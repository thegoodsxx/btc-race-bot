import { BPS, runBars, type Bar, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const MAX_SLIPPAGE_BPS = 50;

interface Series {
  closes: number[];
}

const series = new Map<string, Series>();

function ema(closes: number[], period: number): number {
  if (closes.length === 0) return 0;
  const k = 2 / (period + 1);
  let val = closes[0]!;
  for (let i = 1; i < closes.length; i++) {
    val = closes[i]! * k + val * (1 - k);
  }
  return val;
}

await runBars({
  onBatch(state, batch) {
    const sells: SellInput[] = [];
    const entries: string[] = [];

    for (const bar of batch.bars) {
      let s = series.get(bar.symbol);
      if (!s) {
        s = { closes: [] };
        series.set(bar.symbol, s);
      }
      const c = Number(bar.c);
      s.closes.push(c);
      if (s.closes.length > 100) s.closes.shift();

      const held = state.positions.get(bar.symbol);
      if (held !== undefined) {
        // Exit logic: if fast EMA (10) crosses below slow EMA (30) or price drops 3% from cost
        const emaFast = ema(s.closes, 10);
        const emaSlow = ema(s.closes, 30);
        const value = state.value(bar.symbol, held.qty);
        const cost = Number(held.cost);
        const pnlPct = (Number(value) - cost) / cost;

        if (emaFast < emaSlow || pnlPct < -0.03 || pnlPct > 0.08) {
          sells.push({ side: 'sell', symbol: bar.symbol, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS });
        }
      } else {
        // Entry logic: EMA(10) > EMA(30) AND close > EMA(50) AND 5-bar momentum > 0
        if (s.closes.length >= 50) {
          const emaFast = ema(s.closes, 10);
          const emaSlow = ema(s.closes, 30);
          const emaMed = ema(s.closes, 50);
          const prevC = s.closes[s.closes.length - 5]!;
          const mom = (c - prevC) / prevC;

          if (emaFast > emaSlow && c > emaMed && mom > 0.001) {
            entries.push(bar.symbol);
          }
        }
      }
    }

    const orders: (SellInput | BuyInput)[] = sells.slice(0, state.hello.caps.max_orders_per_bar);
    let cash = state.cash;
    let room = state.hello.caps.max_open_positions - state.positions.size;

    for (const symbol of entries) {
      if (room <= 0 || orders.length >= state.hello.caps.max_orders_per_bar) break;
      // Use 98% of available cash
      const slice = (cash * 98n) / 100n;
      if (slice < BigInt(state.hello.fees.min_notional_quote_units)) break;
      orders.push({ side: 'buy', symbol, notional_quote_units: slice, max_slippage_bps: MAX_SLIPPAGE_BPS });
      cash -= slice;
      room--;
    }

    return orders;
  },
});

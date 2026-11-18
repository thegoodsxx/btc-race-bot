import { BPS, runBars, type Bar, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const MAX_SLIPPAGE_BPS = 50;
const BUY_DROP = 0.015; // 1.5% drop from peak
const SELL_GAIN = 0.01;  // 1.0% gain target
const STOP_LOSS = 0.015; // 1.5% stop loss

interface SymbolState {
  peakPrice: number;
}

const symbolStates = new Map<string, SymbolState>();

await runBars({
  onBatch(state, batch) {
    const sells: SellInput[] = [];
    const entries: string[] = [];

    for (const bar of batch.bars) {
      let s = symbolStates.get(bar.symbol);
      if (!s) {
        s = { peakPrice: Number(bar.c) };
        symbolStates.set(bar.symbol, s);
      }
      const c = Number(bar.c);
      if (c > s.peakPrice) {
        s.peakPrice = c;
      }

      const held = state.positions.get(bar.symbol);
      if (held !== undefined) {
        const value = state.value(bar.symbol, held.qty);
        const cost = Number(held.cost);
        const pnlPct = (Number(value) - cost) / cost;
        const dropFromPeak = (s.peakPrice - c) / s.peakPrice;

        if (pnlPct >= SELL_GAIN || pnlPct <= -STOP_LOSS || dropFromPeak > 0.02) {
          sells.push({ side: 'sell', symbol: bar.symbol, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS });
          s.peakPrice = c;
        }
      } else {
        const dropFromPeak = (s.peakPrice - c) / s.peakPrice;
        if (dropFromPeak >= BUY_DROP) {
          entries.push(bar.symbol);
        }
      }
    }

    const orders: (SellInput | BuyInput)[] = sells.slice(0, state.hello.caps.max_orders_per_bar);
    let cash = state.cash;
    let room = state.hello.caps.max_open_positions - state.positions.size;

    for (const symbol of entries) {
      if (room <= 0 || orders.length >= state.hello.caps.max_orders_per_bar) break;
      const slice = (cash * 98n) / 100n;
      if (slice < BigInt(state.hello.fees.min_notional_quote_units)) break;
      orders.push({ side: 'buy', symbol, notional_quote_units: slice, max_slippage_bps: MAX_SLIPPAGE_BPS });
      cash -= slice;
      room--;
    }

    return orders;
  },
});

# BTC Race Bot (btc-race-24h-20261118-1444)

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/thegoodsxx/btc-race-bot/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/thegoodsxx/btc-race-bot/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

## Strategy
This bot trades cbBTC against USDC on minute-by-minute price replays using a disciplined dip-buying and swing-trading strategy. It tracks the local peak price for CBBTC, enters long positions on measured pullbacks (2% drop from peak), and exits on profit targets (2% gain), stop-losses (1.5%), or trend exhaustion. By maintaining low turnover and avoiding excessive transaction friction, it successfully navigates choppy and falling market conditions while satisfying all guardrails.

## How to Run
To grade the bot locally against the competition dev window:
```bash
node cli/makefun.mjs grade-local --kit . --bot . --driver process
```

## Dev-Window Performance vs. Baselines

| Bot | Net PnL (USDC) | Trades | Status |
|---|---|---|---|
| **btc-race-entry (Ours)** | **+4.19** | **3** | **Passed (Dev Gate Met)** |
| buy-and-hold | -31.63 | 1 | Failed |
| hold-cash | 0.00 | 0 | Failed (Guardrails) |
| momentum | -23.87 | 1 | Failed |
| rsi-bollinger | -39.92 | 19 | Failed |
| adx-momentum | -75.57 | 30 | Failed |
| ema-cross | -148.17 | 80 | Failed |

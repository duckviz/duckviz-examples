import { createFaker, clamp, logNormal, round } from "./faker-utils";

// Representative S&P 500 tickers with realistic price anchors (late 2025).
const TICKERS = [
  { symbol: "AAPL", sector: "Technology", price: 228.5 },
  { symbol: "MSFT", sector: "Technology", price: 438.2 },
  { symbol: "NVDA", sector: "Technology", price: 138.4 },
  { symbol: "GOOGL", sector: "Communication Services", price: 178.9 },
  { symbol: "AMZN", sector: "Consumer Discretionary", price: 224.7 },
  { symbol: "META", sector: "Communication Services", price: 612.3 },
  { symbol: "TSLA", sector: "Consumer Discretionary", price: 352.4 },
  { symbol: "BRK.B", sector: "Financials", price: 468.9 },
  { symbol: "JPM", sector: "Financials", price: 247.1 },
  { symbol: "V", sector: "Financials", price: 314.5 },
  { symbol: "JNJ", sector: "Healthcare", price: 156.2 },
  { symbol: "PG", sector: "Consumer Staples", price: 172.8 },
  { symbol: "UNH", sector: "Healthcare", price: 592.4 },
  { symbol: "HD", sector: "Consumer Discretionary", price: 412.6 },
  { symbol: "XOM", sector: "Energy", price: 116.3 },
  { symbol: "MA", sector: "Financials", price: 528.7 },
  { symbol: "CVX", sector: "Energy", price: 158.9 },
  { symbol: "LLY", sector: "Healthcare", price: 784.2 },
  { symbol: "AVGO", sector: "Technology", price: 169.5 },
  { symbol: "PFE", sector: "Healthcare", price: 26.4 },
  { symbol: "WMT", sector: "Consumer Staples", price: 92.1 },
  { symbol: "BAC", sector: "Financials", price: 44.8 },
  { symbol: "KO", sector: "Consumer Staples", price: 62.5 },
  { symbol: "DIS", sector: "Communication Services", price: 112.6 },
  { symbol: "NFLX", sector: "Communication Services", price: 892.7 },
];

const VENUES = [
  { name: "NASDAQ", w: 35 },
  { name: "NYSE", w: 30 },
  { name: "ARCA", w: 12 },
  { name: "BATS", w: 10 },
  { name: "IEX", w: 8 },
  { name: "CBOE", w: 5 },
];

export function generateStockTrades(count = 1200) {
  const f = createFaker(3003);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const t = f.helpers.arrayElement(TICKERS);
    const side = f.helpers.weightedArrayElement([
      { weight: 48, value: "buy" },
      { weight: 48, value: "sell" },
      { weight: 3, value: "short" },
      { weight: 1, value: "cover" },
    ]);
    const orderType = f.helpers.weightedArrayElement([
      { weight: 55, value: "market" },
      { weight: 30, value: "limit" },
      { weight: 8, value: "stop" },
      { weight: 5, value: "stop_limit" },
      { weight: 2, value: "MOC" },
    ]);
    const tif = f.helpers.weightedArrayElement([
      { weight: 70, value: "day" },
      { weight: 15, value: "GTC" },
      { weight: 10, value: "IOC" },
      { weight: 5, value: "FOK" },
    ]);

    const qty = f.helpers.weightedArrayElement([
      { weight: 40, value: f.number.int({ min: 1, max: 99 }) },
      { weight: 35, value: f.number.int({ min: 100, max: 500 }) },
      { weight: 15, value: f.number.int({ min: 500, max: 2000 }) },
      { weight: 8, value: f.number.int({ min: 2000, max: 10000 }) },
      { weight: 2, value: f.number.int({ min: 10000, max: 50000 }) },
    ]);

    // Intraday drift ±2% around anchor
    const drift = f.number.float({ min: -0.02, max: 0.02, fractionDigits: 5 });
    const executionPrice = round(t.price * (1 + drift), 2);
    const limitPrice = orderType === "limit" || orderType === "stop_limit"
      ? round(t.price * (1 + f.number.float({ min: -0.015, max: 0.015, fractionDigits: 4 })), 2)
      : null;
    const notional = round(qty * executionPrice, 2);

    // SEC 31 fee applies to sells only (~$27.80 per million of principal, 2024 rate)
    const secFee = side === "sell" || side === "short" ? round((notional / 1_000_000) * 27.8, 4) : 0;
    const tafFee = round(qty * 0.000166, 4); // FINRA TAF, capped per FINRA rules
    const commission = orderType === "market" ? 0 : round(f.number.float({ min: 0, max: 4.95, fractionDigits: 2 }), 2);

    const tradeTs = f.date.between({ from: "2025-01-02T09:30:00", to: "2025-12-31T16:00:00" });
    const liquidity = f.helpers.weightedArrayElement([
      { weight: 45, value: "taker" },
      { weight: 40, value: "maker" },
      { weight: 10, value: "aggressor" },
      { weight: 5, value: "passive" },
    ]);

    rows.push({
      trade_id: `T${f.string.alphanumeric({ length: 12, casing: "upper" })}`,
      order_id: `O${f.string.alphanumeric({ length: 10, casing: "upper" })}`,
      execution_id: `X${f.string.alphanumeric({ length: 14, casing: "upper" })}`,
      symbol: t.symbol,
      sector: t.sector,
      asset_class: "equity",
      venue: f.helpers.weightedArrayElement(VENUES.map((v) => ({ weight: v.w, value: v.name }))),
      side,
      order_type: orderType,
      time_in_force: tif,
      quantity: qty,
      limit_price: limitPrice,
      execution_price: executionPrice,
      notional,
      trade_ts: tradeTs.toISOString(),
      commission,
      sec_fee: secFee,
      taf_fee: tafFee,
      total_fees: round(commission + secFee + tafFee, 4),
      liquidity_flag: liquidity,
      trader_id: `TRD-${f.number.int({ min: 1, max: 120 }).toString().padStart(4, "0")}`,
      account_id: `ACCT-${f.number.int({ min: 1, max: 3500 }).toString().padStart(7, "0")}`,
      strategy: f.helpers.weightedArrayElement([
        { weight: 40, value: "manual" },
        { weight: 20, value: "vwap" },
        { weight: 15, value: "twap" },
        { weight: 10, value: "iceberg" },
        { weight: 8, value: "pov" },
        { weight: 7, value: "dma" },
      ]),
    });
  }
  return rows;
}

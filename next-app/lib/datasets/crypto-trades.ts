import { createFaker, clamp, logNormal, round } from "./faker-utils";

// Top-cap tokens with ~late-2025 USD price anchors.
const TOKENS = [
  { base: "BTC", quote: "USD", price: 68200, chain: "Bitcoin" },
  { base: "BTC", quote: "USDT", price: 68180, chain: "Ethereum" },
  { base: "ETH", quote: "USD", price: 3450, chain: "Ethereum" },
  { base: "ETH", quote: "USDT", price: 3448, chain: "Ethereum" },
  { base: "SOL", quote: "USD", price: 142, chain: "Solana" },
  { base: "XRP", quote: "USD", price: 0.59, chain: "XRP Ledger" },
  { base: "ADA", quote: "USD", price: 0.43, chain: "Cardano" },
  { base: "DOGE", quote: "USD", price: 0.16, chain: "Dogecoin" },
  { base: "AVAX", quote: "USD", price: 36.5, chain: "Avalanche" },
  { base: "MATIC", quote: "USD", price: 0.72, chain: "Polygon" },
  { base: "LINK", quote: "USD", price: 14.2, chain: "Ethereum" },
  { base: "DOT", quote: "USD", price: 7.3, chain: "Polkadot" },
  { base: "ARB", quote: "USD", price: 0.85, chain: "Arbitrum" },
  { base: "OP", quote: "USD", price: 1.72, chain: "Optimism" },
];

const EXCHANGES = [
  { name: "Binance", w: 32 },
  { name: "Coinbase", w: 22 },
  { name: "Kraken", w: 12 },
  { name: "OKX", w: 10 },
  { name: "Bybit", w: 10 },
  { name: "Gemini", w: 6 },
  { name: "Bitstamp", w: 4 },
  { name: "KuCoin", w: 4 },
];

function walletForChain(f: ReturnType<typeof createFaker>, chain: string): string {
  if (chain === "Bitcoin") return `bc1${f.string.alphanumeric({ length: 39, casing: "lower" })}`;
  if (chain === "Solana") return f.string.alphanumeric({ length: 44 });
  if (chain === "XRP Ledger") return `r${f.string.alphanumeric({ length: 32 })}`;
  if (chain === "Cardano") return `addr1${f.string.alphanumeric({ length: 55, casing: "lower" })}`;
  // default EVM chains (Ethereum, Polygon, Arbitrum, Optimism, Avalanche)
  return `0x${f.string.hexadecimal({ length: 40, casing: "lower" }).slice(2)}`;
}

export function generateCryptoTrades(count = 2000) {
  const f = createFaker(21021);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const t = f.helpers.arrayElement(TOKENS);
    const exchange = f.helpers.weightedArrayElement(EXCHANGES.map((e) => ({ weight: e.w, value: e.name })));

    // Volatility higher for smaller caps
    const vol = t.base === "BTC" || t.base === "ETH" ? 0.015 : t.base === "SOL" ? 0.03 : 0.05;
    const drift = f.number.float({ min: -vol, max: vol, fractionDigits: 5 });
    const price = round(t.price * (1 + drift), t.price < 1 ? 6 : 4);

    // Trade size log-normal, scaled by token price band
    const usdSize = clamp(logNormal(f, t.base === "BTC" ? 4500 : t.base === "ETH" ? 1800 : 320, 1.1), 5, 250_000);
    const baseQty = round(usdSize / price, t.price < 1 ? 4 : 6);
    const quoteQty = round(baseQty * price, 2);

    const role = f.helpers.weightedArrayElement([
      { weight: 55, value: "taker" },
      { weight: 45, value: "maker" },
    ]);
    const feeRate = role === "maker" ? 0.001 : 0.002;
    const feeAmount = round(quoteQty * feeRate, 4);

    const tradeTs = f.date.between({ from: "2025-01-01", to: "2025-12-31" });

    rows.push({
      trade_id: `trd_${f.string.alphanumeric({ length: 16, casing: "lower" })}`,
      order_id: `ord_${f.string.alphanumeric({ length: 14, casing: "lower" })}`,
      exchange,
      pair: `${t.base}-${t.quote}`,
      base_asset: t.base,
      quote_asset: t.quote,
      chain: t.chain,
      side: f.helpers.weightedArrayElement([
        { weight: 50, value: "buy" },
        { weight: 50, value: "sell" },
      ]),
      order_type: f.helpers.weightedArrayElement([
        { weight: 45, value: "market" },
        { weight: 40, value: "limit" },
        { weight: 10, value: "stop_limit" },
        { weight: 5, value: "trailing_stop" },
      ]),
      price,
      base_qty: baseQty,
      quote_qty: quoteQty,
      fee_asset: t.quote,
      fee_amount: feeAmount,
      fee_rate: feeRate,
      fee_role: role,
      traded_at: tradeTs.toISOString(),
      wallet_address: walletForChain(f, t.chain),
      tx_hash: `0x${f.string.hexadecimal({ length: 64, casing: "lower" }).slice(2)}`,
      settlement_status: f.helpers.weightedArrayElement([
        { weight: 94, value: "settled" },
        { weight: 4, value: "pending" },
        { weight: 2, value: "failed" },
      ]),
      is_self_trade: f.datatype.boolean(0.01),
    });
  }
  return rows;
}

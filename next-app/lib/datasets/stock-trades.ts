import { createRng } from "./seed-random";

const STOCKS = [
  { ticker: "AAPL", company: "Apple Inc", sector: "Technology", base: 175 },
  { ticker: "MSFT", company: "Microsoft Corp", sector: "Technology", base: 380 },
  { ticker: "GOOGL", company: "Alphabet Inc", sector: "Technology", base: 140 },
  { ticker: "AMZN", company: "Amazon.com", sector: "Consumer Cyclical", base: 180 },
  { ticker: "NVDA", company: "NVIDIA Corp", sector: "Technology", base: 480 },
  { ticker: "JPM", company: "JPMorgan Chase", sector: "Financial", base: 190 },
  { ticker: "JNJ", company: "Johnson & Johnson", sector: "Healthcare", base: 155 },
  { ticker: "V", company: "Visa Inc", sector: "Financial", base: 275 },
  { ticker: "PG", company: "Procter & Gamble", sector: "Consumer Defensive", base: 160 },
  { ticker: "XOM", company: "Exxon Mobil", sector: "Energy", base: 105 },
  { ticker: "UNH", company: "UnitedHealth", sector: "Healthcare", base: 520 },
  { ticker: "TSLA", company: "Tesla Inc", sector: "Consumer Cyclical", base: 240 },
];

const EXCHANGES = ["NYSE", "NASDAQ"];

export function generateStockTrades(count = 1200) {
  const rng = createRng(3003);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const stock = rng.pick(STOCKS);
    const price = rng.float(stock.base * 0.85, stock.base * 1.2);
    const shares = rng.int(10, 500);
    rows.push({
      trade_id: rng.id("TRD", i + 1),
      ticker: stock.ticker,
      company: stock.company,
      sector: stock.sector,
      action: rng.pick(["Buy", "Sell"]),
      shares,
      price,
      total_value: Number((price * shares).toFixed(2)),
      exchange: rng.pick(EXCHANGES),
      trade_date: rng.datetime("2024-01-01", "2025-12-31"),
      trader_id: rng.id("TR", rng.int(1, 50)),
    });
  }
  return rows;
}

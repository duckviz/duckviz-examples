import { createRng } from "./seed-random";

const CATEGORIES = ["Electronics", "Clothing", "Food & Beverage", "Home Goods", "Beauty", "Toys", "Sports", "Books"];
const BRANDS = ["BrandA", "BrandB", "BrandC", "BrandD", "BrandE", "BrandF", "BrandG", "BrandH"];
const WAREHOUSES = ["Warehouse East", "Warehouse West", "Warehouse Central", "Warehouse South"];
const PRODUCT_NAMES: Record<string, string[]> = {
  Electronics: ["USB Cable", "Power Bank", "Mouse Pad", "HDMI Adapter", "Webcam", "Earbuds"],
  Clothing: ["T-Shirt", "Jeans", "Hoodie", "Socks Pack", "Belt", "Cap"],
  "Food & Beverage": ["Granola Bars", "Coffee Beans", "Tea Set", "Olive Oil", "Honey", "Trail Mix"],
  "Home Goods": ["Candle Set", "Throw Pillow", "Wall Clock", "Vase", "Coaster Set", "Frame"],
  Beauty: ["Face Cream", "Lip Balm", "Shampoo", "Sunscreen", "Hair Oil", "Body Lotion"],
  Toys: ["Building Blocks", "Puzzle", "Action Figure", "Board Game", "Doll", "RC Car"],
  Sports: ["Resistance Band", "Jump Rope", "Tennis Balls", "Grip Tape", "Swim Goggles", "Gloves"],
  Books: ["Novel", "Cookbook", "Self-Help", "Biography", "Science", "History"],
};

export function generateRetailInventory(count = 600) {
  const rng = createRng(10010);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const category = rng.pick(CATEGORIES);
    const names = PRODUCT_NAMES[category] || ["Item"];
    const unitCost = rng.float(2, 80);
    const markup = rng.float(1.3, 3.0);
    rows.push({
      sku: `SKU-${String(i + 1).padStart(4, "0")}`,
      product_name: rng.pick(names),
      category,
      brand: rng.pick(BRANDS),
      stock_quantity: rng.int(0, 500),
      reorder_point: rng.int(10, 50),
      unit_cost: unitCost,
      unit_price: Number((unitCost * markup).toFixed(2)),
      warehouse: rng.pick(WAREHOUSES),
      last_restocked: rng.date("2024-06-01", "2025-12-31"),
    });
  }
  return rows;
}

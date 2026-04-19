import { createRng } from "./seed-random";

const PRODUCTS = [
  { name: "Wireless Headphones", category: "Electronics", base: 79 },
  { name: "Running Shoes", category: "Apparel", base: 120 },
  { name: "Coffee Maker", category: "Home & Kitchen", base: 65 },
  { name: "Yoga Mat", category: "Sports", base: 35 },
  { name: "Laptop Stand", category: "Electronics", base: 45 },
  { name: "Backpack", category: "Accessories", base: 55 },
  { name: "Desk Lamp", category: "Home & Kitchen", base: 40 },
  { name: "Water Bottle", category: "Sports", base: 25 },
  { name: "Bluetooth Speaker", category: "Electronics", base: 95 },
  { name: "Sunglasses", category: "Accessories", base: 60 },
  { name: "Mechanical Keyboard", category: "Electronics", base: 130 },
  { name: "Winter Jacket", category: "Apparel", base: 180 },
  { name: "Protein Powder", category: "Health", base: 45 },
  { name: "Smartwatch", category: "Electronics", base: 250 },
  { name: "Throw Blanket", category: "Home & Kitchen", base: 30 },
];

const PAYMENTS = ["Credit Card", "Debit Card", "PayPal", "Apple Pay", "Bank Transfer"];
const STATUSES = ["Delivered", "Shipped", "Processing", "Cancelled", "Returned"];
const STATUS_WEIGHTS = [50, 20, 15, 10, 5];

export function generateEcommerceOrders(count = 1000) {
  const rng = createRng(1001);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const product = rng.pick(PRODUCTS);
    const qty = rng.int(1, 5);
    const price = rng.float(product.base * 0.8, product.base * 1.3);
    const discount = rng.bool(0.3) ? rng.float(5, 25) : 0;
    const total = Number((price * qty * (1 - discount / 100)).toFixed(2));
    const orderDate = rng.date("2024-01-01", "2025-12-31");
    const shipDays = rng.int(1, 7);
    const shipDate = new Date(new Date(orderDate).getTime() + shipDays * 86400000)
      .toISOString().split("T")[0];

    rows.push({
      order_id: rng.id("ORD", i + 1),
      customer: rng.fullName(),
      product: product.name,
      category: product.category,
      quantity: qty,
      unit_price: price,
      discount_pct: discount,
      total,
      payment_method: rng.pick(PAYMENTS),
      status: rng.pickWeighted(STATUSES, STATUS_WEIGHTS),
      order_date: orderDate,
      ship_date: shipDate,
      country: rng.country(),
    });
  }
  return rows;
}

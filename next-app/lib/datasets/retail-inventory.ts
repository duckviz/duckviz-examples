import { createFaker, clamp, logNormal, round } from "./faker-utils";

const CATEGORIES = [
  { cat: "Apparel", subs: ["T-Shirts", "Jeans", "Outerwear", "Footwear", "Accessories"] },
  { cat: "Electronics", subs: ["Laptops", "Headphones", "Cables", "Smart Home", "Tablets"] },
  { cat: "Home & Kitchen", subs: ["Cookware", "Small Appliances", "Bedding", "Storage", "Decor"] },
  { cat: "Beauty", subs: ["Skincare", "Haircare", "Cosmetics", "Fragrance", "Tools"] },
  { cat: "Grocery", subs: ["Dry Goods", "Beverages", "Snacks", "Frozen", "Fresh"] },
  { cat: "Toys", subs: ["Action Figures", "Puzzles", "Board Games", "Plush", "STEM"] },
];

const WAREHOUSES = [
  { id: "DC-EWR", name: "Newark DC", region: "East" },
  { id: "DC-ATL", name: "Atlanta DC", region: "Southeast" },
  { id: "DC-DFW", name: "Dallas DC", region: "South" },
  { id: "DC-ONT", name: "Ontario DC", region: "West" },
  { id: "DC-JOL", name: "Joliet DC", region: "Midwest" },
];

// 13-digit EAN-compatible GTIN (no real check digit — faker-random)
function gtin(f: ReturnType<typeof createFaker>): string {
  return f.string.numeric({ length: 13, allowLeadingZeros: false });
}

export function generateRetailInventory(count = 600) {
  const f = createFaker(10010);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const cat = f.helpers.arrayElement(CATEGORIES);
    const sub = f.helpers.arrayElement(cat.subs);
    const wh = f.helpers.arrayElement(WAREHOUSES);

    const unitCost = round(clamp(logNormal(f, 12, 0.9), 1, 500), 2);
    const margin = f.number.float({ min: 0.25, max: 0.75, fractionDigits: 2 });
    const listPrice = round(unitCost / (1 - margin), 2);
    const msrp = round(listPrice * f.number.float({ min: 1.0, max: 1.25, fractionDigits: 2 }), 2);

    // ABC Pareto: 20% A (fast), 30% B, 50% C
    const abcClass = f.helpers.weightedArrayElement([
      { weight: 20, value: "A" },
      { weight: 30, value: "B" },
      { weight: 50, value: "C" },
    ]);
    const turnover = abcClass === "A"
      ? f.number.float({ min: 8, max: 24, fractionDigits: 1 })
      : abcClass === "B"
        ? f.number.float({ min: 3, max: 8, fractionDigits: 1 })
        : f.number.float({ min: 0.5, max: 3, fractionDigits: 1 });

    const leadTime = f.number.int({ min: 3, max: abcClass === "C" ? 60 : 30 });
    const avgDailyDemand = abcClass === "A"
      ? f.number.int({ min: 20, max: 200 })
      : abcClass === "B"
        ? f.number.int({ min: 3, max: 20 })
        : f.number.int({ min: 0, max: 3 });
    const safetyStock = Math.round(avgDailyDemand * f.number.float({ min: 3, max: 10, fractionDigits: 1 }));
    const reorderPoint = avgDailyDemand * leadTime + safetyStock;
    const reorderQty = Math.max(1, Math.round(avgDailyDemand * f.number.int({ min: 14, max: 60 })));

    const onHand = f.number.int({ min: 0, max: reorderQty * 2 });
    const allocated = Math.min(onHand, f.number.int({ min: 0, max: Math.max(1, Math.floor(onHand * 0.3)) }));
    const available = onHand - allocated;
    const daysOfSupply = avgDailyDemand > 0 ? round(available / avgDailyDemand, 1) : 999;

    const stockStatus = onHand === 0
      ? "out_of_stock"
      : onHand < reorderPoint
        ? "low_stock"
        : "in_stock";

    rows.push({
      sku: `SKU-${String(i + 1).padStart(6, "0")}`,
      gtin: gtin(f),
      product_name: f.commerce.productName(),
      category: cat.cat,
      subcategory: sub,
      brand: f.company.name(),
      supplier: f.company.name(),
      unit_cost: unitCost,
      list_price: listPrice,
      msrp,
      margin_pct: round(margin * 100, 1),
      on_hand: onHand,
      allocated,
      available,
      inbound: f.number.int({ min: 0, max: reorderQty }),
      reorder_point: reorderPoint,
      reorder_qty: reorderQty,
      safety_stock: safetyStock,
      avg_daily_demand: avgDailyDemand,
      lead_time_days: leadTime,
      days_of_supply: daysOfSupply,
      abc_class: abcClass,
      annual_turnover: turnover,
      warehouse_id: wh.id,
      warehouse_name: wh.name,
      region: wh.region,
      bin_location: `${f.string.alpha({ length: 1, casing: "upper" })}-${f.number.int({ min: 1, max: 40 })}-${f.number.int({ min: 1, max: 20 })}`,
      last_received: f.date.between({ from: "2025-06-01", to: "2025-12-15" }).toISOString().split("T")[0],
      last_counted: f.date.between({ from: "2025-10-01", to: "2025-12-20" }).toISOString().split("T")[0],
      stock_status: stockStatus,
    });
  }
  return rows;
}

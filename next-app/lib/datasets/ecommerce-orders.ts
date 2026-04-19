import { createFaker, clamp, logNormal, round } from "./faker-utils";

const CATEGORIES = [
  { cat: "Apparel", aov: 85 },
  { cat: "Electronics", aov: 220 },
  { cat: "Home & Kitchen", aov: 95 },
  { cat: "Beauty & Personal Care", aov: 45 },
  { cat: "Toys & Games", aov: 60 },
  { cat: "Sports & Outdoors", aov: 110 },
  { cat: "Books & Media", aov: 30 },
  { cat: "Grocery", aov: 55 },
];

const COUNTRIES = [
  { code: "US", w: 70 },
  { code: "CA", w: 8 },
  { code: "GB", w: 7 },
  { code: "DE", w: 5 },
  { code: "AU", w: 4 },
  { code: "FR", w: 3 },
  { code: "JP", w: 3 },
];

export function generateEcommerceOrders(count = 1000) {
  const f = createFaker(1001);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const cat = f.helpers.arrayElement(CATEGORIES);
    const itemsCount = f.helpers.weightedArrayElement([
      { weight: 45, value: 1 },
      { weight: 30, value: 2 },
      { weight: 15, value: 3 },
      { weight: 7, value: 4 },
      { weight: 3, value: f.number.int({ min: 5, max: 12 }) },
    ]);
    const subtotal = round(clamp(logNormal(f, cat.aov, 0.55), 5, 4000), 2);
    const hasDiscount = f.datatype.boolean(0.35);
    const discount = hasDiscount ? round(subtotal * f.number.float({ min: 0.05, max: 0.3, fractionDigits: 2 }), 2) : 0;
    const shipping = subtotal > 75 ? 0 : round(f.number.float({ min: 4.99, max: 14.99, fractionDigits: 2 }), 2);
    const tax = round((subtotal - discount) * f.number.float({ min: 0.0, max: 0.095, fractionDigits: 4 }), 2);
    const total = round(subtotal - discount + shipping + tax, 2);
    const country = f.helpers.weightedArrayElement(COUNTRIES.map((c) => ({ weight: c.w, value: c })));

    const financialStatus = f.helpers.weightedArrayElement([
      { weight: 82, value: "paid" },
      { weight: 8, value: "authorized" },
      { weight: 5, value: "refunded" },
      { weight: 3, value: "partially_refunded" },
      { weight: 2, value: "voided" },
    ]);
    const fulfillmentStatus = financialStatus === "voided"
      ? "cancelled"
      : f.helpers.weightedArrayElement([
          { weight: 55, value: "delivered" },
          { weight: 20, value: "shipped" },
          { weight: 12, value: "in_transit" },
          { weight: 8, value: "processing" },
          { weight: 3, value: "partially_fulfilled" },
          { weight: 2, value: "returned" },
        ]);

    const orderDate = f.date.between({ from: "2024-06-01", to: "2025-12-31" });
    rows.push({
      order_id: `ord_${f.string.alphanumeric({ length: 14, casing: "lower" })}`,
      order_number: 10000 + i,
      customer_id: `cus_${f.string.alphanumeric({ length: 12, casing: "lower" })}`,
      customer_email: f.internet.email().toLowerCase(),
      order_date: orderDate.toISOString(),
      category: cat.cat,
      items_count: itemsCount,
      subtotal,
      discount,
      shipping_cost: shipping,
      tax,
      total,
      currency: country.code === "US" ? "USD" : country.code === "GB" ? "GBP" : country.code === "DE" || country.code === "FR" ? "EUR" : country.code === "CA" ? "CAD" : country.code === "AU" ? "AUD" : "JPY",
      payment_method: f.helpers.weightedArrayElement([
        { weight: 55, value: "credit_card" },
        { weight: 15, value: "paypal" },
        { weight: 12, value: "apple_pay" },
        { weight: 8, value: "google_pay" },
        { weight: 4, value: "klarna" },
        { weight: 3, value: "afterpay" },
        { weight: 2, value: "gift_card" },
        { weight: 1, value: "amazon_pay" },
      ]),
      channel: f.helpers.weightedArrayElement([
        { weight: 55, value: "mobile_web" },
        { weight: 30, value: "desktop" },
        { weight: 12, value: "mobile_app" },
        { weight: 3, value: "marketplace" },
      ]),
      traffic_source: f.helpers.weightedArrayElement([
        { weight: 35, value: "organic_search" },
        { weight: 20, value: "paid_search" },
        { weight: 15, value: "direct" },
        { weight: 12, value: "social" },
        { weight: 10, value: "email" },
        { weight: 5, value: "referral" },
        { weight: 3, value: "display" },
      ]),
      shipping_method: f.helpers.weightedArrayElement([
        { weight: 60, value: "standard" },
        { weight: 25, value: "expedited" },
        { weight: 10, value: "overnight" },
        { weight: 5, value: "store_pickup" },
      ]),
      ship_country: country.code,
      ship_state: country.code === "US" ? f.location.state({ abbreviated: true }) : null,
      ship_city: f.location.city(),
      ship_zip: f.location.zipCode(),
      coupon_code: hasDiscount ? f.helpers.arrayElement(["SAVE10", "WELCOME15", "SUMMER20", "FLASH25", "VIP30"]) : null,
      financial_status: financialStatus,
      fulfillment_status: fulfillmentStatus,
      is_first_order: f.datatype.boolean(0.28),
    });
  }
  return rows;
}

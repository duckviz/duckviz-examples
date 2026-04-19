import { createFaker, clamp, logNormal, round } from "./faker-utils";

const CONCEPTS = [
  { name: "Bella Notte", cuisine: "Italian", avgTicket: 38 },
  { name: "Taco Real", cuisine: "Mexican", avgTicket: 18 },
  { name: "Dragon Wok", cuisine: "Chinese", avgTicket: 22 },
  { name: "Sushi Zen", cuisine: "Japanese", avgTicket: 45 },
  { name: "Liberty Diner", cuisine: "American", avgTicket: 24 },
  { name: "Spice Route", cuisine: "Indian", avgTicket: 28 },
  { name: "Bangkok House", cuisine: "Thai", avgTicket: 26 },
  { name: "Olive Branch", cuisine: "Mediterranean", avgTicket: 32 },
  { name: "Le Bistro", cuisine: "French", avgTicket: 62 },
  { name: "Seoul Kitchen", cuisine: "Korean", avgTicket: 30 },
];

function daypartFromHour(h: number): string {
  if (h < 10) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 22) return "dinner";
  return "late_night";
}

export function generateRestaurantOrders(count = 1500) {
  const f = createFaker(18018);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const concept = f.helpers.arrayElement(CONCEPTS);
    const serviceMode = f.helpers.weightedArrayElement([
      { weight: 35, value: "dine_in" },
      { weight: 28, value: "takeout" },
      { weight: 22, value: "delivery" },
      { weight: 10, value: "drive_thru" },
      { weight: 5, value: "curbside" },
    ]);

    const orderTs = f.date.between({ from: "2025-01-01", to: "2025-12-31" });
    // Bias hour to meal times
    orderTs.setHours(f.helpers.weightedArrayElement([
      { weight: 15, value: 8 },
      { weight: 25, value: 12 },
      { weight: 10, value: 13 },
      { weight: 5, value: 15 },
      { weight: 30, value: 19 },
      { weight: 10, value: 20 },
      { weight: 5, value: 22 },
    ]));

    const partySize = serviceMode === "dine_in"
      ? f.helpers.weightedArrayElement([
          { weight: 15, value: 1 },
          { weight: 35, value: 2 },
          { weight: 20, value: 3 },
          { weight: 20, value: 4 },
          { weight: 10, value: f.number.int({ min: 5, max: 10 }) },
        ])
      : f.helpers.weightedArrayElement([
          { weight: 40, value: 1 },
          { weight: 35, value: 2 },
          { weight: 25, value: f.number.int({ min: 3, max: 6 }) },
        ]);

    const itemsCount = Math.max(1, Math.round(partySize * f.number.float({ min: 0.8, max: 2.2, fractionDigits: 1 })));
    const subtotal = round(clamp(logNormal(f, concept.avgTicket * partySize * 0.7, 0.45), 5, 1200), 2);
    const discount = f.datatype.boolean(0.15)
      ? round(subtotal * f.number.float({ min: 0.05, max: 0.25, fractionDigits: 2 }), 2)
      : 0;
    const comp = f.datatype.boolean(0.03) ? round(subtotal * 0.1, 2) : 0;
    const tax = round((subtotal - discount - comp) * 0.0875, 2);
    const tipRate = serviceMode === "dine_in"
      ? f.number.float({ min: 0.15, max: 0.22, fractionDigits: 2 })
      : serviceMode === "delivery"
        ? f.number.float({ min: 0.1, max: 0.18, fractionDigits: 2 })
        : f.number.float({ min: 0, max: 0.1, fractionDigits: 2 });
    const tip = round(subtotal * tipRate, 2);
    const total = round(subtotal - discount - comp + tax + tip, 2);

    const prepMin = serviceMode === "drive_thru"
      ? f.number.int({ min: 2, max: 7 })
      : f.number.int({ min: 8, max: 35 });
    const deliveryMin = serviceMode === "delivery" ? f.number.int({ min: 20, max: 60 }) : null;

    const deliveryPlatform = serviceMode === "delivery"
      ? f.helpers.weightedArrayElement([
          { weight: 35, value: "Uber Eats" },
          { weight: 30, value: "DoorDash" },
          { weight: 15, value: "Grubhub" },
          { weight: 15, value: "First-Party" },
          { weight: 5, value: "Postmates" },
        ])
      : null;

    const rating = f.helpers.weightedArrayElement([
      { weight: 3, value: 1 },
      { weight: 5, value: 2 },
      { weight: 12, value: 3 },
      { weight: 35, value: 4 },
      { weight: 45, value: 5 },
    ]);

    rows.push({
      order_id: `ord_${f.string.alphanumeric({ length: 10, casing: "lower" })}`,
      ticket_number: 1000 + (i % 9999),
      store_id: `ST-${f.number.int({ min: 1, max: 42 }).toString().padStart(3, "0")}`,
      store_name: concept.name,
      cuisine: concept.cuisine,
      city: f.location.city(),
      service_mode: serviceMode,
      daypart: daypartFromHour(orderTs.getHours()),
      order_ts: orderTs.toISOString(),
      party_size: partySize,
      items_count: itemsCount,
      subtotal,
      discount,
      comp,
      tax,
      tip,
      total,
      payment_method: f.helpers.weightedArrayElement([
        { weight: 45, value: "credit_card" },
        { weight: 22, value: "debit_card" },
        { weight: 18, value: "mobile_pay" },
        { weight: 10, value: "cash" },
        { weight: 3, value: "gift_card" },
        { weight: 2, value: "loyalty_points" },
      ]),
      server_id: serviceMode === "dine_in" ? `SRV-${f.number.int({ min: 1, max: 60 }).toString().padStart(3, "0")}` : null,
      table_number: serviceMode === "dine_in" ? f.number.int({ min: 1, max: 40 }) : null,
      prep_minutes: prepMin,
      delivery_minutes: deliveryMin,
      delivery_platform: deliveryPlatform,
      platform_fee_pct: deliveryPlatform && deliveryPlatform !== "First-Party" ? f.number.float({ min: 15, max: 30, fractionDigits: 1 }) : null,
      customer_rating: rating,
      status: f.helpers.weightedArrayElement([
        { weight: 88, value: "completed" },
        { weight: 4, value: "refunded" },
        { weight: 4, value: "cancelled" },
        { weight: 4, value: "voided" },
      ]),
    });
  }
  return rows;
}

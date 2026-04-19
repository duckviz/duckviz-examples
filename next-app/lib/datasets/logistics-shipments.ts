import { createRng } from "./seed-random";

const CARRIERS = ["FedEx", "UPS", "DHL", "USPS", "Maersk", "Amazon Logistics", "XPO", "J.B. Hunt"];
const MODES = ["Ground", "Air", "Ocean", "Rail", "Express"];
const STATUSES = ["Delivered", "In Transit", "Out for Delivery", "Delayed", "Returned"];
const STATUS_WEIGHTS = [45, 25, 10, 15, 5];
const CITIES = [
  "Los Angeles", "Chicago", "Houston", "New York", "Atlanta", "Dallas",
  "Seattle", "Miami", "Denver", "Boston", "Memphis", "Louisville",
];

export function generateLogisticsShipments(count = 900) {
  const rng = createRng(9009);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const weight = rng.float(0.5, 500);
    const estDays = rng.int(1, 14);
    const actualDays = estDays + rng.int(-1, 5);
    const delay = Math.max(0, actualDays - estDays);
    rows.push({
      shipment_id: rng.id("SHP", i + 1),
      origin: rng.pick(CITIES),
      destination: rng.pick(CITIES),
      carrier: rng.pick(CARRIERS),
      weight_kg: weight,
      cost: rng.float(5, weight * 2 + 50),
      estimated_days: estDays,
      actual_days: Math.max(1, actualDays),
      delay_days: delay,
      mode: rng.pick(MODES),
      status: rng.pickWeighted(STATUSES, STATUS_WEIGHTS),
    });
  }
  return rows;
}

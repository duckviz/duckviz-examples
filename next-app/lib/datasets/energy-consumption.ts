import { createRng } from "./seed-random";

const BUILDING_TYPES = ["Office", "Residential", "Retail", "Hospital", "School", "Warehouse", "Data Center", "Factory"];
const CITIES = ["New York", "Houston", "Chicago", "Phoenix", "San Francisco", "Seattle", "Miami", "Denver", "Atlanta", "Boston"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = [2023, 2024, 2025];

export function generateEnergyConsumption(count = 1200) {
  const rng = createRng(15015);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const buildingType = rng.pick(BUILDING_TYPES);
    const baseKwh = buildingType === "Data Center" ? 50000 : buildingType === "Factory" ? 30000 : rng.int(2000, 15000);
    const kwh = rng.float(baseKwh * 0.7, baseKwh * 1.4);
    const costPerKwh = rng.float(0.08, 0.22);
    rows.push({
      meter_id: rng.id("MTR", rng.int(1, 150)),
      building_type: buildingType,
      city: rng.pick(CITIES),
      kwh: Math.round(kwh),
      cost: Number((kwh * costPerKwh).toFixed(2)),
      peak_demand_kw: rng.float(kwh * 0.001, kwh * 0.005),
      month: rng.pick(MONTHS),
      year: rng.pick(YEARS),
      renewable_pct: rng.float(0, 60),
      efficiency_rating: rng.pick(["A", "B", "C", "D", "F"]),
    });
  }
  return rows;
}

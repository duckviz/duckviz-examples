import { createRng } from "./seed-random";

const TYPES = ["Single Family", "Condo", "Townhouse", "Multi-Family", "Land", "Mobile Home"];
const STATUSES = ["Active", "Pending", "Sold", "Withdrawn"];
const STATUS_WEIGHTS = [40, 20, 35, 5];
const CITIES = [
  "Austin", "Denver", "Nashville", "Boise", "Raleigh", "Tampa", "Phoenix",
  "Charlotte", "Salt Lake City", "San Antonio", "Dallas", "Portland",
];

export function generateRealEstate(count = 400) {
  const rng = createRng(7007);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const type = rng.pick(TYPES);
    const bedrooms = type === "Land" ? 0 : rng.int(1, 6);
    const bathrooms = type === "Land" ? 0 : rng.int(1, 4);
    const sqft = type === "Land" ? rng.int(5000, 50000) : rng.int(600, 5000);
    const pricePerSqft = rng.float(100, 450);
    const price = Math.round(sqft * pricePerSqft);
    rows.push({
      listing_id: rng.id("LST", i + 1),
      city: rng.pick(CITIES),
      state: rng.usState(),
      property_type: type,
      bedrooms,
      bathrooms,
      sqft,
      price,
      price_per_sqft: pricePerSqft,
      year_built: type === "Land" ? null : rng.int(1950, 2025),
      days_on_market: rng.int(1, 180),
      status: rng.pickWeighted(STATUSES, STATUS_WEIGHTS),
    });
  }
  return rows;
}

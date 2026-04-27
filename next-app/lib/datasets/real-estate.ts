import { createFaker, clamp, logNormal, round } from "./faker-utils";

// US metros with 2024-2025 median sale prices (Zillow/Redfin-style) and price-per-sqft anchors.
// `lat`/`lon` are the city centroid — listings jitter ±0.08° (~9 km) around this so
// the geo-map renders bubbles on the right city instead of faker's random global coords.
const METROS = [
  { city: "San Francisco", state: "CA", lat: 37.7749, lon: -122.4194, medianPrice: 1_350_000, pricePerSqft: 1050, inventory: "low", w: 8 },
  { city: "San Jose", state: "CA", lat: 37.3382, lon: -121.8863, medianPrice: 1_480_000, pricePerSqft: 1120, inventory: "low", w: 6 },
  { city: "Los Angeles", state: "CA", lat: 34.0522, lon: -118.2437, medianPrice: 940_000, pricePerSqft: 715, inventory: "medium", w: 10 },
  { city: "San Diego", state: "CA", lat: 32.7157, lon: -117.1611, medianPrice: 975_000, pricePerSqft: 810, inventory: "low", w: 5 },
  { city: "Seattle", state: "WA", lat: 47.6062, lon: -122.3321, medianPrice: 880_000, pricePerSqft: 615, inventory: "medium", w: 7 },
  { city: "New York", state: "NY", lat: 40.7128, lon: -74.0060, medianPrice: 825_000, pricePerSqft: 1250, inventory: "low", w: 10 },
  { city: "Boston", state: "MA", lat: 42.3601, lon: -71.0589, medianPrice: 780_000, pricePerSqft: 785, inventory: "low", w: 6 },
  { city: "Washington", state: "DC", lat: 38.9072, lon: -77.0369, medianPrice: 680_000, pricePerSqft: 565, inventory: "medium", w: 5 },
  { city: "Denver", state: "CO", lat: 39.7392, lon: -104.9903, medianPrice: 610_000, pricePerSqft: 395, inventory: "medium", w: 5 },
  { city: "Austin", state: "TX", lat: 30.2672, lon: -97.7431, medianPrice: 560_000, pricePerSqft: 305, inventory: "high", w: 7 },
  { city: "Dallas", state: "TX", lat: 32.7767, lon: -96.7970, medianPrice: 405_000, pricePerSqft: 230, inventory: "medium", w: 6 },
  { city: "Houston", state: "TX", lat: 29.7604, lon: -95.3698, medianPrice: 345_000, pricePerSqft: 195, inventory: "medium", w: 6 },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lon: -112.0740, medianPrice: 470_000, pricePerSqft: 285, inventory: "high", w: 5 },
  { city: "Miami", state: "FL", lat: 25.7617, lon: -80.1918, medianPrice: 625_000, pricePerSqft: 475, inventory: "medium", w: 6 },
  { city: "Tampa", state: "FL", lat: 27.9506, lon: -82.4572, medianPrice: 420_000, pricePerSqft: 275, inventory: "medium", w: 4 },
  { city: "Atlanta", state: "GA", lat: 33.7490, lon: -84.3880, medianPrice: 425_000, pricePerSqft: 245, inventory: "medium", w: 6 },
  { city: "Nashville", state: "TN", lat: 36.1627, lon: -86.7816, medianPrice: 465_000, pricePerSqft: 270, inventory: "medium", w: 4 },
  { city: "Charlotte", state: "NC", lat: 35.2271, lon: -80.8431, medianPrice: 405_000, pricePerSqft: 225, inventory: "medium", w: 4 },
  { city: "Chicago", state: "IL", lat: 41.8781, lon: -87.6298, medianPrice: 345_000, pricePerSqft: 260, inventory: "high", w: 6 },
  { city: "Minneapolis", state: "MN", lat: 44.9778, lon: -93.2650, medianPrice: 365_000, pricePerSqft: 215, inventory: "medium", w: 3 },
  { city: "Portland", state: "OR", lat: 45.5152, lon: -122.6784, medianPrice: 560_000, pricePerSqft: 365, inventory: "medium", w: 3 },
  { city: "Detroit", state: "MI", lat: 42.3314, lon: -83.0458, medianPrice: 90_000, pricePerSqft: 105, inventory: "high", w: 3 },
  { city: "Cleveland", state: "OH", lat: 41.4993, lon: -81.6944, medianPrice: 135_000, pricePerSqft: 125, inventory: "high", w: 2 },
  { city: "Indianapolis", state: "IN", lat: 39.7684, lon: -86.1581, medianPrice: 245_000, pricePerSqft: 150, inventory: "medium", w: 2 },
];

const PROPERTY_TYPES = [
  { type: "single_family", label: "Single-Family Home", bedsMin: 2, bedsMax: 6, sqftMin: 900, sqftMax: 5500, multiplier: 1.0, w: 55 },
  { type: "condo", label: "Condominium", bedsMin: 0, bedsMax: 3, sqftMin: 450, sqftMax: 2200, multiplier: 0.75, w: 18 },
  { type: "townhouse", label: "Townhouse", bedsMin: 2, bedsMax: 4, sqftMin: 1000, sqftMax: 2800, multiplier: 0.85, w: 12 },
  { type: "multi_family", label: "Multi-Family (2-4 Unit)", bedsMin: 3, bedsMax: 10, sqftMin: 1800, sqftMax: 6000, multiplier: 0.9, w: 5 },
  { type: "coop", label: "Co-op", bedsMin: 0, bedsMax: 4, sqftMin: 450, sqftMax: 2500, multiplier: 0.65, w: 4 },
  { type: "mobile_home", label: "Mobile/Manufactured", bedsMin: 1, bedsMax: 4, sqftMin: 600, sqftMax: 2200, multiplier: 0.2, w: 2 },
  { type: "land", label: "Vacant Land", bedsMin: 0, bedsMax: 0, sqftMin: 0, sqftMax: 0, multiplier: 0.3, w: 4 },
];

const LISTING_STATUS = [
  { status: "active", w: 30 },
  { status: "pending", w: 18 },
  { status: "sold", w: 38 },
  { status: "coming_soon", w: 5 },
  { status: "contingent", w: 6 },
  { status: "expired", w: 3 },
];

export function generateRealEstate(count = 1200) {
  const f = createFaker(7007);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const metro = f.helpers.weightedArrayElement(METROS.map((m) => ({ weight: m.w, value: m })));
    const propType = f.helpers.weightedArrayElement(PROPERTY_TYPES.map((p) => ({ weight: p.w, value: p })));
    const status = f.helpers.weightedArrayElement(LISTING_STATUS.map((s) => ({ weight: s.w, value: s.status })));

    const beds = propType.type === "land" ? 0 : f.number.int({ min: propType.bedsMin, max: propType.bedsMax });
    const baths = propType.type === "land" ? 0 : round(f.number.float({ min: Math.max(1, beds - 1), max: beds + 1.5, fractionDigits: 1 }), 1);
    const sqft = propType.type === "land" ? 0 : f.number.int({ min: propType.sqftMin, max: propType.sqftMax });
    const lotSqft = propType.type === "condo" || propType.type === "coop"
      ? 0
      : propType.type === "land"
        ? f.number.int({ min: 4000, max: 200000 })
        : f.number.int({ min: 2000, max: 25000 });

    const yearBuilt = propType.type === "land" ? 0 : f.number.int({ min: 1890, max: 2025 });
    const age = yearBuilt > 0 ? new Date().getFullYear() - yearBuilt : 0;

    // Price = (median via log-normal) × property multiplier × sqft factor
    const basePrice = clamp(logNormal(f, metro.medianPrice, 0.55), metro.medianPrice * 0.25, metro.medianPrice * 4);
    const listPrice = Math.round(basePrice * propType.multiplier * (sqft > 0 ? sqft / 1800 : 1));
    // Sold price usually within ±5% of list; hot markets over-ask
    const soldRatio = metro.inventory === "low" ? f.number.float({ min: 0.98, max: 1.15, fractionDigits: 3 }) : metro.inventory === "high" ? f.number.float({ min: 0.88, max: 1.02, fractionDigits: 3 }) : f.number.float({ min: 0.93, max: 1.05, fractionDigits: 3 });
    const soldPrice = status === "sold" ? Math.round(listPrice * soldRatio) : 0;
    const pricePerSqft = sqft > 0 ? Math.round(listPrice / sqft) : 0;

    const listedDate = f.date.between({ from: "2025-01-01", to: "2025-12-01" });
    const daysOnMarket = metro.inventory === "low" ? f.number.int({ min: 1, max: 30 }) : metro.inventory === "medium" ? f.number.int({ min: 7, max: 75 }) : f.number.int({ min: 20, max: 180 });
    const soldDate = status === "sold" ? new Date(listedDate.getTime() + daysOnMarket * 24 * 3600 * 1000) : null;

    // HOA common for condos/townhouses
    const hoaFee = propType.type === "condo" || propType.type === "coop" ? f.number.int({ min: 200, max: 1800 }) : propType.type === "townhouse" ? f.number.int({ min: 50, max: 450 }) : 0;

    // Property tax ~0.5% (HI) to 2.4% (NJ) of assessed value annually
    const taxRatePct = metro.state === "NJ" || metro.state === "IL" || metro.state === "TX" || metro.state === "CT" ? f.number.float({ min: 1.8, max: 2.4, fractionDigits: 3 }) : metro.state === "CA" ? f.number.float({ min: 0.7, max: 1.2, fractionDigits: 3 }) : f.number.float({ min: 0.6, max: 1.6, fractionDigits: 3 });
    const annualTax = Math.round(listPrice * (taxRatePct / 100));

    // 30-yr mortgage ~6.8-7.5% late 2025
    const mortgageRatePct = round(f.number.float({ min: 6.5, max: 7.8, fractionDigits: 3 }), 3);
    const downPct = f.helpers.weightedArrayElement([
      { weight: 30, value: 0.20 },
      { weight: 20, value: 0.10 },
      { weight: 15, value: 0.05 },
      { weight: 15, value: 0.25 },
      { weight: 10, value: 0.035 }, // FHA
      { weight: 5, value: 0.50 },
      { weight: 5, value: 1.0 }, // cash
    ]);
    const loanAmount = Math.round(listPrice * (1 - downPct));
    const monthlyRate = mortgageRatePct / 100 / 12;
    const n = 360;
    const monthlyPayment = loanAmount > 0 ? Math.round((loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n))) : 0;

    rows.push({
      listing_id: `MLS${f.string.numeric({ length: 9, allowLeadingZeros: true })}`,
      mls_number: `${metro.state}${f.string.numeric({ length: 7, allowLeadingZeros: true })}`,
      address: f.location.streetAddress(),
      city: metro.city,
      state: metro.state,
      zip_code: f.location.zipCode(),
      // Anchor to the metro centroid with ±0.08° (~9 km) jitter so the
      // geo-map plots listings on the actual city. faker's location.latitude()
      // is uniform across the globe and breaks any city↔coords correspondence.
      latitude: round(metro.lat + f.number.float({ min: -0.08, max: 0.08, fractionDigits: 5 }), 5),
      longitude: round(metro.lon + f.number.float({ min: -0.08, max: 0.08, fractionDigits: 5 }), 5),
      property_type: propType.type,
      property_type_label: propType.label,
      listing_status: status,
      bedrooms: beds,
      bathrooms: baths,
      square_feet: sqft,
      lot_square_feet: lotSqft,
      year_built: yearBuilt || null,
      property_age: yearBuilt > 0 ? age : null,
      stories: propType.type === "single_family" || propType.type === "townhouse" ? f.number.int({ min: 1, max: 3 }) : 1,
      garage_spaces: propType.type === "condo" || propType.type === "coop" || propType.type === "land" ? 0 : f.number.int({ min: 0, max: 4 }),
      has_pool: f.datatype.boolean(metro.state === "FL" || metro.state === "AZ" || metro.state === "CA" ? 0.3 : 0.08),
      has_basement: f.datatype.boolean(["MA", "NY", "IL", "OH", "MI", "MN", "NJ"].includes(metro.state) ? 0.6 : 0.1),
      list_price_usd: listPrice,
      sold_price_usd: soldPrice || null,
      price_per_sqft_usd: pricePerSqft,
      sale_to_list_ratio: status === "sold" ? round(soldRatio, 4) : null,
      estimated_market_value_usd: Math.round(listPrice * f.number.float({ min: 0.95, max: 1.08, fractionDigits: 3 })),
      listed_date: listedDate.toISOString().split("T")[0],
      sold_date: soldDate ? soldDate.toISOString().split("T")[0] : null,
      days_on_market: status === "sold" || status === "pending" ? daysOnMarket : Math.round((Date.now() - listedDate.getTime()) / (24 * 3600 * 1000)),
      price_reduced_count: f.number.int({ min: 0, max: 4 }),
      price_reduction_total_usd: f.number.int({ min: 0, max: 4 }) > 0 ? Math.round(listPrice * f.number.float({ min: 0.01, max: 0.08, fractionDigits: 3 })) : 0,
      hoa_fee_monthly_usd: hoaFee,
      annual_tax_usd: annualTax,
      tax_rate_pct: round(taxRatePct, 3),
      mortgage_rate_pct: mortgageRatePct,
      down_payment_pct: round(downPct * 100, 1),
      loan_amount_usd: loanAmount,
      est_monthly_payment_usd: monthlyPayment,
      listing_agent: f.person.fullName(),
      listing_office: `${f.company.name()} Realty`,
      brokerage: f.helpers.weightedArrayElement([
        { weight: 22, value: "Keller Williams" },
        { weight: 18, value: "RE/MAX" },
        { weight: 15, value: "Coldwell Banker" },
        { weight: 12, value: "Compass" },
        { weight: 10, value: "Berkshire Hathaway HomeServices" },
        { weight: 8, value: "Redfin" },
        { weight: 8, value: "Century 21" },
        { weight: 4, value: "eXp Realty" },
        { weight: 3, value: "Sotheby's International" },
      ]),
      zestimate_accuracy_pct: round(f.number.float({ min: 90, max: 105, fractionDigits: 2 }), 2),
      school_rating: f.number.int({ min: 1, max: 10 }),
      walk_score: f.number.int({ min: 10, max: 100 }),
      transit_score: f.number.int({ min: 0, max: 100 }),
      virtual_tour: f.datatype.boolean(0.55),
      is_new_construction: yearBuilt >= 2024,
      is_foreclosure: f.datatype.boolean(0.02),
      views_last_30d: Math.round(clamp(logNormal(f, 420, 1.0), 5, 15000)),
      saves_last_30d: Math.round(clamp(logNormal(f, 18, 1.1), 0, 500)),
    });
  }
  return rows;
}

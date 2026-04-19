import { createFaker, clamp, logNormal, round } from "./faker-utils";

// EIA CBECS building-type energy intensity baselines (kWh/sqft/year)
const BUILDING_TYPES = [
  { type: "data_center", label: "Data Center", eui: 220, area: [5000, 200000], occupantsPer1000Sqft: 0.2, peakHourStart: 0, peakHourEnd: 23, w: 6 },
  { type: "hospital", label: "Hospital", eui: 90, area: [40000, 600000], occupantsPer1000Sqft: 2.5, peakHourStart: 0, peakHourEnd: 23, w: 5 },
  { type: "supermarket", label: "Supermarket", eui: 52, area: [15000, 80000], occupantsPer1000Sqft: 1.8, peakHourStart: 6, peakHourEnd: 22, w: 8 },
  { type: "restaurant", label: "Restaurant", eui: 48, area: [2000, 12000], occupantsPer1000Sqft: 8, peakHourStart: 10, peakHourEnd: 22, w: 7 },
  { type: "office_large", label: "Office (Large)", eui: 18, area: [50000, 500000], occupantsPer1000Sqft: 3.5, peakHourStart: 8, peakHourEnd: 18, w: 18 },
  { type: "office_small", label: "Office (Small)", eui: 14, area: [2000, 25000], occupantsPer1000Sqft: 3.0, peakHourStart: 8, peakHourEnd: 18, w: 15 },
  { type: "retail", label: "Retail Store", eui: 16, area: [5000, 40000], occupantsPer1000Sqft: 2.5, peakHourStart: 9, peakHourEnd: 21, w: 10 },
  { type: "school", label: "School", eui: 12, area: [30000, 150000], occupantsPer1000Sqft: 6, peakHourStart: 7, peakHourEnd: 16, w: 8 },
  { type: "warehouse", label: "Warehouse", eui: 6, area: [20000, 500000], occupantsPer1000Sqft: 0.3, peakHourStart: 6, peakHourEnd: 18, w: 10 },
  { type: "hotel", label: "Hotel", eui: 36, area: [20000, 300000], occupantsPer1000Sqft: 1.8, peakHourStart: 0, peakHourEnd: 23, w: 5 },
  { type: "residential_mf", label: "Multi-Family Residential", eui: 11, area: [10000, 250000], occupantsPer1000Sqft: 3.0, peakHourStart: 17, peakHourEnd: 22, w: 8 },
];

const UTILITIES = [
  { name: "PG&E", state: "CA", rateKwh: [0.28, 0.42], w: 10 },
  { name: "Con Edison", state: "NY", rateKwh: [0.22, 0.32], w: 10 },
  { name: "Duke Energy", state: "NC", rateKwh: [0.11, 0.15], w: 10 },
  { name: "Southern California Edison", state: "CA", rateKwh: [0.26, 0.38], w: 10 },
  { name: "Dominion Energy", state: "VA", rateKwh: [0.12, 0.17], w: 8 },
  { name: "Exelon ComEd", state: "IL", rateKwh: [0.13, 0.19], w: 8 },
  { name: "Xcel Energy", state: "CO", rateKwh: [0.12, 0.18], w: 7 },
  { name: "TVA", state: "TN", rateKwh: [0.10, 0.14], w: 7 },
  { name: "ERCOT (TX)", state: "TX", rateKwh: [0.09, 0.16], w: 10 },
  { name: "Florida Power & Light", state: "FL", rateKwh: [0.11, 0.16], w: 8 },
];

function seasonalFactor(month: number): number {
  // Peak consumption in summer (cooling) and winter (heating), shoulder months lower
  if (month === 7 || month === 8) return 1.35;
  if (month === 12 || month === 1 || month === 2) return 1.22;
  if (month === 6 || month === 9) return 1.1;
  return 0.92;
}

function hourOfDayFactor(hour: number, peakStart: number, peakEnd: number): number {
  if (hour >= peakStart && hour <= peakEnd) return f24(hour);
  return 0.45;
}

function f24(hour: number): number {
  // Commercial load curve — peaks around 13–15h
  const peakHour = 14;
  const dist = Math.abs(hour - peakHour);
  return Math.max(0.55, 1.2 - dist * 0.06);
}

export function generateEnergyConsumption(count = 2000) {
  const f = createFaker(21021);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const bldg = f.helpers.weightedArrayElement(BUILDING_TYPES.map((b) => ({ weight: b.w, value: b })));
    const utility = f.helpers.weightedArrayElement(UTILITIES.map((u) => ({ weight: u.w, value: u })));

    const sqft = f.number.int({ min: bldg.area[0]!, max: bldg.area[1]! });
    const occupants = Math.round((sqft / 1000) * bldg.occupantsPer1000Sqft);
    const annualKwh = Math.round(sqft * bldg.eui * f.number.float({ min: 0.85, max: 1.25, fractionDigits: 3 }));

    const readingTs = f.date.between({ from: "2025-01-01", to: "2025-12-31" });
    const hour = readingTs.getHours();
    const month = readingTs.getMonth() + 1;
    const dayOfWeek = readingTs.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Hourly kWh = annual / 8760 × season × hour × (weekend discount for offices)
    const hourlyBase = annualKwh / 8760;
    const occupancyFactor = (bldg.type.startsWith("office") || bldg.type === "school") && isWeekend ? 0.3 : 1.0;
    const hourlyKwh = round(hourlyBase * seasonalFactor(month) * hourOfDayFactor(hour, bldg.peakHourStart, bldg.peakHourEnd) * occupancyFactor * f.number.float({ min: 0.85, max: 1.15, fractionDigits: 3 }), 3);

    const rate = round(f.number.float({ min: utility.rateKwh[0]!, max: utility.rateKwh[1]!, fractionDigits: 4 }), 4);
    // TOU pricing: peak hours cost ~1.5x, off-peak ~0.7x
    const isPeakHour = hour >= 14 && hour <= 20 && !isWeekend;
    const effectiveRate = isPeakHour ? round(rate * 1.5, 4) : hour >= 22 || hour <= 6 ? round(rate * 0.7, 4) : rate;
    const costUsd = round(hourlyKwh * effectiveRate, 4);

    // Demand (kW) typically 1.3x hourly kWh due to peak draws
    const demandKw = round(hourlyKwh * f.number.float({ min: 1.0, max: 1.5, fractionDigits: 2 }), 2);
    // Power factor — industrial 0.8–0.95, commercial 0.9–0.98
    const powerFactor = round(f.number.float({ min: 0.82, max: 0.98, fractionDigits: 3 }), 3);
    // Grid emission factor varies by state (EPA eGRID 2023) — renewables-heavy states low, coal-heavy high
    const co2Factor = utility.state === "CA" ? 0.22 : utility.state === "NY" ? 0.19 : utility.state === "TX" ? 0.40 : utility.state === "TN" ? 0.28 : 0.45;
    const co2Kg = round(hourlyKwh * co2Factor, 3);

    const hvacPct = round(f.number.float({ min: 0.3, max: 0.55, fractionDigits: 3 }), 3);
    const lightingPct = round(f.number.float({ min: 0.1, max: 0.25, fractionDigits: 3 }), 3);
    const plugLoadPct = round(1 - hvacPct - lightingPct - 0.05, 3);

    rows.push({
      meter_id: `MTR-${f.string.alphanumeric({ length: 10, casing: "upper" })}`,
      building_id: `BLD-${f.string.alphanumeric({ length: 8, casing: "upper" })}`,
      building_name: `${f.company.name()} ${bldg.label}`,
      building_type: bldg.type,
      building_label: bldg.label,
      square_feet: sqft,
      occupants,
      address_state: utility.state,
      utility_provider: utility.name,
      tariff_class: bldg.type === "residential_mf" ? "Residential" : bldg.type === "warehouse" || bldg.type === "data_center" ? "Industrial" : "Commercial",
      reading_ts: readingTs.toISOString(),
      reading_date: readingTs.toISOString().split("T")[0],
      hour,
      day_of_week: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek],
      is_weekend: isWeekend,
      is_peak_hour: isPeakHour,
      kwh_consumed: hourlyKwh,
      demand_kw: demandKw,
      power_factor: powerFactor,
      rate_usd_per_kwh: effectiveRate,
      cost_usd: costUsd,
      co2_kg: co2Kg,
      energy_use_intensity: bldg.eui,
      hvac_pct: hvacPct,
      lighting_pct: lightingPct,
      plug_load_pct: plugLoadPct,
      other_pct: round(1 - hvacPct - lightingPct - plugLoadPct, 3),
      outdoor_temp_c: round(seasonalFactor(month) > 1.2 && month >= 6 && month <= 8 ? f.number.float({ min: 22, max: 38, fractionDigits: 1 }) : month === 1 || month === 2 || month === 12 ? f.number.float({ min: -10, max: 8, fractionDigits: 1 }) : f.number.float({ min: 8, max: 24, fractionDigits: 1 }), 1),
      has_solar: f.datatype.boolean(0.18),
      solar_kwh_generated: 0,
      leed_certification: f.helpers.weightedArrayElement([
        { weight: 55, value: "none" },
        { weight: 18, value: "Certified" },
        { weight: 14, value: "Silver" },
        { weight: 9, value: "Gold" },
        { weight: 4, value: "Platinum" },
      ]),
      energy_star_score: f.number.int({ min: 25, max: 100 }),
      anomaly_flag: round(clamp(logNormal(f, 1, 0.3), 0, 10), 2) > 2.5,
    });
  }
  return rows;
}

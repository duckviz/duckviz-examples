import { createFaker, clamp, round } from "./faker-utils";

// Crops with realistic yields (bu/acre or ton/acre), planting windows, typical inputs.
// Sources: USDA NASS 2023 averages
const CROPS = [
  { name: "Corn", yieldUnit: "bu/acre", yieldMean: 177, yieldStd: 40, plantMonth: 4, harvestMonth: 10, priceUsd: 4.5, waterInchesSeason: 22, nitrogenLbsAcre: 180, w: 16 },
  { name: "Soybeans", yieldUnit: "bu/acre", yieldMean: 50, yieldStd: 12, plantMonth: 5, harvestMonth: 10, priceUsd: 12.8, waterInchesSeason: 20, nitrogenLbsAcre: 30, w: 14 },
  { name: "Wheat (Winter)", yieldUnit: "bu/acre", yieldMean: 52, yieldStd: 14, plantMonth: 10, harvestMonth: 7, priceUsd: 6.9, waterInchesSeason: 18, nitrogenLbsAcre: 100, w: 10 },
  { name: "Wheat (Spring)", yieldUnit: "bu/acre", yieldMean: 48, yieldStd: 12, plantMonth: 4, harvestMonth: 8, priceUsd: 7.2, waterInchesSeason: 17, nitrogenLbsAcre: 90, w: 5 },
  { name: "Rice", yieldUnit: "cwt/acre", yieldMean: 77, yieldStd: 10, plantMonth: 4, harvestMonth: 9, priceUsd: 16.5, waterInchesSeason: 45, nitrogenLbsAcre: 150, w: 5 },
  { name: "Cotton", yieldUnit: "lb/acre", yieldMean: 850, yieldStd: 220, plantMonth: 5, harvestMonth: 10, priceUsd: 0.76, waterInchesSeason: 24, nitrogenLbsAcre: 85, w: 7 },
  { name: "Sorghum", yieldUnit: "bu/acre", yieldMean: 65, yieldStd: 18, plantMonth: 5, harvestMonth: 10, priceUsd: 4.2, waterInchesSeason: 16, nitrogenLbsAcre: 70, w: 3 },
  { name: "Barley", yieldUnit: "bu/acre", yieldMean: 77, yieldStd: 20, plantMonth: 4, harvestMonth: 8, priceUsd: 5.3, waterInchesSeason: 16, nitrogenLbsAcre: 80, w: 3 },
  { name: "Oats", yieldUnit: "bu/acre", yieldMean: 63, yieldStd: 18, plantMonth: 4, harvestMonth: 8, priceUsd: 4.1, waterInchesSeason: 15, nitrogenLbsAcre: 60, w: 2 },
  { name: "Potatoes", yieldUnit: "cwt/acre", yieldMean: 460, yieldStd: 90, plantMonth: 4, harvestMonth: 9, priceUsd: 11.8, waterInchesSeason: 22, nitrogenLbsAcre: 220, w: 5 },
  { name: "Sugarcane", yieldUnit: "ton/acre", yieldMean: 35, yieldStd: 8, plantMonth: 3, harvestMonth: 12, priceUsd: 45, waterInchesSeason: 60, nitrogenLbsAcre: 180, w: 3 },
  { name: "Almonds", yieldUnit: "lb/acre", yieldMean: 2200, yieldStd: 450, plantMonth: 2, harvestMonth: 8, priceUsd: 2.2, waterInchesSeason: 48, nitrogenLbsAcre: 250, w: 3 },
  { name: "Grapes (Wine)", yieldUnit: "ton/acre", yieldMean: 7.2, yieldStd: 2, plantMonth: 3, harvestMonth: 9, priceUsd: 850, waterInchesSeason: 20, nitrogenLbsAcre: 60, w: 3 },
  { name: "Apples", yieldUnit: "bu/acre", yieldMean: 850, yieldStd: 200, plantMonth: 4, harvestMonth: 9, priceUsd: 30, waterInchesSeason: 30, nitrogenLbsAcre: 90, w: 3 },
];

// Top US ag-producing states with dominant crops
const STATES = [
  { code: "IA", name: "Iowa", region: "Midwest", w: 14 },
  { code: "IL", name: "Illinois", region: "Midwest", w: 12 },
  { code: "NE", name: "Nebraska", region: "Midwest", w: 10 },
  { code: "KS", name: "Kansas", region: "Midwest", w: 8 },
  { code: "MN", name: "Minnesota", region: "Midwest", w: 8 },
  { code: "IN", name: "Indiana", region: "Midwest", w: 7 },
  { code: "TX", name: "Texas", region: "South", w: 10 },
  { code: "CA", name: "California", region: "West", w: 9 },
  { code: "MS", name: "Mississippi", region: "South", w: 4 },
  { code: "AR", name: "Arkansas", region: "South", w: 4 },
  { code: "ND", name: "North Dakota", region: "Plains", w: 5 },
  { code: "SD", name: "South Dakota", region: "Plains", w: 4 },
  { code: "OH", name: "Ohio", region: "Midwest", w: 5 },
];

const SOIL_TYPES = [
  { type: "Silty Clay Loam", organic: [3.0, 5.5], w: 22 },
  { type: "Silt Loam", organic: [2.5, 4.5], w: 20 },
  { type: "Clay Loam", organic: [2.0, 4.0], w: 15 },
  { type: "Sandy Loam", organic: [1.0, 3.0], w: 15 },
  { type: "Loam", organic: [2.5, 4.5], w: 12 },
  { type: "Loamy Sand", organic: [0.5, 2.0], w: 8 },
  { type: "Clay", organic: [2.5, 4.5], w: 5 },
  { type: "Sand", organic: [0.2, 1.2], w: 3 },
];

const IRRIGATION_SYSTEMS = [
  { name: "Center Pivot", efficiencyPct: 82, w: 35 },
  { name: "Drip", efficiencyPct: 92, w: 15 },
  { name: "Furrow / Flood", efficiencyPct: 55, w: 18 },
  { name: "Sprinkler (Solid Set)", efficiencyPct: 75, w: 12 },
  { name: "Subsurface Drip", efficiencyPct: 95, w: 5 },
  { name: "Rainfed Only", efficiencyPct: 0, w: 15 },
];

export function generateAgriculturalYields(count = 600) {
  const f = createFaker(9009);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const crop = f.helpers.weightedArrayElement(CROPS.map((c) => ({ weight: c.w, value: c })));
    const state = f.helpers.weightedArrayElement(STATES.map((s) => ({ weight: s.w, value: s })));
    const soil = f.helpers.weightedArrayElement(SOIL_TYPES.map((s) => ({ weight: s.w, value: s })));
    const irrigation = f.helpers.weightedArrayElement(IRRIGATION_SYSTEMS.map((ir) => ({ weight: ir.w, value: ir })));

    // Yield is normally distributed around mean with some bad-year tails
    const weatherScore = round(f.number.float({ min: 0.55, max: 1.15, fractionDigits: 3 }), 3); // 1.0 = normal
    const pestPressure = f.helpers.weightedArrayElement([
      { weight: 60, value: "low" },
      { weight: 28, value: "moderate" },
      { weight: 10, value: "high" },
      { weight: 2, value: "severe" },
    ]);
    const pestPenalty = pestPressure === "severe" ? 0.65 : pestPressure === "high" ? 0.82 : pestPressure === "moderate" ? 0.94 : 1.0;

    const baseYield = crop.yieldMean + f.number.float({ min: -crop.yieldStd, max: crop.yieldStd, fractionDigits: 2 });
    const actualYield = round(clamp(baseYield * weatherScore * pestPenalty, crop.yieldMean * 0.2, crop.yieldMean * 1.8), 2);

    const farmAcres = f.number.int({ min: 80, max: 5000 });
    const plantedAcres = Math.round(farmAcres * f.number.float({ min: 0.75, max: 0.98, fractionDigits: 2 }));
    const harvestedAcres = Math.round(plantedAcres * f.number.float({ min: 0.9, max: 1.0, fractionDigits: 3 }));
    const totalProduction = Math.round(actualYield * harvestedAcres);
    const grossRevenue = round(totalProduction * crop.priceUsd, 2);

    // Input costs — fertilizer, seed, labor, equipment, crop insurance
    const fertilizerCostAcre = round(crop.nitrogenLbsAcre * 0.65 + f.number.float({ min: 20, max: 60, fractionDigits: 2 }), 2);
    const seedCostAcre = round(f.number.float({ min: 60, max: 220, fractionDigits: 2 }), 2);
    const laborCostAcre = round(f.number.float({ min: 25, max: 140, fractionDigits: 2 }), 2);
    const equipmentCostAcre = round(f.number.float({ min: 40, max: 150, fractionDigits: 2 }), 2);
    const chemicalsCostAcre = round(f.number.float({ min: 20, max: 90, fractionDigits: 2 }), 2);
    const totalCostAcre = round(fertilizerCostAcre + seedCostAcre + laborCostAcre + equipmentCostAcre + chemicalsCostAcre, 2);
    const totalCost = round(totalCostAcre * harvestedAcres, 2);
    const netProfit = round(grossRevenue - totalCost, 2);
    const profitPerAcre = harvestedAcres > 0 ? round(netProfit / harvestedAcres, 2) : 0;

    const growingSeasonYear = f.number.int({ min: 2023, max: 2025 });
    const plantingDate = new Date(growingSeasonYear, crop.plantMonth - 1, f.number.int({ min: 1, max: 28 }));
    const harvestYear = crop.harvestMonth < crop.plantMonth ? growingSeasonYear + 1 : growingSeasonYear;
    const harvestDate = new Date(harvestYear, crop.harvestMonth - 1, f.number.int({ min: 1, max: 28 }));

    const waterApplied = irrigation.efficiencyPct > 0 ? round(crop.waterInchesSeason * f.number.float({ min: 0.9, max: 1.2, fractionDigits: 2 }), 1) : 0;

    rows.push({
      field_id: `FLD-${state.code}-${f.string.alphanumeric({ length: 8, casing: "upper" })}`,
      farm_id: `FRM-${f.string.alphanumeric({ length: 8, casing: "upper" })}`,
      farm_name: `${f.person.lastName()} ${f.helpers.arrayElement(["Farms", "Ranch", "Agribusiness", "Ag Co"])}`,
      state_code: state.code,
      state_name: state.name,
      region: state.region,
      county: `${f.location.county()}`,
      latitude: round(f.location.latitude({ min: 25, max: 48 }), 5),
      longitude: round(f.location.longitude({ min: -125, max: -70 }), 5),
      crop_name: crop.name,
      growing_season_year: growingSeasonYear,
      planting_date: plantingDate.toISOString().split("T")[0],
      harvest_date: harvestDate.toISOString().split("T")[0],
      growing_days: Math.round((harvestDate.getTime() - plantingDate.getTime()) / (24 * 3600 * 1000)),
      field_acres: farmAcres,
      planted_acres: plantedAcres,
      harvested_acres: harvestedAcres,
      yield_per_acre: actualYield,
      yield_unit: crop.yieldUnit,
      total_production: totalProduction,
      soil_type: soil.type,
      soil_organic_matter_pct: round(f.number.float({ min: soil.organic[0]!, max: soil.organic[1]!, fractionDigits: 2 }), 2),
      soil_ph: round(f.number.float({ min: 5.2, max: 7.8, fractionDigits: 2 }), 2),
      irrigation_system: irrigation.name,
      irrigation_efficiency_pct: irrigation.efficiencyPct,
      water_applied_inches: waterApplied,
      total_rainfall_inches: round(f.number.float({ min: 8, max: 55, fractionDigits: 1 }), 1),
      gdd_accumulated: f.number.int({ min: 1800, max: 4200 }),
      nitrogen_applied_lbs_acre: round(crop.nitrogenLbsAcre * f.number.float({ min: 0.85, max: 1.15, fractionDigits: 2 }), 1),
      phosphorus_applied_lbs_acre: round(f.number.float({ min: 20, max: 90, fractionDigits: 1 }), 1),
      potassium_applied_lbs_acre: round(f.number.float({ min: 30, max: 140, fractionDigits: 1 }), 1),
      pest_pressure: pestPressure,
      weather_anomaly_score: weatherScore,
      fertilizer_cost_usd_acre: fertilizerCostAcre,
      seed_cost_usd_acre: seedCostAcre,
      labor_cost_usd_acre: laborCostAcre,
      equipment_cost_usd_acre: equipmentCostAcre,
      chemicals_cost_usd_acre: chemicalsCostAcre,
      total_cost_usd_acre: totalCostAcre,
      price_per_unit_usd: crop.priceUsd,
      gross_revenue_usd: grossRevenue,
      total_cost_usd: totalCost,
      net_profit_usd: netProfit,
      profit_per_acre_usd: profitPerAcre,
      crop_insurance: f.datatype.boolean(0.82),
      organic_certified: f.datatype.boolean(0.07),
      gmo_variety: f.datatype.boolean(crop.name === "Corn" || crop.name === "Soybeans" || crop.name === "Cotton" ? 0.88 : 0.02),
      tillage_practice: f.helpers.weightedArrayElement([
        { weight: 45, value: "No-Till" },
        { weight: 25, value: "Reduced Till" },
        { weight: 20, value: "Conventional Till" },
        { weight: 10, value: "Strip-Till" },
      ]),
    });
  }
  return rows;
}

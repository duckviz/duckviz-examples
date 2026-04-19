import { createFaker, clamp, round } from "./faker-utils";

// ICAO station identifiers for major US airports (METAR sources).
const STATIONS = [
  { icao: "KJFK", city: "New York", lat: 40.64, lon: -73.78, elev_m: 4, climate: "temperate" },
  { icao: "KLAX", city: "Los Angeles", lat: 33.94, lon: -118.41, elev_m: 38, climate: "mediterranean" },
  { icao: "KORD", city: "Chicago", lat: 41.98, lon: -87.91, elev_m: 204, climate: "continental" },
  { icao: "KDFW", city: "Dallas", lat: 32.90, lon: -97.04, elev_m: 184, climate: "humid_subtropical" },
  { icao: "KATL", city: "Atlanta", lat: 33.64, lon: -84.43, elev_m: 313, climate: "humid_subtropical" },
  { icao: "KDEN", city: "Denver", lat: 39.86, lon: -104.67, elev_m: 1655, climate: "semi_arid" },
  { icao: "KSEA", city: "Seattle", lat: 47.45, lon: -122.31, elev_m: 132, climate: "oceanic" },
  { icao: "KPHX", city: "Phoenix", lat: 33.43, lon: -112.01, elev_m: 337, climate: "arid" },
  { icao: "KMIA", city: "Miami", lat: 25.79, lon: -80.29, elev_m: 2, climate: "tropical" },
  { icao: "KBOS", city: "Boston", lat: 42.36, lon: -71.01, elev_m: 6, climate: "temperate" },
];

// METAR-style condition codes
const CONDITIONS = [
  { code: "CLR", label: "Clear", w: 28 },
  { code: "FEW", label: "Few Clouds", w: 12 },
  { code: "SCT", label: "Scattered Clouds", w: 14 },
  { code: "BKN", label: "Broken Clouds", w: 12 },
  { code: "OVC", label: "Overcast", w: 10 },
  { code: "-RA", label: "Light Rain", w: 8 },
  { code: "RA", label: "Rain", w: 5 },
  { code: "+RA", label: "Heavy Rain", w: 2 },
  { code: "TSRA", label: "Thunderstorm Rain", w: 3 },
  { code: "FG", label: "Fog", w: 2 },
  { code: "BR", label: "Mist", w: 2 },
  { code: "-SN", label: "Light Snow", w: 1 },
  { code: "SN", label: "Snow", w: 1 },
];

function climateTemps(climate: string, month: number): { highC: number; lowC: number; humidity: number; precipChance: number } {
  // Very rough seasonal ranges
  const season = month === 12 || month <= 2 ? "winter" : month <= 5 ? "spring" : month <= 8 ? "summer" : "fall";
  const profiles: Record<string, Record<string, { highC: number; lowC: number; humidity: number; precipChance: number }>> = {
    temperate: { winter: { highC: 5, lowC: -3, humidity: 60, precipChance: 0.35 }, spring: { highC: 17, lowC: 7, humidity: 55, precipChance: 0.35 }, summer: { highC: 29, lowC: 20, humidity: 65, precipChance: 0.3 }, fall: { highC: 18, lowC: 9, humidity: 60, precipChance: 0.3 } },
    mediterranean: { winter: { highC: 18, lowC: 9, humidity: 55, precipChance: 0.2 }, spring: { highC: 22, lowC: 12, humidity: 50, precipChance: 0.1 }, summer: { highC: 28, lowC: 18, humidity: 45, precipChance: 0.02 }, fall: { highC: 25, lowC: 15, humidity: 50, precipChance: 0.1 } },
    continental: { winter: { highC: 0, lowC: -9, humidity: 65, precipChance: 0.35 }, spring: { highC: 16, lowC: 5, humidity: 60, precipChance: 0.38 }, summer: { highC: 29, lowC: 19, humidity: 65, precipChance: 0.35 }, fall: { highC: 16, lowC: 7, humidity: 60, precipChance: 0.3 } },
    humid_subtropical: { winter: { highC: 15, lowC: 4, humidity: 65, precipChance: 0.3 }, spring: { highC: 24, lowC: 13, humidity: 62, precipChance: 0.35 }, summer: { highC: 34, lowC: 23, humidity: 68, precipChance: 0.4 }, fall: { highC: 24, lowC: 13, humidity: 62, precipChance: 0.25 } },
    semi_arid: { winter: { highC: 7, lowC: -7, humidity: 45, precipChance: 0.2 }, spring: { highC: 18, lowC: 2, humidity: 40, precipChance: 0.3 }, summer: { highC: 31, lowC: 15, humidity: 38, precipChance: 0.35 }, fall: { highC: 20, lowC: 5, humidity: 42, precipChance: 0.2 } },
    oceanic: { winter: { highC: 9, lowC: 3, humidity: 80, precipChance: 0.55 }, spring: { highC: 15, lowC: 6, humidity: 72, precipChance: 0.45 }, summer: { highC: 24, lowC: 13, humidity: 65, precipChance: 0.25 }, fall: { highC: 15, lowC: 8, humidity: 78, precipChance: 0.5 } },
    arid: { winter: { highC: 20, lowC: 8, humidity: 35, precipChance: 0.1 }, spring: { highC: 29, lowC: 14, humidity: 25, precipChance: 0.05 }, summer: { highC: 41, lowC: 27, humidity: 25, precipChance: 0.15 }, fall: { highC: 32, lowC: 17, humidity: 30, precipChance: 0.1 } },
    tropical: { winter: { highC: 25, lowC: 16, humidity: 72, precipChance: 0.2 }, spring: { highC: 28, lowC: 19, humidity: 72, precipChance: 0.2 }, summer: { highC: 32, lowC: 25, humidity: 80, precipChance: 0.55 }, fall: { highC: 30, lowC: 23, humidity: 78, precipChance: 0.45 } },
  };
  return profiles[climate]![season]!;
}

export function generateWeatherObservations(count = 1500) {
  const f = createFaker(12012);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const station = f.helpers.arrayElement(STATIONS);
    const obsTs = f.date.between({ from: "2024-01-01", to: "2025-12-31" });
    const profile = climateTemps(station.climate, obsTs.getMonth() + 1);

    const highC = round(profile.highC + f.number.float({ min: -4, max: 4, fractionDigits: 1 }), 1);
    const lowC = round(Math.min(profile.lowC + f.number.float({ min: -3, max: 3, fractionDigits: 1 }), highC - 3), 1);
    const tempC = round(f.number.float({ min: lowC, max: highC, fractionDigits: 1 }), 1);
    const dewPointC = round(clamp(tempC - f.number.float({ min: 2, max: 12, fractionDigits: 1 }), -40, tempC), 1);
    const humidity = round(clamp(profile.humidity + f.number.float({ min: -20, max: 20, fractionDigits: 1 }), 10, 100), 1);
    const pressureHpa = round(f.number.float({ min: 990, max: 1030, fractionDigits: 1 }) - station.elev_m * 0.12, 1);

    const hasPrecip = f.datatype.boolean(profile.precipChance);
    const cond = hasPrecip
      ? f.helpers.arrayElement(tempC < 0 ? ["-SN", "SN"] : ["-RA", "RA", "+RA", "TSRA"])
      : f.helpers.weightedArrayElement(CONDITIONS.map((c) => ({ weight: c.w, value: c.code })));

    const windDir = f.number.int({ min: 0, max: 359 });
    const windSpeedKmh = round(clamp(f.number.float({ min: 0, max: 50, fractionDigits: 1 }) + (cond === "TSRA" ? 25 : 0), 0, 120), 1);
    const windGustKmh = round(windSpeedKmh * f.number.float({ min: 1.0, max: 1.8, fractionDigits: 2 }), 1);
    const visibilityKm = cond === "FG" || cond === "BR" ? round(f.number.float({ min: 0.1, max: 3, fractionDigits: 2 }), 2) : round(f.number.float({ min: 8, max: 16, fractionDigits: 1 }), 1);
    const precip1h = hasPrecip
      ? round(cond === "+RA" || cond === "TSRA" ? f.number.float({ min: 3, max: 25, fractionDigits: 2 }) : f.number.float({ min: 0.1, max: 4, fractionDigits: 2 }), 2)
      : 0;

    rows.push({
      station_icao: station.icao,
      station_city: station.city,
      latitude: station.lat,
      longitude: station.lon,
      elevation_m: station.elev_m,
      climate_zone: station.climate,
      observation_ts: obsTs.toISOString(),
      observation_date: obsTs.toISOString().split("T")[0],
      temp_c: tempC,
      temp_high_c: highC,
      temp_low_c: lowC,
      dew_point_c: dewPointC,
      humidity_pct: humidity,
      pressure_hpa: pressureHpa,
      wind_direction_deg: windDir,
      wind_speed_kmh: windSpeedKmh,
      wind_gust_kmh: windGustKmh,
      visibility_km: visibilityKm,
      cloud_cover_pct: cond === "CLR" ? 0 : cond === "FEW" ? f.number.int({ min: 10, max: 25 }) : cond === "SCT" ? f.number.int({ min: 30, max: 55 }) : cond === "BKN" ? f.number.int({ min: 60, max: 85 }) : f.number.int({ min: 90, max: 100 }),
      precipitation_1h_mm: precip1h,
      precipitation_24h_mm: hasPrecip ? round(precip1h * f.number.float({ min: 2, max: 10, fractionDigits: 1 }), 2) : 0,
      condition_code: cond,
      condition_label: CONDITIONS.find((c) => c.code === cond)?.label ?? cond,
      uv_index: tempC > 20 && cond === "CLR" ? f.number.int({ min: 5, max: 11 }) : f.number.int({ min: 0, max: 4 }),
    });
  }
  return rows;
}

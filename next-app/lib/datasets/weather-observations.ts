import { createRng } from "./seed-random";

const CONDITIONS = ["Sunny", "Partly Cloudy", "Cloudy", "Rain", "Thunderstorm", "Snow", "Fog", "Windy"];
const CONDITION_WEIGHTS = [25, 20, 15, 15, 5, 8, 5, 7];
const STATIONS = [
  { id: "WX-NYC", city: "New York" },
  { id: "WX-LAX", city: "Los Angeles" },
  { id: "WX-CHI", city: "Chicago" },
  { id: "WX-HOU", city: "Houston" },
  { id: "WX-PHX", city: "Phoenix" },
  { id: "WX-SEA", city: "Seattle" },
  { id: "WX-MIA", city: "Miami" },
  { id: "WX-DEN", city: "Denver" },
  { id: "WX-ATL", city: "Atlanta" },
  { id: "WX-BOS", city: "Boston" },
];

export function generateWeatherObservations(count = 1500) {
  const rng = createRng(12012);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const station = rng.pick(STATIONS);
    const tempHigh = rng.float(-5, 42);
    const tempLow = rng.float(tempHigh - 15, tempHigh - 3);
    rows.push({
      station_id: station.id,
      city: station.city,
      date: rng.date("2024-01-01", "2025-12-31"),
      temp_high_c: tempHigh,
      temp_low_c: Number(tempLow.toFixed(1)),
      humidity_pct: rng.float(20, 100),
      precipitation_mm: rng.bool(0.35) ? rng.float(0.1, 50) : 0,
      wind_speed_kmh: rng.float(0, 80),
      condition: rng.pickWeighted(CONDITIONS, CONDITION_WEIGHTS),
      uv_index: rng.int(0, 11),
    });
  }
  return rows;
}

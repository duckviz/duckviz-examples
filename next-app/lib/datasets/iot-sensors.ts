import { createRng } from "./seed-random";

const DEVICE_TYPES = ["Temperature Sensor", "Humidity Sensor", "Pressure Gauge", "Motion Detector", "Air Quality Monitor", "Vibration Sensor"];
const LOCATIONS = ["Factory Floor A", "Factory Floor B", "Warehouse 1", "Warehouse 2", "Server Room", "Office", "Loading Dock", "Rooftop"];
const ALERT_LEVELS = ["Normal", "Warning", "Critical"];
const ALERT_WEIGHTS = [75, 20, 5];

export function generateIotSensors(count = 2000) {
  const rng = createRng(5005);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const alertLevel = rng.pickWeighted(ALERT_LEVELS, ALERT_WEIGHTS);
    const tempBase = alertLevel === "Critical" ? 85 : alertLevel === "Warning" ? 65 : 40;
    rows.push({
      sensor_id: rng.id("SNS", rng.int(1, 100)),
      device_type: rng.pick(DEVICE_TYPES),
      location: rng.pick(LOCATIONS),
      temperature_c: rng.float(tempBase - 20, tempBase + 15),
      humidity_pct: rng.float(20, 95),
      pressure_hpa: rng.float(990, 1030),
      battery_pct: rng.float(5, 100),
      timestamp: rng.datetime("2025-01-01", "2025-12-31"),
      alert_level: alertLevel,
    });
  }
  return rows;
}

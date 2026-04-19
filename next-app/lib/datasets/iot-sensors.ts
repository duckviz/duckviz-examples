import { createFaker, clamp, round } from "./faker-utils";

// Real-world industrial IoT sensor types with typical measurement ranges and units
const SENSOR_TYPES = [
  { type: "temperature", label: "Temperature Sensor", unit: "°C", min: -40, max: 125, typical: [15, 35], protocol: "MQTT", w: 18 },
  { type: "humidity", label: "Relative Humidity", unit: "%RH", min: 0, max: 100, typical: [30, 70], protocol: "MQTT", w: 14 },
  { type: "pressure", label: "Pressure (Barometric)", unit: "hPa", min: 800, max: 1100, typical: [990, 1025], protocol: "Modbus", w: 8 },
  { type: "motion_pir", label: "PIR Motion Detector", unit: "bool", min: 0, max: 1, typical: [0, 0], protocol: "Zigbee", w: 10 },
  { type: "air_quality_pm25", label: "Air Quality PM2.5", unit: "µg/m³", min: 0, max: 500, typical: [5, 55], protocol: "LoRaWAN", w: 8 },
  { type: "co2", label: "CO2 Concentration", unit: "ppm", min: 300, max: 5000, typical: [400, 1200], protocol: "Modbus", w: 7 },
  { type: "vibration", label: "Vibration (RMS)", unit: "mm/s", min: 0, max: 50, typical: [0.5, 8], protocol: "OPC-UA", w: 6 },
  { type: "current", label: "AC Current Draw", unit: "A", min: 0, max: 200, typical: [5, 80], protocol: "Modbus", w: 5 },
  { type: "voltage", label: "Voltage", unit: "V", min: 0, max: 480, typical: [110, 240], protocol: "Modbus", w: 4 },
  { type: "flow_rate", label: "Flow Rate", unit: "L/min", min: 0, max: 1000, typical: [10, 400], protocol: "HART", w: 5 },
  { type: "level", label: "Tank Level", unit: "%", min: 0, max: 100, typical: [20, 95], protocol: "HART", w: 4 },
  { type: "light", label: "Illuminance", unit: "lux", min: 0, max: 100000, typical: [150, 800], protocol: "Zigbee", w: 5 },
  { type: "noise", label: "Sound Level", unit: "dB", min: 20, max: 140, typical: [35, 75], protocol: "MQTT", w: 3 },
  { type: "gas_voc", label: "VOC Gas Sensor", unit: "ppb", min: 0, max: 1000, typical: [50, 400], protocol: "LoRaWAN", w: 3 },
];

const MANUFACTURERS = ["Siemens", "Schneider Electric", "Honeywell", "ABB", "Emerson", "Rockwell", "Bosch", "Omron", "Libelium", "Enocean"];

const FACILITIES = [
  { id: "FAC-NYC-01", city: "New York", country: "US", type: "Smart Building" },
  { id: "FAC-LAX-02", city: "Los Angeles", country: "US", type: "Warehouse" },
  { id: "FAC-CHI-03", city: "Chicago", country: "US", type: "Factory" },
  { id: "FAC-BER-01", city: "Berlin", country: "DE", type: "Data Center" },
  { id: "FAC-LON-02", city: "London", country: "GB", type: "Office Campus" },
  { id: "FAC-SIN-01", city: "Singapore", country: "SG", type: "Logistics Hub" },
  { id: "FAC-TOK-01", city: "Tokyo", country: "JP", type: "Factory" },
  { id: "FAC-SAO-01", city: "São Paulo", country: "BR", type: "Agriculture" },
];

export function generateIotSensors(count = 2500) {
  const f = createFaker(5005);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const sensor = f.helpers.weightedArrayElement(SENSOR_TYPES.map((s) => ({ weight: s.w, value: s })));
    const facility = f.helpers.arrayElement(FACILITIES);

    // Most readings cluster in typical range; occasional anomaly in full range
    const isAnomaly = f.datatype.boolean(0.03);
    const reading = sensor.type === "motion_pir"
      ? (f.datatype.boolean(0.12) ? 1 : 0)
      : isAnomaly
        ? round(f.number.float({ min: sensor.min, max: sensor.max, fractionDigits: 2 }), 2)
        : round(f.number.float({ min: sensor.typical[0]!, max: sensor.typical[1]!, fractionDigits: 2 }), 2);

    // Battery-powered sensors drain; mains-powered stay at 100
    const isBatteryPowered = ["motion_pir", "air_quality_pm25", "gas_voc", "humidity"].includes(sensor.type);
    const batteryPct = isBatteryPowered ? f.number.int({ min: 5, max: 100 }) : null;

    const signalStrengthDbm = sensor.protocol === "LoRaWAN"
      ? f.number.int({ min: -130, max: -70 })
      : sensor.protocol === "Zigbee"
        ? f.number.int({ min: -90, max: -40 })
        : f.number.int({ min: -85, max: -35 });

    // Firmware versions follow semver
    const fwMajor = f.number.int({ min: 1, max: 5 });
    const fwMinor = f.number.int({ min: 0, max: 12 });
    const fwPatch = f.number.int({ min: 0, max: 45 });

    const observedAt = f.date.between({ from: "2025-09-01", to: "2025-12-31" });

    rows.push({
      reading_id: `rd_${f.string.alphanumeric({ length: 14, casing: "lower" })}`,
      device_id: `dev_${f.string.alphanumeric({ length: 10, casing: "lower" })}`,
      device_eui: Array.from({ length: 8 }, () => f.string.hexadecimal({ length: 2, prefix: "", casing: "upper" })).join(":"),
      sensor_type: sensor.type,
      sensor_label: sensor.label,
      manufacturer: f.helpers.arrayElement(MANUFACTURERS),
      model: `${f.string.alpha({ length: 3, casing: "upper" })}-${f.number.int({ min: 100, max: 9999 })}`,
      firmware_version: `${fwMajor}.${fwMinor}.${fwPatch}`,
      facility_id: facility.id,
      facility_city: facility.city,
      country: facility.country,
      zone: f.helpers.arrayElement(["Zone-A", "Zone-B", "Zone-C", "Zone-D", "Zone-E", "Exterior", "Rooftop", "Basement"]),
      protocol: sensor.protocol,
      network_id: sensor.protocol === "LoRaWAN" ? `LNS-${f.string.alphanumeric({ length: 6, casing: "upper" })}` : sensor.protocol === "Zigbee" ? `ZGB-${f.string.hexadecimal({ length: 4, prefix: "", casing: "upper" })}` : null,
      observed_at: observedAt.toISOString(),
      observation_date: observedAt.toISOString().split("T")[0],
      reading,
      unit: sensor.unit,
      is_anomaly: isAnomaly,
      quality_code: isAnomaly ? f.helpers.arrayElement(["UNCERTAIN", "BAD"]) : "GOOD",
      battery_pct: batteryPct,
      signal_strength_dbm: signalStrengthDbm,
      uplink_rssi: signalStrengthDbm,
      uplink_snr_db: round(f.number.float({ min: -10, max: 15, fractionDigits: 1 }), 1),
      latitude: round(clamp(f.location.latitude() + f.number.float({ min: -0.02, max: 0.02, fractionDigits: 6 }), -90, 90), 6),
      longitude: round(clamp(f.location.longitude() + f.number.float({ min: -0.02, max: 0.02, fractionDigits: 6 }), -180, 180), 6),
      status: batteryPct !== null && batteryPct < 15 ? "low_battery" : isAnomaly ? "alert" : "ok",
      last_maintenance_date: f.date.between({ from: "2024-01-01", to: "2025-10-01" }).toISOString().split("T")[0],
    });
  }
  return rows;
}

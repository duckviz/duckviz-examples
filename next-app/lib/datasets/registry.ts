import { generateHrEmployees } from "./hr-employees";
import { generateIotSensors } from "./iot-sensors";
import { generateMarketingCampaigns } from "./marketing-campaigns";
import { generateRealEstate } from "./real-estate";
import { generateStudentPerformance } from "./student-performance";
import { generateLogisticsShipments } from "./logistics-shipments";
import { generateRetailInventory } from "./retail-inventory";
import { generateSaasMetrics } from "./saas-metrics";
import { generateWeatherObservations } from "./weather-observations";
import { generateSocialMedia } from "./social-media";
import { generateManufacturingDefects } from "./manufacturing-defects";
import { generateEnergyConsumption } from "./energy-consumption";
import { generateAirlineFlights } from "./airline-flights";
import { generateBankingTransactions } from "./banking-transactions";

export interface DatasetMeta {
  slug: string;
  name: string;
  icon: string;
  description: string;
  tableName: string;
  rowCount: number;
  industry: string;
}

export const DATASETS: DatasetMeta[] = [
  { slug: "hr-employees", name: "HR Employees", icon: "👥", description: "Employees with SOC occupation codes, cost-of-living comp, and FLSA exempt flags", tableName: "t_hr_employees", rowCount: 500, industry: "Human Resources" },
  { slug: "iot-sensors", name: "IoT Sensors", icon: "📡", description: "Industrial readings across MQTT/LoRaWAN/Zigbee with battery, RSSI, and anomalies", tableName: "t_iot_sensors", rowCount: 2000, industry: "IoT" },
  { slug: "marketing-campaigns", name: "Marketing Campaigns", icon: "📣", description: "13-channel campaigns with channel-realistic CPM/CTR/CVR bands and ROAS", tableName: "t_marketing_campaigns", rowCount: 600, industry: "Marketing" },
  { slug: "real-estate", name: "Real Estate Listings", icon: "🏠", description: "MLS listings with metro-median pricing, HOA/tax/mortgage math, and DOM", tableName: "t_real_estate", rowCount: 400, industry: "Real Estate" },
  { slug: "student-performance", name: "Student Performance", icon: "🎓", description: "Student scores, attendance, and study habits across schools", tableName: "t_student_performance", rowCount: 700, industry: "Education" },
  { slug: "logistics-shipments", name: "Logistics Shipments", icon: "🚚", description: "Shipments with SCAC-coded carriers, tracking formats, and fuel surcharges", tableName: "t_logistics_shipments", rowCount: 900, industry: "Logistics" },
  { slug: "retail-inventory", name: "Retail Inventory", icon: "📦", description: "GTIN-13 SKUs with ABC-class Pareto mix and reorder-point math", tableName: "t_retail_inventory", rowCount: 600, industry: "Retail" },
  { slug: "saas-metrics", name: "SaaS Metrics", icon: "💻", description: "Subscription accounts with plan-gated MRR, churn-derived LTV, and NPS/CAC math", tableName: "t_saas_metrics", rowCount: 500, industry: "SaaS" },
  { slug: "weather-observations", name: "Weather Observations", icon: "🌤️", description: "METAR-style observations from 10 ICAO stations with seasonal climate profiles", tableName: "t_weather_observations", rowCount: 1500, industry: "Weather" },
  { slug: "social-media", name: "Social Media Posts", icon: "📱", description: "Platform-specific engagement with power-law viral reach and sentiment scoring", tableName: "t_social_media", rowCount: 800, industry: "Social Media" },
  { slug: "manufacturing-defects", name: "Manufacturing Defects", icon: "🏭", description: "Production defects with DPMO, Cp/Cpk capability, and IPC-A-610 defect codes", tableName: "t_manufacturing_defects", rowCount: 1000, industry: "Manufacturing" },
  { slug: "energy-consumption", name: "Energy Consumption", icon: "⚡", description: "CBECS-style building EUI with TOU rates and eGRID CO2 emissions", tableName: "t_energy_consumption", rowCount: 1200, industry: "Energy" },
  { slug: "airline-flights", name: "Airline Flights", icon: "✈️", description: "IATA/ICAO routes with haversine distance, BTS delay codes, and load factors", tableName: "t_airline_flights", rowCount: 800, industry: "Aviation" },
  { slug: "banking-transactions", name: "Banking Transactions", icon: "🏦", description: "Account activity with MCC-coded merchants, running balance, and fraud scores", tableName: "t_banking_transactions", rowCount: 2000, industry: "Finance" },
];

type GeneratorFn = (count?: number) => Record<string, unknown>[];

const GENERATORS: Record<string, GeneratorFn> = {
  "hr-employees": generateHrEmployees,
  "iot-sensors": generateIotSensors,
  "marketing-campaigns": generateMarketingCampaigns,
  "real-estate": generateRealEstate,
  "student-performance": generateStudentPerformance,
  "logistics-shipments": generateLogisticsShipments,
  "retail-inventory": generateRetailInventory,
  "saas-metrics": generateSaasMetrics,
  "weather-observations": generateWeatherObservations,
  "social-media": generateSocialMedia,
  "manufacturing-defects": generateManufacturingDefects,
  "energy-consumption": generateEnergyConsumption,
  "airline-flights": generateAirlineFlights,
  "banking-transactions": generateBankingTransactions,
};

export function getDataset(slug: string) {
  const meta = DATASETS.find((d) => d.slug === slug);
  const generator = GENERATORS[slug];
  if (!meta || !generator) return null;
  return { meta, rows: generator(meta.rowCount) };
}

export function getDatasetMeta(slug: string) {
  return DATASETS.find((d) => d.slug === slug) ?? null;
}

import { generateEcommerceOrders } from "./ecommerce-orders";
import { generateHealthcareVisits } from "./healthcare-visits";
import { generateStockTrades } from "./stock-trades";
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
  { slug: "ecommerce-orders", name: "E-commerce Orders", icon: "🛒", description: "Online retail orders with products, payments, and shipping data", tableName: "t_ecommerce_orders", rowCount: 1000, industry: "Retail" },
  { slug: "healthcare-visits", name: "Healthcare Visits", icon: "🏥", description: "Patient visit records across hospital departments", tableName: "t_healthcare_visits", rowCount: 800, industry: "Healthcare" },
  { slug: "stock-trades", name: "Stock Trades", icon: "📈", description: "Equity trade records with tickers, prices, and volumes", tableName: "t_stock_trades", rowCount: 1200, industry: "Finance" },
  { slug: "hr-employees", name: "HR Employees", icon: "👥", description: "Employee directory with salaries, tenure, and performance", tableName: "t_hr_employees", rowCount: 500, industry: "Human Resources" },
  { slug: "iot-sensors", name: "IoT Sensors", icon: "📡", description: "Industrial sensor readings with temperature, humidity, and alerts", tableName: "t_iot_sensors", rowCount: 2000, industry: "IoT" },
  { slug: "marketing-campaigns", name: "Marketing Campaigns", icon: "📣", description: "Campaign performance across channels with ROI metrics", tableName: "t_marketing_campaigns", rowCount: 600, industry: "Marketing" },
  { slug: "real-estate", name: "Real Estate Listings", icon: "🏠", description: "Property listings with prices, sizes, and market duration", tableName: "t_real_estate", rowCount: 400, industry: "Real Estate" },
  { slug: "student-performance", name: "Student Performance", icon: "🎓", description: "Student scores, attendance, and study habits across schools", tableName: "t_student_performance", rowCount: 700, industry: "Education" },
  { slug: "logistics-shipments", name: "Logistics Shipments", icon: "🚚", description: "Shipping records with carriers, delays, and delivery modes", tableName: "t_logistics_shipments", rowCount: 900, industry: "Logistics" },
  { slug: "retail-inventory", name: "Retail Inventory", icon: "📦", description: "Warehouse stock levels, costs, and reorder points", tableName: "t_retail_inventory", rowCount: 600, industry: "Retail" },
  { slug: "saas-metrics", name: "SaaS Metrics", icon: "💻", description: "Subscription metrics — MRR, churn risk, and feature usage", tableName: "t_saas_metrics", rowCount: 500, industry: "SaaS" },
  { slug: "weather-observations", name: "Weather Observations", icon: "🌤️", description: "Daily weather data across 10 US cities", tableName: "t_weather_observations", rowCount: 1500, industry: "Weather" },
  { slug: "social-media", name: "Social Media Posts", icon: "📱", description: "Social media engagement metrics and sentiment analysis", tableName: "t_social_media", rowCount: 800, industry: "Social Media" },
  { slug: "manufacturing-defects", name: "Manufacturing Defects", icon: "🏭", description: "Production defect reports with severity and resolution times", tableName: "t_manufacturing_defects", rowCount: 1000, industry: "Manufacturing" },
  { slug: "energy-consumption", name: "Energy Consumption", icon: "⚡", description: "Building energy usage, costs, and efficiency ratings", tableName: "t_energy_consumption", rowCount: 1200, industry: "Energy" },
];

type GeneratorFn = (count?: number) => Record<string, unknown>[];

const GENERATORS: Record<string, GeneratorFn> = {
  "ecommerce-orders": generateEcommerceOrders,
  "healthcare-visits": generateHealthcareVisits,
  "stock-trades": generateStockTrades,
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

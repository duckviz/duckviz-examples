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
import { generateAirlineFlights } from "./airline-flights";
import { generateBankingTransactions } from "./banking-transactions";
import { generateRestaurantOrders } from "./restaurant-orders";
import { generateFitnessWorkouts } from "./fitness-workouts";
import { generateInsuranceClaims } from "./insurance-claims";
import { generateCryptoTrades } from "./crypto-trades";
import { generateCyberIncidents } from "./cyber-incidents";
import { generateHotelBookings } from "./hotel-bookings";
import { generateRideSharing } from "./ride-sharing";
import { generateVideoStreaming } from "./video-streaming";
import { generateAdImpressions } from "./ad-impressions";
import { generateAgriculturalYields } from "./agricultural-yields";
import { generateTelecomCalls } from "./telecom-calls";
import { generateClinicalTrials } from "./clinical-trials";
import { generateSupportTickets } from "./support-tickets";

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
  { slug: "healthcare-visits", name: "Healthcare Visits", icon: "🏥", description: "Patient encounters with ICD-10 diagnoses, CPT codes, and vitals", tableName: "t_healthcare_visits", rowCount: 800, industry: "Healthcare" },
  { slug: "stock-trades", name: "Stock Trades", icon: "📈", description: "S&P 500 trades across NASDAQ/NYSE/ARCA with SEC 31 and FINRA TAF fees", tableName: "t_stock_trades", rowCount: 1200, industry: "Finance" },
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
  { slug: "restaurant-orders", name: "Restaurant Orders", icon: "🍽️", description: "Orders across cuisines with tips, prep time, and ratings", tableName: "t_restaurant_orders", rowCount: 1500, industry: "Food Service" },
  { slug: "fitness-workouts", name: "Fitness Workouts", icon: "🏋️", description: "Workouts with MET-based calories, 5-zone heart-rate splits, and device telemetry", tableName: "t_fitness_workouts", rowCount: 1200, industry: "Fitness" },
  { slug: "insurance-claims", name: "Insurance Claims", icon: "📋", description: "Claims across policy types with settlement amounts and status", tableName: "t_insurance_claims", rowCount: 700, industry: "Insurance" },
  { slug: "crypto-trades", name: "Crypto Trades", icon: "🪙", description: "Exchange trades with chain-specific wallet formats and maker/taker fee tiers", tableName: "t_crypto_trades", rowCount: 2000, industry: "Crypto" },
  { slug: "cyber-incidents", name: "Cyber Incidents", icon: "🛡️", description: "Security incidents with MITRE ATT&CK tactics/techniques, CVSS scores, and dwell time", tableName: "t_cyber_incidents", rowCount: 600, industry: "Cybersecurity" },
  { slug: "hotel-bookings", name: "Hotel Bookings", icon: "🏨", description: "Room reservations with ADR, channels, and loyalty status", tableName: "t_hotel_bookings", rowCount: 900, industry: "Hospitality" },
  { slug: "ride-sharing", name: "Ride Sharing", icon: "🚗", description: "Ride trips with surge pricing, ratings, and payment methods", tableName: "t_ride_sharing", rowCount: 2500, industry: "Transportation" },
  { slug: "video-streaming", name: "Video Streaming", icon: "🎬", description: "Streaming sessions with completion rates, devices, and resolution", tableName: "t_video_streaming", rowCount: 1800, industry: "Media" },
  { slug: "ad-impressions", name: "Ad Impressions", icon: "📺", description: "Programmatic RTB with IAB-sized units, second-price auctions, and MRC viewability", tableName: "t_ad_impressions", rowCount: 3000, industry: "AdTech" },
  { slug: "agricultural-yields", name: "Agricultural Yields", icon: "🌾", description: "USDA NASS crop yields by state with inputs, irrigation efficiency, and profit per acre", tableName: "t_agricultural_yields", rowCount: 800, industry: "Agriculture" },
  { slug: "telecom-calls", name: "Telecom Calls", icon: "📞", description: "CDRs with MCC/MNC carriers, MSISDN/IMSI, 5G/LTE RAT, and roaming flags", tableName: "t_telecom_calls", rowCount: 2200, industry: "Telecom" },
  { slug: "clinical-trials", name: "Clinical Trials", icon: "🔬", description: "NCT-registered trials with MeSH conditions, Phase I–IV enrollment, and SAEs", tableName: "t_clinical_trials", rowCount: 500, industry: "Pharma" },
  { slug: "support-tickets", name: "Support Tickets", icon: "🎫", description: "Support queue with tier×priority SLA targets, FRT, breach flags, and CSAT", tableName: "t_support_tickets", rowCount: 1500, industry: "Customer Support" },
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
  "airline-flights": generateAirlineFlights,
  "banking-transactions": generateBankingTransactions,
  "restaurant-orders": generateRestaurantOrders,
  "fitness-workouts": generateFitnessWorkouts,
  "insurance-claims": generateInsuranceClaims,
  "crypto-trades": generateCryptoTrades,
  "cyber-incidents": generateCyberIncidents,
  "hotel-bookings": generateHotelBookings,
  "ride-sharing": generateRideSharing,
  "video-streaming": generateVideoStreaming,
  "ad-impressions": generateAdImpressions,
  "agricultural-yields": generateAgriculturalYields,
  "telecom-calls": generateTelecomCalls,
  "clinical-trials": generateClinicalTrials,
  "support-tickets": generateSupportTickets,
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

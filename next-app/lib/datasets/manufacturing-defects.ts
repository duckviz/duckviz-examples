import { createRng } from "./seed-random";

const PRODUCT_LINES = ["Assembly Line A", "Assembly Line B", "Assembly Line C", "Packaging", "Quality Check", "Finishing"];
const DEFECT_TYPES = [
  "Dimensional Error", "Surface Scratch", "Color Mismatch", "Missing Component",
  "Weld Failure", "Alignment Issue", "Material Defect", "Contamination",
  "Electrical Fault", "Seal Failure",
];
const SEVERITIES = ["Minor", "Moderate", "Major", "Critical"];
const SEVERITY_WEIGHTS = [40, 30, 20, 10];
const SHIFTS = ["Morning", "Afternoon", "Night"];
const OPERATORS = ["Op-A", "Op-B", "Op-C", "Op-D", "Op-E", "Op-F", "Op-G", "Op-H"];

export function generateManufacturingDefects(count = 1000) {
  const rng = createRng(14014);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const severity = rng.pickWeighted(SEVERITIES, SEVERITY_WEIGHTS);
    const baseCost = severity === "Critical" ? 5000 : severity === "Major" ? 1500 : severity === "Moderate" ? 500 : 100;
    rows.push({
      batch_id: rng.id("BAT", i + 1),
      product_line: rng.pick(PRODUCT_LINES),
      defect_type: rng.pick(DEFECT_TYPES),
      severity,
      machine_id: `MCH-${String(rng.int(1, 20)).padStart(3, "0")}`,
      operator: rng.pick(OPERATORS),
      shift: rng.pick(SHIFTS),
      detected_at: rng.datetime("2024-01-01", "2025-12-31"),
      resolution_hrs: rng.float(0.5, severity === "Critical" ? 48 : 12),
      cost_impact: rng.float(baseCost * 0.5, baseCost * 2),
    });
  }
  return rows;
}

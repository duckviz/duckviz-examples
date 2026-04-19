import { createFaker, clamp, logNormal, round } from "./faker-utils";

// Production lines with typical cycle times and defect rate baselines (DPMO — defects per million opportunities)
const PRODUCTION_LINES = [
  { id: "LINE-A1", name: "Assembly Line A1", product: "PCB Assembly", cycleTimeSec: 42, baseDPMO: 2800, w: 15 },
  { id: "LINE-A2", name: "Assembly Line A2", product: "PCB Assembly", cycleTimeSec: 45, baseDPMO: 3400, w: 12 },
  { id: "LINE-B1", name: "Injection Molding B1", product: "Plastic Housing", cycleTimeSec: 22, baseDPMO: 5200, w: 12 },
  { id: "LINE-B2", name: "Injection Molding B2", product: "Plastic Housing", cycleTimeSec: 24, baseDPMO: 4800, w: 10 },
  { id: "LINE-C1", name: "CNC Machining C1", product: "Metal Bracket", cycleTimeSec: 185, baseDPMO: 1200, w: 10 },
  { id: "LINE-D1", name: "Final Assembly D1", product: "Finished Unit", cycleTimeSec: 340, baseDPMO: 6200, w: 12 },
  { id: "LINE-E1", name: "Packaging E1", product: "Carton Pack", cycleTimeSec: 15, baseDPMO: 900, w: 8 },
  { id: "LINE-F1", name: "Paint Shop F1", product: "Painted Part", cycleTimeSec: 120, baseDPMO: 7500, w: 8 },
  { id: "LINE-G1", name: "Welding Cell G1", product: "Welded Frame", cycleTimeSec: 95, baseDPMO: 3600, w: 7 },
  { id: "LINE-H1", name: "QC Test Rig H1", product: "Tested Unit", cycleTimeSec: 78, baseDPMO: 2100, w: 6 },
];

// Defect categories — standard IPC-A-610 / ISO 9001 defect taxonomy
const DEFECT_CATEGORIES = [
  { code: "COSM", label: "Cosmetic (scratch/dent)", severity: "minor", w: 22 },
  { code: "DIM", label: "Dimensional Out-of-Spec", severity: "major", w: 15 },
  { code: "SOLDER", label: "Solder Joint Defect", severity: "major", w: 12 },
  { code: "MISS", label: "Missing Component", severity: "critical", w: 10 },
  { code: "WRONG", label: "Wrong Component", severity: "critical", w: 8 },
  { code: "CONTAM", label: "Contamination", severity: "major", w: 7 },
  { code: "CRACK", label: "Crack / Fracture", severity: "critical", w: 6 },
  { code: "WARP", label: "Warpage", severity: "major", w: 5 },
  { code: "LABEL", label: "Label Misprint", severity: "minor", w: 5 },
  { code: "FUNC", label: "Functional Test Failure", severity: "critical", w: 4 },
  { code: "ALIGN", label: "Alignment/Fit Issue", severity: "major", w: 3 },
  { code: "BURR", label: "Burr / Flash", severity: "minor", w: 3 },
];

const ROOT_CAUSES = [
  { cause: "Machine Wear", category: "equipment", w: 18 },
  { cause: "Tool Misalignment", category: "equipment", w: 12 },
  { cause: "Operator Error", category: "human", w: 15 },
  { cause: "Material Defect", category: "material", w: 14 },
  { cause: "Temperature Drift", category: "environment", w: 8 },
  { cause: "Humidity Out of Range", category: "environment", w: 5 },
  { cause: "Supplier Quality", category: "material", w: 10 },
  { cause: "Process Parameter Drift", category: "process", w: 8 },
  { cause: "Maintenance Overdue", category: "equipment", w: 5 },
  { cause: "Setup Error", category: "human", w: 5 },
];

const SHIFTS = [
  { name: "A (06:00-14:00)", w: 40, qualityBias: 1.0 },
  { name: "B (14:00-22:00)", w: 35, qualityBias: 1.1 },
  { name: "C (22:00-06:00)", w: 25, qualityBias: 1.4 }, // night shift historically has more defects
];

export function generateManufacturingDefects(count = 1500) {
  const f = createFaker(8008);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const line = f.helpers.weightedArrayElement(PRODUCTION_LINES.map((l) => ({ weight: l.w, value: l })));
    const shift = f.helpers.weightedArrayElement(SHIFTS.map((s) => ({ weight: s.w, value: s })));
    const defect = f.helpers.weightedArrayElement(DEFECT_CATEGORIES.map((d) => ({ weight: d.w, value: d })));
    const rootCause = f.helpers.weightedArrayElement(ROOT_CAUSES.map((r) => ({ weight: r.w, value: r })));

    // Batch size & units inspected
    const batchSize = f.number.int({ min: 100, max: 5000 });
    const baseDefects = Math.round((line.baseDPMO / 1_000_000) * batchSize * shift.qualityBias);
    const defectsFound = Math.max(0, Math.round(clamp(logNormal(f, Math.max(baseDefects, 1), 0.8), 0, batchSize * 0.3)));
    const defectRatePpm = Math.round((defectsFound / batchSize) * 1_000_000);

    // Cp / Cpk process capability — Cpk > 1.33 is industry acceptable, < 1.0 is out of control
    const cpk = round(clamp(f.number.float({ min: 0.6, max: 2.5, fractionDigits: 3 }), 0.3, 3.0), 3);
    const cp = round(cpk + f.number.float({ min: 0.05, max: 0.4, fractionDigits: 3 }), 3);

    // Cost impact — scrap cost + rework labor
    const unitCost = round(line.product === "Finished Unit" ? f.number.float({ min: 45, max: 250, fractionDigits: 2 }) : f.number.float({ min: 2, max: 35, fractionDigits: 2 }), 2);
    const reworkCost = round(defectsFound * unitCost * f.number.float({ min: 0.2, max: 0.6, fractionDigits: 2 }), 2);
    const scrapCost = round(defectsFound * unitCost * (defect.severity === "critical" ? 1.0 : 0.3), 2);

    const detectedAt = f.date.between({ from: "2025-01-01", to: "2025-12-31" });
    const resolvedHours = defect.severity === "critical" ? f.number.int({ min: 2, max: 72 }) : defect.severity === "major" ? f.number.int({ min: 0, max: 24 }) : f.number.int({ min: 0, max: 4 });

    rows.push({
      defect_id: `DEF-${f.string.alphanumeric({ length: 12, casing: "upper" })}`,
      lot_number: `LOT-${f.date.recent().toISOString().split("T")[0]!.replace(/-/g, "")}-${f.string.alphanumeric({ length: 4, casing: "upper" })}`,
      part_number: `PN-${f.string.alphanumeric({ length: 8, casing: "upper" })}`,
      serial_number: `SN${f.string.numeric({ length: 10, allowLeadingZeros: true })}`,
      product_family: line.product,
      production_line: line.id,
      production_line_name: line.name,
      workstation: `${line.id}-WS${f.number.int({ min: 1, max: 8 })}`,
      shift: shift.name,
      operator_id: `OP-${f.string.numeric({ length: 5, allowLeadingZeros: true })}`,
      detected_at: detectedAt.toISOString(),
      batch_size: batchSize,
      defects_found: defectsFound,
      defect_rate_ppm: defectRatePpm,
      yield_pct: round(((batchSize - defectsFound) / batchSize) * 100, 3),
      first_pass_yield_pct: round(f.number.float({ min: 85, max: 99.5, fractionDigits: 2 }), 2),
      defect_code: defect.code,
      defect_category: defect.label,
      defect_severity: defect.severity,
      root_cause: rootCause.cause,
      root_cause_category: rootCause.category,
      detection_method: f.helpers.weightedArrayElement([
        { weight: 30, value: "Visual Inspection" },
        { weight: 25, value: "AOI (Automated Optical)" },
        { weight: 15, value: "In-Circuit Test" },
        { weight: 12, value: "Functional Test" },
        { weight: 8, value: "X-Ray" },
        { weight: 5, value: "Customer Return" },
        { weight: 5, value: "Outgoing QC" },
      ]),
      measurement_value: defect.code === "DIM" ? round(f.number.float({ min: 10, max: 120, fractionDigits: 3 }), 3) : null,
      spec_min: defect.code === "DIM" ? round(f.number.float({ min: 10, max: 50, fractionDigits: 2 }), 2) : null,
      spec_max: defect.code === "DIM" ? round(f.number.float({ min: 55, max: 120, fractionDigits: 2 }), 2) : null,
      cp,
      cpk,
      rework_cost_usd: reworkCost,
      scrap_cost_usd: scrapCost,
      total_cost_usd: round(reworkCost + scrapCost, 2),
      disposition: f.helpers.weightedArrayElement([
        { weight: 45, value: "rework" },
        { weight: 30, value: "scrap" },
        { weight: 15, value: "return_to_supplier" },
        { weight: 7, value: "use_as_is" },
        { weight: 3, value: "quarantine" },
      ]),
      resolution_hours: resolvedHours,
      resolved: f.datatype.boolean(0.85),
      corrective_action_id: f.datatype.boolean(0.45) ? `CAPA-${f.string.numeric({ length: 6, allowLeadingZeros: true })}` : null,
      supplier_code: rootCause.category === "material" ? `SUP-${f.string.alphanumeric({ length: 5, casing: "upper" })}` : null,
      iso_9001_nonconformance: defect.severity !== "minor",
    });
  }
  return rows;
}

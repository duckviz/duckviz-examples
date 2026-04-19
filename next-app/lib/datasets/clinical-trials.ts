import { createFaker, clamp, logNormal, round } from "./faker-utils";

// ClinicalTrials.gov-style schema. NCT IDs use 8-digit number suffix.
const PHASES = [
  { phase: "Phase 1", enrollMin: 15, enrollMax: 80, durationMo: [6, 18], w: 18 },
  { phase: "Phase 2", enrollMin: 60, enrollMax: 400, durationMo: [12, 30], w: 30 },
  { phase: "Phase 3", enrollMin: 300, enrollMax: 5000, durationMo: [24, 60], w: 28 },
  { phase: "Phase 4", enrollMin: 500, enrollMax: 30000, durationMo: [24, 72], w: 10 },
  { phase: "Early Phase 1", enrollMin: 6, enrollMax: 40, durationMo: [3, 12], w: 6 },
  { phase: "N/A", enrollMin: 20, enrollMax: 500, durationMo: [6, 36], w: 8 },
];

const CONDITIONS = [
  { mesh: "D003924", name: "Type 2 Diabetes Mellitus", area: "Endocrine" },
  { mesh: "D006973", name: "Hypertension", area: "Cardiovascular" },
  { mesh: "D009369", name: "Neoplasms (Solid Tumors)", area: "Oncology" },
  { mesh: "D000544", name: "Alzheimer Disease", area: "Neurology" },
  { mesh: "D003866", name: "Major Depressive Disorder", area: "Psychiatry" },
  { mesh: "D001249", name: "Asthma", area: "Respiratory" },
  { mesh: "D001168", name: "Rheumatoid Arthritis", area: "Immunology" },
  { mesh: "D009103", name: "Migraine Disorders", area: "Neurology" },
  { mesh: "D009765", name: "Obesity", area: "Metabolic" },
  { mesh: "D010300", name: "Parkinson Disease", area: "Neurology" },
  { mesh: "D003920", name: "Diabetic Neuropathy", area: "Endocrine" },
  { mesh: "D015212", name: "Inflammatory Bowel Disease", area: "Gastroenterology" },
  { mesh: "D008171", name: "Lupus Erythematosus", area: "Immunology" },
  { mesh: "D003141", name: "COVID-19 Post-Acute Sequelae", area: "Respiratory" },
];

const SPONSORS = [
  { name: "Pfizer", type: "Industry" },
  { name: "Moderna", type: "Industry" },
  { name: "Novartis", type: "Industry" },
  { name: "Roche", type: "Industry" },
  { name: "Johnson & Johnson", type: "Industry" },
  { name: "Merck", type: "Industry" },
  { name: "AstraZeneca", type: "Industry" },
  { name: "GSK", type: "Industry" },
  { name: "National Institutes of Health", type: "NIH" },
  { name: "National Cancer Institute", type: "NIH" },
  { name: "Mayo Clinic", type: "Other" },
  { name: "MD Anderson Cancer Center", type: "Other" },
  { name: "Memorial Sloan Kettering", type: "Other" },
];

const PRIMARY_ENDPOINTS = [
  "Overall Survival",
  "Progression-Free Survival",
  "HbA1c Change from Baseline",
  "Systolic BP Change from Baseline",
  "ACR20 Response Rate",
  "MADRS Score Change",
  "FEV1 Change from Baseline",
  "MMSE Score Change",
  "BMI Change from Baseline",
  "Adverse Event Incidence",
];

export function generateClinicalTrials(count = 500) {
  const f = createFaker(29029);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const phase = f.helpers.weightedArrayElement(PHASES.map((p) => ({ weight: p.w, value: p })));
    const condition = f.helpers.arrayElement(CONDITIONS);
    const sponsor = f.helpers.arrayElement(SPONSORS);
    const studyType = f.helpers.weightedArrayElement([
      { weight: 82, value: "Interventional" },
      { weight: 15, value: "Observational" },
      { weight: 3, value: "Expanded Access" },
    ]);

    const enrollmentTarget = f.number.int({ min: phase.enrollMin, max: phase.enrollMax });
    const status = f.helpers.weightedArrayElement([
      { weight: 35, value: "Recruiting" },
      { weight: 20, value: "Active, not recruiting" },
      { weight: 20, value: "Completed" },
      { weight: 8, value: "Not yet recruiting" },
      { weight: 7, value: "Terminated" },
      { weight: 5, value: "Withdrawn" },
      { weight: 3, value: "Suspended" },
      { weight: 2, value: "Unknown status" },
    ]);
    const enrolledPct = status === "Completed"
      ? f.number.float({ min: 0.85, max: 1.0, fractionDigits: 2 })
      : status === "Recruiting"
        ? f.number.float({ min: 0.1, max: 0.7, fractionDigits: 2 })
        : status === "Not yet recruiting"
          ? 0
          : f.number.float({ min: 0.3, max: 0.95, fractionDigits: 2 });
    const enrolled = Math.round(enrollmentTarget * enrolledPct);

    const startDate = f.date.between({ from: "2020-01-01", to: "2025-06-01" });
    const durationMs = f.number.int({ min: phase.durationMo[0]!, max: phase.durationMo[1]! }) * 30 * 24 * 60 * 60 * 1000;
    const primaryCompletion = new Date(startDate.getTime() + durationMs);
    const studyCompletion = new Date(primaryCompletion.getTime() + f.number.int({ min: 60, max: 365 }) * 24 * 60 * 60 * 1000);

    const sitesCount = phase.phase === "Phase 3" || phase.phase === "Phase 4"
      ? f.number.int({ min: 15, max: 250 })
      : phase.phase === "Phase 2"
        ? f.number.int({ min: 3, max: 40 })
        : f.number.int({ min: 1, max: 8 });

    const saeCount = Math.round(clamp(logNormal(f, enrolled * 0.05, 0.8), 0, enrolled * 0.3));
    const isBlinded = studyType === "Interventional" && phase.phase !== "Phase 1";
    const drugName = `${f.company.name().split(" ")[0]}${f.string.alpha({ length: 2, casing: "lower" })}-${f.number.int({ min: 100, max: 9999 })}`;

    rows.push({
      nct_id: `NCT${f.number.int({ min: 10000000, max: 99999999 })}`,
      brief_title: `A ${phase.phase} Study of ${drugName} in ${condition.name}`,
      study_type: studyType,
      phase: phase.phase,
      primary_condition: condition.name,
      condition_mesh: condition.mesh,
      therapeutic_area: condition.area,
      intervention_name: drugName,
      intervention_type: studyType === "Interventional"
        ? f.helpers.weightedArrayElement([
            { weight: 60, value: "Drug" },
            { weight: 15, value: "Biological" },
            { weight: 10, value: "Device" },
            { weight: 8, value: "Procedure" },
            { weight: 4, value: "Behavioral" },
            { weight: 3, value: "Combination" },
          ])
        : "Observational",
      primary_endpoint: f.helpers.arrayElement(PRIMARY_ENDPOINTS),
      lead_sponsor: sponsor.name,
      sponsor_type: sponsor.type,
      start_date: startDate.toISOString().split("T")[0],
      primary_completion_date: primaryCompletion.toISOString().split("T")[0],
      study_completion_date: studyCompletion.toISOString().split("T")[0],
      enrollment_target: enrollmentTarget,
      enrollment_actual: enrolled,
      enrollment_pct: round(enrolledPct * 100, 1),
      sites_count: sitesCount,
      countries_count: f.number.int({ min: 1, max: Math.min(sitesCount, 35) }),
      allocation: isBlinded ? f.helpers.arrayElement(["Randomized", "Non-Randomized"]) : "N/A",
      masking: isBlinded
        ? f.helpers.arrayElement(["Double (Participant, Investigator)", "Triple", "Quadruple", "Single (Participant)"])
        : "None (Open Label)",
      status,
      serious_adverse_events: saeCount,
      has_results_posted: status === "Completed" && f.datatype.boolean(0.6),
      budget_usd: Math.round(clamp(logNormal(f, phase.phase === "Phase 3" || phase.phase === "Phase 4" ? 25_000_000 : 3_000_000, 0.9), 200_000, 500_000_000)),
    });
  }
  return rows;
}

import { createFaker, clamp, logNormal, round } from "./faker-utils";

const POLICIES = [
  {
    line: "Auto",
    medianClaim: 4800,
    causes: [
      { code: "COL", label: "Collision", w: 40 },
      { code: "COMP", label: "Comprehensive", w: 15 },
      { code: "THFT", label: "Theft", w: 8 },
      { code: "VAND", label: "Vandalism", w: 7 },
      { code: "GLAS", label: "Glass", w: 20 },
      { code: "WTHR", label: "Weather", w: 10 },
    ],
  },
  {
    line: "Homeowners",
    medianClaim: 13200,
    causes: [
      { code: "WATR", label: "Water Damage", w: 30 },
      { code: "WIND", label: "Wind / Hail", w: 25 },
      { code: "FIRE", label: "Fire", w: 8 },
      { code: "THFT", label: "Theft", w: 12 },
      { code: "LIAB", label: "Liability", w: 10 },
      { code: "FRZN", label: "Freezing", w: 15 },
    ],
  },
  {
    line: "Health",
    medianClaim: 2100,
    causes: [
      { code: "INPT", label: "Inpatient", w: 12 },
      { code: "OUPT", label: "Outpatient", w: 40 },
      { code: "ER", label: "Emergency Room", w: 18 },
      { code: "RX", label: "Pharmacy", w: 25 },
      { code: "LAB", label: "Lab / Imaging", w: 5 },
    ],
  },
  {
    line: "Life",
    medianClaim: 180000,
    causes: [
      { code: "NAT", label: "Natural Causes", w: 85 },
      { code: "ACC", label: "Accident", w: 12 },
      { code: "OTH", label: "Other", w: 3 },
    ],
  },
  {
    line: "Renters",
    medianClaim: 2400,
    causes: [
      { code: "THFT", label: "Theft", w: 40 },
      { code: "WATR", label: "Water Damage", w: 25 },
      { code: "FIRE", label: "Fire", w: 10 },
      { code: "VAND", label: "Vandalism", w: 15 },
      { code: "LIAB", label: "Liability", w: 10 },
    ],
  },
  {
    line: "Commercial",
    medianClaim: 38000,
    causes: [
      { code: "PROP", label: "Property Damage", w: 30 },
      { code: "GL", label: "General Liability", w: 25 },
      { code: "WC", label: "Workers Comp", w: 20 },
      { code: "BIL", label: "Business Interruption", w: 15 },
      { code: "CYB", label: "Cyber", w: 10 },
    ],
  },
];

export function generateInsuranceClaims(count = 700) {
  const f = createFaker(20020);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const policy = f.helpers.arrayElement(POLICIES);
    const cause = f.helpers.weightedArrayElement(policy.causes.map((c) => ({ weight: c.w, value: c })));
    const claimed = round(clamp(logNormal(f, policy.medianClaim, 0.9), 100, policy.medianClaim * 20), 2);

    const status = f.helpers.weightedArrayElement([
      { weight: 35, value: "closed_paid" },
      { weight: 20, value: "closed_denied" },
      { weight: 15, value: "open_in_review" },
      { weight: 10, value: "awaiting_docs" },
      { weight: 10, value: "in_investigation" },
      { weight: 5, value: "reopened" },
      { weight: 5, value: "litigation" },
    ]);

    const deductible = policy.line === "Health"
      ? f.helpers.arrayElement([0, 250, 500, 1000, 2000, 5000])
      : policy.line === "Auto"
        ? f.helpers.arrayElement([250, 500, 1000])
        : policy.line === "Homeowners"
          ? f.helpers.arrayElement([500, 1000, 2500, 5000])
          : policy.line === "Life"
            ? 0
            : f.helpers.arrayElement([250, 500, 1000, 2500]);

    const reservedAmount = round(claimed * f.number.float({ min: 0.7, max: 1.1, fractionDigits: 2 }), 2);
    const paidAmount = status === "closed_paid"
      ? round(Math.max(0, claimed - deductible) * f.number.float({ min: 0.6, max: 1.0, fractionDigits: 2 }), 2)
      : status === "closed_denied"
        ? 0
        : 0;

    const fraudScore = round(clamp(logNormal(f, 8, 1.3), 0, 100), 1);
    const isFraudSuspected = fraudScore > 70;

    const lossDate = f.date.between({ from: "2024-01-01", to: "2025-12-31" });
    const reportDays = f.helpers.weightedArrayElement([
      { weight: 50, value: f.number.int({ min: 0, max: 1 }) },
      { weight: 30, value: f.number.int({ min: 2, max: 7 }) },
      { weight: 15, value: f.number.int({ min: 8, max: 30 }) },
      { weight: 5, value: f.number.int({ min: 30, max: 180 }) },
    ]);
    const reportDate = new Date(lossDate.getTime() + reportDays * 24 * 60 * 60 * 1000);
    const closeDays = status.startsWith("closed") ? f.number.int({ min: 5, max: 180 }) : null;
    const closeDate = closeDays !== null
      ? new Date(reportDate.getTime() + closeDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : null;

    rows.push({
      claim_id: `CLM-${f.number.int({ min: 1, max: 999999999 }).toString().padStart(10, "0")}`,
      policy_number: `POL-${f.number.int({ min: 1, max: 99999999 }).toString().padStart(10, "0")}`,
      line_of_business: policy.line,
      loss_cause_code: cause.code,
      loss_cause: cause.label,
      loss_date: lossDate.toISOString().split("T")[0],
      report_date: reportDate.toISOString().split("T")[0],
      close_date: closeDate,
      report_lag_days: reportDays,
      days_to_close: closeDays,
      claimed_amount: claimed,
      reserved_amount: reservedAmount,
      paid_amount: paidAmount,
      deductible,
      status,
      adjuster: f.person.fullName(),
      adjuster_team: f.helpers.arrayElement(["Field", "Desk", "SIU", "Complex", "Express"]),
      state: f.location.state({ abbreviated: true }),
      subrogation_flag: f.datatype.boolean(0.18),
      litigation_flag: status === "litigation" || f.datatype.boolean(0.04),
      fraud_score: fraudScore,
      fraud_suspected: isFraudSuspected,
      catastrophe_code: cause.code === "WIND" || cause.code === "WTHR"
        ? f.datatype.boolean(0.3)
          ? `CAT-${f.number.int({ min: 2401, max: 2512 })}`
          : null
        : null,
    });
  }
  return rows;
}

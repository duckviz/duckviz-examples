import { createFaker, clamp, logNormal, round } from "./faker-utils";

const PLANS = [
  { plan: "Free", mrrMin: 0, mrrMax: 0, seatsMin: 1, seatsMax: 3, churnMonthly: 0.09, w: 45 },
  { plan: "Starter", mrrMin: 29, mrrMax: 99, seatsMin: 1, seatsMax: 10, churnMonthly: 0.055, w: 25 },
  { plan: "Pro", mrrMin: 199, mrrMax: 999, seatsMin: 5, seatsMax: 100, churnMonthly: 0.025, w: 20 },
  { plan: "Business", mrrMin: 999, mrrMax: 4999, seatsMin: 20, seatsMax: 500, churnMonthly: 0.015, w: 7 },
  { plan: "Enterprise", mrrMin: 5000, mrrMax: 80000, seatsMin: 100, seatsMax: 10000, churnMonthly: 0.008, w: 3 },
];

const INDUSTRIES = [
  "Software / SaaS", "Financial Services", "Healthcare", "Retail / E-commerce",
  "Media & Entertainment", "Manufacturing", "Education", "Professional Services",
  "Government", "Non-profit", "Energy & Utilities", "Telecom",
];

const EMPLOYEE_BANDS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"];

const COUNTRIES = [
  { code: "US", w: 55 },
  { code: "GB", w: 8 },
  { code: "DE", w: 6 },
  { code: "CA", w: 5 },
  { code: "FR", w: 4 },
  { code: "AU", w: 4 },
  { code: "IN", w: 5 },
  { code: "BR", w: 3 },
  { code: "JP", w: 3 },
  { code: "NL", w: 3 },
  { code: "SG", w: 2 },
  { code: "ES", w: 2 },
];

export function generateSaasMetrics(count = 500) {
  const f = createFaker(11011);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const plan = f.helpers.weightedArrayElement(PLANS.map((p) => ({ weight: p.w, value: p })));
    const billingTerm = f.helpers.weightedArrayElement([
      { weight: 60, value: "monthly" },
      { weight: 35, value: "annual" },
      { weight: 5, value: "multi_year" },
    ]);

    const seats = f.number.int({ min: plan.seatsMin, max: plan.seatsMax });
    const mrrBase = plan.plan === "Free"
      ? 0
      : round(clamp(logNormal(f, (plan.mrrMin + plan.mrrMax) / 2, 0.5), plan.mrrMin, plan.mrrMax), 2);
    // Annual discount typically 15–20%
    const mrr = billingTerm === "annual" ? round(mrrBase * 0.83, 2) : billingTerm === "multi_year" ? round(mrrBase * 0.75, 2) : mrrBase;
    const arr = round(mrr * 12, 2);

    const signupDate = f.date.between({ from: "2021-01-01", to: "2025-11-01" });
    const ageDays = Math.round((Date.now() - signupDate.getTime()) / (24 * 60 * 60 * 1000));

    const hasChurned = f.datatype.boolean(Math.min(plan.churnMonthly * (ageDays / 30), 0.85));
    const churnDate = hasChurned
      ? new Date(signupDate.getTime() + f.number.int({ min: 30, max: ageDays }) * 24 * 60 * 60 * 1000)
      : null;

    const dauAvg = plan.plan === "Free"
      ? f.number.int({ min: 0, max: 2 })
      : Math.round(seats * f.number.float({ min: 0.35, max: 0.85, fractionDigits: 2 }));
    const featureUsage = round(f.number.float({ min: 10, max: 95, fractionDigits: 1 }), 1);

    const healthScore = hasChurned
      ? f.number.int({ min: 0, max: 35 })
      : f.number.int({ min: plan.plan === "Free" ? 20 : 55, max: 100 });
    const npsCategory = healthScore > 70 ? "promoter" : healthScore > 40 ? "passive" : "detractor";
    const npsScore = npsCategory === "promoter" ? f.number.int({ min: 9, max: 10 }) : npsCategory === "passive" ? f.number.int({ min: 7, max: 8 }) : f.number.int({ min: 0, max: 6 });

    const cac = round(clamp(logNormal(f, mrr * 5, 0.6), 0, mrr * 50), 2);
    const ltv = hasChurned ? round(mrr * Math.max(1, ageDays / 30) * 0.9, 2) : round(mrr / Math.max(plan.churnMonthly, 0.001), 2);

    rows.push({
      account_id: `acc_${f.string.alphanumeric({ length: 12, casing: "lower" })}`,
      company: f.company.name(),
      industry: f.helpers.arrayElement(INDUSTRIES),
      employee_band: f.helpers.arrayElement(EMPLOYEE_BANDS),
      country: f.helpers.weightedArrayElement(COUNTRIES.map((c) => ({ weight: c.w, value: c.code }))),
      plan: plan.plan,
      billing_term: billingTerm,
      seats,
      mrr,
      arr,
      currency: "USD",
      signup_date: signupDate.toISOString().split("T")[0],
      trial_end_date: new Date(signupDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      last_login_date: hasChurned ? churnDate!.toISOString().split("T")[0] : f.date.between({ from: "2025-11-01", to: "2025-12-31" }).toISOString().split("T")[0],
      churn_date: churnDate ? churnDate.toISOString().split("T")[0] : null,
      churn_reason: hasChurned
        ? f.helpers.weightedArrayElement([
            { weight: 30, value: "price" },
            { weight: 25, value: "missing_features" },
            { weight: 15, value: "switched_competitor" },
            { weight: 12, value: "low_usage" },
            { weight: 10, value: "lost_sponsor" },
            { weight: 8, value: "company_closed" },
          ])
        : null,
      dau_avg_30d: dauAvg,
      mau_avg_30d: Math.round(dauAvg * f.number.float({ min: 2.5, max: 5, fractionDigits: 1 })),
      feature_adoption_pct: featureUsage,
      health_score: healthScore,
      nps_score: npsScore,
      nps_category: npsCategory,
      expansion_mrr_ytd: round(mrr * f.number.float({ min: 0, max: 0.4, fractionDigits: 2 }), 2),
      contraction_mrr_ytd: hasChurned ? 0 : round(mrr * f.number.float({ min: 0, max: 0.15, fractionDigits: 2 }), 2),
      support_tickets_90d: f.number.int({ min: 0, max: 40 }),
      cac_usd: cac,
      ltv_usd: round(ltv, 2),
      ltv_cac_ratio: cac > 0 ? round(ltv / cac, 2) : null,
    });
  }
  return rows;
}

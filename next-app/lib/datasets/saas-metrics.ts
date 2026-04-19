import { createRng } from "./seed-random";

const PLANS = ["Free", "Starter", "Pro", "Enterprise"];
const PLAN_MRR: Record<string, [number, number]> = {
  Free: [0, 0],
  Starter: [29, 99],
  Pro: [100, 499],
  Enterprise: [500, 5000],
};

export function generateSaasMetrics(count = 500) {
  const rng = createRng(11011);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const plan = rng.pick(PLANS);
    const [minMrr, maxMrr] = PLAN_MRR[plan]!;
    const mrr = plan === "Free" ? 0 : rng.int(minMrr, maxMrr);
    const churnRisk = plan === "Free" ? rng.float(0.3, 0.9) : rng.float(0.01, 0.5);
    rows.push({
      account_id: rng.id("ACC", i + 1),
      company: rng.companyName(),
      plan,
      mrr,
      arr: mrr * 12,
      active_users: rng.int(1, plan === "Enterprise" ? 500 : 50),
      feature_usage_pct: rng.float(10, 100),
      churn_risk: churnRisk,
      signup_date: rng.date("2022-01-01", "2025-11-01"),
      last_active: rng.date("2025-06-01", "2025-12-31"),
      support_tickets: rng.int(0, 20),
    });
  }
  return rows;
}

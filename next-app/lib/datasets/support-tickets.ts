import { createFaker, clamp, logNormal, round } from "./faker-utils";

const CATEGORIES = [
  { category: "Billing", subs: ["Invoice Dispute", "Payment Failed", "Refund Request", "Subscription Change"] },
  { category: "Technical", subs: ["Login Issue", "Performance", "Bug Report", "Integration Error", "API Error"] },
  { category: "Account", subs: ["SSO Setup", "User Provisioning", "Password Reset", "MFA Issue"] },
  { category: "Feature Request", subs: ["New Feature", "Enhancement", "Integration Request"] },
  { category: "Onboarding", subs: ["Getting Started", "Training", "Best Practices"] },
  { category: "Security", subs: ["Compliance", "Audit Log", "Permissions", "Data Deletion"] },
];

const TIERS = [
  { tier: "free", w: 45, slaHrs: 72 },
  { tier: "starter", w: 25, slaHrs: 24 },
  { tier: "pro", w: 20, slaHrs: 8 },
  { tier: "enterprise", w: 10, slaHrs: 4 },
];

const PRIORITIES = [
  { p: "P4 — Low", w: 30, slaMult: 2.0 },
  { p: "P3 — Normal", w: 45, slaMult: 1.0 },
  { p: "P2 — High", w: 18, slaMult: 0.5 },
  { p: "P1 — Urgent", w: 7, slaMult: 0.2 },
];

export function generateSupportTickets(count = 1500) {
  const f = createFaker(30030);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const cat = f.helpers.arrayElement(CATEGORIES);
    const sub = f.helpers.arrayElement(cat.subs);
    const tier = f.helpers.weightedArrayElement(TIERS.map((t) => ({ weight: t.w, value: t })));
    const priority = f.helpers.weightedArrayElement(PRIORITIES.map((p) => ({ weight: p.w, value: p })));

    const slaHours = tier.slaHrs * priority.slaMult;
    const createdTs = f.date.between({ from: "2025-01-01", to: "2025-12-31" });

    // First response time — exponential-ish, capped at SLA × 2
    const firstResponseMin = round(clamp(logNormal(f, slaHours * 60 * 0.4, 0.8), 1, slaHours * 60 * 2), 1);
    const replies = f.number.int({ min: 1, max: priority.p === "P1 — Urgent" ? 30 : 15 });

    const status = f.helpers.weightedArrayElement([
      { weight: 55, value: "resolved" },
      { weight: 15, value: "closed" },
      { weight: 12, value: "in_progress" },
      { weight: 8, value: "waiting_on_customer" },
      { weight: 5, value: "open" },
      { weight: 3, value: "escalated" },
      { weight: 2, value: "reopened" },
    ]);
    const resolved = status === "resolved" || status === "closed";
    const resolutionHours = resolved
      ? round(clamp(logNormal(f, slaHours * 0.8, 0.9), 0.2, slaHours * 8), 2)
      : null;
    const slaBreached = resolutionHours !== null && resolutionHours > slaHours;

    const updatedTs = new Date(createdTs.getTime() + (resolutionHours ?? f.number.float({ min: 0.1, max: slaHours, fractionDigits: 2 })) * 60 * 60 * 1000);
    const resolvedTs = resolved
      ? new Date(createdTs.getTime() + (resolutionHours ?? 0) * 60 * 60 * 1000).toISOString()
      : null;

    const csat = resolved && f.datatype.boolean(0.55)
      ? f.helpers.weightedArrayElement([
          { weight: 3, value: 1 },
          { weight: 5, value: 2 },
          { weight: 12, value: 3 },
          { weight: 30, value: 4 },
          { weight: 50, value: 5 },
        ])
      : null;

    rows.push({
      ticket_id: `TKT-${f.number.int({ min: 1, max: 999999 }).toString().padStart(6, "0")}`,
      created_ts: createdTs.toISOString(),
      updated_ts: updatedTs.toISOString(),
      resolved_ts: resolvedTs,
      customer_id: `CUS-${f.number.int({ min: 1, max: 12000 }).toString().padStart(6, "0")}`,
      customer_tier: tier.tier,
      channel: f.helpers.weightedArrayElement([
        { weight: 38, value: "email" },
        { weight: 28, value: "chat" },
        { weight: 15, value: "web_form" },
        { weight: 10, value: "in_app" },
        { weight: 5, value: "phone" },
        { weight: 4, value: "twitter" },
      ]),
      subject: f.hacker.phrase(),
      category: cat.category,
      subcategory: sub,
      product_area: f.helpers.arrayElement(["Web App", "Mobile App", "API", "Desktop", "Integrations", "Platform"]),
      priority: priority.p,
      severity: priority.p.startsWith("P1") ? "critical" : priority.p.startsWith("P2") ? "high" : priority.p.startsWith("P3") ? "normal" : "low",
      assigned_team: f.helpers.arrayElement(["Tier 1", "Tier 2", "Tier 3", "Billing Ops", "Engineering", "Success"]),
      assignee: f.person.fullName(),
      status,
      first_response_min: firstResponseMin,
      resolution_hours: resolutionHours,
      sla_target_hours: round(slaHours, 1),
      sla_breached: slaBreached,
      replies_count: replies,
      reopen_count: status === "reopened" ? f.number.int({ min: 1, max: 3 }) : 0,
      escalations: status === "escalated" ? 1 : f.datatype.boolean(0.08) ? 1 : 0,
      csat_score: csat,
      language: f.helpers.weightedArrayElement([
        { weight: 75, value: "en" },
        { weight: 8, value: "es" },
        { weight: 5, value: "de" },
        { weight: 5, value: "fr" },
        { weight: 4, value: "pt" },
        { weight: 3, value: "ja" },
      ]),
    });
  }
  return rows;
}

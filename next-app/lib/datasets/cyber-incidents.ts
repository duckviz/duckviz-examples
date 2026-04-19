import { createFaker, clamp, logNormal, round } from "./faker-utils";

// MITRE ATT&CK tactics (TA0001..TA0043) — real tactic IDs
const ATTACK_VECTORS = [
  { name: "phishing", label: "Phishing / Spear-Phishing", tactic: "TA0001", techniques: ["T1566.001", "T1566.002", "T1566.003"], w: 28 },
  { name: "credential_stuffing", label: "Credential Stuffing", tactic: "TA0006", techniques: ["T1110.004", "T1110.003"], w: 12 },
  { name: "malware", label: "Malware Infection", tactic: "TA0002", techniques: ["T1204", "T1059.001", "T1059.003"], w: 18 },
  { name: "ransomware", label: "Ransomware", tactic: "TA0040", techniques: ["T1486", "T1490"], w: 8 },
  { name: "web_exploit", label: "Web Application Exploit", tactic: "TA0001", techniques: ["T1190"], w: 8 },
  { name: "sql_injection", label: "SQL Injection", tactic: "TA0001", techniques: ["T1190"], w: 3 },
  { name: "insider_threat", label: "Insider Threat", tactic: "TA0001", techniques: ["T1078.003"], w: 4 },
  { name: "supply_chain", label: "Supply Chain Compromise", tactic: "TA0001", techniques: ["T1195.002", "T1195.001"], w: 2 },
  { name: "ddos", label: "Denial of Service", tactic: "TA0040", techniques: ["T1498", "T1499"], w: 5 },
  { name: "misconfiguration", label: "Cloud Misconfiguration", tactic: "TA0005", techniques: ["T1578", "T1530"], w: 6 },
  { name: "zero_day", label: "Zero-Day Exploit", tactic: "TA0001", techniques: ["T1203"], w: 2 },
  { name: "brute_force", label: "Brute Force", tactic: "TA0006", techniques: ["T1110.001"], w: 4 },
];

const INDUSTRY_SECTORS = [
  { name: "Healthcare", medianExposed: 45000, compliance: ["HIPAA", "HITECH"], w: 14 },
  { name: "Financial Services", medianExposed: 28000, compliance: ["PCI-DSS", "SOX", "GLBA"], w: 16 },
  { name: "Technology", medianExposed: 85000, compliance: ["SOC 2"], w: 14 },
  { name: "Retail / E-commerce", medianExposed: 120000, compliance: ["PCI-DSS"], w: 12 },
  { name: "Government", medianExposed: 18000, compliance: ["FISMA", "FedRAMP"], w: 8 },
  { name: "Education", medianExposed: 22000, compliance: ["FERPA"], w: 7 },
  { name: "Manufacturing", medianExposed: 9500, compliance: ["NIST CSF"], w: 6 },
  { name: "Energy & Utilities", medianExposed: 7500, compliance: ["NERC CIP"], w: 5 },
  { name: "Professional Services", medianExposed: 12000, compliance: ["SOC 2"], w: 6 },
  { name: "Media & Entertainment", medianExposed: 55000, compliance: ["GDPR"], w: 5 },
  { name: "Telecom", medianExposed: 180000, compliance: ["GDPR", "CCPA"], w: 4 },
  { name: "Hospitality", medianExposed: 68000, compliance: ["PCI-DSS"], w: 3 },
];

const SEVERITY_LEVELS = [
  { level: "low", score: [0.1, 3.9], w: 25 },
  { level: "medium", score: [4.0, 6.9], w: 40 },
  { level: "high", score: [7.0, 8.9], w: 25 },
  { level: "critical", score: [9.0, 10.0], w: 10 },
];

const THREAT_ACTORS = [
  "APT28 (Fancy Bear)", "APT29 (Cozy Bear)", "Lazarus Group", "FIN7", "Conti",
  "LockBit", "BlackCat/ALPHV", "Cl0p", "REvil", "DarkSide",
  "Anonymous", "Lapsus$", "Unknown (External)", "Unknown (Internal)",
  "Nation State (Unattributed)", "Hacktivist", "Cybercriminal (Opportunistic)",
];

const ASSET_TYPES = [
  "Workstation", "Server (On-Prem)", "Cloud VM", "Database", "Web Application",
  "API Endpoint", "IoT Device", "Network Device", "Email Account", "SaaS Application",
  "Mobile Device", "Container/Pod", "S3 Bucket / Blob Storage",
];

export function generateCyberIncidents(count = 750) {
  const f = createFaker(32032);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const vector = f.helpers.weightedArrayElement(ATTACK_VECTORS.map((v) => ({ weight: v.w, value: v })));
    const sector = f.helpers.weightedArrayElement(INDUSTRY_SECTORS.map((s) => ({ weight: s.w, value: s })));
    const severity = f.helpers.weightedArrayElement(SEVERITY_LEVELS.map((s) => ({ weight: s.w, value: s })));

    // CVSS v3.1 base score within severity band
    const cvssScore = round(f.number.float({ min: severity.score[0]!, max: severity.score[1]!, fractionDigits: 1 }), 1);

    const detectedAt = f.date.between({ from: "2024-06-01", to: "2025-12-15" });
    // Dwell time: how long adversary was active before detection. IBM/Mandiant benchmarks ~16-21 days median
    const dwellTimeHours = Math.round(clamp(logNormal(f, 380, 1.3), 0.5, 8760));
    const initiatedAt = new Date(detectedAt.getTime() - dwellTimeHours * 3600 * 1000);
    // MTTR (mean time to respond): containment takes hours to days, severity-dependent
    const containmentHours = Math.round(clamp(logNormal(f, severity.level === "critical" ? 6 : severity.level === "high" ? 24 : 72, 0.9), 0.25, 720));
    const containedAt = new Date(detectedAt.getTime() + containmentHours * 3600 * 1000);
    const resolvedAt = new Date(containedAt.getTime() + f.number.int({ min: 1, max: 60 }) * 24 * 3600 * 1000);

    // Records exposed — heavy tailed, breach-size distribution follows power law
    const exposed = severity.level === "critical" || severity.level === "high"
      ? Math.round(clamp(logNormal(f, sector.medianExposed * 3, 1.8), 0, 50_000_000))
      : severity.level === "medium"
        ? Math.round(clamp(logNormal(f, sector.medianExposed * 0.4, 1.4), 0, 500_000))
        : f.number.int({ min: 0, max: 500 });

    // Financial impact — Ponemon 2024: avg data breach ~$4.88M, varies by records + sector
    const baseFinancialImpact = exposed * f.number.float({ min: 80, max: 180, fractionDigits: 2 }); // per-record cost
    const financialImpactUsd = round(clamp(baseFinancialImpact + f.number.int({ min: 5000, max: 2_000_000 }), 500, 500_000_000), 2);

    const ransomPaid = vector.name === "ransomware" && f.datatype.boolean(0.35);
    const ransomAmount = ransomPaid ? Math.round(clamp(logNormal(f, 500_000, 1.6), 10_000, 75_000_000)) : 0;

    const affectedAssets = f.number.int({ min: 1, max: severity.level === "critical" ? 2500 : severity.level === "high" ? 500 : 50 });
    const iocCount = f.number.int({ min: 0, max: severity.level === "critical" ? 200 : 30 });

    rows.push({
      incident_id: `INC-${new Date(detectedAt).getFullYear()}-${f.string.numeric({ length: 6, allowLeadingZeros: true })}`,
      title: `${vector.label} — ${sector.name}`,
      initiated_at: initiatedAt.toISOString(),
      detected_at: detectedAt.toISOString(),
      contained_at: containedAt.toISOString(),
      resolved_at: resolvedAt.toISOString(),
      dwell_time_hours: dwellTimeHours,
      mttr_hours: containmentHours,
      attack_vector: vector.name,
      attack_vector_label: vector.label,
      mitre_tactic: vector.tactic,
      mitre_technique: f.helpers.arrayElement(vector.techniques),
      kill_chain_phase: f.helpers.weightedArrayElement([
        { weight: 10, value: "Reconnaissance" },
        { weight: 8, value: "Weaponization" },
        { weight: 15, value: "Delivery" },
        { weight: 15, value: "Exploitation" },
        { weight: 12, value: "Installation" },
        { weight: 15, value: "Command & Control" },
        { weight: 25, value: "Actions on Objectives" },
      ]),
      severity: severity.level,
      cvss_score: cvssScore,
      cvss_vector: `CVSS:3.1/AV:${f.helpers.arrayElement(["N", "A", "L", "P"])}/AC:${f.helpers.arrayElement(["L", "H"])}/PR:${f.helpers.arrayElement(["N", "L", "H"])}/UI:${f.helpers.arrayElement(["N", "R"])}/S:${f.helpers.arrayElement(["U", "C"])}/C:${f.helpers.arrayElement(["N", "L", "H"])}/I:${f.helpers.arrayElement(["N", "L", "H"])}/A:${f.helpers.arrayElement(["N", "L", "H"])}`,
      industry_sector: sector.name,
      organization_country: f.location.countryCode(),
      affected_asset_type: f.helpers.arrayElement(ASSET_TYPES),
      affected_assets: affectedAssets,
      records_exposed: exposed,
      data_types_exposed: f.helpers.arrayElements(
        ["PII", "PHI", "PCI / Credit Card", "Credentials", "Intellectual Property", "Financial Records", "Source Code", "Email Content", "Customer Records", "Employee Records"],
        { min: 0, max: 4 },
      ).join(", "),
      threat_actor: f.helpers.arrayElement(THREAT_ACTORS),
      source_country: f.helpers.weightedArrayElement([
        { weight: 25, value: "RU" },
        { weight: 20, value: "CN" },
        { weight: 12, value: "KP" },
        { weight: 10, value: "IR" },
        { weight: 8, value: "US" },
        { weight: 25, value: f.location.countryCode() },
      ]),
      source_ip: f.internet.ipv4(),
      compliance_impact: f.helpers.arrayElement(sector.compliance),
      notification_required: severity.level === "critical" || severity.level === "high" || exposed > 500,
      notification_window_days: vector.name === "ransomware" ? 3 : f.helpers.arrayElement([30, 60, 72]),
      financial_impact_usd: financialImpactUsd,
      ransom_demanded: ransomPaid || (vector.name === "ransomware" && f.datatype.boolean(0.7)),
      ransom_paid: ransomPaid,
      ransom_amount_usd: ransomAmount,
      ioc_count: iocCount,
      status: f.helpers.weightedArrayElement([
        { weight: 55, value: "resolved" },
        { weight: 20, value: "contained" },
        { weight: 15, value: "investigating" },
        { weight: 8, value: "open" },
        { weight: 2, value: "remediation_in_progress" },
      ]),
      detection_source: f.helpers.weightedArrayElement([
        { weight: 28, value: "SIEM" },
        { weight: 20, value: "EDR" },
        { weight: 12, value: "user_report" },
        { weight: 10, value: "threat_intel" },
        { weight: 8, value: "external_party" },
        { weight: 8, value: "law_enforcement" },
        { weight: 8, value: "pen_test / red_team" },
        { weight: 6, value: "audit" },
      ]),
    });
  }
  return rows;
}

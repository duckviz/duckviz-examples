import { createFaker, clamp, logNormal, round } from "./faker-utils";

// Representative SOC (Standard Occupational Classification) codes + realistic salary bands.
const JOBS = [
  { code: "15-1252", title: "Software Developer", dept: "Engineering", exempt: true, band: [95000, 210000] },
  { code: "15-1254", title: "Web Developer", dept: "Engineering", exempt: true, band: [72000, 145000] },
  { code: "15-1299", title: "Data Scientist", dept: "Engineering", exempt: true, band: [110000, 235000] },
  { code: "15-1211", title: "Systems Analyst", dept: "IT", exempt: true, band: [78000, 140000] },
  { code: "11-3021", title: "Computer & IS Manager", dept: "IT", exempt: true, band: [130000, 280000] },
  { code: "13-1111", title: "Management Analyst", dept: "Operations", exempt: true, band: [70000, 138000] },
  { code: "13-2011", title: "Accountant / Auditor", dept: "Finance", exempt: true, band: [62000, 118000] },
  { code: "13-1161", title: "Marketing Research Analyst", dept: "Marketing", exempt: true, band: [58000, 108000] },
  { code: "41-3031", title: "Sales Representative", dept: "Sales", exempt: false, band: [52000, 128000] },
  { code: "11-2021", title: "Marketing Manager", dept: "Marketing", exempt: true, band: [98000, 185000] },
  { code: "11-2022", title: "Sales Manager", dept: "Sales", exempt: true, band: [108000, 215000] },
  { code: "13-1071", title: "HR Specialist", dept: "HR", exempt: true, band: [55000, 98000] },
  { code: "11-3121", title: "HR Manager", dept: "HR", exempt: true, band: [85000, 165000] },
  { code: "43-4051", title: "Customer Service Rep", dept: "Support", exempt: false, band: [35000, 62000] },
  { code: "27-1024", title: "Graphic Designer", dept: "Marketing", exempt: true, band: [48000, 92000] },
  { code: "11-1021", title: "General / Ops Manager", dept: "Operations", exempt: true, band: [95000, 195000] },
];

const OFFICES = [
  { city: "San Francisco", state: "CA", adjust: 1.35 },
  { city: "New York", state: "NY", adjust: 1.3 },
  { city: "Seattle", state: "WA", adjust: 1.25 },
  { city: "Boston", state: "MA", adjust: 1.2 },
  { city: "Austin", state: "TX", adjust: 1.05 },
  { city: "Denver", state: "CO", adjust: 1.0 },
  { city: "Atlanta", state: "GA", adjust: 0.95 },
  { city: "Chicago", state: "IL", adjust: 1.05 },
  { city: "Raleigh", state: "NC", adjust: 0.9 },
  { city: "Phoenix", state: "AZ", adjust: 0.88 },
];

export function generateHrEmployees(count = 500) {
  const f = createFaker(4004);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const job = f.helpers.arrayElement(JOBS);
    const office = f.helpers.arrayElement(OFFICES);
    const hireDate = f.date.between({ from: "2012-01-01", to: "2025-09-01" });
    const tenureYears = round((Date.now() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000), 1);

    const baseRange = job.band;
    const tenureBoost = Math.min(tenureYears * 0.015, 0.2);
    const baseSalary = Math.round(
      f.number.float({ min: baseRange[0]!, max: baseRange[1]!, fractionDigits: 0 }) * office.adjust * (1 + tenureBoost),
    );

    const bonusPct = job.exempt ? f.number.float({ min: 0.05, max: 0.22, fractionDigits: 3 }) : 0;
    const bonus = Math.round(baseSalary * bonusPct);
    const equity = job.exempt && job.band[1]! > 120000
      ? Math.round(clamp(logNormal(f, baseSalary * 0.4, 0.9), 0, baseSalary * 3))
      : 0;

    const employmentStatus = f.helpers.weightedArrayElement([
      { weight: 85, value: "active" },
      { weight: 8, value: "terminated" },
      { weight: 4, value: "on_leave" },
      { weight: 3, value: "resigned" },
    ]);
    const termDate = employmentStatus === "terminated" || employmentStatus === "resigned"
      ? f.date.between({ from: hireDate, to: "2025-12-31" }).toISOString().split("T")[0]
      : null;

    const perfRating = f.helpers.weightedArrayElement([
      { weight: 5, value: 1 },
      { weight: 10, value: 2 },
      { weight: 50, value: 3 },
      { weight: 25, value: 4 },
      { weight: 10, value: 5 },
    ]);

    const firstName = f.person.firstName();
    const lastName = f.person.lastName();

    rows.push({
      emp_id: `E${f.number.int({ min: 1, max: 999999 }).toString().padStart(6, "0")}`,
      first_name: firstName,
      last_name: lastName,
      work_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.com`,
      job_title: job.title,
      soc_code: job.code,
      department: job.dept,
      manager_id: i > 30 ? `E${f.number.int({ min: 1, max: 30 }).toString().padStart(6, "0")}` : null,
      hire_date: hireDate.toISOString().split("T")[0],
      termination_date: termDate,
      tenure_years: tenureYears,
      employment_type: f.helpers.weightedArrayElement([
        { weight: 80, value: "full_time" },
        { weight: 10, value: "part_time" },
        { weight: 7, value: "contractor" },
        { weight: 3, value: "intern" },
      ]),
      flsa_status: job.exempt ? "exempt" : "non_exempt",
      pay_grade: f.helpers.arrayElement(["IC1", "IC2", "IC3", "IC4", "IC5", "M1", "M2", "M3"]),
      base_salary: baseSalary,
      bonus_target_pct: round(bonusPct * 100, 1),
      bonus_amount: bonus,
      equity_grant_usd: equity,
      total_comp: baseSalary + bonus + equity,
      office_city: office.city,
      office_state: office.state,
      remote_flag: f.datatype.boolean(0.32),
      gender: f.person.sex(),
      age_band: f.helpers.arrayElement(["20-29", "30-39", "40-49", "50-59", "60+"]),
      performance_rating: perfRating,
      promotion_count: f.number.int({ min: 0, max: Math.min(5, Math.floor(tenureYears / 2)) }),
      status: employmentStatus,
    });
  }
  return rows;
}

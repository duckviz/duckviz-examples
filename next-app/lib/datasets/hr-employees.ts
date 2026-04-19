import { createRng } from "./seed-random";

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Finance", "HR", "Operations", "Legal", "Product", "Design", "Support"];
const TITLES = {
  Engineering: ["Software Engineer", "Senior Engineer", "Staff Engineer", "Engineering Manager", "CTO"],
  Sales: ["Sales Rep", "Account Executive", "Sales Manager", "VP Sales", "Sales Director"],
  Marketing: ["Marketing Coordinator", "Content Manager", "Marketing Director", "CMO", "Brand Manager"],
  Finance: ["Financial Analyst", "Controller", "CFO", "Accountant", "Finance Manager"],
  HR: ["HR Coordinator", "Recruiter", "HR Manager", "VP People", "HR Director"],
  Operations: ["Operations Analyst", "Ops Manager", "COO", "Supply Chain Manager", "Logistics Lead"],
  Legal: ["Paralegal", "Corporate Counsel", "General Counsel", "Legal Analyst", "Compliance Officer"],
  Product: ["Product Manager", "Senior PM", "VP Product", "Product Analyst", "CPO"],
  Design: ["UI Designer", "UX Researcher", "Design Lead", "Creative Director", "Design Manager"],
  Support: ["Support Agent", "Support Lead", "Support Manager", "Customer Success", "Technical Support"],
};
const LOCATIONS = ["New York", "San Francisco", "Austin", "Chicago", "Seattle", "Denver", "Boston", "Remote"];

export function generateHrEmployees(count = 500) {
  const rng = createRng(4004);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const dept = rng.pick(DEPARTMENTS);
    const titleOptions = TITLES[dept as keyof typeof TITLES] || ["Associate"];
    const tenure = rng.float(0.5, 20);
    rows.push({
      employee_id: rng.id("EMP", i + 1),
      name: rng.fullName(),
      department: dept,
      title: rng.pick(titleOptions),
      salary: rng.int(45000, 220000),
      hire_date: rng.date("2015-01-01", "2025-06-30"),
      tenure_years: tenure,
      performance_score: rng.float(1.0, 5.0, 1),
      location: rng.pick(LOCATIONS),
      remote: rng.bool(0.35),
    });
  }
  return rows;
}

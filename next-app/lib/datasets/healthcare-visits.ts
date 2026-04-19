import { createRng } from "./seed-random";

const DEPARTMENTS = ["Emergency", "Cardiology", "Orthopedics", "Neurology", "Pediatrics", "Oncology", "Dermatology", "Psychiatry"];
const DIAGNOSES = [
  "Hypertension", "Type 2 Diabetes", "Fracture", "Migraine", "Pneumonia",
  "Anxiety Disorder", "Asthma", "Back Pain", "UTI", "Anemia",
  "Arthritis", "Depression", "Allergic Reaction", "Concussion", "Appendicitis",
];
const TREATMENTS = ["Medication", "Surgery", "Physical Therapy", "Observation", "Counseling", "Imaging", "Lab Tests"];
const INSURANCES = ["Blue Cross", "Aetna", "UnitedHealth", "Cigna", "Medicare", "Medicaid", "Self-Pay"];

export function generateHealthcareVisits(count = 800) {
  const rng = createRng(2002);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const dept = rng.pick(DEPARTMENTS);
    const age = dept === "Pediatrics" ? rng.int(1, 17) : rng.int(18, 90);
    rows.push({
      patient_id: rng.id("PAT", i + 1),
      age,
      gender: rng.pick(["Male", "Female", "Non-binary"]),
      department: dept,
      diagnosis: rng.pick(DIAGNOSES),
      treatment: rng.pick(TREATMENTS),
      cost: rng.float(150, 25000),
      insurance: rng.pick(INSURANCES),
      visit_date: rng.date("2024-01-01", "2025-12-31"),
      duration_mins: rng.int(15, 480),
      readmission: rng.bool(0.12),
    });
  }
  return rows;
}

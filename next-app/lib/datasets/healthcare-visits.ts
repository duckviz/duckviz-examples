import { createFaker, clamp, logNormal, round } from "./faker-utils";

// ICD-10 chapter representative codes + CPT procedure codes.
const ENCOUNTERS = [
  { type: "outpatient", w: 55, losMin: 0, losMax: 0, chargeMedian: 320 },
  { type: "emergency", w: 20, losMin: 0, losMax: 1, chargeMedian: 2800 },
  { type: "telehealth", w: 15, losMin: 0, losMax: 0, chargeMedian: 120 },
  { type: "inpatient", w: 7, losMin: 1, losMax: 14, chargeMedian: 18500 },
  { type: "urgent_care", w: 3, losMin: 0, losMax: 0, chargeMedian: 280 },
];

const DIAGNOSES = [
  { icd10: "I10", label: "Essential hypertension", chapter: "Circulatory" },
  { icd10: "E11.9", label: "Type 2 diabetes without complications", chapter: "Endocrine" },
  { icd10: "J06.9", label: "Acute upper respiratory infection", chapter: "Respiratory" },
  { icd10: "M54.5", label: "Low back pain", chapter: "Musculoskeletal" },
  { icd10: "R51", label: "Headache", chapter: "Symptoms" },
  { icd10: "F32.9", label: "Major depressive disorder", chapter: "Mental" },
  { icd10: "K21.9", label: "GERD without esophagitis", chapter: "Digestive" },
  { icd10: "N39.0", label: "Urinary tract infection", chapter: "Genitourinary" },
  { icd10: "J45.909", label: "Asthma unspecified", chapter: "Respiratory" },
  { icd10: "Z00.00", label: "Encounter for general exam", chapter: "Factors" },
  { icd10: "I25.10", label: "Atherosclerotic heart disease", chapter: "Circulatory" },
  { icd10: "E78.5", label: "Hyperlipidemia", chapter: "Endocrine" },
  { icd10: "M17.11", label: "Osteoarthritis knee right", chapter: "Musculoskeletal" },
  { icd10: "R07.9", label: "Chest pain unspecified", chapter: "Symptoms" },
  { icd10: "C50.911", label: "Breast cancer right", chapter: "Neoplasms" },
];

const CPT_BY_ENCOUNTER: Record<string, string[]> = {
  outpatient: ["99213", "99214", "99203", "99204", "93000", "71046"],
  emergency: ["99283", "99284", "99285", "71046", "87086"],
  telehealth: ["99212", "99213", "99441", "99442"],
  inpatient: ["99223", "99232", "99233", "99238"],
  urgent_care: ["99213", "87880", "71046"],
};

const DEPTS = ["Internal Medicine", "Cardiology", "Emergency", "Pediatrics", "OB/GYN", "Orthopedics", "Oncology", "Radiology", "Dermatology", "Psychiatry", "Family Medicine"];

const PAYERS = [
  { name: "Medicare", w: 22 },
  { name: "Medicaid", w: 18 },
  { name: "Blue Cross Blue Shield", w: 16 },
  { name: "UnitedHealthcare", w: 12 },
  { name: "Aetna", w: 10 },
  { name: "Cigna", w: 8 },
  { name: "Humana", w: 6 },
  { name: "Kaiser Permanente", w: 5 },
  { name: "Self-Pay", w: 3 },
];

export function generateHealthcareVisits(count = 800) {
  const f = createFaker(2002);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const enc = f.helpers.weightedArrayElement(ENCOUNTERS.map((e) => ({ weight: e.w, value: e })));
    const dx = f.helpers.arrayElement(DIAGNOSES);
    const cptList = CPT_BY_ENCOUNTER[enc.type]!;
    const age = f.number.int({ min: 0, max: 95 });
    const sex = f.helpers.weightedArrayElement([
      { weight: 52, value: "F" },
      { weight: 48, value: "M" },
    ]);

    const systolic = clamp(Math.round(f.number.float({ min: 95, max: 165, fractionDigits: 0 }) + (age > 60 ? 10 : 0)), 85, 200);
    const diastolic = clamp(Math.round(systolic * f.number.float({ min: 0.55, max: 0.72, fractionDigits: 2 })), 55, 120);
    const heartRate = clamp(Math.round(f.number.int({ min: 55, max: 110 })), 40, 180);
    const tempC = round(f.number.float({ min: 36.1, max: 38.8, fractionDigits: 1 }), 1);
    const spo2 = round(f.number.float({ min: 92, max: 100, fractionDigits: 1 }), 1);

    const totalCharge = round(clamp(logNormal(f, enc.chargeMedian, 0.7), 40, enc.chargeMedian * 15), 2);
    const payer = f.helpers.weightedArrayElement(PAYERS.map((p) => ({ weight: p.w, value: p.name })));
    const allowedRate = payer === "Self-Pay" ? 1 : f.number.float({ min: 0.35, max: 0.7, fractionDigits: 2 });
    const insurancePaid = payer === "Self-Pay" ? 0 : round(totalCharge * allowedRate, 2);
    const patientResponsibility = round(totalCharge - insurancePaid, 2);

    const los = enc.losMin === enc.losMax ? enc.losMin : f.number.int({ min: enc.losMin, max: enc.losMax });

    rows.push({
      visit_id: `ENC-${f.number.int({ min: 1, max: 999999999 }).toString().padStart(10, "0")}`,
      patient_id: `P${f.number.int({ min: 1, max: 50000 }).toString().padStart(8, "0")}`,
      encounter_date: f.date.between({ from: "2024-06-01", to: "2025-12-31" }).toISOString(),
      encounter_type: enc.type,
      department: f.helpers.arrayElement(DEPTS),
      chief_complaint: dx.label,
      primary_dx_code: dx.icd10,
      dx_chapter: dx.chapter,
      cpt_code: f.helpers.arrayElement(cptList),
      patient_age: age,
      patient_sex: sex,
      length_of_stay_days: los,
      bp_systolic: systolic,
      bp_diastolic: diastolic,
      heart_rate_bpm: heartRate,
      temperature_c: tempC,
      spo2_pct: spo2,
      bmi: round(f.number.float({ min: 18, max: 42, fractionDigits: 1 }), 1),
      provider_npi: f.string.numeric({ length: 10, allowLeadingZeros: false }),
      payer,
      total_charge: totalCharge,
      insurance_paid: insurancePaid,
      patient_paid: patientResponsibility,
      readmission_30d: enc.type === "inpatient" && f.datatype.boolean(0.12),
      discharge_disposition: enc.type === "inpatient"
        ? f.helpers.weightedArrayElement([
            { weight: 70, value: "home" },
            { weight: 15, value: "skilled_nursing" },
            { weight: 8, value: "home_health" },
            { weight: 5, value: "rehab" },
            { weight: 2, value: "expired" },
          ])
        : null,
    });
  }
  return rows;
}

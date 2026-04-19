import { createFaker, clamp, round } from "./faker-utils";

const SUBJECTS = [
  { name: "Algebra I", course: "MATH-1", dept: "Math" },
  { name: "Geometry", course: "MATH-2", dept: "Math" },
  { name: "Algebra II", course: "MATH-3", dept: "Math" },
  { name: "Pre-Calculus", course: "MATH-4", dept: "Math" },
  { name: "AP Calculus", course: "MATH-AP", dept: "Math" },
  { name: "English I", course: "ENG-1", dept: "English" },
  { name: "English II", course: "ENG-2", dept: "English" },
  { name: "AP English Lit", course: "ENG-AP", dept: "English" },
  { name: "Biology", course: "SCI-1", dept: "Science" },
  { name: "Chemistry", course: "SCI-2", dept: "Science" },
  { name: "Physics", course: "SCI-3", dept: "Science" },
  { name: "AP Biology", course: "SCI-AP", dept: "Science" },
  { name: "World History", course: "HIS-1", dept: "History" },
  { name: "US History", course: "HIS-2", dept: "History" },
  { name: "AP US History", course: "HIS-AP", dept: "History" },
  { name: "Spanish I", course: "WL-SP1", dept: "World Language" },
  { name: "Spanish II", course: "WL-SP2", dept: "World Language" },
  { name: "AP Computer Science A", course: "CS-AP", dept: "Computer Science" },
  { name: "Studio Art", course: "ART-1", dept: "Art" },
  { name: "Physical Education", course: "PE-1", dept: "PE" },
];

const SCHOOLS = [
  { name: "Lincoln High School", district: "Metro USD 1", locale: "urban" },
  { name: "Washington Academy", district: "Metro USD 1", locale: "urban" },
  { name: "Jefferson Prep", district: "Suburban USD 5", locale: "suburban" },
  { name: "Roosevelt School", district: "Suburban USD 5", locale: "suburban" },
  { name: "Adams Institute", district: "County USD 12", locale: "rural" },
  { name: "Madison Charter", district: "Metro USD 1", locale: "urban" },
];

function letterGrade(score: number): string {
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 65) return "D";
  return "F";
}

function gpaPoints(score: number): number {
  if (score >= 93) return 4.0;
  if (score >= 90) return 3.7;
  if (score >= 87) return 3.3;
  if (score >= 83) return 3.0;
  if (score >= 80) return 2.7;
  if (score >= 77) return 2.3;
  if (score >= 73) return 2.0;
  if (score >= 70) return 1.7;
  if (score >= 67) return 1.3;
  if (score >= 65) return 1.0;
  return 0;
}

export function generateStudentPerformance(count = 700) {
  const f = createFaker(8008);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const school = f.helpers.arrayElement(SCHOOLS);
    const subject = f.helpers.arrayElement(SUBJECTS);
    const gradeLevel = f.number.int({ min: 9, max: 12 });
    const studyHours = round(f.number.float({ min: 0, max: 12, fractionDigits: 1 }), 1);
    const attendancePct = round(clamp(f.number.float({ min: 55, max: 100, fractionDigits: 1 }) + (school.locale === "rural" ? -3 : 0), 0, 100), 1);
    const tutoring = f.datatype.boolean(school.locale === "urban" ? 0.22 : school.locale === "suburban" ? 0.32 : 0.12);
    const iep = f.datatype.boolean(0.13);
    const ell = f.datatype.boolean(school.locale === "urban" ? 0.18 : 0.05);
    const freeReducedLunch = f.datatype.boolean(school.locale === "urban" ? 0.5 : school.locale === "suburban" ? 0.25 : 0.48);

    let base = 55 + studyHours * 3.0;
    base += (attendancePct - 80) * 0.6;
    if (tutoring) base += 6;
    if (iep) base -= 4;
    if (ell) base -= 5;
    if (subject.course.endsWith("AP")) base -= 3;
    const noise = f.number.float({ min: -12, max: 12, fractionDigits: 1 });
    const finalScore = clamp(Math.round(base + noise), 0, 100);

    const cohortYear = 2026 - (gradeLevel - 9);

    rows.push({
      student_id: `STU-${f.number.int({ min: 1, max: 50000 }).toString().padStart(6, "0")}`,
      school_name: school.name,
      district: school.district,
      locale: school.locale,
      grade_level: gradeLevel,
      cohort_year: cohortYear,
      semester: f.helpers.arrayElement(["Fall 2024", "Spring 2025", "Fall 2025"]),
      course_code: subject.course,
      subject: subject.name,
      department: subject.dept,
      final_score: finalScore,
      letter_grade: letterGrade(finalScore),
      gpa_points: gpaPoints(finalScore),
      attendance_pct: attendancePct,
      absences: f.number.int({ min: 0, max: 30 }),
      tardies: f.number.int({ min: 0, max: 15 }),
      study_hours_weekly: studyHours,
      has_tutoring: tutoring,
      iep_flag: iep,
      ell_flag: ell,
      free_reduced_lunch: freeReducedLunch,
      gender: f.helpers.weightedArrayElement([
        { weight: 49, value: "F" },
        { weight: 49, value: "M" },
        { weight: 2, value: "Non-binary" },
      ]),
    });
  }
  return rows;
}

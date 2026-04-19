import { createRng } from "./seed-random";

const SUBJECTS = ["Mathematics", "English", "Science", "History", "Art", "Physical Education", "Computer Science", "Foreign Language"];
const SCHOOLS = ["Lincoln High", "Washington Academy", "Jefferson Prep", "Roosevelt School", "Adams Institute", "Madison Charter"];
const SEMESTERS = ["Fall 2024", "Spring 2025", "Fall 2025"];

export function generateStudentPerformance(count = 700) {
  const rng = createRng(8008);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const studyHours = rng.float(0, 8);
    const tutoring = rng.bool(0.25);
    const baseScore = 40 + studyHours * 5 + (tutoring ? 8 : 0);
    const score = Math.min(100, Math.max(0, Math.round(baseScore + rng.float(-15, 15))));
    rows.push({
      student_id: rng.id("STU", rng.int(1, 200)),
      grade_level: rng.int(9, 12),
      subject: rng.pick(SUBJECTS),
      score,
      attendance_pct: rng.float(60, 100),
      study_hours_weekly: Number(studyHours.toFixed(1)),
      tutoring,
      gender: rng.pick(["Male", "Female", "Non-binary"]),
      school: rng.pick(SCHOOLS),
      semester: rng.pick(SEMESTERS),
    });
  }
  return rows;
}

// Shared by seed.js (initial fee assessment) and routes/enrollment.js
// (re-enrollment assessment for the next school year) so both use the same
// figures — illustrative amounts only, not sourced from any real tuition
// schedule.
const SUBJECTS = ['Filipino', 'English', 'Math', 'Science', 'Values Education'];
const PASSING_GRADE = 75;

// The school's 4 quarters (DepEd calls them "grading periods") — one school
// year is these 4, in this order. Single source of truth for both grade
// entry (Teacher > Grades) and validation (POST /teacher/classes/:id/grades).
const GRADING_PERIODS = ['First Grading', 'Second Grading', 'Third Grading', 'Fourth Grading'];

// DepEd-style short codes for the Subjects tab (admin/subjects) — display
// only, not used as a lookup key anywhere subject records are stored.
const SUBJECT_CODES = {
  Filipino: 'FIL',
  English: 'ENG',
  Math: 'MATH',
  Science: 'SCI',
  'Values Education': 'VE',
};

const FEE_TEMPLATES = {
  low: [ // Grades 1-3
    { fee_type: 'Tuition Fee', amount: 15000 },
    { fee_type: 'Miscellaneous Fee', amount: 2500 },
    { fee_type: 'Computer Fee', amount: 1500 },
    { fee_type: 'Books', amount: 3000 },
    { fee_type: 'Notebooks & Supplies', amount: 800 },
  ],
  high: [ // Grades 4-6
    { fee_type: 'Tuition Fee', amount: 18000 },
    { fee_type: 'Miscellaneous Fee', amount: 2500 },
    { fee_type: 'Computer Fee', amount: 1500 },
    { fee_type: 'Books', amount: 3500 },
    { fee_type: 'Notebooks & Supplies', amount: 800 },
  ],
};

function feeTemplateForGrade(grade) {
  return grade <= 3 ? FEE_TEMPLATES.low : FEE_TEMPLATES.high;
}

// '2025-2026' -> '2026-2027'
function nextSchoolYear(schoolYear) {
  const [start] = schoolYear.split('-').map(Number);
  return `${start + 1}-${start + 2}`;
}

module.exports = { SUBJECTS, SUBJECT_CODES, GRADING_PERIODS, PASSING_GRADE, FEE_TEMPLATES, feeTemplateForGrade, nextSchoolYear };

// Shared by seed.js (initial fee assessment) and routes/enrollment.js
// (re-enrollment assessment for the next school year) so both use the same
// figures — illustrative amounts only, not sourced from any real tuition
// schedule.
const SUBJECTS = ['Filipino', 'English', 'Math', 'Science', 'Values Education'];
const PASSING_GRADE = 75;

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

module.exports = { SUBJECTS, PASSING_GRADE, FEE_TEMPLATES, feeTemplateForGrade, nextSchoolYear };

// Fixed catalog for the forgot-password flow — a school doesn't customize
// this list, so it lives in code rather than a database table (same
// reasoning as REQUIREMENT_TYPES in curriculum.js). Shared by me.js (setup)
// and auth.js (forgot-password verification against whatever a user chose).
const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  'What was the name of your first pet?',
  'What elementary school did you attend?',
  'What is your favorite book?',
  'What city were you born in?',
  'What was your childhood nickname?',
];

// A user picks this many distinct questions and answers all of them —
// picked so a single leaked answer isn't enough to reset the account.
const REQUIRED_QUESTION_COUNT = 3;

module.exports = { SECURITY_QUESTIONS, REQUIRED_QUESTION_COUNT };

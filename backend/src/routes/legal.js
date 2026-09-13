const fs = require('fs');
const path = require('path');
const express = require('express');

const router = express.Router();

// Serves the project's actual legal docs (repo root) so there's a single
// source of truth — no separate copy to keep in sync with the frontend.
const DOCS = {
  'privacy-policy': path.join(__dirname, '..', '..', '..', 'PRIVACY_POLICY_TEMPLATE.md'),
  'terms-of-service': path.join(__dirname, '..', '..', '..', 'TERMS_OF_SERVICE_TEMPLATE.md'),
};

// Public — no auth. The whole point is these are readable with no login.
router.get('/:doc', (req, res) => {
  const filePath = DOCS[req.params.doc];
  if (!filePath) {
    return res.status(404).json({ error: `unknown doc; use one of: ${Object.keys(DOCS).join(', ')}` });
  }
  res.json({ content: fs.readFileSync(filePath, 'utf8') });
});

module.exports = router;

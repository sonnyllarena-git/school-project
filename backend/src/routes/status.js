const express = require('express');
const { checkNow, getHistory, getUptimePct, getStartedAt } = require('../lib/status');

const router = express.Router();

// Public — no auth. A status page needs to work even when the app/DB is down.
router.get('/', async (req, res) => {
  const current = await checkNow();
  res.json({
    status: current.ok ? 'operational' : 'degraded',
    db_connected: current.ok,
    started_at: getStartedAt(),
    uptime_pct_recent: getUptimePct(),
    checked_at: current.timestamp,
  });
});

router.get('/history', (req, res) => {
  res.json(getHistory());
});

module.exports = router;

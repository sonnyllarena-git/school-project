const pool = require('../db');

const HISTORY_LIMIT = 500;
const startedAt = new Date();
const history = [];

async function checkNow() {
  let dbOk = true;
  try {
    await pool.query('SELECT 1');
  } catch {
    dbOk = false;
  }
  const record = { timestamp: new Date().toISOString(), ok: dbOk };
  history.push(record);
  if (history.length > HISTORY_LIMIT) history.shift();
  return record;
}

function getHistory() {
  return history;
}

function getUptimePct() {
  if (history.length === 0) return null;
  const okCount = history.filter(h => h.ok).length;
  return Math.round((okCount / history.length) * 1000) / 10;
}

function getStartedAt() {
  return startedAt.toISOString();
}

module.exports = { checkNow, getHistory, getUptimePct, getStartedAt };

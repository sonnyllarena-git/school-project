const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pool = require('../db');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const RETENTION_DAYS = 30;

// Core content tables — excludes audit_logs/backups themselves (operational
// logs, not school records) to keep backups focused on what a school would
// actually need restored.
const TABLES = ['schools', 'users', 'teachers', 'subjects', 'teacher_subjects', 'classes', 'students', 'attendance', 'grades', 'fee_items', 'payments', 'enrollments', 'student_requirements', 'messages', 'security_questions'];

async function dumpTables() {
  const dump = {};
  let totalRecords = 0;
  for (const table of TABLES) {
    const { rows } = await pool.query(`SELECT * FROM ${table}`);
    dump[table] = rows;
    totalRecords += rows.length;
  }
  return { dump, totalRecords };
}

function pruneOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  for (const file of fs.readdirSync(BACKUP_DIR)) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(BACKUP_DIR, file);
    if (fs.statSync(filePath).mtimeMs < cutoff) fs.unlinkSync(filePath);
  }
}

async function runBackup({ schoolId = 'STM001', triggeredBy = 'manual' } = {}) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const { dump, totalRecords } = await dumpTables();

  const now = new Date();
  const fileName = `${now.toISOString().replace(/[:.]/g, '-')}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(dump, null, 2));
  const sizeMb = Math.round((fs.statSync(filePath).size / (1024 * 1024)) * 100) / 100;

  await pool.query(
    `INSERT INTO backups (backup_id, school_id, backup_date, backup_time, tables_backed_up, total_records, backup_size_mb, backup_location, status, retention_days)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SUCCESS', $9)`,
    [crypto.randomUUID(), schoolId, now.toISOString().slice(0, 10), now.toISOString().slice(11, 19),
      TABLES, totalRecords, sizeMb, fileName, RETENTION_DAYS]
  );

  pruneOldBackups();
  return { fileName, totalRecords, sizeMb, triggeredBy };
}

module.exports = { runBackup, pruneOldBackups, BACKUP_DIR, RETENTION_DAYS };

// Restores a backup produced by scripts/backup.js. Deliberately NOT wired
// into any automatic path — restoring is destructive (replaces current
// data), so it's a one-command, explicit, confirm-by-typing-the-filename
// action, never triggered on startup or on a schedule.
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { BACKUP_DIR } = require('../src/lib/backup');

const TABLES_IN_ORDER = ['schools', 'users', 'teachers', 'subjects', 'teacher_subjects', 'classes', 'students', 'attendance', 'grades', 'fee_items', 'payments', 'enrollments'];

async function restore(fileName) {
  const filePath = path.join(BACKUP_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found: ${filePath}`);
  }
  const dump = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query('BEGIN');
    // audit_logs/backups aren't part of the backup dump (they're operational logs, not
    // school records — see backup.js) but still hold FKs into users/schools, so they
    // must be cleared before those tables can be deleted. This restore does not bring
    // back pre-restore audit/backup history.
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM backups');
    // Reverse order for TRUNCATE-free delete (children before parents), then insert parents-first.
    for (const table of [...TABLES_IN_ORDER].reverse()) {
      await client.query(`DELETE FROM ${table}`);
    }
    for (const table of TABLES_IN_ORDER) {
      const rows = dump[table] || [];
      for (const row of rows) {
        const columns = Object.keys(row);
        const placeholders = columns.map((_, i) => `$${i + 1}`);
        await client.query(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
          columns.map(c => row[c])
        );
      }
    }
    await client.query('COMMIT');
    return Object.fromEntries(TABLES_IN_ORDER.map(t => [t, (dump[t] || []).length]));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

const fileName = process.argv[2];
if (!fileName) {
  console.error('Usage: node scripts/restore.js <backup-file-name.json>');
  console.error(`Available backups in ${BACKUP_DIR}:`);
  fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).forEach(f => console.error(`  ${f}`));
  process.exit(1);
}

restore(fileName)
  .then(counts => { console.log('Restore complete:', counts); process.exit(0); })
  .catch(err => { console.error('Restore failed:', err.message); process.exit(1); });

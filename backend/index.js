require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const teacherRoutes = require('./src/routes/teacher');
const studentRoutes = require('./src/routes/student');
const statusRoutes = require('./src/routes/status');
const legalRoutes = require('./src/routes/legal');
const accountsRoutes = require('./src/routes/accounts');
const enrollmentRoutes = require('./src/routes/enrollment');
const meRoutes = require('./src/routes/me');
const requirementsRoutes = require('./src/routes/requirements');
const messagesRoutes = require('./src/routes/messages');
const documentsRoutes = require('./src/routes/documents');
const { checkNow } = require('./src/lib/status');
const { runBackup } = require('./src/lib/backup');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/teacher', teacherRoutes);
app.use('/student', studentRoutes);
app.use('/status', statusRoutes);
app.use('/legal', legalRoutes);
app.use('/accounts', accountsRoutes);
app.use('/enrollment', enrollmentRoutes);
app.use('/me', meRoutes);
app.use('/requirements', requirementsRoutes);
app.use('/messages', messagesRoutes);
app.use('/documents', documentsRoutes);

const HEALTH_CHECK_INTERVAL_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const BACKUP_HOUR_UTC = 19; // ~3am Philippines time (UTC+8)

function scheduleDailyBackup() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), BACKUP_HOUR_UTC, 0, 0));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  setTimeout(function trigger() {
    runBackup({ triggeredBy: 'daily-automated' }).catch(err => console.error('Automated backup failed:', err.message));
    setInterval(() => {
      runBackup({ triggeredBy: 'daily-automated' }).catch(err => console.error('Automated backup failed:', err.message));
    }, DAY_MS);
  }, next.getTime() - now.getTime());
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  setInterval(() => { checkNow().catch(() => {}); }, HEALTH_CHECK_INTERVAL_MS);
  checkNow().catch(() => {});
  scheduleDailyBackup();
});

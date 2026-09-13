require('dotenv').config({ quiet: true });
const { runBackup } = require('../src/lib/backup');

runBackup({ triggeredBy: 'manual' })
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Backup failed:', err.message);
    process.exit(1);
  });

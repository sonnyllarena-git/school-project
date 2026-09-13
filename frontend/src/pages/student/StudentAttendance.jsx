import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import AttendanceTable from '../../components/AttendanceTable';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export default function StudentAttendance() {
  const { session } = useAuth();
  const [records, setRecords] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myAttendance(session.token).then(setRecords).catch(err => setError(err.message));
  }, [session]);

  return (
    <Layout title="My Attendance">
      {error && <div className="error-banner">{error}</div>}
      <AttendanceTable records={records} />
    </Layout>
  );
}

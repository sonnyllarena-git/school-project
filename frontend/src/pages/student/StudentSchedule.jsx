import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ScheduleView from '../../components/ScheduleView';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export default function StudentSchedule() {
  const { session } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.mySchedule(session.token).then(setSchedule).catch(err => setError(err.message));
  }, [session]);

  return (
    <Layout title="My Schedule">
      {error && <div className="error-banner">{error}</div>}
      <ScheduleView schedule={schedule} />
    </Layout>
  );
}

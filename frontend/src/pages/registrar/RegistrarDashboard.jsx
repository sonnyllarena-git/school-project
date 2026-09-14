import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const STAGE_LABEL = {
  not_started: 'Not Yet Started',
  verified: 'Verified',
  assessed: 'Assessed (SOA Generated)',
  printed: 'Printed for Parent',
  certificate_issued: 'Certificate Issued',
};

export default function RegistrarDashboard() {
  const { session } = useAuth();
  const [enrollment, setEnrollment] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getEnrollmentSummary(session.token).then(setEnrollment).catch(err => setError(err.message));
    api.getRequirementsSummary(session.token).then(setRequirements).catch(err => setError(err.message));
  }, [session]);

  return (
    <Layout title="Registrar Dashboard">
      {error && <div className="error-banner">{error}</div>}

      {enrollment && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Promotion Pipeline — School Year {enrollment.school_year}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
            Where all {enrollment.total_students} students stand in the re-enrollment/promotion workflow. Manage this on the Enrollment tab.
          </p>
          <div className="grid grid-4">
            <StatCard label={STAGE_LABEL.not_started} value={enrollment.not_started} />
            <StatCard label={STAGE_LABEL.verified} value={enrollment.verified} />
            <StatCard label={STAGE_LABEL.assessed} value={enrollment.assessed} />
            <StatCard label={STAGE_LABEL.printed} value={enrollment.printed} />
          </div>
          <div className="grid grid-4" style={{ marginTop: 16 }}>
            <StatCard label={STAGE_LABEL.certificate_issued} value={enrollment.certificate_issued} />
          </div>
        </div>
      )}

      {requirements && (
        <div className="card">
          <h3>Enrollment Requirements</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
            Students with every requirement (Birth Certificate, Form 137, etc.) verified vs still missing something. Manage this on the Requirements tab.
          </p>
          <div className="grid grid-3">
            <StatCard label="Total Students" value={requirements.total_students} />
            <StatCard label="Complete" value={requirements.complete} />
            <StatCard label="Incomplete" value={requirements.incomplete} />
          </div>
        </div>
      )}
    </Layout>
  );
}

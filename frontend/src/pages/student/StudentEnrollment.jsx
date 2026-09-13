import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const STAGE_LABEL = {
  VERIFIED: 'Verified — awaiting assessment',
  ASSESSED: 'Assessed — Statement of Account ready',
  PRINTED: 'Printed — awaiting parent review and payment',
  CERTIFICATE_ISSUED: 'Certificate Issued — Enrolled for next school year',
};

export default function StudentEnrollment() {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myEnrollment(session.token).then(setData).catch(err => setError(err.message));
  }, [session]);

  if (error) return <Layout title="Enrollment"><div className="error-banner">{error}</div></Layout>;
  if (!data) return <Layout title="Enrollment"><div className="empty-state">Loading…</div></Layout>;

  return (
    <Layout title="Enrollment">
      <div className="grid grid-2">
        <div className="card">
          <h3>Current Standing</h3>
          <table>
            <tbody>
              <tr><td>Grade Level</td><td>Grade {data.current_grade}{data.current_section}</td></tr>
              <tr><td>Subjects</td><td>{data.subjects.join(', ')}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Promotion — {data.next_school_year}</h3>
          {!data.promotion ? (
            <div className="empty-state">No re-enrollment process started yet for {data.next_school_year}.</div>
          ) : (
            <>
              <p>{STAGE_LABEL[data.promotion.status]}</p>
              {data.promotion.status === 'CERTIFICATE_ISSUED' && (
                <Link to="/student/certificate"><button className="secondary">View / Print Certificate</button></Link>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

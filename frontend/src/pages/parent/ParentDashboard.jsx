import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import AttendanceTable from '../../components/AttendanceTable';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export default function ParentDashboard() {
  const { session } = useAuth();
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState('');
  const [tab, setTab] = useState('grades');
  const [grades, setGrades] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myChildren(session.token).then(cs => {
      setChildren(cs);
      if (cs[0]) setSelected(cs[0].student_id);
    }).catch(err => setError(err.message));
  }, [session]);

  useEffect(() => {
    if (!selected) return;
    setGrades(null);
    setAttendance(null);
    api.childGrades(session.token, selected).then(setGrades).catch(err => setError(err.message));
    api.childAttendance(session.token, selected).then(setAttendance).catch(err => setError(err.message));
  }, [selected, session]);

  if (error) return <Layout title="My Children"><div className="error-banner">{error}</div></Layout>;

  return (
    <Layout title="My Children">
      {children.length === 0 ? (
        <div className="card"><div className="empty-state">No linked children found.</div></div>
      ) : (
        <>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <div style={{ maxWidth: 280 }}>
              <label>Child</label>
              <select value={selected} onChange={e => setSelected(e.target.value)}>
                {children.map(c => <option key={c.student_id} value={c.student_id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="tabs">
            <button className={tab === 'grades' ? 'active' : ''} onClick={() => setTab('grades')}>Grades</button>
            <button className={tab === 'attendance' ? 'active' : ''} onClick={() => setTab('attendance')}>Attendance</button>
          </div>

          {tab === 'grades' && (
            grades === null ? <div className="empty-state">Loading…</div> :
            grades.length === 0 ? <div className="card"><div className="empty-state">No grades recorded yet.</div></div> : (
              <div className="card">
                <table>
                  <thead><tr><th>Subject</th><th>Period</th><th>1st</th><th>2nd</th><th>3rd</th><th>Formative</th><th>Final</th></tr></thead>
                  <tbody>
                    {grades.map((g, i) => (
                      <tr key={i}>
                        <td>{g.subject}</td><td>{g.grading_period}</td>
                        <td>{g.first_period_exam}</td><td>{g.second_period_exam}</td><td>{g.third_period_exam}</td>
                        <td>{g.formative_score}</td><td><strong>{g.final_grade}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'attendance' && <AttendanceTable records={attendance} />}
        </>
      )}
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const SCHOOL_FIELDS = ['name', 'address', 'phone', 'email', 'principal', 'region'];
const SCHOOL_FIELD_LABELS = { name: 'Name', address: 'Address', phone: 'Phone', email: 'Email', principal: 'Principal', region: 'Region' };

export default function AdminDashboard() {
  const { session } = useAuth();
  const [school, setSchool] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [grades, setGrades] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { token } = session;
    Promise.all([api.getSchool(token), api.attendanceReport(token), api.gradesReport(token)])
      .then(([s, a, g]) => { setSchool(s); setAttendance(a); setGrades(g); })
      .catch(err => setError(err.message));
  }, [session]);

  function startEdit() {
    setForm(Object.fromEntries(SCHOOL_FIELDS.map(f => [f, school[f] || ''])));
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updated = await api.updateSchool(session.token, form);
      setSchool(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !school) return <Layout title="Dashboard"><div className="error-banner">{error}</div></Layout>;
  if (!school) return <Layout title="Dashboard"><div className="empty-state">Loading…</div></Layout>;

  return (
    <Layout title="Dashboard">
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="School Year" value={school.school_year} />
        <StatCard label="Overall Attendance" value={attendance ? `${attendance.overall_attendance_pct}%` : '—'} />
        <StatCard label="Grades Recorded" value={grades?.total ?? '—'} />
        <StatCard label="Excellent (90-100)" value={grades?.excellent_90_100 ?? '—'} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>School Info</h3>
            {!editing && <button className="ghost" style={{ fontSize: 13, padding: '4px 10px' }} onClick={startEdit}>Edit</button>}
          </div>
          {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
          {editing ? (
            <form onSubmit={handleSave} style={{ marginTop: 12 }}>
              {SCHOOL_FIELDS.map(f => (
                <div key={f} style={{ marginBottom: 10 }}>
                  <label>{SCHOOL_FIELD_LABELS[f]}</label>
                  <input value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" className="ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <table style={{ marginTop: 12 }}>
              <tbody>
                <tr><td>Name</td><td>{school.name}</td></tr>
                <tr><td>Principal</td><td>{school.principal}</td></tr>
                <tr><td>Region</td><td>{school.region}</td></tr>
                <tr><td>Email</td><td>{school.email}</td></tr>
                <tr><td>Phone</td><td>{school.phone}</td></tr>
                <tr><td>Address</td><td>{school.address}</td></tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>Attendance by Class</h3>
          <table>
            <thead><tr><th>Class</th><th>Present / Total</th><th>%</th></tr></thead>
            <tbody>
              {attendance?.per_class.map(c => (
                <tr key={c.class_id}>
                  <td>Grade {c.grade_level}{c.section}</td>
                  <td>{c.present} / {c.total}</td>
                  <td>{c.attendance_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Grade Distribution</h3>
        <div className="grid grid-4">
          <StatCard label="Excellent (90-100)" value={grades?.excellent_90_100} />
          <StatCard label="Very Good (80-89)" value={grades?.very_good_80_89} />
          <StatCard label="Good (70-79)" value={grades?.good_70_79} />
          <StatCard label="Needs Improvement (<70)" value={grades?.needs_improvement_below_70} />
        </div>
      </div>
    </Layout>
  );
}

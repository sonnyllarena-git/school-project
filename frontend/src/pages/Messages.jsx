import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const SENDER_ROLES = ['ADMIN', 'TEACHER', 'REGISTRAR'];
const GRADES = [1, 2, 3, 4, 5, 6];
const SECTIONS = ['A', 'B'];

const AUDIENCE_LABEL = m => {
  if (m.audience_type === 'ALL') return 'Everyone';
  if (m.audience_type === 'GRADE_SECTION') return `Grade ${m.audience_grade_level} — ${m.audience_section}`;
  return 'One student';
};

export default function Messages() {
  const { session } = useAuth();
  const canSend = SENDER_ROLES.includes(session.user.role);
  // A teacher composing doesn't have a general student directory (Accounts
  // is Admin/Registrar/Cashier only) — so Specific Student is Admin/
  // Registrar only; a teacher's realistic case (their own class) is covered
  // by Grade & Section.
  const canTargetStudent = ['ADMIN', 'REGISTRAR'].includes(session.user.role);

  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ audience_type: 'ALL', audience_grade_level: 1, audience_section: 'A', audience_student_id: '', subject: '', body: '' });

  function load() {
    api.getMessages(session.token).then(setMessages).catch(err => setError(err.message));
  }

  useEffect(load, [session]);

  useEffect(() => {
    if (!canTargetStudent) return;
    api.listAccountStudents(session.token).then(list => {
      setStudents(list);
      if (list[0]) setForm(f => ({ ...f, audience_student_id: f.audience_student_id || list[0].student_id }));
    }).catch(() => {});
  }, [session, canTargetStudent]);

  async function handleSend(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setSending(true);
    try {
      await api.sendMessage(session.token, form);
      setForm(f => ({ ...f, subject: '', body: '' }));
      setNotice('Message sent.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Layout title="Messages">
      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="error-banner" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>{notice}</div>}

      {canSend && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Compose Announcement</h3>
          <form onSubmit={handleSend}>
            <div className="form-row">
              <div>
                <label>Audience</label>
                <select value={form.audience_type} onChange={e => setForm({ ...form, audience_type: e.target.value })}>
                  <option value="ALL">Everyone</option>
                  <option value="GRADE_SECTION">A Specific Grade &amp; Section</option>
                  {canTargetStudent && <option value="STUDENT">A Specific Student</option>}
                </select>
              </div>
              {form.audience_type === 'GRADE_SECTION' && (
                <>
                  <div>
                    <label>Grade</label>
                    <select value={form.audience_grade_level} onChange={e => setForm({ ...form, audience_grade_level: Number(e.target.value) })}>
                      {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Section</label>
                    <select value={form.audience_section} onChange={e => setForm({ ...form, audience_section: e.target.value })}>
                      {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </>
              )}
              {form.audience_type === 'STUDENT' && (
                <div>
                  <label>Student</label>
                  <select value={form.audience_student_id} onChange={e => setForm({ ...form, audience_student_id: e.target.value })}>
                    {students.map(s => (
                      <option key={s.student_id} value={s.student_id}>{s.name} — Grade {s.grade_level} {s.section} ({s.lrn})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="form-row">
              <div>
                <label>Subject</label>
                <input value={form.subject} required onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Message</label>
                <textarea rows={4} value={form.body} required onChange={e => setForm({ ...form, body: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send'}</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Inbox ({messages.length})</h3>
        {messages.length === 0 ? (
          <div className="empty-state">No messages yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(m => (
              <div key={m.message_id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong>{m.subject}</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  From {m.sender_name} ({m.sender_role}) · To: {AUDIENCE_LABEL(m)}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

import { Fragment, useEffect, useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/Layout';
import SubjectDetailModal from '../../components/SubjectDetailModal';
import AddSubjectModal from '../../components/AddSubjectModal';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import { formatTime } from '../../lib/format';

const GRADES = [1, 2, 3, 4, 5, 6];

export default function AdminSubjects() {
  const { session } = useAuth();
  const [grade, setGrade] = useState(1);
  const [gradeData, setGradeData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [detailSubject, setDetailSubject] = useState(null);
  const [adding, setAdding] = useState(false);

  function load() {
    Promise.all([api.getSubjects(session.token), api.listTeachers(session.token)])
      .then(([subjects, teacherList]) => {
        setGradeData(subjects);
        setTeachers(teacherList);
      })
      .catch(err => setError(err.message));
  }

  useEffect(load, [session]);

  const subjectsForGrade = gradeData.find(g => g.grade_level === grade)?.subjects || [];

  function openDetail(subject) {
    setDetailSubject({ ...subject, grade_level: grade });
  }

  return (
    <Layout title="Subjects">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h3>Subjects by Grade</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
              Click the arrow to see teachers and schedule. Double-click a subject to view full details and assign teachers.
            </p>
          </div>
          <button onClick={() => setAdding(true)}>+ Add Subject</button>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <div className="tabs">
          {GRADES.map(g => (
            <button key={g} className={g === grade ? 'active' : ''} onClick={() => { setGrade(g); setExpanded(null); }}>
              Grade {g}
            </button>
          ))}
        </div>
        <table>
          <thead><tr><th></th><th>Code</th><th>Subject</th></tr></thead>
          <tbody>
            {subjectsForGrade.map(s => (
              <Fragment key={s.subject_id}>
                <tr
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === s.subject_id ? null : s.subject_id)}
                  onDoubleClick={() => openDetail(s)}
                >
                  <td style={{ width: 28 }}>
                    {expanded === s.subject_id ? <ChevronDownIcon width={16} /> : <ChevronRightIcon width={16} />}
                  </td>
                  <td>{s.code}</td>
                  <td>{s.name}</td>
                </tr>
                {expanded === s.subject_id && (
                  <tr>
                    <td></td>
                    <td colSpan={2} style={{ paddingBottom: 16 }}>
                      <div className="form-row" style={{ marginBottom: 0 }}>
                        <div>
                          <label>Teacher(s)</label>
                          <div>{s.teachers.length ? s.teachers.map(t => t.name).join(', ') : '—'}</div>
                        </div>
                        <div>
                          <label>Schedule</label>
                          <div>
                            {s.schedule?.days || '—'}
                            {s.schedule?.start_time && s.schedule?.end_time
                              ? ` · ${formatTime(s.schedule.start_time)} – ${formatTime(s.schedule.end_time)}`
                              : ''}
                          </div>
                        </div>
                        <div>
                          <label>Room</label>
                          <div>{s.schedule?.room || '—'}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {detailSubject && (
        <SubjectDetailModal
          token={session.token}
          subject={detailSubject}
          allTeachers={teachers}
          onClose={() => setDetailSubject(null)}
          onChanged={() => { load(); setDetailSubject(null); }}
        />
      )}

      {adding && (
        <AddSubjectModal
          token={session.token}
          gradeLevel={grade}
          onClose={() => setAdding(false)}
          onCreated={() => { load(); setAdding(false); }}
        />
      )}
    </Layout>
  );
}

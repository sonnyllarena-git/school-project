import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import { HOME_BY_ROLE } from '../lib/roleHome';

const EMPTY_SLOT = { question: '', answer: '' };

export default function SetupSecurity() {
  const { session, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('password');

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const [catalog, setCatalog] = useState(null);
  const [requiredCount, setRequiredCount] = useState(3);
  const [slots, setSlots] = useState([]);
  const [qError, setQError] = useState('');
  const [qBusy, setQBusy] = useState(false);

  useEffect(() => {
    api.getSecurityQuestionCatalog().then(({ questions, required_count }) => {
      setCatalog(questions);
      setRequiredCount(required_count);
      setSlots(Array.from({ length: required_count }, () => ({ ...EMPTY_SLOT })));
    }).catch(err => setQError(err.message));
  }, []);

  if (!session) return <Navigate to="/login" replace />;
  // Someone landed here directly despite already being fully set up (e.g.
  // typed the URL, or refreshed after finishing) — nothing to do here.
  if (!session.user.must_complete_setup && step !== 'done') {
    return <Navigate to={HOME_BY_ROLE[session.user.role] || '/login'} replace />;
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwError('');
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("New password and confirmation don't match.");
      return;
    }
    setPwBusy(true);
    try {
      await api.changePassword(session.token, pwForm.current_password, pwForm.new_password);
      setStep('questions');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwBusy(false);
    }
  }

  function setSlot(index, patch) {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
  }

  function optionsFor(index) {
    const chosenElsewhere = slots.filter((s, i) => i !== index).map(s => s.question);
    return catalog.filter(q => q === slots[index].question || !chosenElsewhere.includes(q));
  }

  async function handleQuestionsSubmit(e) {
    e.preventDefault();
    setQError('');
    if (slots.some(s => !s.question || !s.answer.trim())) {
      setQError('Every question needs a selection and an answer.');
      return;
    }
    setQBusy(true);
    try {
      await api.setMySecurityQuestions(session.token, slots);
      updateUser({ must_complete_setup: false });
      setStep('done');
      navigate(HOME_BY_ROLE[session.user.role] || '/login', { replace: true });
    } catch (err) {
      setQError(err.message);
    } finally {
      setQBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 440 }}>
        <h1>Finish Setting Up Your Account</h1>
        <p className="subtitle">
          {step === 'password'
            ? 'First, choose a new password to replace the temporary one.'
            : 'Now set up security questions — you\'ll use these later if you ever forget your password.'}
        </p>

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            {pwError && <div className="error-banner">{pwError}</div>}
            <label>Temporary/Current Password</label>
            <input
              type="password" required value={pwForm.current_password}
              onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
              style={{ width: '100%', marginBottom: 12 }}
            />
            <label>New Password</label>
            <input
              type="password" required minLength={8} value={pwForm.new_password}
              onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
              style={{ width: '100%', marginBottom: 12 }}
            />
            <label>Confirm New Password</label>
            <input
              type="password" required minLength={8} value={pwForm.confirm}
              onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
              style={{ width: '100%', marginBottom: 14 }}
            />
            <button type="submit" disabled={pwBusy} style={{ width: '100%' }}>
              {pwBusy ? 'Saving…' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'questions' && (
          <form onSubmit={handleQuestionsSubmit}>
            {qError && <div className="error-banner">{qError}</div>}
            {!catalog ? (
              <div className="empty-state">Loading…</div>
            ) : (
              slots.map((slot, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <label>Security Question {i + 1}</label>
                  <select
                    required
                    value={slot.question}
                    onChange={e => setSlot(i, { question: e.target.value })}
                    style={{ width: '100%', marginBottom: 6 }}
                  >
                    <option value="" disabled>Choose a question…</option>
                    {optionsFor(i).map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <input
                    placeholder="Your answer"
                    required
                    value={slot.answer}
                    onChange={e => setSlot(i, { answer: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              ))
            )}
            <button type="submit" disabled={qBusy || !catalog} style={{ width: '100%' }}>
              {qBusy ? 'Saving…' : 'Finish Setup'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

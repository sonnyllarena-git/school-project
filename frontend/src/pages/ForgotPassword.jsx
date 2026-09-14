import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import Footer from '../components/Footer';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // email -> questions -> reset -> done
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [challengeToken, setChallengeToken] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.forgotPasswordStart(email.trim());
      setChallengeToken(res.challenge_token);
      setQuestions(res.questions);
      setAnswers(Object.fromEntries(res.questions.map(q => [q, ''])));
      setStep('questions');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAnswersSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.forgotPasswordVerify(
        challengeToken,
        questions.map(q => ({ question: q, answer: answers[q] }))
      );
      setResetToken(res.reset_token);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    setBusy(true);
    try {
      await api.forgotPasswordReset(resetToken, newPassword);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Forgot Password</h1>

        {step === 'email' && (
          <>
            <p className="subtitle">Enter your account email to answer your security questions.</p>
            <form onSubmit={handleEmailSubmit}>
              {error && <div className="error-banner">{error}</div>}
              <label>Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@stmichaels.ph" style={{ width: '100%', marginBottom: 14 }}
              />
              <button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Checking…' : 'Continue'}</button>
            </form>
          </>
        )}

        {step === 'questions' && (
          <>
            <p className="subtitle">Answer all of your security questions.</p>
            <form onSubmit={handleAnswersSubmit}>
              {error && <div className="error-banner">{error}</div>}
              {questions.map(q => (
                <div key={q} style={{ marginBottom: 12 }}>
                  <label>{q}</label>
                  <input
                    required value={answers[q]}
                    onChange={e => setAnswers({ ...answers, [q]: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
              <button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Verifying…' : 'Verify'}</button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <p className="subtitle">Verified — choose a new password.</p>
            <form onSubmit={handleResetSubmit}>
              {error && <div className="error-banner">{error}</div>}
              <label>New Password</label>
              <input
                type="password" required minLength={8} value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: '100%', marginBottom: 12 }}
              />
              <label>Confirm New Password</label>
              <input
                type="password" required minLength={8} value={confirm}
                onChange={e => setConfirm(e.target.value)}
                style={{ width: '100%', marginBottom: 14 }}
              />
              <button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Saving…' : 'Reset Password'}</button>
            </form>
          </>
        )}

        {step === 'done' && (
          <div className="error-banner" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
            Password reset. You can now <Link to="/login">log in</Link> with your new password.
          </div>
        )}

        {step !== 'done' && (
          <div className="demo-creds">
            <Link to="/login">&larr; Back to login</Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

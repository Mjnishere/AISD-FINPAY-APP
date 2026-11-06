import { useState } from 'react';
import { Wallet, Gift, ShieldCheck, Zap } from 'lucide-react';
import { setToken } from '../api.js';

const STUDENTS = [
  { id: 'student-rahul', name: 'Rahul Sharma', tier: 'Basic', note: 'Canteen regular' },
  { id: 'student-priya', name: 'Priya Rao', tier: 'Prime', note: 'Stationery and cafés' },
  { id: 'student-aman', name: 'Aman Das', tier: 'Premium', note: 'Rides and online store' }
];

export default function Login({ onLogin }) {
  const [student, setStudent] = useState('student-rahul');
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/dev/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: student, role: admin ? 'ADMIN' : 'STUDENT' }) });
      const data = await res.json();
      if (!data.token) throw new Error(data.error || 'Could not sign in');
      setToken(data.token); onLogin();
    } catch (err) {
      setError(err instanceof TypeError ? 'Cannot reach the FinPay server. Make sure the backend is running on port 4000.' : err.message);
    } finally { setBusy(false); }
  }

  return (
    <main className="login">
      <section className="login-hero">
        <div className="brand"><span className="brand-mark"><Wallet size={20} /></span>FinPay</div>
        <h1>Pay for campus life.<br />Get a little back every time.</h1>
        <ul className="pitch">
          <li><Gift size={18} /><span><b>Cashback on every meal, ride and print-out</b>Up to 2% back, with your tier boosting the rate.</span></li>
          <li><Zap size={18} /><span><b>Tap, confirm, done</b>Pay canteens, shuttles, hostel dues and the campus store.</span></li>
          <li><ShieldCheck size={18} /><span><b>Safe by design</b>Duplicate-proof payments and daily spending limits.</span></li>
        </ul>
      </section>
      <section className="login-card">
        <h2>Sign in to your wallet</h2>
        <p className="muted">Demo mode: pick a student to continue. In production, FinPay uses your campus (TalentHub) sign-in.</p>
        <form onSubmit={submit}>
          <div className="student-list" role="radiogroup" aria-label="Demo student">
            {STUDENTS.map(s => (
              <label key={s.id} className={`student ${student === s.id ? 'on' : ''}`}>
                <input type="radio" name="student" value={s.id} checked={student === s.id} onChange={() => setStudent(s.id)} />
                <span className="avatar">{s.name.split(' ').map(x => x[0]).join('')}</span>
                <span><b>{s.name}</b><small>{s.note}</small></span>
                <em className={`tier-chip ${s.tier.toLowerCase()}`}>{s.tier}</em>
              </label>
            ))}
          </div>
          <label className="check-row"><input type="checkbox" checked={admin} onChange={e => setAdmin(e.target.checked)} /> Sign in as finance admin (unlocks reconciliation)</label>
          <button className="btn primary wide" disabled={busy}>{busy ? 'Signing in…' : 'Open wallet'}</button>
        </form>
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}

import React, { useState } from 'react';
import { Lock, User, Hammer, ShieldCheck, ArrowRight } from 'lucide-react';
import './login.css';

const API = '/api';

// Each tab is just a UI convenience — the actual role (and what dashboard opens)
// always comes from the account itself, decided by the server, never guessed client-side.
const ROLE_TABS = [
  { id: 'customer', label: 'Customer', icon: User, blurb: 'Track your project\'s progress.' },
  { id: 'staff', label: 'Employee', icon: Hammer, blurb: 'Staff login for day-to-day site work.' },
  { id: 'owner', label: 'Owner / Admin', icon: ShieldCheck, blurb: 'Full access — rates, staff, everything.' },
];

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('customer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const tab = ROLE_TABS.find((t) => t.id === activeTab);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error(body?.message || 'Invalid username or password');

      sessionStorage.setItem('psk_auth', JSON.stringify(body));
      // Where we land depends on the account's real role, not the tab clicked —
      // an owner/admin account works from any tab, a customer account only reaches the portal.
      window.location.href = body.role === 'CUSTOMER' ? '/portal' : '/admin';
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="loginPage">
      <div className="loginShade" />
      <div className="loginCard">
        <a href="/" className="loginBrand">
          <img src="/logo-icon.png" alt="" className="loginBrandIcon" />
          <span>PSK <b>Brothers</b></span>
        </a>
        <div className="loginTabs">
          {ROLE_TABS.map((t) => (
            <button key={t.id} type="button" className={'loginTab' + (activeTab === t.id ? ' active' : '')} onClick={() => { setActiveTab(t.id); setError(''); }}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
        <div className="loginIcon"><Lock size={22} /></div>
        <h2>{tab.label} Login</h2>
        <p>{tab.blurb}</p>
        <form onSubmit={submit}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <div className="adminError">{error}</div>}
          <button className="primary" disabled={busy}>{busy ? 'Checking...' : 'Login'} <ArrowRight size={16} /></button>
        </form>
        <a href="/" className="loginBack">← Back to site</a>
      </div>
    </div>
  );
}

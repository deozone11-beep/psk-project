import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { API, api } from './api';

export default function RateTab({ creds }) {
  const [rate, setRate] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/settings`).then((r) => r.json()).then((s) => setRate(s.ratePerSqft ?? '')).catch(console.error);
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api('/admin/settings', creds, { method: 'PUT', body: JSON.stringify({ ratePerSqft: Number(rate) }) });
      setMsg('Rate updated ✓');
    } catch (err) { setMsg(err.message); } finally { setSaving(false); }
  }

  return (
    <section className="adminCard">
      <h3>Construction Rate</h3>
      <p className="adminHint">This is the ₹/sqft used across the website's cost calculator and every customer's estimate.</p>
      <form onSubmit={save} className="rateForm">
        <span>₹</span>
        <input type="number" min="1" value={rate} onChange={(e) => setRate(e.target.value)} required />
        <span>/ sqft</span>
        <button className="primary" disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save'}</button>
      </form>
      {msg && <p className="adminHint">{msg}</p>}
    </section>
  );
}

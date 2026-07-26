import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { API, api } from './api';

export default function RateTab({ creds }) {
  const [rate, setRate] = useState('');
  const [otherRate, setOtherRate] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((s) => {
        setRate(s.ratePerSqft ?? '');
        setOtherRate(s.otherBuilderRatePerSqft ?? '');
      })
      .catch(console.error);
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api('/admin/settings', creds, {
        method: 'PUT',
        body: JSON.stringify({
          ratePerSqft: Number(rate),
          otherBuilderRatePerSqft: Number(otherRate)
        })
      });
      setMsg('Rates updated successfully ✓');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="adminCard">
      <h3>Cost Calculator Rates</h3>
      <p className="adminHint" style={{ marginBottom: '24px' }}>
        Configure the standard construction rates used across the website's cost calculator.
      </p>
      
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
          <label style={{ fontWeight: '600', fontSize: '0.88rem', color: '#17201d' }}>
            PSK Brothers Rate
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>₹</span>
            <input
              type="number"
              min="1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
              style={{
                padding: '10px 12px',
                border: '1px solid #d8dcda',
                borderRadius: '6px',
                flex: 1,
                fontSize: '0.9rem'
              }}
            />
            <span>/ sqft</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
          <label style={{ fontWeight: '600', fontSize: '0.88rem', color: '#17201d' }}>
            Other Builders Rate (Typical Market Rate)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>₹</span>
            <input
              type="number"
              min="1"
              value={otherRate}
              onChange={(e) => setOtherRate(e.target.value)}
              required
              style={{
                padding: '10px 12px',
                border: '1px solid #d8dcda',
                borderRadius: '6px',
                flex: 1,
                fontSize: '0.9rem'
              }}
            />
            <span>/ sqft</span>
          </div>
        </div>

        <button
          className="primary"
          disabled={saving}
          style={{
            alignSelf: 'flex-start',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          <Save size={15} /> {saving ? 'Saving...' : 'Save Rates'}
        </button>
      </form>
      
      {msg && (
        <p
          className="adminHint"
          style={{
            marginTop: '16px',
            color: msg.includes('successfully') ? '#2ea86f' : '#e2262b',
            fontWeight: '600'
          }}
        >
          {msg}
        </p>
      )}
    </section>
  );
}

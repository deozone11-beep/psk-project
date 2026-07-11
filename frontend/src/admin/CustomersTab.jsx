import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from './api';

export default function CustomersTab({ creds }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', phone: '', projectName: '', estimatedSqft: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);
  function load() { api('/admin/customers', creds).then(setList).catch(console.error); }

  async function add(e) {
    e.preventDefault();
    try {
      await api('/admin/customers', creds, { method: 'POST', body: JSON.stringify({ ...form, estimatedSqft: Number(form.estimatedSqft) || null }) });
      setForm({ username: '', password: '', displayName: '', phone: '', projectName: '', estimatedSqft: '' });
      setMsg('Customer login created ✓');
      load();
    } catch (err) { setMsg(err.message); }
  }
  async function del(id) {
    if (!confirm('Remove this customer account? They will lose portal access.')) return;
    try { await api(`/admin/customers/${id}`, creds, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  }

  return (
    <section className="adminCard">
      <h3>Customer Logins ({list.length})</h3>
      <p className="adminHint">Create a login for each client so they can track their project at <code>/portal</code>.</p>
      <form onSubmit={add} className="inlineForm wrap2">
        <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <input placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input placeholder="Customer name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Project name" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
        <input type="number" placeholder="Estimated sqft" value={form.estimatedSqft} onChange={(e) => setForm({ ...form, estimatedSqft: e.target.value })} />
        <button className="primary"><Plus size={15} /> Create Login</button>
      </form>
      {msg && <p className="adminHint">{msg}</p>}
      <div className="tableList">
        {list.map((c) => (
          <div className="tableRow" key={c.id}>
            <div><b>{c.displayName}</b><span className="tableSub">@{c.username} · {c.projectName || 'no project set'} · {c.estimatedSqft ? `${c.estimatedSqft} sqft` : ''}</span></div>
            <button className="deleteBtn" onClick={() => del(c.id)}><Trash2 size={15} /></button>
          </div>
        ))}
        {list.length === 0 && <p className="adminHint">No customer accounts yet.</p>}
      </div>
    </section>
  );
}

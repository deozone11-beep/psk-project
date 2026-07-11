import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from './api';

export default function EmployeesTab({ creds }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', role: '', phone: '', dailyWage: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);
  function load() { api('/admin/employees', creds).then(setList).catch(console.error); }

  async function add(e) {
    e.preventDefault();
    try {
      await api('/admin/employees', creds, { method: 'POST', body: JSON.stringify({ ...form, dailyWage: Number(form.dailyWage), active: true }) });
      setForm({ name: '', role: '', phone: '', dailyWage: '' });
      setMsg('Employee added ✓');
      load();
    } catch (err) { setMsg(err.message); }
  }
  async function del(id) {
    if (!confirm('Remove this employee?')) return;
    try { await api(`/admin/employees/${id}`, creds, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  }

  return (
    <section className="adminCard">
      <h3>Employees &amp; Labour ({list.length})</h3>
      <form onSubmit={add} className="inlineForm">
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Role (Mason, Electrician...)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input type="number" placeholder="Daily wage ₹" value={form.dailyWage} onChange={(e) => setForm({ ...form, dailyWage: e.target.value })} required />
        <button className="primary"><Plus size={15} /> Add</button>
      </form>
      {msg && <p className="adminHint">{msg}</p>}
      <div className="tableList">
        {list.map((e) => (
          <div className="tableRow" key={e.id}>
            <div><b>{e.name}</b><span className="tableSub">{e.role || '—'} · {e.phone || 'no phone'}</span></div>
            <div className="tableAmt">₹{e.dailyWage}/day</div>
            <button className="deleteBtn" onClick={() => del(e.id)}><Trash2 size={15} /></button>
          </div>
        ))}
        {list.length === 0 && <p className="adminHint">No employees added yet.</p>}
      </div>
    </section>
  );
}

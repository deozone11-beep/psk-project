import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from './api';

export default function PaymentsTab({ creds }) {
  const [employees, setEmployees] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ employeeId: '', date: new Date().toLocaleDateString('en-CA'), amount: '', notes: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/admin/employees', creds).then(setEmployees).catch(console.error);
    load();
  }, []);
  function load() { api('/admin/payments', creds).then(setList).catch(console.error); }

  async function pay(e) {
    e.preventDefault();
    if (!form.employeeId) { setMsg('Select an employee first'); return; }
    try {
      await api('/admin/payments', creds, { method: 'POST', body: JSON.stringify({ ...form, employeeId: Number(form.employeeId), amount: Number(form.amount) }) });
      setMsg('Payment recorded ✓');
      load();
    } catch (err) { setMsg(err.message); }
  }
  async function del(id) {
    try { await api(`/admin/payments/${id}`, creds, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  }
  function empName(id) { return employees.find((e) => e.id === id)?.name || `#${id}`; }

  return (
    <section className="adminCard">
      <h3>Payments</h3>
      <form onSubmit={pay} className="inlineForm">
        <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
          <option value="">Select employee</option>
          {employees.filter(e => e.active !== false).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <input type="number" placeholder="Amount ₹" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="primary"><Plus size={15} /> Record</button>
      </form>
      {msg && <p className="adminHint">{msg}</p>}
      <div className="tableList">
        {list.map((p) => (
          <div className="tableRow" key={p.id}>
            <div><b>{empName(p.employee.id)}</b><span className="tableSub">{p.date} {p.notes ? `· ${p.notes}` : ''}</span></div>
            <div className="tableAmt">₹{p.amount}</div>
            <button className="deleteBtn" onClick={() => del(p.id)}><Trash2 size={15} /></button>
          </div>
        ))}
        {list.length === 0 && <p className="adminHint">No payments recorded yet.</p>}
      </div>
    </section>
  );
}

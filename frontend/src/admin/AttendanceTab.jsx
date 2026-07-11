import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from './api';

export default function AttendanceTab({ creds }) {
  const [employees, setEmployees] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ employeeId: '', date: new Date().toISOString().slice(0, 10), present: true, hoursWorked: 8, notes: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/admin/employees', creds).then(setEmployees).catch(console.error);
    load();
  }, []);
  function load() { api('/admin/attendance', creds).then(setList).catch(console.error); }

  async function mark(e) {
    e.preventDefault();
    if (!form.employeeId) { setMsg('Select an employee first'); return; }
    try {
      await api('/admin/attendance', creds, { method: 'POST', body: JSON.stringify({ ...form, employeeId: Number(form.employeeId), hoursWorked: Number(form.hoursWorked) }) });
      setMsg('Attendance marked ✓');
      load();
    } catch (err) { setMsg(err.message); }
  }
  async function del(id) {
    try { await api(`/admin/attendance/${id}`, creds, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  }
  function empName(id) { return employees.find((e) => e.id === id)?.name || `#${id}`; }

  return (
    <section className="adminCard">
      <h3>Attendance</h3>
      <form onSubmit={mark} className="inlineForm">
        <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
          <option value="">Select employee</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <select value={form.present} onChange={(e) => setForm({ ...form, present: e.target.value === 'true' })}>
          <option value="true">Present</option>
          <option value="false">Absent</option>
        </select>
        <input type="number" step="0.5" placeholder="Hours" value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} />
        <button className="primary"><Plus size={15} /> Mark</button>
      </form>
      {msg && <p className="adminHint">{msg}</p>}
      <div className="tableList">
        {list.map((a) => (
          <div className="tableRow" key={a.id}>
            <div><b>{empName(a.employee.id)}</b><span className="tableSub">{a.date} · {a.present ? 'Present' : 'Absent'} {a.present ? `· ${a.hoursWorked ?? 0}h` : ''}</span></div>
            <button className="deleteBtn" onClick={() => del(a.id)}><Trash2 size={15} /></button>
          </div>
        ))}
        {list.length === 0 && <p className="adminHint">No attendance records yet.</p>}
      </div>
    </section>
  );
}

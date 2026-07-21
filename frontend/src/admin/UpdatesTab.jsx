import React, { useEffect, useState } from 'react';
import { Upload, Plus, Trash2, Users, UserCheck, Check } from 'lucide-react';
import { api, API } from './api';

export default function UpdatesTab({ creds }) {
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [list, setList] = useState([]);
  
  const defaultEngineer = creds?.displayName || creds?.username || 'Site Engineer';
  const [form, setForm] = useState({ 
    customerId: '', 
    title: '', 
    description: '', 
    workDate: new Date().toLocaleDateString('en-CA'), 
    engineerName: defaultEngineer, 
    workerNames: '' 
  });
  
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api('/admin/customers', creds).then(setCustomers).catch(console.error);
    api('/admin/employees', creds).then(setEmployees).catch(console.error);
    api('/admin/attendance', creds).then(setAttendanceList).catch(console.error);
    load();
  }, []);

  function load() { 
    api('/admin/updates', creds).then(setList).catch(console.error); 
  }

  // When workDate or attendanceList updates, auto-select workers marked present on that date
  useEffect(() => {
    if (!form.workDate || !attendanceList.length) return;
    const presentRecords = attendanceList.filter(a => a.date === form.workDate && a.present);
    if (presentRecords.length > 0 && selectedWorkers.length === 0) {
      const presentNames = presentRecords.map(a => `${a.employee?.name || ''}${a.employee?.designation ? ` (${a.employee.designation})` : ''}`).filter(Boolean);
      if (presentNames.length > 0) {
        setSelectedWorkers(presentNames);
        setForm(prev => ({ ...prev, workerNames: presentNames.join(', ') }));
      }
    }
  }, [form.workDate, attendanceList]);

  function toggleWorker(emp) {
    const fullName = `${emp.name}${emp.designation ? ` (${emp.designation})` : ''}`;
    let updated;
    if (selectedWorkers.includes(fullName)) {
      updated = selectedWorkers.filter(w => w !== fullName);
    } else {
      updated = [...selectedWorkers, fullName];
    }
    setSelectedWorkers(updated);
    setForm(prev => ({ ...prev, workerNames: updated.join(', ') }));
  }

  async function post(e) {
    e.preventDefault();
    if (!form.customerId) { setMsg('Select a customer first'); return; }
    setUploading(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('customerId', form.customerId);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('workDate', form.workDate);
      if (form.engineerName) fd.append('engineerName', form.engineerName);
      
      const finalWorkerNames = selectedWorkers.length > 0 ? selectedWorkers.join(', ') : form.workerNames;
      if (finalWorkerNames) fd.append('workerNames', finalWorkerNames);

      if (files && files.length > 0) {
        files.forEach((f) => fd.append('photos', f));
      }
      
      const r = await fetch(`${API}/admin/updates`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + creds.token },
        body: fd
      });
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.message || 'Update failed');
      }

      // Auto-mark attendance for selected workers if not already present on that date
      if (selectedWorkers.length > 0 && form.customerId) {
        const custObj = customers.find(c => String(c.id) === String(form.customerId));
        const siteName = custObj ? (custObj.projectName || custObj.displayName) : 'Site Project';
        
        for (const workerNameStr of selectedWorkers) {
          const empMatch = employees.find(emp => workerNameStr.startsWith(emp.name));
          if (empMatch) {
            const hasAtt = attendanceList.some(a => a.employee?.id === empMatch.id && a.date === form.workDate);
            if (!hasAtt) {
              fetch(`${API}/admin/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + creds.token },
                body: JSON.stringify({
                  employeeId: empMatch.id,
                  date: form.workDate,
                  present: true,
                  hoursWorked: 8,
                  dailyRate: empMatch.dailyWage || 0,
                  siteName: siteName,
                  notes: 'Auto-marked via Site Progress Update'
                })
              }).catch(console.error);
            }
          }
        }
      }

      setForm({ 
        customerId: '', 
        title: '', 
        description: '', 
        workDate: new Date().toLocaleDateString('en-CA'),
        engineerName: defaultEngineer, 
        workerNames: '' 
      });
      setSelectedWorkers([]);
      setFiles([]);
      setMsg('Update posted ✓ — Attendance synced automatically.');
      load();
    } catch (err) { setMsg(err.message); } finally { setUploading(false); }
  }

  async function del(id) {
    if (!confirm('Delete this site update?')) return;
    try { await api(`/admin/updates/${id}`, creds, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  }

  function custName(id) { return customers.find((c) => c.id === id)?.displayName || `#${id}`; }

  return (
    <section className="adminCard">
      <h3>Site Progress Updates</h3>
      <p className="adminHint">Post site progress with assigned engineer and present worker team. Workers selected will automatically sync attendance for that site.</p>
      
      <form onSubmit={post} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          
          {/* Customer Selection */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Select Customer / Project *</label>
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="">Choose customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName} ({c.projectName || 'Site'})</option>)}
            </select>
          </div>

          {/* Work Date */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Work Date *</label>
            <input type="date" value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Update Title *</label>
            <input placeholder="e.g. Roof slab casting" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>

          {/* Site Engineer In-Charge */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Site Engineer In-Charge</label>
            <input 
              placeholder="e.g. Er. Dinesh Kumar" 
              value={form.engineerName} 
              onChange={(e) => setForm({ ...form, engineerName: e.target.value })} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {/* Notes / Description */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Notes / Progress Details</label>
            <input placeholder="Optional progress details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>

          {/* Photos Upload */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Site Progress Photos</label>
            <label className="fileInput" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#fff', justifyContent: 'center', cursor: 'pointer' }}>
              <Upload size={16} /> {files.length > 0 ? `${files.length} photo(s) chosen` : 'Choose photos'}
              <input type="file" accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files))} multiple hidden />
            </label>
          </div>
        </div>

        {/* Multi-Select Worker Team Selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={15} style={{ color: '#e2262b' }} />
              On-Site Labor Workers ({selectedWorkers.length} selected)
            </label>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              💡 Present workers on {form.workDate} are highlighted green
            </span>
          </div>

          {/* Worker Chips selection */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', maxHeight: '140px', overflowY: 'auto' }}>
            {employees.length === 0 ? (
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No employees added in system yet.</span>
            ) : (
              employees.map(emp => {
                const fullName = `${emp.name}${emp.designation ? ` (${emp.designation})` : ''}`;
                const isSelected = selectedWorkers.includes(fullName);
                const isAttPresent = attendanceList.some(a => a.employee?.id === emp.id && a.date === form.workDate && a.present);

                return (
                  <button
                    type="button"
                    key={emp.id}
                    onClick={() => toggleWorker(emp)}
                    style={{
                      background: isSelected ? '#e2262b' : (isAttPresent ? '#f0fdf4' : '#f1f5f9'),
                      color: isSelected ? '#ffffff' : (isAttPresent ? '#15803d' : '#334155'),
                      border: isAttPresent && !isSelected ? '1px solid #86efac' : '1px solid transparent',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.76rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s'
                    }}
                  >
                    {isSelected ? <Check size={12} /> : (isAttPresent ? <UserCheck size={12} /> : null)}
                    {emp.name} {emp.designation && <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>({emp.designation})</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button className="primary" disabled={uploading} style={{ padding: '10px 24px', fontSize: '0.88rem', borderRadius: '8px' }}>
            <Plus size={16} /> {uploading ? 'Posting Update & Syncing Attendance...' : 'Post Site Progress Update'}
          </button>
        </div>
      </form>

      {msg && <p className="adminHint" style={{ color: msg.includes('✓') ? 'green' : '#e2262b', marginTop: '12px' }}>{msg}</p>}

      <div className="updateGrid" style={{ marginTop: '24px' }}>
        {list.map((u) => {
          const imgs = u.photoUrl ? u.photoUrl.split('|||') : [];
          const thumb = imgs.length > 0 ? imgs[0] : null;
          return (
            <div className="updateCard" key={u.id}>
              {thumb && <img src={thumb} alt={u.title} />}
              {imgs.length > 1 && (
                <span className="calcBadge" style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(226,38,43,0.9)', color: '#fff', fontSize: '0.65rem', padding: '3px 8px', borderRadius: '10px' }}>
                  +{imgs.length - 1} more
                </span>
              )}
              <div className="updateCardBody">
                <b>{u.title}</b>
                <span className="tableSub">{custName(u.customer.id)} · {u.workDate}</span>
                {u.description && <p>{u.description}</p>}
                {u.engineerName && <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#0284c7', fontWeight: '700' }}>👷 {u.engineerName}</p>}
                {u.workerNames && (
                  <div style={{ margin: '4px 0 0', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {u.workerNames.split(',').map((w, idx) => (
                      <span key={idx} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', color: '#334155', fontWeight: '600' }}>
                        👥 {w.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button className="deleteBtn" onClick={() => del(u.id)} style={{ zIndex: 5 }}><Trash2 size={15} /></button>
            </div>
          );
        })}
        {list.length === 0 && <p className="adminHint">No updates posted yet.</p>}
      </div>
    </section>
  );
}

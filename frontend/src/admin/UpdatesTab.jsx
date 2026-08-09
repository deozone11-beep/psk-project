import React, { useEffect, useState } from 'react';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Users, 
  UserCheck, 
  Check, 
  Calendar as CalendarIcon, 
  HardHat, 
  Building2, 
  Layers, 
  CheckCircle2, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { api, API } from './api';

export default function UpdatesTab({ creds }) {
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [list, setList] = useState([]);
  
  const defaultEngineer = creds?.displayName || creds?.username || 'Admin / Staff';
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
    if (!form.customerId) { setMsg('Select a customer / project first'); return; }
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
      setMsg('Site update posted successfully ✓ — Worker attendance synced automatically.');
      load();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) { setMsg(err.message); } finally { setUploading(false); }
  }

  async function del(id) {
    if (!confirm('Delete this site progress update log?')) return;
    try { await api(`/admin/updates/${id}`, creds, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  }

  function custName(id) { return customers.find((c) => c.id === id)?.displayName || `#${id}`; }
  function projName(id) { return customers.find((c) => c.id === id)?.projectName || 'Site Project'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top KPI Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div className="adminCard" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(226, 38, 43, 0.15)', color: '#ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Site Logs</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', margin: '2px 0' }}>{list.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Auto-Attendance Synced
            </div>
          </div>
        </div>

        <div className="adminCard" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Job Sites</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', margin: '2px 0' }}>{customers.filter(c => c.projectName).length}</div>
            <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: '600' }}>Active Construction Projects</div>
          </div>
        </div>

        <div className="adminCard" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardHat size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Staff &amp; Labor</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', margin: '2px 0' }}>{employees.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: '600' }}>Registered On-Site Workforce</div>
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: '900', color: '#ffffff' }}>Post Site Progress Update</h3>
        <p className="adminHint" style={{ marginBottom: '20px', color: '#94a3b8' }}>Post site progress with assigned engineer and present worker team. Workers selected will automatically sync attendance for that site.</p>

        {msg && (
          <div style={{ padding: '10px 16px', borderRadius: '10px', background: msg.includes('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: msg.includes('✓') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', color: msg.includes('✓') ? '#34d399' : '#f87171', fontWeight: '700', fontSize: '0.85rem', marginBottom: '16px' }}>
            {msg}
          </div>
        )}

        <form onSubmit={post} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(15, 23, 42, 0.75)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
            
            {/* Customer Selection */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Select Customer / Job Site *</label>
              <select 
                value={form.customerId} 
                onChange={(e) => setForm({ ...form, customerId: e.target.value })} 
                required 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(15, 23, 42, 0.9)', color: '#ffffff', fontSize: '0.88rem' }}
              >
                <option value="" style={{ background: '#0f172a' }}>Choose customer site...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                    {c.displayName} — {c.projectName || 'Site Project'} ({c.estimatedSqft ? `${c.estimatedSqft} sqft` : 'No Sqft'})
                  </option>
                ))}
              </select>
            </div>

            {/* Work Date */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Work Date *</label>
              <input 
                type="date" 
                value={form.workDate} 
                onChange={(e) => setForm({ ...form, workDate: e.target.value })} 
                required 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem' }} 
              />
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Update Title *</label>
              <input 
                placeholder="e.g. Ground Floor Column Casting Complete" 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
                required 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem' }} 
              />
            </div>

            {/* Site Engineer In-Charge */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Site Engineer In-Charge</label>
              <input 
                placeholder="e.g. Er. Dinesh Kumar" 
                value={form.engineerName} 
                onChange={(e) => setForm({ ...form, engineerName: e.target.value })} 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem' }} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Notes / Description */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Progress Details / Site Notes</label>
              <textarea 
                placeholder="Detailed site progress description, material status, structural milestones..." 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                rows={2}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical' }} 
              />
            </div>

            {/* Photos Upload */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Site Progress Photos (Multiple)</label>
              <label 
                style={{ 
                  width: '100%', 
                  height: '62px',
                  padding: '10px 16px', 
                  borderRadius: '10px', 
                  border: '1.5px dashed rgba(255, 255, 255, 0.25)', 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  color: '#ffffff', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  transition: 'all 0.2s'
                }}
              >
                <ImageIcon size={18} style={{ color: '#60a5fa' }} /> 
                {files.length > 0 ? `${files.length} Photo(s) Selected` : 'Click to Upload Site Photos'}
                <input type="file" accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files))} multiple hidden />
              </label>
            </div>
          </div>

          {/* Multi-Select Worker Team Selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} style={{ color: '#ff6b6b' }} />
                On-Site Labor Workforce ({selectedWorkers.length} selected)
              </label>
              <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> Present workers on {form.workDate} highlighted green
              </span>
            </div>

            {/* Worker Chips selection */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'rgba(15, 23, 42, 0.9)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)', maxHeight: '150px', overflowY: 'auto' }}>
              {employees.length === 0 ? (
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No workers registered in system yet. Add employees in Employees tab.</span>
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
                        background: isSelected ? '#e2262b' : (isAttPresent ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)'),
                        color: isSelected ? '#ffffff' : (isAttPresent ? '#34d399' : '#e2e8f0'),
                        border: isSelected ? '1px solid #e2262b' : (isAttPresent ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)'),
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 4px 12px rgba(226, 38, 43, 0.35)' : 'none'
                      }}
                    >
                      {isSelected ? <Check size={13} /> : (isAttPresent ? <UserCheck size={13} /> : null)}
                      {emp.name} {emp.designation && <span style={{ opacity: 0.85, fontSize: '0.7rem', fontWeight: '600' }}>({emp.designation})</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button 
              className="primary" 
              disabled={uploading} 
              style={{ 
                padding: '12px 28px', 
                fontSize: '0.9rem', 
                borderRadius: '10px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)',
                boxShadow: '0 4px 14px rgba(226, 38, 43, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} /> {uploading ? 'Posting Update & Syncing Attendance...' : 'Post Site Progress Update'}
            </button>
          </div>
        </form>

        {/* Posted Updates Grid */}
        <h4 style={{ margin: '30px 0 16px', fontSize: '1.15rem', color: '#ffffff', fontWeight: '900' }}>Posted Progress Updates ({list.length})</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
          {list.map((u) => {
            const imgs = u.photoUrl ? u.photoUrl.split('|||') : [];
            const thumb = imgs.length > 0 ? imgs[0] : null;
            return (
              <div 
                className="updateCard" 
                key={u.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                }}
              >
                {thumb && (
                  <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden' }}>
                    <img src={thumb} alt={u.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {imgs.length > 1 && (
                      <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(15, 23, 42, 0.85)', color: '#ffffff', fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)' }}>
                        +{imgs.length - 1} photos
                      </span>
                    )}
                  </div>
                )}

                <button 
                  className="deleteBtn" 
                  onClick={() => del(u.id)} 
                  title="Remove Progress Update"
                >
                  <Trash2 size={15} />
                </button>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.08rem', fontWeight: '800', lineHeight: 1.3 }}>{u.title}</h4>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      <span style={{ background: 'rgba(239, 68, 68, 0.18)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800' }}>
                        🏢 {custName(u.customer.id)} — {projName(u.customer.id)}
                      </span>
                      <span style={{ background: 'rgba(59, 130, 246, 0.18)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={12} /> {u.workDate}
                      </span>
                    </div>
                  </div>

                  {u.description && (
                    <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.5' }}>
                      {u.description}
                    </p>
                  )}

                  {u.engineerName && (
                    <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#38bdf8', fontWeight: '800', alignSelf: 'flex-start' }}>
                      👷 {u.engineerName} (Site Engineer)
                    </div>
                  )}

                  {u.workerNames && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>On-Site Labor Team:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {u.workerNames.split(',').map((w, idx) => (
                          <span key={idx} style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', color: '#e2e8f0', fontWeight: '700' }}>
                            👥 {w.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>No site progress updates posted yet. Use the form above to post your first site update!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

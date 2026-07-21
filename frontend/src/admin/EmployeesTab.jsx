import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Shield, User, Lock, X, Key, Check, Eye, EyeOff } from 'lucide-react';
import { api } from './api';

const COMMON_ROLES = [
  'Mason',
  'Helper / Chithal',
  'Carpenter',
  'Steel Fitter / Bar Bender',
  'Plumber',
  'Electrician',
  'Painter',
  'Supervisor',
  'Site Engineer',
  'Other'
];

export default function EmployeesTab({ creds }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null); // null means adding
  const [selectedCommonRole, setSelectedCommonRole] = useState('Mason');
  const [form, setForm] = useState({
    name: '',
    role: 'Mason',
    phone: '',
    dailyWage: '',
    username: '',
    password: '',
    loginRole: 'NONE',
    active: true
  });
  const [msg, setMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    api('/admin/employees', creds)
      .then(setList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  function openAdd() {
    setEditingEmp(null);
    setSelectedCommonRole('Mason');
    setForm({
      name: '',
      role: 'Mason',
      phone: '',
      dailyWage: '',
      username: '',
      password: '',
      loginRole: 'NONE',
      active: true
    });
    setMsg('');
    setShowPassword(false);
    setShowModal(true);
  }

  function openEdit(emp) {
    setEditingEmp(emp);
    const isCommon = COMMON_ROLES.includes(emp.role);
    setSelectedCommonRole(isCommon ? emp.role : 'Other');
    setForm({
      name: emp.name || '',
      role: emp.role || '',
      phone: emp.phone || '',
      dailyWage: emp.dailyWage || '',
      username: emp.username || '',
      password: '',
      loginRole: emp.loginRole || 'NONE',
      active: emp.active !== false
    });
    setMsg('');
    setShowPassword(false);
    setShowModal(true);
  }

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      const payload = {
        ...form,
        role: selectedCommonRole === 'Other' ? form.role : selectedCommonRole,
        dailyWage: Number(form.dailyWage)
      };
      
      if (form.loginRole === 'NONE') {
        payload.username = null;
        payload.password = null;
      }

      if (editingEmp) {
        const res = await api(`/admin/employees/${editingEmp.id}`, creds, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.message) throw new Error(res.message);
        setMsg('Employee updated successfully ✓');
      } else {
        const res = await api('/admin/employees', creds, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.message) throw new Error(res.message);
        setMsg('Employee added successfully ✓');
      }
      
      setTimeout(() => {
        setShowModal(false);
        load();
      }, 1000);
    } catch (err) {
      setMsg(err.message || 'Action failed');
    }
  }

  async function del(id) {
    if (!confirm('Remove this employee? This will also delete their login account if one exists.')) return;
    try {
      await api(`/admin/employees/${id}`, creds, { method: 'DELETE' });
      load();
    } catch (e) {
      console.error(e);
    }
  }

  // Filter display based on user privileges
  const displayList = list.filter(e => {
    if (creds.username === 'owner') {
      // Owner CANNOT see/edit Admin profiles or accounts
      return e.loginRole !== 'ADMIN';
    }
    if (creds.role === 'ENGINEER') {
      // Engineers can manage field workers & site labor team under them
      return e.loginRole !== 'ADMIN';
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '800' }}>Employees &amp; Labour Management</h2>
          <p className="adminHint" style={{ margin: '4px 0 0' }}>Add, update, and manage access control for employees and site engineers.</p>
        </div>
        <button className="primary" onClick={openAdd} style={{ borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <section className="adminCard" style={{ padding: '24px' }}>
        <h3>All Staff &amp; Workers ({displayList.length})</h3>
        {loading ? (
          <p className="adminHint">Loading list...</p>
        ) : displayList.length === 0 ? (
          <p className="adminHint">No employees found. Add one to get started.</p>
        ) : (
          <div className="tableList">
            {displayList.map((e) => (
              <div className="tableRow" key={e.id} style={{ borderLeftColor: e.loginRole !== 'NONE' ? '#e2262b' : '#475569' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <b style={{ fontSize: '0.98rem' }}>{e.name}</b>
                    {e.loginRole === 'ADMIN' && (
                      <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(220, 38, 38, 0.15)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={10} /> ADMIN
                      </span>
                    )}
                    {e.loginRole === 'ENGINEER' && (
                      <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(5, 150, 105, 0.15)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <User size={10} /> ENGINEER
                      </span>
                    )}
                  </div>
                  <div className="tableSub" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                    <span>Role: <b>{e.role || 'Laborer'}</b></span>
                    {e.phone && <span>Phone: <b>{e.phone}</b></span>}
                    {e.username && <span>Username: <b style={{ color: '#0f172a' }}>{e.username}</b></span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div className="tableAmt" style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800' }}>₹{e.dailyWage}/day</div>
                    <span style={{ fontSize: '0.72rem', color: e.active ? '#059669' : '#64748b', fontWeight: '700' }}>
                      ● {e.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="deleteBtn" onClick={() => openEdit(e)} style={{ borderColor: '#cbd5e1', color: '#475569' }}>
                      <Pencil size={14} />
                    </button>
                    <button className="deleteBtn" onClick={() => del(e.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', borderRadius: '20px', padding: '32px' }}>
            <button className="modalClose" onClick={() => setShowModal(false)}><X size={20}/></button>
            
            <div className="modalHeader" style={{ marginBottom: '24px' }}>
              <p className="eyebrow" style={{ justifyContent: 'flex-start' }}>STAFF ACCOUNT</p>
              <h2>{editingEmp ? 'Edit Employee Details' : 'Add New Employee'}</h2>
              <p className="modalDesc">Configure employee profile and custom dashboard login credentials.</p>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Full Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="E.g. Ramesh Kumar"
                    style={{ padding: '11px 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Role/Designation *</label>
                  <select
                    value={selectedCommonRole}
                    onChange={(e) => {
                      setSelectedCommonRole(e.target.value);
                      if (e.target.value !== 'Other') {
                        setForm(prev => ({ ...prev, role: e.target.value }));
                      } else {
                        setForm(prev => ({ ...prev, role: '' }));
                      }
                    }}
                    style={{ padding: '11px 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', background: '#fff' }}
                  >
                    {COMMON_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCommonRole === 'Other' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.2s ease' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Enter Custom Role/Designation *</label>
                  <input
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    required
                    placeholder="E.g. Centering Worker, Welder"
                    style={{ padding: '11px 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="E.g. 9876543210"
                    style={{ padding: '11px 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Daily Wage (₹) *</label>
                  <input
                    type="number"
                    value={form.dailyWage}
                    onChange={(e) => setForm({ ...form, dailyWage: e.target.value })}
                    required
                    placeholder="E.g. 800"
                    style={{ padding: '11px 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="emp-active-chk"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="emp-active-chk" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                  Mark employee as active (available for attendance)
                </label>
              </div>

              <div style={{ borderTop: '1.5px solid #e2e8f0', marginTop: '12px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Dashboard Login Permission</label>
                  <select
                    value={form.loginRole}
                    onChange={(e) => setForm({ ...form, loginRole: e.target.value })}
                    style={{ padding: '11px 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', background: '#fff' }}
                  >
                    <option value="NONE">No Login Access (Field Labor / Subordinate Worker)</option>
                    {creds.role === 'ADMIN' && (
                      <option value="ENGINEER">Site Engineer (Can track attendance, upload progress photos)</option>
                    )}
                    {creds.username === 'admin' && (
                      <option value="ADMIN">Admin / Staff (Full controls — rates, staff, payments)</option>
                    )}
                  </select>
                </div>

                {form.loginRole !== 'NONE' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', animation: 'fadeIn 0.25s ease' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Username *</label>
                      <input
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                        placeholder="Login username"
                        style={{ padding: '11px 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                        {editingEmp ? 'Password (leave blank to keep current)' : 'Password *'}
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          required={!editingEmp}
                          placeholder={editingEmp ? "••••••••" : "Choose password"}
                          style={{ width: '100%', padding: '11px 14px', paddingRight: '40px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0
                          }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {msg && (
                <p style={{ margin: '8px 0 0', fontSize: '0.82rem', fontWeight: '700', color: msg.includes('successfully') ? '#059669' : '#dc2626' }}>
                  {msg}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="stepBack" onClick={() => setShowModal(false)} style={{ borderRadius: '10px', padding: '12px 20px', fontSize: '0.85rem' }}>
                  Cancel
                </button>
                <button className="primary" style={{ borderRadius: '10px', padding: '12px 24px', fontSize: '0.85rem' }}>
                  {editingEmp ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

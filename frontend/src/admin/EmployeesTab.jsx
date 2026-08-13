import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Shield, User, Lock, X, Key, Check, Eye, EyeOff, Search, Users, Wallet, Phone, Briefcase } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

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

  const isAdmin = creds?.role === 'ADMIN' || creds?.username === 'admin';

  async function toggleActiveStatus(emp) {
    if (!isAdmin) return;
    const newActiveState = !(emp.active !== false);
    try {
      const payload = {
        ...emp,
        active: newActiveState
      };
      await api(`/admin/employees/${emp.id}`, creds, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setList(prev => prev.map(item => item.id === emp.id ? { ...item, active: newActiveState } : item));
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  }

  // Filter display based on user privileges
  const displayList = list.filter(e => {
    if (creds.username === 'owner') {
      return e.loginRole !== 'ADMIN';
    }
    if (creds.role === 'ENGINEER') {
      return e.loginRole !== 'ADMIN';
    }
    return true;
  });

  const filteredList = displayList.filter(e => {
    const matchesSearch = 
      (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.role || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.phone || '').includes(search) ||
      (e.username || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterRole === 'ACTIVE') return e.active !== false;
    if (filterRole === 'LOGIN') return e.loginRole && e.loginRole !== 'NONE';
    if (filterRole === 'FIELD') return e.loginRole === 'NONE';

    return true;
  });

  const activeWorkers = displayList.filter(e => e.active !== false).length;
  const totalDailyWage = displayList.reduce((sum, e) => sum + (Number(e.dailyWage) || 0), 0);
  const loginAccounts = displayList.filter(e => e.loginRole && e.loginRole !== 'NONE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header & Add Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: '800', letterSpacing: '-0.3px' }}>
            Employees &amp; Labour Management
          </h2>
          <p className="adminHint" style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
            Add, update, and manage access control for employees and site engineers.
          </p>
        </div>
        <button 
          className="primary" 
          onClick={openAdd} 
          style={{ 
            borderRadius: '12px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer', 
            fontWeight: '800',
            padding: '12px 20px',
            boxShadow: '0 4px 16px rgba(226, 38, 43, 0.4)'
          }}
        >
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* Metrics Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="statCard" style={{ borderLeft: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'rgba(19, 27, 45, 0.8)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#94a3b8' }}>Total Staff &amp; Workers</span>
            <b style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>{displayList.length} Members</b>
            <span style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'none', fontWeight: '700' }}>● {activeWorkers} Currently Active</span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
        </div>

        <div className="statCard" style={{ borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'rgba(19, 27, 45, 0.8)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#94a3b8' }}>Daily Payroll Expenditure</span>
            <b style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>₹{totalDailyWage.toLocaleString('en-IN')} / day</b>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'none' }}>Combined active daily wages</span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={22} />
          </div>
        </div>

        <div className="statCard" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'rgba(19, 27, 45, 0.8)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#94a3b8' }}>Portal Login Accounts</span>
            <b style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>{loginAccounts} Authorized</b>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'none' }}>Engineers &amp; Staff logins</span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} />
          </div>
        </div>
      </div>

      {/* Main Staff Container */}
      <section className="adminCard" style={{ padding: '24px', borderRadius: '20px' }}>
        
        {/* Search & Filter Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search by worker name, role, or phone..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '12px',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Workers' },
              { id: 'ACTIVE', label: 'Active Only' },
              { id: 'LOGIN', label: 'Engineers & Staff' },
              { id: 'FIELD', label: 'Field Labor' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterRole(tab.id)}
                style={{
                  background: filterRole === tab.id ? '#e2262b' : 'rgba(255, 255, 255, 0.06)',
                  border: filterRole === tab.id ? '1px solid #e2262b' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p className="adminHint" style={{ color: '#94a3b8' }}>Loading worker database...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
            <p className="adminHint" style={{ color: '#94a3b8', margin: 0 }}>No employees match the current filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredList.map((e) => (
              <div 
                key={e.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderLeft: `4px solid ${e.loginRole === 'ADMIN' ? '#ef4444' : e.loginRole === 'ENGINEER' ? '#10b981' : '#64748b'}`,
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Header: Avatar, Name, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '1.1rem',
                      boxShadow: '0 4px 12px rgba(226, 38, 43, 0.3)'
                    }}>
                      {(e.name || 'W').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: '800', color: '#ffffff' }}>{e.name}</h4>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Briefcase size={12} /> {e.role || 'Laborer'}
                      </span>
                    </div>
                  </div>

                  <span 
                    onClick={() => isAdmin && toggleActiveStatus(e)}
                    title={isAdmin ? "Click to toggle Active/Inactive" : "Status (Admin Only)"}
                    style={{
                      fontSize: '0.7rem',
                      color: e.active !== false ? '#34d399' : '#94a3b8',
                      background: e.active !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: '800',
                      border: e.active !== false ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: isAdmin ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      userSelect: 'none'
                    }}
                  >
                    ● {e.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Details Section */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                  {e.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                      <Phone size={13} style={{ color: '#94a3b8' }} />
                      <span>Phone: <b style={{ color: '#ffffff' }}>{e.phone}</b></span>
                    </div>
                  )}
                  {e.username && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                      <User size={13} style={{ color: '#60a5fa' }} />
                      <span>Login User: <b style={{ color: '#60a5fa' }}>{e.username}</b></span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                    <Shield size={13} style={{ color: e.loginRole === 'CENSUS_USER' ? '#a855f7' : e.loginRole !== 'NONE' ? '#ff6b6b' : '#94a3b8' }} />
                    <span>Access Level: <b style={{ color: e.loginRole === 'CENSUS_USER' ? '#a855f7' : e.loginRole !== 'NONE' ? '#ff6b6b' : '#94a3b8' }}>{e.loginRole === 'CENSUS_USER' ? '🗺️ Census Staff' : e.loginRole || 'NONE'}</b></span>
                  </div>
                </div>

                {/* Footer: Daily Wage & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px', display: 'block' }}>Daily Wage</span>
                    <b style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: '800' }}>₹{e.dailyWage || 0}<span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '500' }}> / day</span></b>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => openEdit(e)} 
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button 
                      className="deleteBtn" 
                      onClick={() => del(e.id)}
                      style={{ padding: '8px' }}
                    >
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
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', borderRadius: '20px', padding: '32px', background: '#0d1322', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
            <button className="modalClose" onClick={() => setShowModal(false)} style={{ color: '#94a3b8' }}><X size={20}/></button>
            
            <div className="modalHeader" style={{ marginBottom: '24px', background: 'transparent' }}>
              <p className="eyebrow" style={{ justifyContent: 'flex-start', color: '#ff6b6b' }}>STAFF ACCOUNT</p>
              <h2 style={{ color: '#ffffff', margin: '4px 0' }}>{editingEmp ? 'Edit Employee Details' : 'Add New Employee'}</h2>
              <p className="modalDesc" style={{ color: '#94a3b8', margin: 0 }}>Configure employee profile and custom dashboard login credentials.</p>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Full Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="E.g. Ramesh Kumar"
                    style={{ padding: '11px 14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Role/Designation *</label>
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
                    style={{ padding: '11px 14px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', fontSize: '0.88rem', background: '#0f172a', color: '#ffffff' }}
                  >
                    {COMMON_ROLES.map(r => (
                      <option key={r} value={r} style={{ background: '#0f172a' }}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCommonRole === 'Other' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.2s ease' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Enter Custom Role/Designation *</label>
                  <input
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    required
                    placeholder="E.g. Centering Worker, Welder"
                    style={{ padding: '11px 14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="E.g. 9876543210"
                    style={{ padding: '11px 14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Daily Wage (₹) *</label>
                  <input
                    type="number"
                    value={form.dailyWage}
                    onChange={(e) => setForm({ ...form, dailyWage: e.target.value })}
                    required
                    placeholder="E.g. 800"
                    style={{ padding: '11px 14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="emp-active-chk"
                  checked={form.active}
                  onChange={(e) => isAdmin && setForm({ ...form, active: e.target.checked })}
                  disabled={!isAdmin}
                  style={{ width: '16px', height: '16px', cursor: isAdmin ? 'pointer' : 'not-allowed' }}
                />
                <label 
                  htmlFor="emp-active-chk" 
                  style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    color: isAdmin ? '#cbd5e1' : '#64748b', 
                    cursor: isAdmin ? 'pointer' : 'not-allowed' 
                  }}
                >
                  Mark employee as active (available for attendance) {!isAdmin && <span style={{ fontSize: '0.74rem', color: '#ff6b6b', fontWeight: '700' }}>(Admin Only)</span>}
                </label>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '12px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Dashboard Login Permission</label>
                  <select
                    value={form.loginRole}
                    onChange={(e) => setForm({ ...form, loginRole: e.target.value })}
                    style={{ padding: '11px 14px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', fontSize: '0.88rem', background: '#0f172a', color: '#ffffff' }}
                  >
                    <option value="NONE" style={{ background: '#0f172a' }}>No Login Access (Field Labor / Subordinate Worker)</option>
                    {creds.role === 'ADMIN' && (
                      <option value="CENSUS_USER" style={{ background: '#0f172a' }}>🗺️ Census Staff (Census data view only)</option>
                    )}
                    {creds.role === 'ADMIN' && (
                      <option value="ENGINEER" style={{ background: '#0f172a' }}>Site Engineer (Can track attendance, upload progress photos)</option>
                    )}
                    {creds.username === 'admin' && (
                      <option value="ADMIN" style={{ background: '#0f172a' }}>Admin / Staff (Full controls — rates, staff, payments)</option>
                    )}
                  </select>
                </div>

                {form.loginRole !== 'NONE' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', animation: 'fadeIn 0.25s ease' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Username *</label>
                      <input
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                        placeholder="Login username"
                        style={{ padding: '11px 14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>
                        {editingEmp ? 'Password (leave blank to keep current)' : 'Password *'}
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          required={!editingEmp}
                          placeholder={editingEmp ? "••••••••" : "Choose password"}
                          style={{ width: '100%', padding: '11px 14px', paddingRight: '40px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
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
                            color: '#94a3b8',
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
                <p style={{ margin: '8px 0 0', fontSize: '0.82rem', fontWeight: '700', color: msg.includes('successfully') ? '#34d399' : '#ff6b6b' }}>
                  {msg}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="stepBack" onClick={() => setShowModal(false)} style={{ borderRadius: '10px', padding: '12px 20px', fontSize: '0.85rem' }}>
                  Cancel
                </button>
                <button className="primary" style={{ borderRadius: '10px', padding: '12px 24px', fontSize: '0.85rem', fontWeight: '700' }}>
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

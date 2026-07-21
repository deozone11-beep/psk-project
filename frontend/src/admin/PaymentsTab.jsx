import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Wallet, 
  Calendar, 
  FileText, 
  Search, 
  User, 
  Filter, 
  Coins,
  ArrowUpRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { api } from './api';

export default function PaymentsTab({ creds }) {
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [list, setList] = useState([]);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [filterEmp, setFilterEmp] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [form, setForm] = useState({ 
    employeeId: '', 
    date: new Date().toLocaleDateString('en-CA'), 
    amount: '', 
    notes: '',
    siteName: ''
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/admin/employees', creds).then(setEmployees).catch(console.error);
    api('/admin/customers', creds).then(setCustomers).catch(console.error);
    load();
  }, []);

  function load() { 
    api('/admin/payments', creds).then(setList).catch(console.error); 
  }

  async function pay(e) {
    e.preventDefault();
    if (!form.employeeId) { setMsg('Select an employee first'); return; }
    
    // Combine siteName and notes for storage in the payment notes field
    const finalNotes = form.siteName 
      ? `${form.siteName}${form.notes ? ' · ' + form.notes : ''}` 
      : form.notes;

    try {
      await api('/admin/payments', creds, { 
        method: 'POST', 
        body: JSON.stringify({ 
          employeeId: Number(form.employeeId), 
          date: form.date,
          amount: Number(form.amount),
          notes: finalNotes
        }) 
      });
      setMsg('Payment recorded successfully ✓');
      load();
      setForm({
        employeeId: '',
        date: new Date().toLocaleDateString('en-CA'),
        amount: '',
        notes: '',
        siteName: ''
      });
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.message); }
  }

  async function del(id) {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try { 
      await api(`/admin/payments/${id}`, creds, { method: 'DELETE' }); 
      load(); 
    } catch (e) { console.error(e); }
  }

  function empName(id) { 
    return employees.find((e) => e.id === id)?.name || `#${id}`; 
  }

  // Filtered List calculations
  const filteredList = list.filter(p => {
    const query = search.toLowerCase();
    const matchesSearch = 
      (p.notes && p.notes.toLowerCase().includes(query)) ||
      (empName(p.employee.id).toLowerCase().includes(query));

    const matchesEmp = filterEmp === 'ALL' || p.employee.id === Number(filterEmp);
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(p.date) >= new Date(startDate);
    }
    if (endDate) {
      const endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(p.date) <= endLimit;
    }

    return matchesSearch && matchesEmp && matchesDate;
  });

  // Calculate metrics based on filtered results
  const totalWagesPaid = filteredList.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalTransactions = filteredList.length;
  const lastPaymentDate = filteredList.length > 0 
    ? filteredList.map(p => new Date(p.date)).sort((a,b) => b-a)[0].toLocaleDateString('en-IN')
    : '-';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Metrics Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <div className="estCard" style={{ borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Total Disbursed</span>
            <b style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>₹{totalWagesPaid.toLocaleString('en-IN')}</b>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'none' }}>Overall wages recorded</span>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="estCard" style={{ borderLeft: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Transactions</span>
            <b style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>{totalTransactions} Payments</b>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'none' }}>Wage slips logged</span>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coins size={20} />
          </div>
        </div>

        <div className="estCard" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Last Wage Payout</span>
            <b style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>{lastPaymentDate}</b>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'none' }}>Most recent ledger entry</span>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} />
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Record New Payment Form */}
        <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
          <span className="eyebrow" style={{ justifyContent: 'flex-start' }}>FINANCE LEDGER</span>
          <h3 style={{ margin: '4px 0 16px' }}>Record Labor Wage Payment</h3>
          
          <form onSubmit={pay} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Select Employee *</label>
              <select 
                value={form.employeeId} 
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })} 
                required 
                style={{ width: '100%', padding: '10px' }}
              >
                <option value="">Choose worker...</option>
                {employees.filter(e => e.active !== false).map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.role || 'Laborer'})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Date *</label>
                <input 
                  type="date" 
                  value={form.date} 
                  onChange={(e) => setForm({ ...form, date: e.target.value })} 
                  required 
                  style={{ width: '100%', padding: '10px' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Amount (₹) *</label>
                <input 
                  type="number" 
                  placeholder="Amount in Rupees" 
                  value={form.amount} 
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                  required 
                  style={{ width: '100%', padding: '10px' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Job Site / Project</label>
              <select 
                value={form.siteName} 
                onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                style={{ width: '100%', padding: '10px' }}
              >
                <option value="">Select Project...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.projectName || c.displayName}>{c.projectName || c.displayName}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Additional Notes</label>
              <input 
                placeholder="Optional descriptions (e.g. Bank transfer, week-end wage)" 
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                style={{ width: '100%', padding: '10px' }} 
              />
            </div>

            <button className="primary" style={{ width: '100%', borderRadius: '10px', height: '46px', marginTop: '10px' }}>
              <Plus size={16} /> Record Wage Payment
            </button>
          </form>
          {msg && <p style={{ margin: '12px 0 0', fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>{msg}</p>}
        </section>

        {/* Right Side: Ledger history & filter */}
        <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ margin: 0, marginBottom: '4px' }}>Wage Ledger Transactions</h3>
          <p className="adminHint" style={{ marginBottom: '18px' }}>Review the history of wages paid, advances cleared, and cash transactions.</p>
          
          {/* Filters Dashboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  placeholder="Search payments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 30px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem' }}
                />
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
              </div>
              <select 
                value={filterEmp} 
                onChange={(e) => setFilterEmp(e.target.value)}
                style={{ width: '140px', padding: '8px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', background: '#fff' }}
              >
                <option value="ALL">All Workers</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '700' }}>Date Range:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                style={{ flex: 1, padding: '6px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                style={{ flex: 1, padding: '6px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem' }}
              />
            </div>
          </div>

          {/* Payment List Grid */}
          <div className="tableList" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {filteredList.map((p) => (
              <div 
                className="tableRow" 
                key={p.id}
                style={{ 
                  padding: '12px 14px', 
                  borderRadius: '12px', 
                  marginBottom: '8px',
                  border: '1.5px solid #e2e8f0',
                  transition: 'all 0.2s',
                  background: '#ffffff'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={16} />
                  </div>
                  <div>
                    <b style={{ fontSize: '0.94rem', color: '#0f172a' }}>{empName(p.employee.id)}</b>
                    <span className="tableSub" style={{ display: 'block', marginTop: '2px', fontSize: '0.76rem', color: '#64748b' }}>
                      📅 {p.date} {p.notes ? ` · 📝 ${p.notes}` : ''}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '0.98rem', fontWeight: '800', color: '#10b981' }}>
                    ₹{p.amount.toLocaleString('en-IN')}
                  </div>
                  <button 
                    className="deleteBtn" 
                    onClick={() => del(p.id)}
                    style={{ padding: '6px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filteredList.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p className="adminHint">No ledger entries match current filters.</p>
              </div>
            )}
          </div>
        </section>

      </div>

    </div>
  );
}

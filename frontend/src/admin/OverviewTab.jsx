import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Wallet, 
  Mail, 
  MapPin, 
  ArrowRight, 
  Activity, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Compass, 
  Award, 
  PlusCircle, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { api } from './api';

export default function OverviewTab({ creds, setTab }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    totalSites: 0,
    pendingLeads: 0,
    totalPayments: 0,
    attendanceRate: 0
  });
  const [roleBreakdown, setRoleBreakdown] = useState([]);
  const [activeSites, setActiveSites] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [employees, attendance, payments, enquiries, customers, updates] = await Promise.all([
        api('/admin/employees', creds).catch(() => []),
        api('/admin/attendance', creds).catch(() => []),
        api('/admin/payments', creds).catch(() => []),
        api('/admin/enquiries', creds).catch(() => []),
        api('/admin/customers', creds).catch(() => []),
        api('/admin/updates', creds).catch(() => [])
      ]);

      const todayStr = new Date().toLocaleDateString('en-CA');
      const activeEmps = employees.filter(e => e.active !== false);
      const todayAttendance = attendance.filter(a => a.date === todayStr);
      const presentToday = todayAttendance.filter(a => a.present).length;

      const totalWages = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const rate = activeEmps.length > 0 ? Math.round((presentToday / activeEmps.length) * 100) : 0;

      setStats({
        totalEmployees: activeEmps.length,
        presentToday,
        totalSites: customers.length,
        pendingLeads: enquiries.length,
        totalPayments: totalWages,
        attendanceRate: rate
      });

      const roles = {};
      todayAttendance.filter(a => a.present).forEach(a => {
        const role = a.employee.role || 'Laborer';
        roles[role] = (roles[role] || 0) + 1;
      });
      const breakdown = Object.entries(roles).map(([name, count]) => ({
        name,
        count,
        percent: presentToday > 0 ? Math.round((count / presentToday) * 100) : 0
      })).sort((a, b) => b.count - a.count);
      setRoleBreakdown(breakdown);

      const sites = customers.map(c => {
        const custUpdates = updates.filter(u => u.customer && u.customer.id === c.id);
        const latestUpdate = custUpdates.length > 0 ? custUpdates[0] : null;
        
        let progress = 15;
        if (custUpdates.length === 1) progress = 35;
        else if (custUpdates.length === 2) progress = 55;
        else if (custUpdates.length === 3) progress = 75;
        else if (custUpdates.length >= 4) progress = 90;

        return {
          id: c.id,
          name: c.displayName,
          project: c.projectName || 'Residential Construction',
          progress,
          latestUpdate: latestUpdate ? latestUpdate.title : 'No updates logged yet',
          latestDate: latestUpdate ? latestUpdate.workDate : null
        };
      });
      setActiveSites(sites);

      const actions = [];
      
      todayAttendance.forEach(a => {
        actions.push({
          type: 'checkin',
          title: `${a.employee.name} checked in`,
          desc: a.checkInTime ? `Logged via GPS at ${a.checkInTime}` : 'Marked present by admin',
          time: new Date(a.date).toLocaleDateString('en-IN'),
          rawDate: new Date(a.date),
          meta: a.checkInLocation
        });
      });

      payments.slice(0, 5).forEach(p => {
        actions.push({
          type: 'payment',
          title: `Recorded Labor Wage Payment`,
          desc: `Paid ₹${p.amount.toLocaleString('en-IN')} to ${p.employee ? p.employee.name : 'Unknown'}`,
          time: p.date,
          rawDate: new Date(p.date)
        });
      });

      updates.slice(0, 5).forEach(u => {
        actions.push({
          type: 'update',
          title: `Progress Update: ${u.title}`,
          desc: `Uploaded for ${u.customer ? u.customer.displayName : 'Unknown'}`,
          time: u.workDate,
          rawDate: new Date(u.workDate)
        });
      });

      actions.sort((a, b) => b.rawDate - a.rawDate);
      setRecentActions(actions.slice(0, 8));

    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <p className="adminHint">Loading site overview...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Quick Actions command center */}
      <section className="adminCard" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem', fontWeight: '800', letterSpacing: '-0.2px' }}>⚡ Quick Command Center</h4>
            <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.78rem', fontWeight: '500' }}>Direct shortcuts to switch sections and log daily operations.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {creds.role === 'ADMIN' && (
              <button 
                onClick={() => setTab && setTab('enquiries')}
                style={{ background: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc', padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#e2262b'; e.currentTarget.style.borderColor = '#e2262b'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
              >
                <PlusCircle size={14} /> Review Leads
              </button>
            )}
            <button 
              onClick={() => setTab && setTab('attendance')}
              style={{ background: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc', padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#e2262b'; e.currentTarget.style.borderColor = '#e2262b'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
            >
              <Users size={14} /> Log Attendance
            </button>
            <button 
              onClick={() => setTab && setTab('payments')}
              style={{ background: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc', padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#e2262b'; e.currentTarget.style.borderColor = '#e2262b'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
            >
              <Wallet size={14} /> Pay Wages
            </button>
            <button 
              onClick={() => setTab && setTab('updates')}
              style={{ background: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255, 255, 255, 0.07)', color: '#f8fafc', padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#e2262b'; e.currentTarget.style.borderColor = '#e2262b'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
            >
              <Compass size={14} /> Upload Site Update
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* Attendance Rate (Circular SVG visual) */}
        <div 
          onClick={() => setTab && setTab('attendance')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = '#10b981';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(16, 185, 129, 0.08), 0 4px 6px -2px rgba(16, 185, 129, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
          }}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '22px', 
            background: '#ffffff', 
            borderRadius: '16px',
            border: '1.5px solid transparent',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Today's Attendance</span>
            <b style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{stats.presentToday} / {stats.totalEmployees} Present</b>
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>{stats.attendanceRate}% of labor active today</span>
          </div>
          <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
              <circle cx="28" cy="28" r="22" fill="transparent" stroke="#10b981" strokeWidth="4" 
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - stats.attendanceRate / 100)}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
              />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#10b981' }}>
              {stats.attendanceRate}%
            </span>
          </div>
        </div>

        {/* Active Sites */}
        <div 
          onClick={() => setTab && setTab('customers')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.08), 0 4px 6px -2px rgba(59, 130, 246, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
          }}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '22px', 
            background: '#ffffff', 
            borderRadius: '16px',
            border: '1.5px solid transparent',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Active Projects</span>
            <b style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{stats.totalSites} Job Sites</b>
            <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: '700', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              Timeline tracking active <ChevronRight size={12} />
            </span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Compass size={22} />
          </div>
        </div>

        {/* Expenses/Wages */}
        <div 
          onClick={() => setTab && setTab('payments')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = '#e2262b';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(226, 38, 43, 0.08), 0 4px 6px -2px rgba(226, 38, 43, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
          }}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '22px', 
            background: '#ffffff', 
            borderRadius: '16px',
            border: '1.5px solid transparent',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Total Expenses Paid</span>
            <b style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>₹{stats.totalPayments.toLocaleString('en-IN')}</b>
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>Labor daily wage payouts</span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2262b' }}>
            <Wallet size={22} />
          </div>
        </div>

        {/* New Leads */}
        <div 
          onClick={() => setTab && setTab('enquiries')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = '#f59e0b';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(245, 158, 11, 0.08), 0 4px 6px -2px rgba(245, 158, 11, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
          }}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '22px', 
            background: '#ffffff', 
            borderRadius: '16px',
            border: '1.5px solid transparent',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Pending Leads</span>
            <b style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{stats.pendingLeads} Client Enquiries</b>
            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '700', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              Awaiting response <ChevronRight size={12} />
            </span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Mail size={22} />
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left column: Site progress and skill distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Site Progress */}
          <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '800' }}>Job Site Construction Progress</h3>
            <p className="adminHint" style={{ marginBottom: '20px', fontSize: '0.8rem' }}>Site compilation estimates based on progress updates logged.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activeSites.map(s => (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <b style={{ fontSize: '0.94rem', color: '#0f172a', fontWeight: '700' }}>{s.name}</b>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', marginLeft: '8px' }}>({s.project})</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e2262b' }}>{s.progress}%</span>
                  </div>
                  <div style={{ width: '100%', background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${s.progress}%`, background: 'linear-gradient(90deg, #e2262b 0%, #ff5252 100%)', height: '100%' }} />
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic', fontWeight: '500' }}>
                    Latest Log: {s.latestUpdate} {s.latestDate ? `· ${s.latestDate}` : ''}
                  </span>
                </div>
              ))}
              {activeSites.length === 0 && (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <p className="adminHint">No customer site databases registered yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Role breakdown */}
          <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '800' }}>Active Skills Breakdown (Today)</h3>
            <p className="adminHint" style={{ marginBottom: '20px', fontSize: '0.8rem' }}>Distribution of worker roles checked in today.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {roleBreakdown.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '120px', fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'capitalize' }}>
                    {r.name.toLowerCase()}
                  </div>
                  <div style={{ flex: 1, background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${r.percent}%`, background: 'linear-gradient(90deg, #e2262b 0%, #ff5252 100%)', height: '100%' }} />
                  </div>
                  <div style={{ width: '40px', textAlign: 'right', fontSize: '0.82rem', fontWeight: '800', color: '#0f172a' }}>
                    {r.count}
                  </div>
                </div>
              ))}
              {roleBreakdown.length === 0 && (
                <div style={{ padding: '10px 0', textAlign: 'center' }}>
                  <p className="adminHint">No laborers present today.</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right column: Recent Activity Logs Feed */}
        <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '800' }}>Recent Operations Feed</h3>
          <p className="adminHint" style={{ marginBottom: '24px', fontSize: '0.8rem' }}>Live activity timeline across attendance, payments, and site updates.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', position: 'relative' }}>
            {recentActions.map((a, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: a.type === 'checkin' ? '#10b981' : (a.type === 'payment' ? '#e2262b' : '#3b82f6'),
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 2px rgba(15,23,42,0.06)',
                    zIndex: 2
                  }} />
                  {idx !== recentActions.length - 1 && (
                    <div style={{ width: '2px', flex: 1, background: '#e2e8f0', marginTop: '6px', marginBottom: '-24px', minHeight: '40px' }} />
                  )}
                </div>
                <div style={{ flex: 1, marginTop: '-4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <b style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: '700' }}>{a.title}</b>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>{a.time}</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4', fontWeight: '500' }}>
                    {a.desc}
                  </p>
                  {a.type === 'checkin' && a.meta && (
                    <a 
                      href={a.meta} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#e2262b', textDecoration: 'none', fontWeight: '700', marginTop: '6px' }}
                    >
                      <MapPin size={11} /> Pin Location
                    </a>
                  )}
                </div>
              </div>
            ))}
            {recentActions.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <p className="adminHint">No actions logged yet.</p>
              </div>
            )}
          </div>
        </section>

      </div>

    </div>
  );
}

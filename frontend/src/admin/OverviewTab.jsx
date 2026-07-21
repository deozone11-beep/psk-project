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
  ChevronRight,
  UserCheck,
  HardHat,
  FileText,
  Zap
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
        const role = a.employee?.role || 'Laborer';
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
        
        let progress = 20;
        if (custUpdates.length === 1) progress = 35;
        else if (custUpdates.length === 2) progress = 55;
        else if (custUpdates.length === 3) progress = 75;
        else if (custUpdates.length >= 4) progress = 90;

        return {
          id: c.id,
          name: c.displayName,
          project: c.projectName || 'Residential Construction',
          sqft: c.estimatedSqft,
          phone: c.phone,
          progress,
          latestUpdate: latestUpdate ? latestUpdate.title : 'No updates logged yet',
          latestDate: latestUpdate ? latestUpdate.workDate : null,
          engineerName: latestUpdate?.engineerName || 'Site Engineer Assigned',
          workerNames: latestUpdate?.workerNames || ''
        };
      });
      setActiveSites(sites);

      const actions = [];
      
      todayAttendance.forEach(a => {
        actions.push({
          type: 'checkin',
          title: `${a.employee?.name || 'Staff'} checked in`,
          desc: a.checkInTime ? `Logged via GPS at ${a.checkInTime}` : 'Marked present on site',
          time: new Date(a.date).toLocaleDateString('en-IN'),
          rawDate: new Date(a.date),
          meta: a.checkInLocation
        });
      });

      payments.slice(0, 5).forEach(p => {
        actions.push({
          type: 'payment',
          title: `Labor Wage Payment Recorded`,
          desc: `Paid ₹${p.amount.toLocaleString('en-IN')} to ${p.employee ? p.employee.name : 'Worker'}`,
          time: p.date,
          rawDate: new Date(p.date)
        });
      });

      updates.slice(0, 5).forEach(u => {
        actions.push({
          type: 'update',
          title: `Progress Update: ${u.title}`,
          desc: `Uploaded for ${u.customer ? u.customer.displayName : 'Customer'} (${u.engineerName || 'Site Engineer'})`,
          time: u.workDate,
          rawDate: new Date(u.workDate)
        });
      });

      enquiries.slice(0, 3).forEach(e => {
        actions.push({
          type: 'enquiry',
          title: `New Project Enquiry: ${e.name}`,
          desc: `${e.projectType || 'Construction'} query from ${e.city || 'Tamil Nadu'}`,
          time: e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN') : 'Recent',
          rawDate: e.createdAt ? new Date(e.createdAt) : new Date()
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
        <p className="adminHint">Loading site command center...</p>
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Live Operational Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.18)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.3px' }}>
            LIVE OPERATIONS CONTROL CENTER
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>
          <Calendar size={14} style={{ color: '#e2262b' }} />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Quick Actions Command Center */}
      <section className="adminCard" style={{ padding: '22px 26px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: '0 12px 30px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: '#e2262b' }} /> Quick Operations Command Shortcuts
            </h4>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '500' }}>Direct action shortcuts to manage daily site operations and customer updates.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {creds.role === 'ADMIN' && (
              <button 
                onClick={() => setTab && setTab('enquiries')}
                style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', padding: '9px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'; e.currentTarget.style.color = '#fbbf24'; }}
              >
                <Mail size={14} /> Review Leads ({stats.pendingLeads})
              </button>
            )}
            <button 
              onClick={() => setTab && setTab('attendance')}
              style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '9px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.color = '#34d399'; }}
            >
              <UserCheck size={14} /> Log Attendance
            </button>
            <button 
              onClick={() => setTab && setTab('updates')}
              style={{ background: 'rgba(226, 38, 43, 0.2)', border: '1px solid rgba(226, 38, 43, 0.4)', color: '#ff6b6b', padding: '9px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#e2262b'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(226, 38, 43, 0.2)'; e.currentTarget.style.color = '#ff6b6b'; }}
            >
              <Compass size={14} /> Upload Site Update
            </button>
            <button 
              onClick={() => setTab && setTab('payments')}
              style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '9px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'; e.currentTarget.style.color = '#60a5fa'; }}
            >
              <Wallet size={14} /> Pay Wages
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px' }}>
        
        {/* Today's Attendance Rate */}
        <div 
          onClick={() => setTab && setTab('attendance')}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px', 
            background: '#ffffff', 
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Today's Attendance</span>
            <b style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{stats.presentToday} / {stats.totalEmployees} Present</b>
            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>{stats.attendanceRate}% active today</span>
          </div>
          <div style={{ position: 'relative', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="20" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
              <circle cx="26" cy="26" r="20" fill="transparent" stroke="#10b981" strokeWidth="4" 
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - stats.attendanceRate / 100)}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
              />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: '800', color: '#10b981' }}>
              {stats.attendanceRate}%
            </span>
          </div>
        </div>

        {/* Active Job Sites */}
        <div 
          onClick={() => setTab && setTab('customers')}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px', 
            background: '#ffffff', 
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Active Job Sites</span>
            <b style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{stats.totalSites} Projects</b>
            <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: '700', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              Timeline active <ChevronRight size={12} />
            </span>
          </div>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Compass size={22} />
          </div>
        </div>

        {/* Total Wage Payments */}
        <div 
          onClick={() => setTab && setTab('payments')}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px', 
            background: '#ffffff', 
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Total Wages Paid</span>
            <b style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>₹{stats.totalPayments.toLocaleString('en-IN')}</b>
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Labor wage payouts</span>
          </div>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2262b' }}>
            <Wallet size={22} />
          </div>
        </div>

        {/* Client Enquiries / Leads */}
        <div 
          onClick={() => setTab && setTab('enquiries')}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px', 
            background: '#ffffff', 
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#64748b' }}>Pending Leads</span>
            <b style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{stats.pendingLeads} Client Enquiries</b>
            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '700', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              Awaiting response <ChevronRight size={12} />
            </span>
          </div>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Mail size={22} />
          </div>
        </div>

      </div>

      {/* Main Grid: Job Site Progress & Operations Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Job Sites & Skills Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Job Site Construction Progress */}
          <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>Job Site Construction Progress</h3>
                <p className="adminHint" style={{ margin: '2px 0 0', fontSize: '0.78rem' }}>Live project completion estimates based on progress updates.</p>
              </div>
              <button 
                onClick={() => setTab && setTab('updates')}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Post Update
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activeSites.map(s => (
                <div key={s.id} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <b style={{ fontSize: '0.98rem', color: '#0f172a', fontWeight: '800' }}>{s.name}</b>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', marginLeft: '6px' }}>({s.project})</span>
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#e2262b', background: '#fef2f2', padding: '3px 10px', borderRadius: '12px' }}>
                      {s.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${s.progress}%`, background: 'linear-gradient(90deg, #e2262b 0%, #ff5252 100%)', height: '100%', borderRadius: '4px' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '0.76rem', color: '#64748b' }}>
                    <span>👷 In-Charge: <b>{s.engineerName}</b></span>
                    {s.latestDate && <span>📅 Logged: <b>{s.latestDate}</b></span>}
                  </div>

                  {s.workerNames && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '0.72rem', color: '#475569' }}>
                      <span>👥 Active Team:</span>
                      {s.workerNames.split(',').map((w, idx) => (
                        <span key={idx} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                          {w.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {activeSites.length === 0 && (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <p className="adminHint">No customer site projects registered yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Role & Skill Distribution Today */}
          <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>Active Labor Skills Breakdown (Today)</h3>
            <p className="adminHint" style={{ marginBottom: '18px', fontSize: '0.78rem' }}>Distribution of worker roles checked in today across all sites.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {roleBreakdown.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '120px', fontSize: '0.82rem', fontWeight: '700', color: '#334155', textTransform: 'capitalize' }}>
                    {r.name.toLowerCase()}
                  </div>
                  <div style={{ flex: 1, background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${r.percent}%`, background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', height: '100%' }} />
                  </div>
                  <div style={{ width: '40px', textAlign: 'right', fontSize: '0.82rem', fontWeight: '800', color: '#0f172a' }}>
                    {r.count}
                  </div>
                </div>
              ))}
              {roleBreakdown.length === 0 && (
                <div style={{ padding: '10px 0', textAlign: 'center' }}>
                  <p className="adminHint">No labor workers present today yet.</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Live Operations Feed */}
        <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#e2262b' }}>REALTIME AUDIT LOG</span>
              <h3 style={{ margin: '2px 0 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>Recent Operations Feed</h3>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', position: 'relative' }}>
            {recentActions.map((a, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: a.type === 'checkin' ? '#10b981' : (a.type === 'payment' ? '#e2262b' : (a.type === 'enquiry' ? '#f59e0b' : '#3b82f6')),
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 2px rgba(15,23,42,0.08)',
                    zIndex: 2
                  }} />
                  {idx !== recentActions.length - 1 && (
                    <div style={{ width: '2px', flex: 1, background: '#e2e8f0', marginTop: '6px', marginBottom: '-24px', minHeight: '42px' }} />
                  )}
                </div>
                <div style={{ flex: 1, marginTop: '-3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <b style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: '800' }}>{a.title}</b>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>{a.time}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: '1.4', fontWeight: '500' }}>
                    {a.desc}
                  </p>
                  {a.type === 'checkin' && a.meta && (
                    <a 
                      href={a.meta} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#e2262b', textDecoration: 'none', fontWeight: '700', marginTop: '6px' }}
                    >
                      <MapPin size={12} /> Pin Location
                    </a>
                  )}
                </div>
              </div>
            ))}
            {recentActions.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <p className="adminHint">No operations recorded yet.</p>
              </div>
            )}
          </div>
        </section>

      </div>

    </div>
  );
}

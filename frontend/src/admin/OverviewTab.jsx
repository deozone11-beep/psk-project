import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, Wallet, Mail, MapPin, ArrowRight, Activity, TrendingUp, Calendar, Clock, Compass } from 'lucide-react';
import { api } from './api';

export default function OverviewTab({ creds }) {
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

      // Calculate totals
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

      // Role breakdown
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

      // Active sites progress list
      const sites = customers.map(c => {
        const custUpdates = updates.filter(u => u.customer && u.customer.id === c.id);
        const latestUpdate = custUpdates.length > 0 ? custUpdates[0] : null;
        
        // Progress estimate based on number of updates
        let progress = 15; // default start
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

      // Unified recent action feed (combine check-ins, payments, updates)
      const actions = [];
      
      // 1. Add today's check-ins
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

      // 2. Add recent payments
      payments.slice(0, 5).forEach(p => {
        actions.push({
          type: 'payment',
          title: `Recorded Labor Wage Payment`,
          desc: `Paid ₹${p.amount.toLocaleString('en-IN')} to ${p.employee ? p.employee.name : 'Unknown'}`,
          time: p.date,
          rawDate: new Date(p.date)
        });
      });

      // 3. Add recent site updates
      updates.slice(0, 5).forEach(u => {
        actions.push({
          type: 'update',
          title: `Progress Update: ${u.title}`,
          desc: `Uploaded for ${u.customer ? u.customer.displayName : 'Unknown'}`,
          time: u.workDate,
          rawDate: new Date(u.workDate)
        });
      });

      // Sort actions by date descending
      actions.sort((a, b) => b.rawDate - a.rawDate);
      setRecentActions(actions.slice(0, 8));

    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="adminHint">Loading site overview...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* Attendance Rate */}
        <div className="estCard" style={{ borderLeft: '4px solid #10b981' }}>
          <span>Today's Attendance</span>
          <b>{stats.presentToday} / {stats.totalEmployees} Present</b>
          <div style={{ width: '100%', background: '#f1f5f9', height: '6px', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${stats.attendanceRate}%`, background: '#10b981', height: '100%' }} />
          </div>
          <span style={{ fontSize: '0.72rem', marginTop: '4px', textTransform: 'none', color: '#64748b' }}>
            {stats.attendanceRate}% of labor active today
          </span>
        </div>

        {/* Active Sites */}
        <div className="estCard" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span>Active Projects</span>
          <b>{stats.totalSites} Job Sites</b>
          <span style={{ fontSize: '0.72rem', marginTop: '14px', textTransform: 'none', color: '#3b82f6', fontWeight: 'bold' }}>
            Timeline tracking active
          </span>
        </div>

        {/* Expenses/Wages */}
        <div className="estCard" style={{ borderLeft: '4px solid #e2262b' }}>
          <span>Total Expenses Paid</span>
          <b>₹{stats.totalPayments.toLocaleString('en-IN')}</b>
          <span style={{ fontSize: '0.72rem', marginTop: '14px', textTransform: 'none', color: '#64748b' }}>
            Labor daily wage payouts
          </span>
        </div>

        {/* New Leads */}
        <div className="estCard" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span>Pending Leads</span>
          <b>{stats.pendingLeads} Client Enquiries</b>
          <span style={{ fontSize: '0.72rem', marginTop: '14px', textTransform: 'none', color: '#f59e0b', fontWeight: 'bold' }}>
            Awaiting response
          </span>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Site Progress & Role Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Site Progress */}
          <section className="adminCard" style={{ padding: '24px' }}>
            <h3>Job Site Construction Progress</h3>
            <p className="adminHint" style={{ marginBottom: '20px' }}>Site compilation estimates based on progress updates logged.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {activeSites.map(s => (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <b style={{ fontSize: '0.92rem', color: '#0f172a' }}>{s.name}</b>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '10px' }}>({s.project})</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e2262b' }}>{s.progress}%</span>
                  </div>
                  <div style={{ width: '100%', background: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${s.progress}%`, background: 'linear-gradient(90deg, #e2262b 0%, #ff5252 100%)', height: '100%' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                    Latest Log: {s.latestUpdate} {s.latestDate ? `· ${s.latestDate}` : ''}
                  </span>
                </div>
              ))}
              {activeSites.length === 0 && <p className="adminHint">No customer site databases registered yet.</p>}
            </div>
          </section>

          {/* Role breakdown */}
          <section className="adminCard" style={{ padding: '24px' }}>
            <h3>Active Skills Breakdown (Today)</h3>
            <p className="adminHint" style={{ marginBottom: '20px' }}>Distribution of worker roles checked in today.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {roleBreakdown.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '110px', fontSize: '0.85rem', fontWeight: '700', color: '#475569', textTransform: 'capitalize' }}>
                    {r.name.toLowerCase()}
                  </div>
                  <div style={{ flex: 1, background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${r.percent}%`, background: '#e2262b', height: '100%' }} />
                  </div>
                  <div style={{ width: '40px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                    {r.count}
                  </div>
                </div>
              ))}
              {roleBreakdown.length === 0 && <p className="adminHint">No laborers present today.</p>}
            </div>
          </section>

        </div>

        {/* Right Side: Recent Activity Logs Feed */}
        <section className="adminCard" style={{ padding: '24px' }}>
          <h3>Recent Operations Feed</h3>
          <p className="adminHint" style={{ marginBottom: '20px' }}>Live activity timeline across attendance, payments, and site updates.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            {recentActions.map((a, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: a.type === 'checkin' ? '#10b981' : (a.type === 'payment' ? '#e2262b' : '#3b82f6'),
                    border: '3px solid #fff',
                    boxShadow: '0 0 0 2px rgba(15,23,42,0.05)',
                    zIndex: 2
                  }} />
                  {idx !== recentActions.length - 1 && (
                    <div style={{ width: '2px', flex: 1, background: '#e2e8f0', marginTop: '4px', marginBottom: '-20px' }} />
                  )}
                </div>
                <div style={{ flex: 1, marginTop: '-3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: '0.88rem', color: '#0f172a' }}>{a.title}</b>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>{a.time}</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748b', lineSpacing: '1.4' }}>
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
            {recentActions.length === 0 && <p className="adminHint">No actions logged yet.</p>}
          </div>
        </section>

      </div>

    </div>
  );
}

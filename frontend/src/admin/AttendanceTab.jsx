import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  Navigation, 
  CheckCircle2, 
  Compass, 
  AlertCircle, 
  ExternalLink,
  Calendar as CalendarIcon,
  ClipboardList,
  BarChart3,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  User
} from 'lucide-react';
import { api } from './api';

export default function AttendanceTab({ creds }) {
  const [employees, setEmployees] = useState([]);
  const [list, setList] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subTab, setSubTab] = useState('daily'); // 'daily' | 'calendar' | 'report'
  
  const [form, setForm] = useState({ 
    employeeId: '', 
    date: new Date().toLocaleDateString('en-CA'), 
    present: true, 
    hoursWorked: 8, 
    notes: '',
    dailyRate: '',
    extraDuty: '',
    advancePaid: ''
  });
  const [msg, setMsg] = useState('');
  
  // Self check-in states
  const [myStatus, setMyStatus] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Calendar states
  const [calDate, setCalDate] = useState(new Date());
  const [selectedCalDateStr, setSelectedCalDateStr] = useState(new Date().toLocaleDateString('en-CA'));

  // Report states
  const [reportRange, setReportRange] = useState({
    employeeId: 'ALL',
    startDate: (() => {
      const d = new Date();
      d.setDate(1); // 1st of current month
      return d.toLocaleDateString('en-CA');
    })(),
    endDate: new Date().toLocaleDateString('en-CA')
  });
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState({ earned: 0, paid: 0, balance: 0 });

  useEffect(() => {
    api('/admin/employees', creds).then(setEmployees).catch(console.error);
    load();
    checkMyStatus();
  }, []);

  // Sync dailyRate when employee selection changes in manual form
  useEffect(() => {
    if (form.employeeId) {
      const emp = employees.find(e => e.id === Number(form.employeeId));
      if (emp) {
        setForm(f => ({ ...f, dailyRate: emp.dailyRate || 0 }));
      }
    }
  }, [form.employeeId, employees]);

  function load() {
    api('/admin/attendance', creds).then(setList).catch(console.error);
    api('/admin/payments', creds).then(setPayments).catch(console.error);
  }

  function checkMyStatus() {
    api('/admin/attendance/my-status', creds)
      .then(setMyStatus)
      .catch(console.error);
  }

  async function mark(e) {
    e.preventDefault();
    if (!form.employeeId) { setMsg('Select an employee first'); return; }
    try {
      await api('/admin/attendance', creds, { 
        method: 'POST', 
        body: JSON.stringify({ 
          ...form, 
          employeeId: Number(form.employeeId), 
          hoursWorked: Number(form.hoursWorked),
          dailyRate: Number(form.dailyRate || 0),
          extraDuty: Number(form.extraDuty || 0),
          advancePaid: Number(form.advancePaid || 0)
        }) 
      });
      setMsg('Attendance marked successfully ✓');
      load();
      // Reset form fields except date
      setForm(f => ({
        ...f,
        employeeId: '',
        present: true,
        hoursWorked: 8,
        notes: '',
        dailyRate: '',
        extraDuty: '',
        advancePaid: ''
      }));
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.message); }
  }

  async function del(id) {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    try { 
      await api(`/admin/attendance/${id}`, creds, { method: 'DELETE' }); 
      load(); 
      checkMyStatus();
    } catch (e) { console.error(e); }
  }

  function handleSelfCheckIn() {
    setCheckingIn(true);
    setGeoError('');
    
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const checkInTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const res = await api('/admin/attendance/checkin', creds, {
            method: 'POST',
            body: JSON.stringify({
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
              time: checkInTime
            })
          });
          if (res.message) throw new Error(res.message);
          
          checkMyStatus();
          load();
        } catch (err) {
          setGeoError(err.message || 'Check-in failed');
        } finally {
          setCheckingIn(false);
        }
      },
      (error) => {
        setCheckingIn(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('GPS Location permission denied. Please allow location access to check-in.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setGeoError('GPS Location request timed out.');
            break;
          default:
            setGeoError('An unknown location error occurred.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function empName(id) { 
    return employees.find((e) => e.id === id)?.name || `#${id}`; 
  }

  // Generate statement report based on selection
  function generateReport(e) {
    if (e) e.preventDefault();
    
    const start = new Date(reportRange.startDate);
    const end = new Date(reportRange.endDate);
    end.setHours(23, 59, 59, 999);

    const filteredEmployees = reportRange.employeeId === 'ALL' 
      ? employees 
      : employees.filter(e => e.id === Number(reportRange.employeeId));

    let overallEarned = 0;
    let overallPaid = 0;

    const dataset = filteredEmployees.map(emp => {
      // 1. Get attendance logs in date range
      const attLogs = list.filter(a => {
        const d = new Date(a.date);
        return a.employee.id === emp.id && d >= start && d <= end;
      });

      const presentDays = attLogs.filter(a => a.present).length;
      
      // Calculate earnings from attendance
      const earnedFromWages = attLogs.reduce((sum, a) => {
        if (!a.present) return sum;
        const rate = a.dailyRate !== null && a.dailyRate !== undefined ? a.dailyRate : (emp.dailyRate || 0);
        return sum + rate;
      }, 0);

      const earnedFromExtraDuty = attLogs.reduce((sum, a) => {
        if (!a.present) return sum;
        return sum + (a.extraDuty || 0);
      }, 0);

      const totalEarned = earnedFromWages + earnedFromExtraDuty;

      // Calculate payments (advances from attendance + general payments)
      const advancesPaid = attLogs.reduce((sum, a) => sum + (a.advancePaid || 0), 0);
      
      const genPayments = payments.filter(p => {
        const d = new Date(p.date);
        return p.employee && p.employee.id === emp.id && d >= start && d <= end;
      }).reduce((sum, p) => sum + (p.amount || 0), 0);

      const totalPaid = advancesPaid + genPayments;
      const balance = totalEarned - totalPaid;

      overallEarned += totalEarned;
      overallPaid += totalPaid;

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role || 'Laborer',
        presentDays,
        earnedWages: earnedFromWages,
        extraDuty: earnedFromExtraDuty,
        totalEarned,
        advances: advancesPaid,
        generalPayments: genPayments,
        totalPaid,
        balance
      };
    });

    setReportData(dataset);
    setReportSummary({
      earned: overallEarned,
      paid: overallPaid,
      balance: overallEarned - overallPaid
    });
  }

  // Trigger report generation when range changes
  useEffect(() => {
    if (employees.length > 0 && (subTab === 'report')) {
      generateReport();
    }
  }, [subTab, employees, list, payments, reportRange.startDate, reportRange.endDate, reportRange.employeeId]);

  // Calendar Helpers
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  function prevMonth() { setCalDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCalDate(new Date(year, month + 1, 1)); }

  const daysArr = Array.from({ length: totalDays }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  // Get selected day logs
  const selectedDayLogs = list.filter(a => a.date === selectedCalDateStr);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '24px', paddingBottom: '2px' }}>
        <button 
          onClick={() => setSubTab('daily')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '10px 4px',
            fontSize: '0.9rem',
            fontWeight: '700',
            color: subTab === 'daily' ? '#e2262b' : '#64748b',
            borderBottom: subTab === 'daily' ? '3px solid #e2262b' : '3px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <ClipboardList size={16} /> Daily Tracker
        </button>
        <button 
          onClick={() => setSubTab('calendar')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '10px 4px',
            fontSize: '0.9rem',
            fontWeight: '700',
            color: subTab === 'calendar' ? '#e2262b' : '#64748b',
            borderBottom: subTab === 'calendar' ? '3px solid #e2262b' : '3px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <CalendarIcon size={16} /> Calendar Day-Wise View
        </button>
        <button 
          onClick={() => setSubTab('report')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '10px 4px',
            fontSize: '0.9rem',
            fontWeight: '700',
            color: subTab === 'report' ? '#e2262b' : '#64748b',
            borderBottom: subTab === 'report' ? '3px solid #e2262b' : '3px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <BarChart3 size={16} /> Wage Statement Report
        </button>
      </div>

      {/* SUBTAB 1: DAILY TRACKER */}
      {subTab === 'daily' && (
        <>
          {/* Self Check-In Card */}
          {myStatus && myStatus.hasProfile && (
            <section className="adminCard" style={{
              background: myStatus.checkedIn ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#ffffff',
              borderColor: myStatus.checkedIn ? '#bbf7d0' : 'rgba(226, 232, 240, 0.8)',
              boxShadow: myStatus.checkedIn ? '0 10px 25px rgba(22, 163, 74, 0.05)' : '0 4px 20px rgba(0,0,0,0.01)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: myStatus.checkedIn ? '#bbf7d0' : 'rgba(226, 38, 43, 0.06)',
                  color: myStatus.checkedIn ? '#15803d' : '#e2262b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {myStatus.checkedIn ? <CheckCircle2 size={22} /> : <Navigation size={22} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                    {myStatus.checkedIn ? 'You are Checked In for Today!' : `Welcome back, ${myStatus.employee.name}!`}
                  </h3>
                  <p className="adminHint" style={{ margin: '4px 0 0', color: myStatus.checkedIn ? '#166534' : '#64748b' }}>
                    {myStatus.checkedIn 
                      ? 'Your presence and job-site GPS coordinates have been recorded.' 
                      : 'Tap below to log your daily attendance and GPS location.'
                    }
                  </p>
                </div>
              </div>

              {!myStatus.checkedIn ? (
                <div style={{ marginTop: '16px' }}>
                  <button 
                    className="primary" 
                    onClick={handleSelfCheckIn}
                    disabled={checkingIn}
                    style={{
                      borderRadius: '10px',
                      padding: '12px 24px',
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(226, 38, 43, 0.25)'
                    }}
                  >
                    <MapPin size={16} className={checkingIn ? 'animate-pulse' : ''} />
                    {checkingIn ? 'Locating via GPS...' : 'Mark Present (GPS Check-In)'}
                  </button>
                  {geoError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600 }}>
                      <AlertCircle size={15} />
                      <span>{geoError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px', padding: '14px', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '10px', border: '1px solid rgba(21, 128, 61, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                    <Clock size={16} />
                    <span>Check-in Time: <b>{myStatus.attendance.checkInTime}</b></span>
                  </div>
                  {myStatus.attendance.checkInLocation && (
                    <a 
                      href={myStatus.attendance.checkInLocation} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#e2262b', fontWeight: 700, textDecoration: 'none' }}
                    >
                      <MapPin size={16} />
                      <span>View GPS Location <ExternalLink size={12} /></span>
                    </a>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Manual Entry Form */}
          <section className="adminCard">
            <h3>Mark General Labor / Staff Attendance &amp; Wages</h3>
            <p className="adminHint" style={{ marginBottom: '20px' }}>Log attendance along with today's applicable wage rate, overtime extra duty, and daily cash advance payments.</p>
            
            <form onSubmit={mark} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Employee *</label>
                  <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required style={{ width: '100%', padding: '10px' }}>
                    <option value="">Select employee</option>
                    {employees.filter(e => e.active !== false).map((e) => <option key={e.id} value={e.id}>{e.name} ({e.role || 'No Role'})</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required style={{ width: '100%', padding: '10px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Status</label>
                  <select value={form.present} onChange={(e) => setForm({ ...form, present: e.target.value === 'true' })} style={{ width: '100%', padding: '10px' }}>
                    <option value="true">Present</option>
                    <option value="false">Absent</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Hours Worked</label>
                  <input type="number" step="0.5" placeholder="Hours (e.g. 8)" value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} style={{ width: '100%', padding: '10px' }} />
                </div>
              </div>

              {form.present && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Daily Wage Rate (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 800" 
                      value={form.dailyRate} 
                      onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} 
                      style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Extra Duty / OT (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 200" 
                      value={form.extraDuty} 
                      onChange={(e) => setForm({ ...form, extraDuty: e.target.value })} 
                      style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Daily Advance / Cash (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 500" 
                      value={form.advancePaid} 
                      onChange={(e) => setForm({ ...form, advancePaid: e.target.value })} 
                      style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <input 
                  placeholder="Optional notes or work location descriptions..." 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                  style={{ flex: 1, minWidth: '220px', padding: '10px' }}
                />
                <button className="primary" style={{ borderRadius: '10px', height: '46px', padding: '0 24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Mark Record
                </button>
              </div>
            </form>
            {msg && <p style={{ margin: '12px 0 0', fontSize: '0.82rem', fontWeight: 700, color: msg.includes('successfully') ? '#059669' : '#b91c1c' }}>{msg}</p>}
          </section>

          {/* Attendance List */}
          <section className="adminCard">
            <h3>Recent Attendance &amp; Wages Feed</h3>
            <p className="adminHint" style={{ marginBottom: '24px' }}>Review past logs, calculated daily payments, advances, and location stamps.</p>
            
            <div className="tableList">
              {list.map((a) => {
                const isSelfCheckIn = a.notes === 'Self Check-in';
                return (
                  <div className="tableRow" key={a.id} style={{ 
                    borderLeftColor: !a.present ? '#ef4444' : (isSelfCheckIn ? '#10b981' : '#475569'),
                    background: !a.present ? '#fef2f2' : '#ffffff'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <b style={{ fontSize: '0.98rem' }}>{empName(a.employee.id)}</b>
                        <span style={{ 
                          background: a.present ? '#ecfdf5' : '#fef2f2',
                          color: a.present ? '#059669' : '#dc2626',
                          border: `1px solid ${a.present ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.15)'}`,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '20px'
                        }}>
                          {a.present ? 'PRESENT' : 'ABSENT'}
                        </span>
                        {isSelfCheckIn && (
                          <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid rgba(37,99,235,0.15)', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Compass size={10} /> GPS CHECK-IN
                          </span>
                        )}
                      </div>
                      <div className="tableSub" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '6px' }}>
                        <span>Date: <b>{a.date}</b></span>
                        {a.present && <span>Hours: <b>{a.hoursWorked ?? 0}h</b></span>}
                        {a.present && <span>Rate: <b>₹{(a.dailyRate ?? 0).toLocaleString('en-IN')}</b></span>}
                        {a.present && a.extraDuty > 0 && <span style={{ color: '#059669', fontWeight: 'bold' }}>OT: +₹{a.extraDuty.toLocaleString('en-IN')}</span>}
                        {a.advancePaid > 0 && <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Cash Advance: -₹{a.advancePaid.toLocaleString('en-IN')}</span>}
                        {a.checkInTime && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1e293b' }}>
                            <Clock size={12} /> Logged: <b>{a.checkInTime}</b>
                          </span>
                        )}
                        {a.notes && !isSelfCheckIn && <span>Notes: <i>{a.notes}</i></span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {a.checkInLocation && (
                        <a 
                          href={a.checkInLocation} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="deleteBtn" 
                          style={{ 
                            borderColor: '#bbf7d0', 
                            color: '#15803d', 
                            background: '#f0fdf4',
                            textDecoration: 'none',
                            gap: '6px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            padding: '8px 14px'
                          }}
                        >
                          <MapPin size={14} /> Map Location
                        </a>
                      )}
                      <button className="deleteBtn" onClick={() => del(a.id)} style={{ padding: '8px 10px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {list.length === 0 && <p className="adminHint">No attendance records found.</p>}
            </div>
          </section>
        </>
      )}

      {/* SUBTAB 2: CALENDAR VIEW */}
      {subTab === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Calendar Grid on Left */}
          <section className="adminCard" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{monthNames[month]} {year}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={prevMonth} className="deleteBtn" style={{ padding: '6px' }}><ChevronLeft size={16} /></button>
                <button onClick={nextMonth} className="deleteBtn" style={{ padding: '6px' }}><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* Week Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            {/* Calendar Days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {blankDays.map(b => (
                <div key={`blank-${b}`} style={{ aspectRatio: '1', background: 'transparent' }} />
              ))}
              {daysArr.map(day => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = selectedCalDateStr === dateStr;
                
                // Get logs for this day to draw indicator dots
                const dayLogs = list.filter(a => a.date === dateStr);
                const hasPresent = dayLogs.some(a => a.present);
                const hasAbsent = dayLogs.some(a => !a.present);

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedCalDateStr(dateStr)}
                    style={{
                      aspectRatio: '1',
                      border: isSelected ? '2px solid #e2262b' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: isSelected ? '#fff5f5' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      fontSize: '0.88rem',
                      fontWeight: isSelected ? '800' : '500',
                      color: isSelected ? '#e2262b' : '#1e293b',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => { if(!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseOut={(e) => { if(!isSelected) e.currentTarget.style.background = '#ffffff'; }}
                  >
                    <span>{day}</span>
                    
                    {/* Status indicator dots */}
                    <div style={{ display: 'flex', gap: '3px', position: 'absolute', bottom: '6px' }}>
                      {hasPresent && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }} />}
                      {hasAbsent && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Day Details on Right */}
          <section className="adminCard" style={{ padding: '24px' }}>
            <span className="eyebrow">DAY LOGS</span>
            <h3 style={{ margin: '4px 0 16px' }}>
              Attendance on {new Date(selectedCalDateStr).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {selectedDayLogs.map(a => {
                const earned = a.present ? (a.dailyRate || 0) + (a.extraDuty || 0) : 0;
                const paid = a.advancePaid || 0;
                
                return (
                  <div key={a.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <b style={{ fontSize: '0.94rem', color: '#0f172a' }}>{empName(a.employee.id)}</b>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{a.employee.role || 'Laborer'}</span>
                      </div>
                      <span style={{
                        background: a.present ? '#ecfdf5' : '#fef2f2',
                        color: a.present ? '#059669' : '#dc2626',
                        fontSize: '0.66rem',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        {a.present ? 'PRESENT' : 'ABSENT'}
                      </span>
                    </div>

                    {a.present && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Earned Wage</span>
                          <b style={{ fontSize: '0.86rem', color: '#0f172a' }}>₹{(a.dailyRate || 0).toLocaleString('en-IN')}</b>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Extra Duty</span>
                          <b style={{ fontSize: '0.86rem', color: '#059669' }}>+₹{(a.extraDuty || 0).toLocaleString('en-IN')}</b>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Cash Advance</span>
                          <b style={{ fontSize: '0.86rem', color: '#dc2626' }}>-₹{(a.advancePaid || 0).toLocaleString('en-IN')}</b>
                        </div>
                      </div>
                    )}
                    
                    {a.present && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: '600', color: '#475569' }}>Net Balance for Day:</span>
                        <b style={{ color: earned - paid >= 0 ? '#1e293b' : '#dc2626' }}>
                          ₹{(earned - paid).toLocaleString('en-IN')} {earned - paid < 0 ? '(Paid Extra)' : ''}
                        </b>
                      </div>
                    )}

                    {a.notes && (
                      <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                        Note: {a.notes}
                      </p>
                    )}
                  </div>
                );
              })}
              {selectedDayLogs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p className="adminHint">No labor logs submitted for this date.</p>
                </div>
              )}
            </div>
          </section>

        </div>
      )}

      {/* SUBTAB 3: WAGE STATEMENT REPORT */}
      {subTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Report Filters Card */}
          <section className="adminCard" style={{ padding: '24px' }}>
            <h3>Generate Salary &amp; Advance Balance Report</h3>
            <p className="adminHint" style={{ marginBottom: '20px' }}>Filter by specific employees and date ranges to see overall earnings, cash advances, general payments, and pending balances.</p>

            <form onSubmit={generateReport} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Select Employee</label>
                <select 
                  value={reportRange.employeeId} 
                  onChange={(e) => setReportRange({ ...reportRange, employeeId: e.target.value })} 
                  style={{ width: '100%', padding: '10px' }}
                >
                  <option value="ALL">All Active Employees</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role || 'No Role'})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>From Date</label>
                <input 
                  type="date" 
                  value={reportRange.startDate} 
                  onChange={(e) => setReportRange({ ...reportRange, startDate: e.target.value })} 
                  required 
                  style={{ width: '100%', padding: '10px' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>To Date</label>
                <input 
                  type="date" 
                  value={reportRange.endDate} 
                  onChange={(e) => setReportRange({ ...reportRange, endDate: e.target.value })} 
                  required 
                  style={{ width: '100%', padding: '10px' }} 
                />
              </div>
              <div>
                <button className="primary" style={{ width: '100%', height: '46px', borderRadius: '10px', fontWeight: '700' }}>
                  Filter Report
                </button>
              </div>
            </form>
          </section>

          {/* Report Summary Blocks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="estCard" style={{ borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span>Overall Period Earnings</span>
                <b style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>₹{reportSummary.earned.toLocaleString('en-IN')}</b>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Base wage + extra duty sums</span>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="estCard" style={{ borderLeft: '4px solid #e2262b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span>Overall Paid / Advances</span>
                <b style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>₹{reportSummary.paid.toLocaleString('en-IN')}</b>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Daily advances + general wages</span>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef2f2', color: '#e2262b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={20} />
              </div>
            </div>

            <div className="estCard" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span>Outstanding Balance</span>
                <b style={{ fontSize: '1.25rem', fontWeight: '800', color: reportSummary.balance >= 0 ? '#d97706' : '#b91c1c' }}>
                  ₹{reportSummary.balance.toLocaleString('en-IN')}
                </b>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                  {reportSummary.balance >= 0 ? 'Pending to be paid' : 'Paid in excess'}
                </span>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircleDollarSign size={20} />
              </div>
            </div>
          </div>

          {/* Statement Table */}
          <section className="adminCard" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Statement Statement Details</h3>
              <button 
                onClick={() => window.print()} 
                style={{ 
                  background: '#f8fafc', 
                  border: '1.5px solid #cbd5e1', 
                  color: '#475569', 
                  padding: '6px 14px', 
                  borderRadius: '8px', 
                  fontWeight: '700', 
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Print Report
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 'bold' }}>
                    <th style={{ padding: '12px 8px' }}>Employee Name</th>
                    <th style={{ padding: '12px 8px' }}>Role</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Days Present</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Earned Wages</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Extra Duty</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Advances Given</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Gen Payments</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}>Total Earned</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}>Total Paid</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#e2262b' }}>Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.15s' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#0f172a' }}>{row.name}</td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize', color: '#475569' }}>{row.role.toLowerCase()}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold' }}>{row.presentDays} days</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#475569' }}>₹{row.earnedWages.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#059669', fontWeight: '500' }}>+₹{row.extraDuty.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#dc2626' }}>₹{row.advances.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#dc2626' }}>₹{row.generalPayments.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>₹{row.totalEarned.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>₹{row.totalPaid.toLocaleString('en-IN')}</td>
                      <td style={{ 
                        padding: '12px 8px', 
                        textAlign: 'right', 
                        fontWeight: '800', 
                        color: row.balance >= 0 ? '#d97706' : '#b91c1c' 
                      }}>
                        ₹{row.balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {reportData.length === 0 && (
                    <tr>
                      <td colSpan="10" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        No records logged for current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}

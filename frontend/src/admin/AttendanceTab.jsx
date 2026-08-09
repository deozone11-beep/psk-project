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
  User,
  UserCheck,
  Printer,
  FileText
} from 'lucide-react';
import { api } from './api';

const DEFAULT_DIGITAL_SIGNATURE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 70" width="180" height="60"><path d="M 15 45 C 30 15, 45 10, 55 30 C 65 50, 75 35, 85 22 C 95 12, 105 40, 120 30 C 135 20, 150 15, 160 38 C 170 52, 185 28, 200 22 C 215 16, 230 35, 250 28" fill="none" stroke="%231d4ed8" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><text x="20" y="58" font-family="'Brush Script MT', 'Dancing Script', cursive, sans-serif" font-size="22" font-weight="bold" fill="%231e40af" font-style="italic">S. Senthil Murugan</text></svg>`;

const DEFAULT_CIRCULAR_SEAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" width="90" height="90"><g transform="rotate(-6 70 70)"><circle cx="70" cy="70" r="64" fill="none" stroke="%23e2262b" stroke-width="3" stroke-dasharray="8 3"/><circle cx="70" cy="70" r="56" fill="none" stroke="%23e2262b" stroke-width="1.5"/><path id="circlePath" fill="none" d="M 22,70 A 48,48 0 1,1 118,70 A 48,48 0 1,1 22,70"/><text fill="%23e2262b" font-size="9.5" font-weight="900" font-family="sans-serif" letter-spacing="1"><textPath href="%23circlePath" startOffset="50%" text-anchor="middle">PSK BROTHERS BUILDERS</textPath></text><path id="circlePath2" fill="none" d="M 118,70 A 48,48 0 1,1 22,70"/><text fill="%23e2262b" font-size="8.5" font-weight="800" font-family="sans-serif" letter-spacing="1.5"><textPath href="%23circlePath2" startOffset="50%" text-anchor="middle">★ CHENNAI ★</textPath></text><circle cx="70" cy="70" r="32" fill="rgba(226,38,43,0.05)" stroke="%23e2262b" stroke-width="1"/><text x="70" y="66" text-anchor="middle" fill="%23e2262b" font-size="8" font-weight="900" font-family="sans-serif" letter-spacing="0.5">OFFICIAL</text><text x="70" y="78" text-anchor="middle" fill="%23e2262b" font-size="8" font-weight="900" font-family="sans-serif" letter-spacing="0.5">SEAL</text></g></svg>`;

export default function AttendanceTab({ creds }) {
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [list, setList] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subTab, setSubTab] = useState('daily'); // 'daily' | 'calendar' | 'report'
  const [payslipRow, setPayslipRow] = useState(null);
  
  const [form, setForm] = useState({ 
    employeeId: '', 
    date: new Date().toLocaleDateString('en-CA'), 
    present: true, 
    hoursWorked: 8, 
    notes: '',
    dailyRate: '',
    extraDuty: '',
    advancePaid: '',
    foodExpense: '',
    travelExpense: '',
    siteName: ''
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
  const [reportDailyLogs, setReportDailyLogs] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    api('/admin/employees', creds).then(setEmployees).catch(console.error);
    api('/admin/customers', creds).then(setCustomers).catch(console.error);
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
          advancePaid: Number(form.advancePaid || 0),
          foodExpense: Number(form.foodExpense || 0),
          travelExpense: Number(form.travelExpense || 0),
          siteName: form.siteName
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
        advancePaid: '',
        foodExpense: '',
        travelExpense: '',
        siteName: ''
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

      // Calculate payments (advances from attendance + general payments + food/travel cash)
      const advancesPaid = attLogs.reduce((sum, a) => sum + (a.advancePaid || 0), 0);
      const foodPaid = attLogs.reduce((sum, a) => sum + (a.foodExpense || 0), 0);
      const travelPaid = attLogs.reduce((sum, a) => sum + (a.travelExpense || 0), 0);
      
      const genPayments = payments.filter(p => {
        const d = new Date(p.date);
        return p.employee && p.employee.id === emp.id && d >= start && d <= end;
      }).reduce((sum, p) => sum + (p.amount || 0), 0);

      const totalPaid = advancesPaid + genPayments + foodPaid + travelPaid;
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
        food: foodPaid,
        travel: travelPaid,
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

    const dailyLogs = list.filter(a => {
      const d = new Date(a.date);
      const matchesEmp = reportRange.employeeId === 'ALL' || a.employee.id === Number(reportRange.employeeId);
      return matchesEmp && d >= start && d <= end;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    setReportDailyLogs(dailyLogs);
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
  const daysInMonth = totalDays;
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
      <div className={(payslipRow || reportModalOpen) ? "noPrint no-print" : ""} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Sub-tab Navigation */}
        <div className="noPrint" style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', gap: '24px', paddingBottom: '2px' }}>
        <button 
          onClick={() => setSubTab('daily')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '10px 4px',
            fontSize: '0.9rem',
            fontWeight: '700',
            color: subTab === 'daily' ? '#ff6b6b' : '#94a3b8',
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
            color: subTab === 'calendar' ? '#ff6b6b' : '#94a3b8',
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
            color: subTab === 'report' ? '#ff6b6b' : '#94a3b8',
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
              background: myStatus.checkedIn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(19, 27, 45, 0.8)',
              borderColor: myStatus.checkedIn ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              boxShadow: myStatus.checkedIn ? '0 10px 25px rgba(22, 163, 74, 0.15)' : '0 4px 20px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: myStatus.checkedIn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(226, 38, 43, 0.15)',
                  color: myStatus.checkedIn ? '#34d399' : '#ff6b6b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {myStatus.checkedIn ? <CheckCircle2 size={22} /> : <Navigation size={22} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>
                    {myStatus.checkedIn ? 'You are Checked In for Today!' : `Welcome back, ${myStatus.employee.name}!`}
                  </h3>
                  <p className="adminHint" style={{ margin: '4px 0 0', color: myStatus.checkedIn ? '#34d399' : '#94a3b8' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#ff6b6b', fontSize: '0.8rem', fontWeight: 600 }}>
                      <AlertCircle size={15} />
                      <span>{geoError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px', padding: '14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
                    <Clock size={16} />
                    <span>Check-in Time: <b>{myStatus.attendance.checkInTime}</b></span>
                  </div>
                  {myStatus.attendance.checkInLocation && (
                    <a 
                      href={myStatus.attendance.checkInLocation} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#ff6b6b', fontWeight: 700, textDecoration: 'none' }}
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
          <section className="adminCard" style={{ padding: '28px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(226, 38, 43, 0.2)', color: '#ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} />
              </div>
              <div>
                <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.25rem' }}>Mark General Labor / Staff Attendance &amp; Wages</h3>
                <p className="adminHint" style={{ margin: '2px 0 0', color: '#94a3b8' }}>Log attendance along with today's applicable wage rate, overtime extra duty, and daily cash advance payments.</p>
              </div>
            </div>
            
            <form onSubmit={mark} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Employee *</label>
                  <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.18)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}>
                    <option value="" style={{ background: '#0f172a' }}>Select employee</option>
                    {employees.filter(e => e.active !== false).map((e) => <option key={e.id} value={e.id} style={{ background: '#0f172a' }}>{e.name} ({e.role || 'No Role'})</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required style={{ width: '100%', padding: '11px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.18)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Status</label>
                  <select value={form.present} onChange={(e) => setForm({ ...form, present: e.target.value === 'true' })} style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.18)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}>
                    <option value="true" style={{ background: '#0f172a' }}>Present</option>
                    <option value="false" style={{ background: '#0f172a' }}>Absent</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Hours Worked</label>
                  <input type="number" step="0.5" placeholder="Hours (e.g. 8)" value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} style={{ width: '100%', padding: '11px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.18)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Job Site / Location</label>
                  <select 
                    value={form.siteName} 
                    onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                    style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.18)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                  >
                    <option value="" style={{ background: '#0f172a' }}>Select Job Site</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.projectName || c.displayName} style={{ background: '#0f172a' }}>
                        {c.projectName} ({c.displayName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.present && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', background: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Daily Wage Rate (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 800" 
                      value={form.dailyRate} 
                      onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} 
                      style={{ width: '100%', padding: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#34d399' }}>Extra Duty / OT (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 200" 
                      value={form.extraDuty} 
                      onChange={(e) => setForm({ ...form, extraDuty: e.target.value })} 
                      style={{ width: '100%', padding: '10px', border: '1px solid rgba(52, 211, 153, 0.3)', background: 'rgba(16, 185, 129, 0.1)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ff6b6b' }}>Food Cash (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 100" 
                      value={form.foodExpense} 
                      onChange={(e) => setForm({ ...form, foodExpense: e.target.value })} 
                      style={{ width: '100%', padding: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ff6b6b' }}>Travel Cash (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 50" 
                      value={form.travelExpense} 
                      onChange={(e) => setForm({ ...form, travelExpense: e.target.value })} 
                      style={{ width: '100%', padding: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ff6b6b' }}>Daily Advance / Cash (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 500" 
                      value={form.advancePaid} 
                      onChange={(e) => setForm({ ...form, advancePaid: e.target.value })} 
                      style={{ width: '100%', padding: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ffffff', borderRadius: '10px', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                  placeholder="Optional notes or work location descriptions..." 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                  style={{ flex: 1, minWidth: '240px', padding: '12px 14px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '12px', fontSize: '0.88rem' }}
                />
                <button className="primary" style={{ borderRadius: '12px', height: '46px', padding: '0 24px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '800', boxShadow: '0 4px 16px rgba(226, 38, 43, 0.4)' }}>
                  <Plus size={18} /> Mark Record
                </button>
              </div>
            </form>
            {msg && <p style={{ margin: '14px 0 0', fontSize: '0.85rem', fontWeight: 800, color: msg.includes('successfully') ? '#34d399' : '#ff6b6b' }}>{msg}</p>}
          </section>

          {/* Attendance Feed List */}
          <section className="adminCard" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.25rem' }}>Recent Attendance &amp; Wages Feed</h3>
            <p className="adminHint" style={{ margin: '4px 0 24px', color: '#94a3b8' }}>Review past logs, calculated daily payments, advances, and location stamps.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {list.map((a) => {
                const isSelfCheckIn = a.notes === 'Self Check-in';
                return (
                  <div key={a.id} style={{ 
                    borderLeft: `4px solid ${!a.present ? '#ff6b6b' : (isSelfCheckIn ? '#10b981' : '#3b82f6')}`,
                    background: !a.present ? 'rgba(220, 38, 38, 0.12)' : 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}>
                    {/* Header Row: Employee Name & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '0.95rem'
                        }}>
                          {(empName(a.employee.id) || 'W').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <b style={{ fontSize: '1.02rem', color: '#ffffff', fontWeight: '800' }}>{empName(a.employee.id)}</b>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                            <span style={{ 
                              background: a.present ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                              color: a.present ? '#34d399' : '#ff6b6b',
                              border: `1px solid ${a.present ? 'rgba(16,185,129,0.3)' : 'rgba(220,38,38,0.3)'}`,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '20px'
                            }}>
                              {a.present ? '● PRESENT' : '● ABSENT'}
                            </span>
                            {isSelfCheckIn && (
                              <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Compass size={10} /> GPS CHECK-IN
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {a.checkInLocation && (
                          <a 
                            href={a.checkInLocation} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                              borderColor: 'rgba(16, 185, 129, 0.3)', 
                              color: '#34d399', 
                              background: 'rgba(16, 185, 129, 0.15)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              padding: '8px 14px',
                              borderRadius: '10px',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <MapPin size={14} /> Map Location
                          </a>
                        )}
                        <button className="deleteBtn" onClick={() => del(a.id)} style={{ padding: '8px 12px', borderRadius: '10px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Chips Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem' }}>
                      <span style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontWeight: '600' }}>
                        📅 {a.date}
                      </span>
                      {a.present && (
                        <span style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontWeight: '600' }}>
                          ⏱️ {a.hoursWorked ?? 0} Hours
                        </span>
                      )}
                      {a.present && (
                        <span style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontWeight: '600' }}>
                          💰 Rate: ₹{(a.dailyRate ?? 0).toLocaleString('en-IN')}
                        </span>
                      )}
                      {a.present && a.extraDuty > 0 && (
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '4px 10px', borderRadius: '8px', fontWeight: '800' }}>
                          ➕ OT: +₹{a.extraDuty.toLocaleString('en-IN')}
                        </span>
                      )}
                      {a.advancePaid > 0 && (
                        <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ff6b6b', padding: '4px 10px', borderRadius: '8px', fontWeight: '800' }}>
                          💸 Cash Advance: -₹{a.advancePaid.toLocaleString('en-IN')}
                        </span>
                      )}
                      {a.foodExpense > 0 && (
                        <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ff6b6b', padding: '4px 10px', borderRadius: '8px', fontWeight: '800' }}>
                          🍱 Food: -₹{a.foodExpense.toLocaleString('en-IN')}
                        </span>
                      )}
                      {a.travelExpense > 0 && (
                        <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ff6b6b', padding: '4px 10px', borderRadius: '8px', fontWeight: '800' }}>
                          🚗 Travel: -₹{a.travelExpense.toLocaleString('en-IN')}
                        </span>
                      )}
                      {a.siteName && (
                        <span style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '4px 10px', borderRadius: '8px', fontWeight: '700' }}>
                          🏢 Site: {a.siteName}
                        </span>
                      )}
                      {a.checkInTime && (
                        <span style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#cbd5e1', padding: '4px 10px', borderRadius: '8px', fontWeight: '600' }}>
                          🕒 Logged: {a.checkInTime}
                        </span>
                      )}
                    </div>

                    {a.notes && !isSelfCheckIn && (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '8px' }}>
                        📝 Notes: <i style={{ color: '#cbd5e1' }}>{a.notes}</i>
                      </p>
                    )}
                  </div>
                );
              })}
              {list.length === 0 && <p className="adminHint">No attendance records found.</p>}
            </div>
          </section>
        </>
      )}

      {/* SUBTAB 2: CALENDAR VIEW */}
      {subTab === 'calendar' && (() => {
        // Calculate Month-Level Metrics for Analytics Column
        const currentMonthLogs = list.filter(a => {
          if (!a.date) return false;
          const parts = a.date.split('-');
          if (parts.length < 2) return false;
          const y = Number(parts[0]);
          const m = Number(parts[1]);
          return y === year && (m - 1) === month;
        });

        const totalMonthLogs = currentMonthLogs.length;
        const totalMonthPresent = currentMonthLogs.filter(a => a.present).length;
        const totalMonthAbsent = currentMonthLogs.filter(a => !a.present).length;
        const monthPresentRate = totalMonthLogs > 0 ? Math.round((totalMonthPresent / totalMonthLogs) * 100) : 100;

        const totalMonthBaseWage = currentMonthLogs.reduce((sum, a) => sum + (a.present ? (Number(a.dailyRate) || 0) : 0), 0);
        const totalMonthOT = currentMonthLogs.reduce((sum, a) => sum + (a.present ? (Number(a.extraDuty) || 0) : 0), 0);
        const totalMonthAdvances = currentMonthLogs.reduce((sum, a) => sum + (Number(a.advancePaid) || 0) + (Number(a.foodExpense) || 0) + (Number(a.travelExpense) || 0), 0);
        const totalMonthNetPayout = (totalMonthBaseWage + totalMonthOT) - totalMonthAdvances;

        // Group attendance by day for the trend chart
        const dailyCounts = {};
        for (let d = 1; d <= daysInMonth; d++) {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayCount = list.filter(a => a.date === dateKey && a.present).length;
          dailyCounts[d] = dayCount;
        }
        const maxDailyCount = Math.max(...Object.values(dailyCounts), 1);

        return (
          <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr 320px', gap: '20px', alignItems: 'flex-start', width: '100%' }}>
            
            {/* COLUMN 1: Calendar Grid on Left */}
            <section className="adminCard" style={{ padding: '20px', borderRadius: '18px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: '800' }}>{monthNames[month]} {year}</h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>Tap day to view logs</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={prevMonth} className="deleteBtn" style={{ padding: '6px 10px', borderRadius: '8px', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)' }}><ChevronLeft size={16} /></button>
                  <button onClick={nextMonth} className="deleteBtn" style={{ padding: '6px 10px', borderRadius: '8px', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)' }}><ChevronRight size={16} /></button>
                </div>
              </div>

              {/* Week Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: '800', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '8px' }}>
                <div style={{ color: '#ff6b6b' }}>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
              </div>

              {/* Calendar Days */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                {blankDays.map(b => (
                  <div key={`blank-${b}`} style={{ aspectRatio: '1', background: 'transparent' }} />
                ))}
                {daysArr.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedCalDateStr === dateStr;
                  
                  const dayLogs = list.filter(a => a.date === dateStr);
                  const hasPresent = dayLogs.some(a => a.present);
                  const hasAbsent = dayLogs.some(a => !a.present);

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => setSelectedCalDateStr(dateStr)}
                      style={{
                        aspectRatio: '1',
                        border: isSelected ? '2px solid #e2262b' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        background: isSelected 
                          ? 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)' 
                          : (hasPresent ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.5)'),
                        boxShadow: isSelected ? '0 4px 12px rgba(226, 38, 43, 0.4)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? '900' : '600',
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={(e) => { if(!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                      onMouseOut={(e) => { if(!isSelected) e.currentTarget.style.background = hasPresent ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.5)'; }}
                    >
                      <span>{day}</span>
                      
                      {/* Status indicator dots */}
                      <div style={{ display: 'flex', gap: '3px', position: 'absolute', bottom: '3px' }}>
                        {hasPresent && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 4px #34d399' }} />}
                        {hasAbsent && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff6b6b' }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* COLUMN 2: Day Details (Selected Date Logs) */}
            <section className="adminCard" style={{ padding: '20px 22px', borderRadius: '18px' }}>
              <span className="eyebrow" style={{ color: '#ff6b6b', fontWeight: '800' }}>DAY LOGS</span>
              <h3 style={{ margin: '4px 0 16px', color: '#ffffff', fontSize: '1.2rem', fontWeight: '800' }}>
                Attendance on {new Date(selectedCalDateStr).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>

              {/* Selected Day Summary Bar */}
              {selectedDayLogs.length > 0 && (
                <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', background: 'rgba(15, 23, 42, 0.8)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: '800' }}>Logged Workers</span>
                    <b style={{ fontSize: '0.9rem', color: '#ffffff' }}>{selectedDayLogs.length} Records</b>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '14px' }}>
                    <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: '800' }}>Present Count</span>
                    <b style={{ fontSize: '0.9rem', color: '#34d399' }}>{selectedDayLogs.filter(a => a.present).length} Present</b>
                  </div>
                </div>
              )}

              {/* Scrollable Worker Logs Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                {selectedDayLogs.map(a => {
                  const earned = a.present ? (a.dailyRate || 0) + (a.extraDuty || 0) : 0;
                  const paid = a.advancePaid || 0;
                  const net = earned - paid;
                  
                  return (
                    <div key={a.id} style={{ padding: '12px 14px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '0.8rem'
                          }}>
                            {(empName(a.employee.id) || 'W').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <b style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: '800' }}>{empName(a.employee.id)}</b>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: '6px' }}>({a.employee.role || 'Laborer'})</span>
                          </div>
                        </div>

                        <span style={{
                          background: a.present ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                          color: a.present ? '#34d399' : '#ff6b6b',
                          border: `1px solid ${a.present ? 'rgba(16,185,129,0.3)' : 'rgba(220,38,38,0.3)'}`,
                          fontSize: '0.64rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '20px'
                        }}>
                          {a.present ? '● PRESENT' : '● ABSENT'}
                        </span>
                      </div>

                      {a.present && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', fontSize: '0.76rem' }}>
                          <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '6px', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            Base: <b style={{ color: '#ffffff' }}>₹{(a.dailyRate || 0).toLocaleString('en-IN')}</b>
                          </span>

                          {a.extraDuty > 0 && (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '6px', color: '#34d399', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                              OT: +₹{a.extraDuty.toLocaleString('en-IN')}
                            </span>
                          )}

                          {a.advancePaid > 0 && (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '3px 8px', borderRadius: '6px', color: '#ff6b6b', fontWeight: '700', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                              Advance: -₹{a.advancePaid.toLocaleString('en-IN')}
                            </span>
                          )}

                          <span style={{ 
                            marginLeft: 'auto',
                            background: net >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                            padding: '3px 10px', 
                            borderRadius: '8px', 
                            color: net >= 0 ? '#34d399' : '#ff6b6b', 
                            fontWeight: '800', 
                            border: `1px solid ${net >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` 
                          }}>
                            Net: ₹{net.toLocaleString('en-IN')} {net < 0 ? '(Overpaid)' : ''}
                          </span>
                        </div>
                      )}

                      {a.checkInLocation && (
                        <a 
                          href={a.checkInLocation} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ 
                            color: '#34d399', 
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <MapPin size={12} /> GPS Location
                        </a>
                      )}

                      {a.notes && (
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.02)', padding: '4px 8px', borderRadius: '6px' }}>
                          📝 Note: {a.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
                {selectedDayLogs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 0', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.12)' }}>
                    <p className="adminHint" style={{ color: '#94a3b8', margin: 0, fontSize: '0.82rem' }}>No labor logs submitted for this date.</p>
                  </div>
                )}
              </div>
            </section>

            {/* COLUMN 3: Right Side Monthly Analytics & Visual Chart Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Card 1: Attendance Rate Gauge & Stat Cards */}
              <section className="adminCard" style={{ padding: '20px', borderRadius: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} style={{ color: '#34d399' }} />
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#ffffff', fontWeight: '800' }}>Monthly Performance</h4>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                    {monthNames[month]} {year}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(15, 23, 42, 0.7)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="60" height="60" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3.8" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#34d399" strokeWidth="3.8" strokeDasharray={`${monthPresentRate}, 100`} />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '0.78rem', fontWeight: '900', color: '#ffffff' }}>{monthPresentRate}%</span>
                  </div>
                  <div>
                    <b style={{ fontSize: '0.98rem', color: '#ffffff', display: 'block' }}>{totalMonthPresent} / {totalMonthLogs} Days Logged</b>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{totalMonthAbsent} Absences logged this month</span>
                  </div>
                </div>
              </section>

              {/* Card 2: Daily Attendance Trend Mini Bar Chart */}
              <section className="adminCard" style={{ padding: '20px', borderRadius: '18px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: '#ffffff', fontWeight: '800' }}>Daily Attendance Trend</h4>
                <p style={{ margin: '0 0 14px', fontSize: '0.72rem', color: '#94a3b8' }}>Present worker count across days of {monthNames[month]}</p>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '90px', padding: '10px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                    const count = dailyCounts[d] || 0;
                    const heightPct = count > 0 ? Math.max((count / maxDailyCount) * 100, 15) : 8;
                    const isTodaySelected = selectedCalDateStr === `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                    return (
                      <div 
                        key={d}
                        onClick={() => setSelectedCalDateStr(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)}
                        title={`Day ${d}: ${count} Present`}
                        style={{
                          flex: 1,
                          height: `${heightPct}%`,
                          background: isTodaySelected 
                            ? 'linear-gradient(180deg, #e2262b 0%, #991b1b 100%)' 
                            : (count > 0 ? 'linear-gradient(180deg, #34d399 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.08)'),
                          borderRadius: '3px',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      />
                    );
                  })}
                </div>
              </section>

              {/* Card 3: Monthly Payroll Expenditure Summary */}
              <section className="adminCard" style={{ padding: '20px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)', border: '1px solid rgba(226, 38, 43, 0.3)' }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#ff6b6b', fontWeight: '800' }}>MONTHLY PAYROLL SUMMARY</span>
                <div style={{ margin: '8px 0 14px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Net Monthly Wage Payout</span>
                  <b style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: '900' }}>₹{totalMonthNetPayout.toLocaleString('en-IN')}</b>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.66rem' }}>Base Wages</span>
                    <b style={{ color: '#ffffff' }}>₹{totalMonthBaseWage.toLocaleString('en-IN')}</b>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ color: '#34d399', display: 'block', fontSize: '0.66rem' }}>Total OT Paid</span>
                    <b style={{ color: '#34d399' }}>+₹{totalMonthOT.toLocaleString('en-IN')}</b>
                  </div>
                </div>
              </section>

            </div>

          </div>
        );
      })()}

      {/* SUBTAB 3: WAGE STATEMENT REPORT */}
      {subTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Print-Only Official Letterhead Header */}
          <div className="print-only-header" style={{ borderBottom: '3px solid #e2262b', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#0f172a' }}>PSK BROTHERS BUILDERS &amp; CONSTRUCTIONS</h1>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#e2262b', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>
                  OFFICIAL LABOR ATTENDANCE &amp; WAGE STATEMENT REPORT
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                <div><strong>Report Period:</strong> {reportRange.startDate} to {reportRange.endDate}</div>
                <div><strong>Generated Date:</strong> {new Date().toLocaleDateString('en-IN')}</div>
              </div>
            </div>
          </div>

          {/* Report Filters Card (Hidden during Printing) */}
          <section className="adminCard no-print" style={{ padding: '24px' }}>
            <h3 style={{ color: '#ffffff' }}>Generate Salary &amp; Advance Balance Report</h3>
            <p className="adminHint" style={{ marginBottom: '20px', color: '#94a3b8' }}>Filter by specific employees and date ranges to see overall earnings, cash advances, general payments, and pending balances.</p>

            <form onSubmit={generateReport} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Select Employee</label>
                <select 
                  value={reportRange.employeeId} 
                  onChange={(e) => setReportRange({ ...reportRange, employeeId: e.target.value })} 
                  style={{ width: '100%', padding: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '10px' }}
                >
                  <option value="ALL" style={{ background: '#0f172a' }}>All Active Employees</option>
                  {employees.map(e => <option key={e.id} value={e.id} style={{ background: '#0f172a' }}>{e.name} ({e.role || 'No Role'})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>From Date</label>
                <input 
                  type="date" 
                  value={reportRange.startDate} 
                  onChange={(e) => setReportRange({ ...reportRange, startDate: e.target.value })} 
                  required 
                  style={{ width: '100%', padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '10px' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>To Date</label>
                <input 
                  type="date" 
                  value={reportRange.endDate} 
                  onChange={(e) => setReportRange({ ...reportRange, endDate: e.target.value })} 
                  required 
                  style={{ width: '100%', padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '10px' }} 
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
            <div className="statCard" style={{ borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#94a3b8' }}>Overall Period Earnings</span>
                <b style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>₹{reportSummary.earned.toLocaleString('en-IN')}</b>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'none' }}>Base wage + extra duty sums</span>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="statCard" style={{ borderLeft: '4px solid #e2262b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#94a3b8' }}>Overall Paid / Advances</span>
                <b style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>₹{reportSummary.paid.toLocaleString('en-IN')}</b>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'none' }}>Daily advances + general wages</span>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(226, 38, 43, 0.2)', color: '#ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={20} />
              </div>
            </div>

            <div className="statCard" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#94a3b8' }}>Outstanding Balance</span>
                <b style={{ fontSize: '1.25rem', fontWeight: '800', color: reportSummary.balance >= 0 ? '#fbbf24' : '#ff6b6b' }}>
                  ₹{reportSummary.balance.toLocaleString('en-IN')}
                </b>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'none' }}>
                  {reportSummary.balance >= 0 ? 'Pending to be paid' : 'Paid in excess'}
                </span>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircleDollarSign size={20} />
              </div>
            </div>
          </div>

          {/* Statement Table */}
          <section className="adminCard" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#ffffff' }}>Labor Wage Statement Summary</h3>
              <button 
                className="no-print"
                onClick={() => setReportModalOpen(true)} 
                style={{ 
                  background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)', 
                  border: 'none', 
                  color: '#ffffff', 
                  padding: '8px 18px', 
                  borderRadius: '10px', 
                  fontWeight: '800', 
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(226, 38, 43, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={15} /> Print Report
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontWeight: 'bold' }}>
                    <th style={{ padding: '12px 8px' }}>Employee Name</th>
                    <th style={{ padding: '12px 8px' }}>Role</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Days Present</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Earned Wages</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Extra Duty</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Advances</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Food Cash</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Travel Cash</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Gen Payments</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#ffffff' }}>Total Earned</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#ffffff' }}>Total Paid</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#ff6b6b' }}>Balance Due</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Payslip PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', transition: 'all 0.15s' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#ffffff' }}>{row.name}</td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize', color: '#cbd5e1' }}>{row.role.toLowerCase()}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#ffffff' }}>{row.presentDays} days</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#cbd5e1' }}>₹{row.earnedWages.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#34d399', fontWeight: '500' }}>+₹{row.extraDuty.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ff6b6b' }}>₹{row.advances.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ff6b6b' }}>₹{row.food.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ff6b6b' }}>₹{row.travel.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ff6b6b' }}>₹{row.generalPayments.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#ffffff' }}>₹{row.totalEarned.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#ffffff' }}>₹{row.totalPaid.toLocaleString('en-IN')}</td>
                      <td style={{ 
                        padding: '12px 8px', 
                        textAlign: 'right', 
                        fontWeight: '800', 
                        color: row.balance >= 0 ? '#fbbf24' : '#ff6b6b' 
                      }}>
                        ₹{row.balance.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button 
                          onClick={() => setPayslipRow(row)}
                          style={{ 
                            background: 'rgba(226, 38, 43, 0.15)', 
                            border: '1px solid rgba(226, 38, 43, 0.35)', 
                            color: '#ff6b6b', 
                            padding: '6px 12px', 
                            fontSize: '0.8rem', 
                            fontWeight: '800', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '5px',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#e2262b';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(226, 38, 43, 0.15)';
                            e.currentTarget.style.color = '#ff6b6b';
                          }}
                        >
                          <FileText size={13} /> Payslip
                        </button>
                      </td>
                    </tr>
                  ))}
                  {reportData.length === 0 && (
                    <tr>
                      <td colSpan="12" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        No records logged for current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Day-Wise Detailed Ledger Table */}
          <section className="adminCard" style={{ padding: '24px', borderRadius: '16px', marginTop: '20px' }}>
            <h3 style={{ margin: 0, marginBottom: '16px', color: '#ffffff' }}>Detailed Day-Wise Ledger</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontWeight: 'bold' }}>
                    <th style={{ padding: '12px 8px' }}>Date</th>
                    {reportRange.employeeId === 'ALL' && <th style={{ padding: '12px 8px' }}>Employee</th>}
                    <th style={{ padding: '12px 8px' }}>Status</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Base Wage</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Extra Duty</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Advance Paid</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Food Cash</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Travel Cash</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#ffffff' }}>Daily Balance</th>
                    <th style={{ padding: '12px 8px' }}>Notes / Location</th>
                  </tr>
                </thead>
                <tbody>
                  {reportDailyLogs.map(a => {
                    const earned = a.present ? (a.dailyRate || 0) + (a.extraDuty || 0) : 0;
                    const paid = (a.advancePaid || 0) + (a.foodExpense || 0) + (a.travelExpense || 0);
                    const bal = earned - paid;
                    
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#cbd5e1' }}>{a.date}</td>
                        {reportRange.employeeId === 'ALL' && (
                          <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#ffffff' }}>{empName(a.employee.id)}</td>
                        )}
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            background: a.present ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                            color: a.present ? '#34d399' : '#ff6b6b',
                            fontSize: '0.66rem',
                            fontWeight: '800',
                            padding: '2px 8px',
                            borderRadius: '10px'
                          }}>
                            {a.present ? 'PRESENT' : 'ABSENT'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#cbd5e1' }}>
                          ₹{a.present ? (a.dailyRate || 0).toLocaleString('en-IN') : '0'}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#34d399', fontWeight: '500' }}>
                          {a.present && a.extraDuty > 0 ? `+₹${a.extraDuty.toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ff6b6b' }}>
                          {a.advancePaid > 0 ? `-₹${a.advancePaid.toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ff6b6b' }}>
                          {a.foodExpense > 0 ? `-₹${a.foodExpense.toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ff6b6b' }}>
                          {a.travelExpense > 0 ? `-₹${a.travelExpense.toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          textAlign: 'right', 
                          fontWeight: '800',
                          color: bal >= 0 ? '#ffffff' : '#ff6b6b'
                        }}>
                          ₹{bal.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {a.siteName && <span style={{ fontWeight: '600', color: '#60a5fa' }}>🏢 {a.siteName}</span>}
                            {a.checkInLocation ? (
                              <a 
                                href={a.checkInLocation} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ color: '#ff6b6b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', fontWeight: '700' }}
                              >
                                <MapPin size={11} /> GPS Location
                              </a>
                            ) : (
                              a.notes && <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>{a.notes}</span>
                            )}
                            {!a.siteName && !a.checkInLocation && !a.notes && <span style={{ color: '#64748b' }}>-</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {reportDailyLogs.length === 0 && (
                    <tr>
                      <td colSpan={reportRange.employeeId === 'ALL' ? 10 : 9} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        No daily logs found for current filters.
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

      {payslipRow && (
        <div className="modalOverlay" style={{ zIndex: 1000 }}>
          <div className="modalCard modalLetterheadView" style={{ maxWidth: '680px', background: '#0d1322', borderRadius: '20px', padding: '0', border: '1px solid rgba(255, 255, 255, 0.15)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div className="modalHeader noPrint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>OFFICIAL PAYROLL DOCUMENT</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.2rem', color: '#ffffff', fontWeight: '800' }}>Official Worker Wage Slip</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => window.print()} 
                  style={{ 
                    background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)', 
                    color: '#ffffff', 
                    border: 'none', 
                    padding: '9px 20px', 
                    borderRadius: '10px', 
                    cursor: 'pointer', 
                    fontWeight: '800', 
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 14px rgba(226, 38, 43, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={15} /> Print Payslip
                </button>
                <button 
                  onClick={() => setPayslipRow(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontWeight: '800',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#0d1322' }}>
              <div className="printableArea" style={{ border: '2px solid #0f172a', padding: '14px 18px', borderRadius: '12px', background: '#ffffff', color: '#0f172a', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                {/* Header with Official Logo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #e2262b', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div>
                    <img src="/logo.png" alt="PSK Brothers Builders &amp; Constructions" style={{ height: '48px', width: 'auto', objectFit: 'contain', display: 'block' }} />
                    <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: '600', marginTop: '3px' }}>
                      Choolaimedu, Chennai - 600094 • Mob: +91 99414 26479 / +91 90031 77934
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ background: '#e2262b', color: '#ffffff', padding: '4px 12px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '900', letterSpacing: '0.5px' }}>WORKER PAYSLIP</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', marginTop: '3px' }}>{reportRange.startDate} to {reportRange.endDate}</div>
                  </div>
                </div>

              {/* Employee Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.8rem' }}>
                <div><strong>Worker Name:</strong> {payslipRow.name}</div>
                <div><strong>Role / Category:</strong> {payslipRow.role}</div>
                <div><strong>Days Present:</strong> {payslipRow.presentDays} Days</div>
                <div><strong>Daily Rate:</strong> ₹{(payslipRow.earnedWages / (payslipRow.presentDays || 1)).toFixed(0)} / day</div>
              </div>

              {/* Wage Calculation Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '12px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Earned (₹)</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Deductions / Paid (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 8px' }}>Basic Wages ({payslipRow.presentDays} Days)</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{payslipRow.earnedWages.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>-</td>
                  </tr>
                  {payslipRow.extraDuty > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 8px' }}>Extra Duty / Overtime</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{payslipRow.extraDuty.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>-</td>
                    </tr>
                  )}
                  {payslipRow.advances > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 8px' }}>Advance Received / Deducted</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#dc2626' }}>₹{payslipRow.advances.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  {payslipRow.food > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 8px' }}>Food Allowance Deducted</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#dc2626' }}>₹{payslipRow.food.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  {payslipRow.travel > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 8px' }}>Travel Expense Deducted</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#dc2626' }}>₹{payslipRow.travel.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  {payslipRow.generalPayments > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 8px' }}>Part Payments Released</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#dc2626' }}>₹{payslipRow.generalPayments.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Net Amount Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NET WAGE PAYABLE:</div>
                  <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>₹{payslipRow.balance.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: payslipRow.balance >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                  {payslipRow.balance >= 0 ? 'STATUS: DUE FOR PAYMENT' : 'STATUS: SETTLED IN ADVANCE'}
                </div>
              </div>

              {/* Signatures & Stamp Seal Section: Left (Worker Sign), Center (Official Stamp Seal), Right (Owner Authorized Signature) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1.2fr', alignItems: 'flex-end', gap: '14px', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                {/* Left: Worker Signature */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '46px', borderBottom: '1px dashed #94a3b8', width: '90%', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Worker Sign / Thumb</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Worker Signature / Thumb</div>
                </div>

                {/* Center: Official Company Stamp Seal */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={localStorage.getItem('psk_custom_seal') || DEFAULT_CIRCULAR_SEAL_SVG} 
                    alt="PSK Official Seal" 
                    style={{ height: '56px', width: '56px', objectFit: 'contain' }} 
                  />
                  <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                    OFFICIAL SEAL
                  </span>
                </div>

                {/* Right: Owner Authorized Digital Signature */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '2px' }}>
                    <img 
                      src={localStorage.getItem('psk_custom_signature') || DEFAULT_DIGITAL_SIGNATURE_SVG} 
                      alt="Owner Authorized Signature" 
                      style={{ height: '48px', maxWidth: '160px', objectFit: 'contain' }} 
                    />
                  </div>
                  <div style={{ borderTop: '1px dashed #94a3b8', width: '95%', paddingTop: '3px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f172a' }}>For PSK BROTHERS BUILDERS</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>(Authorized Signatory & Owner)</div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportModalOpen && (
        <div className="modalOverlay" style={{ zIndex: 1000 }}>
          <div className="modalCard modalLetterheadView" style={{ maxWidth: '900px', background: '#0d1322', borderRadius: '20px', padding: '0', border: '1px solid rgba(255, 255, 255, 0.15)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            {/* Modal Header */}
            <div className="modalHeader noPrint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>OFFICIAL REPORT DOCUMENT</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.1rem', color: '#ffffff', fontWeight: '800' }}>Labor Wage Statement Summary Report</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => window.print()} 
                  style={{ 
                    background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)', 
                    color: '#ffffff', 
                    border: 'none', 
                    padding: '8px 20px', 
                    borderRadius: '10px', 
                    fontWeight: '800', 
                    fontSize: '0.85rem', 
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(226, 38, 43, 0.4)'
                  }}
                >
                  <Printer size={16} /> Print Report
                </button>
                <button 
                  onClick={() => setReportModalOpen(false)} 
                  style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: 'none', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontWeight: '800' }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Printable Report Document */}
            <div style={{ padding: '20px', background: '#0d1322', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="printableArea" style={{ border: '2px solid #0f172a', padding: '20px 24px', borderRadius: '12px', background: '#ffffff', color: '#0f172a', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #e2262b', paddingBottom: '10px', marginBottom: '14px' }}>
                  <div>
                    <img src="/logo.png" alt="PSK Brothers" style={{ height: '48px', width: 'auto', objectFit: 'contain', display: 'block' }} />
                    <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: '600', marginTop: '3px' }}>
                      Choolaimedu, Chennai - 600094 • Mob: +91 99414 26479 / +91 90031 77934
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ background: '#e2262b', color: '#ffffff', padding: '4px 12px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: '900', letterSpacing: '0.5px' }}>LABOR WAGE STATEMENT REPORT</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', marginTop: '3px' }}>
                      Period: {reportRange.startDate} to {reportRange.endDate}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '1px' }}>
                      Generated Date: {new Date().toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Filter Context Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '14px', fontSize: '0.78rem' }}>
                  <div><strong>Filtered Employee:</strong> {reportRange.employeeId === 'ALL' ? 'All Active Laborers' : empName(reportRange.employeeId)}</div>
                  <div><strong>Total Workers Included:</strong> {reportData.length} Workers</div>
                </div>

                {/* 3 Stat Cards Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#166534', fontWeight: '800', textTransform: 'uppercase' }}>Period Total Earned</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#15803d' }}>₹{reportSummary.earned.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: '800', textTransform: 'uppercase' }}>Period Advances / Paid</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#dc2626' }}>₹{reportSummary.paid.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#92400e', fontWeight: '800', textTransform: 'uppercase' }}>Outstanding Balance Due</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: reportSummary.balance >= 0 ? '#d97706' : '#dc2626' }}>₹{reportSummary.balance.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Wage Statement Summary Table */}
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#0f172a', fontWeight: '800' }}>Labor Wage Summary Overview</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem', marginBottom: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1', color: '#334155' }}>
                      <th style={{ padding: '5px 4px', textAlign: 'left' }}>Employee</th>
                      <th style={{ padding: '5px 4px', textAlign: 'left' }}>Role</th>
                      <th style={{ padding: '5px 4px', textAlign: 'center' }}>Present</th>
                      <th style={{ padding: '5px 4px', textAlign: 'right' }}>Base</th>
                      <th style={{ padding: '5px 4px', textAlign: 'right' }}>OT/Extra</th>
                      <th style={{ padding: '5px 4px', textAlign: 'right' }}>Advance</th>
                      <th style={{ padding: '5px 4px', textAlign: 'right' }}>Food</th>
                      <th style={{ padding: '5px 4px', textAlign: 'right' }}>Travel</th>
                      <th style={{ padding: '5px 4px', textAlign: 'right' }}>Gen Pay</th>
                      <th style={{ padding: '5px 4px', textAlign: 'right' }}>Earned</th>
                      <th style={{ padding: '5px 4px', textAlign: 'right' }}>Paid</th>
                      <th style={{ padding: '5px 4px', textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map(row => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '4px 4px', fontWeight: 'bold' }}>{row.name}</td>
                        <td style={{ padding: '4px 4px', textTransform: 'capitalize', color: '#475569' }}>{row.role}</td>
                        <td style={{ padding: '4px 4px', textAlign: 'center' }}>{row.presentDays}d</td>
                        <td style={{ padding: '4px 4px', textAlign: 'right' }}>₹{row.earnedWages.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '4px 4px', textAlign: 'right', color: '#16a34a' }}>+₹{row.extraDuty.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '4px 4px', textAlign: 'right', color: '#dc2626' }}>₹{row.advances.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '4px 4px', textAlign: 'right', color: '#dc2626' }}>₹{row.food.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '4px 4px', textAlign: 'right', color: '#dc2626' }}>₹{row.travel.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '4px 4px', textAlign: 'right', color: '#dc2626' }}>₹{row.generalPayments.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '4px 4px', textAlign: 'right', fontWeight: 'bold' }}>₹{row.totalEarned.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '4px 4px', textAlign: 'right', fontWeight: 'bold' }}>₹{row.totalPaid.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '4px 4px', textAlign: 'right', fontWeight: '800', color: row.balance >= 0 ? '#d97706' : '#dc2626' }}>₹{row.balance.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Detailed Day-Wise Ledger Table */}
                {reportDailyLogs.length > 0 && (
                  <div>
                    <h4 style={{ margin: '12px 0 6px 0', fontSize: '0.82rem', color: '#0f172a', fontWeight: '800' }}>Detailed Day-Wise Attendance &amp; Wage Ledger</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.66rem', marginBottom: '14px' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1', color: '#334155' }}>
                          <th style={{ padding: '4px 4px', textAlign: 'left' }}>Date</th>
                          {reportRange.employeeId === 'ALL' && (<th style={{ padding: '4px 4px' }}>Worker</th>)}
                          <th style={{ padding: '4px 4px' }}>Status</th>
                          <th style={{ padding: '4px 4px', textAlign: 'right' }}>Base</th>
                          <th style={{ padding: '4px 4px', textAlign: 'right' }}>OT</th>
                          <th style={{ padding: '4px 4px', textAlign: 'right' }}>Advance</th>
                          <th style={{ padding: '4px 4px', textAlign: 'right' }}>Food</th>
                          <th style={{ padding: '4px 4px', textAlign: 'right' }}>Travel</th>
                          <th style={{ padding: '4px 4px', textAlign: 'right' }}>Balance</th>
                          <th style={{ padding: '4px 4px' }}>Notes / Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportDailyLogs.map(a => {
                          const earned = a.present ? ((a.dailyRate || 0) + (a.extraDuty || 0)) : 0;
                          const paid = (a.advancePaid || 0) + (a.foodExpense || 0) + (a.travelExpense || 0);
                          const bal = earned - paid;
                          return (
                            <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '3px 4px', fontWeight: '600' }}>{a.date}</td>
                              {reportRange.employeeId === 'ALL' && (<td style={{ padding: '3px 4px', fontWeight: 'bold' }}>{empName(a.employee?.id || a.employeeId)}</td>)}
                              <td style={{ padding: '3px 4px' }}>{a.present ? 'P' : 'A'}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right' }}>₹{a.present ? (a.dailyRate || 0).toLocaleString('en-IN') : '0'}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right', color: '#16a34a' }}>{a.present && a.extraDuty > 0 ? '+₹' + a.extraDuty : '-'}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right', color: '#dc2626' }}>{a.advancePaid > 0 ? '-₹' + a.advancePaid : '-'}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right', color: '#dc2626' }}>{a.foodExpense > 0 ? '-₹' + a.foodExpense : '-'}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right', color: '#dc2626' }}>{a.travelExpense > 0 ? '-₹' + a.travelExpense : '-'}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 'bold', color: bal >= 0 ? '#0f172a' : '#dc2626' }}>₹{bal.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '3px 4px', fontSize: '0.66rem', color: '#64748b' }}>{a.siteName || a.notes || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Signatures & Seal Block */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1.2fr', alignItems: 'flex-end', gap: '14px', marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: '40px', borderBottom: '1px dashed #94a3b8', width: '90%', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>Prepared By (Staff)</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Prepared By Staff Sign</div>
                  </div>

                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={localStorage.getItem('psk_custom_seal') || DEFAULT_CIRCULAR_SEAL_SVG} alt="Seal" style={{ height: '52px', width: '52px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px' }}>OFFICIAL SEAL</span>
                  </div>

                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '2px' }}>
                      <img src={localStorage.getItem('psk_custom_signature') || DEFAULT_DIGITAL_SIGNATURE_SVG} alt="Owner Signature" style={{ height: '44px', maxWidth: '150px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ borderTop: '1px dashed #94a3b8', width: '95%', paddingTop: '3px' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#0f172a' }}>For PSK BROTHERS BUILDERS</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600' }}>(Authorized Signatory & Owner)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

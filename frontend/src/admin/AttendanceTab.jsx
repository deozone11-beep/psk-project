import React, { useEffect, useState } from 'react';
import { Plus, Trash2, MapPin, Clock, Navigation, CheckCircle2, Compass, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from './api';

export default function AttendanceTab({ creds }) {
  const [employees, setEmployees] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ employeeId: '', date: new Date().toLocaleDateString('en-CA'), present: true, hoursWorked: 8, notes: '' });
  const [msg, setMsg] = useState('');
  
  // Self check-in states
  const [myStatus, setMyStatus] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    api('/admin/employees', creds).then(setEmployees).catch(console.error);
    load();
    checkMyStatus();
  }, []);

  function load() {
    api('/admin/attendance', creds).then(setList).catch(console.error);
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
          hoursWorked: Number(form.hoursWorked) 
        }) 
      });
      setMsg('Attendance marked ✓');
      load();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
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

      {/* Manual Entry Form (typically for Admin to log site labor attendance) */}
      <section className="adminCard">
        <h3>Mark General Labor / Staff Attendance</h3>
        <p className="adminHint" style={{ marginBottom: '20px' }}>Select an active employee, date, and input hours worked to record on-site attendance manually.</p>
        
        <form onSubmit={mark} className="inlineForm" style={{ gap: '12px' }}>
          <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required style={{ minWidth: '180px' }}>
            <option value="">Select employee</option>
            {employees.filter(e => e.active !== false).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required style={{ width: '150px' }} />
          <select value={form.present} onChange={(e) => setForm({ ...form, present: e.target.value === 'true' })} style={{ width: '130px' }}>
            <option value="true">Present</option>
            <option value="false">Absent</option>
          </select>
          <input type="number" step="0.5" placeholder="Hours" value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} style={{ width: '100px' }} />
          <button className="primary" style={{ borderRadius: '10px', height: '45px', padding: '0 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Plus size={15} /> Mark</button>
        </form>
        {msg && <p style={{ margin: '12px 0 0', fontSize: '0.82rem', fontWeight: 700, color: msg.includes('marked') ? '#059669' : '#b91c1c' }}>{msg}</p>}
      </section>

      {/* Attendance List */}
      <section className="adminCard">
        <h3>Attendance Logs &amp; GPS Tracking</h3>
        <p className="adminHint" style={{ marginBottom: '24px' }}>Review the daily logs, check-in timestamps, and geographical location map links.</p>
        
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
                    {a.checkInTime && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1e293b' }}>
                        <Clock size={12} /> Logged at: <b>{a.checkInTime}</b>
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
    </div>
  );
}

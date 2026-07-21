import React, { useEffect, useState } from 'react';
import { Trash2, UserPlus, MessageSquare, Check, MapPin, User, Clock, X, Search, Calendar, ArrowRight } from 'lucide-react';
import { api } from './api';

export default function EnquiriesTab({ creds }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState([]);
  
  // Filtering states
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selection for details / chat
  const [selectedEnq, setSelectedEnq] = useState(null);
  const [chatMsg, setChatMsg] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('NEW');
  const [assignedEng, setAssignedEng] = useState('NONE');

  // Conversion modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertForm, setConvertForm] = useState({
    username: '',
    password: '',
    displayName: '',
    phone: '',
    projectName: '',
    estimatedSqft: '',
    email: ''
  });
  const [convertMsg, setConvertMsg] = useState('');

  useEffect(() => {
    load();
    loadEngineers();
  }, []);

  function load() {
    setLoading(true);
    const endpoint = creds.role === 'ENGINEER' ? '/admin/enquiries/assigned' : '/admin/enquiries';
    api(endpoint, creds)
      .then(setList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  function loadEngineers() {
    api('/admin/employees', creds)
      .then(res => {
        const engs = res.filter(e => e.username && e.active !== false);
        setEngineers(engs);
      })
      .catch(console.error);
  }

  useEffect(() => {
    if (selectedEnq) {
      setStatus(selectedEnq.status || 'NEW');
      setRemarks(selectedEnq.engineerRemarks || '');
      setAssignedEng(selectedEnq.assignedEngineerUsername || 'NONE');
    }
  }, [selectedEnq]);

  async function updateCRM(e) {
    e.preventDefault();
    if (!selectedEnq) return;
    try {
      const res = await api(`/admin/enquiries/${selectedEnq.id}`, creds, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          engineerRemarks: remarks,
          assignedEngineerUsername: assignedEng
        })
      });
      setSelectedEnq(res);
      alert('Enquiry settings updated successfully ✓');
      load();
    } catch (err) {
      alert(err.message || 'Update failed');
    }
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!chatMsg.trim() || !selectedEnq) return;
    try {
      const res = await api(`/admin/enquiries/${selectedEnq.id}/reply`, creds, {
        method: 'POST',
        body: JSON.stringify({ message: chatMsg })
      });
      setSelectedEnq(res);
      setChatMsg('');
      load();
    } catch (err) {
      alert(err.message || 'Failed to send reply');
    }
  }

  async function del(id) {
    if (!confirm('Are you sure you want to delete this enquiry record?')) return;
    try {
      await api(`/admin/enquiries/${id}`, creds, { method: 'DELETE' });
      if (selectedEnq?.id === id) setSelectedEnq(null);
      setList(p => p.filter(x => x.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  function openConvert(enq) {
    setConvertForm({
      username: enq.phone || '',
      password: 'psk@customer123',
      displayName: enq.name || '',
      phone: enq.phone || '',
      projectName: `${enq.name}'s Residence`,
      estimatedSqft: '1500',
      email: enq.email || ''
    });
    setConvertMsg('');
    setShowConvertModal(true);
  }

  async function submitConvert(e) {
    e.preventDefault();
    setConvertMsg('');
    try {
      const payload = {
        ...convertForm,
        estimatedSqft: Number(convertForm.estimatedSqft)
      };
      const res = await api(`/admin/enquiries/${selectedEnq.id}/convert`, creds, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.message) throw new Error(res.message);
      
      setConvertMsg('Enquiry converted successfully! Customer account created ✓');
      setTimeout(() => {
        setShowConvertModal(false);
        setSelectedEnq(null);
        load();
      }, 1500);
    } catch (err) {
      setConvertMsg(err.message || 'Conversion failed');
    }
  }

  const filteredList = list.filter(item => {
    const query = search.toLowerCase();
    const matchesSearch = 
      (item.trackId && item.trackId.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.phone && item.phone.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.service && item.service.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (startDate) {
      const start = new Date(startDate);
      const itemDate = new Date(item.createdAt);
      if (itemDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const itemDate = new Date(item.createdAt);
      if (itemDate > end) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedEnq ? '1fr 1fr' : '1fr', gap: '24px', transition: 'all 0.3s ease' }}>
      
      {/* List Panel */}
      <section className="adminCard" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3>Client Enquiries &amp; CRM ({filteredList.length})</h3>
          <button className="primary" onClick={load} style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem' }}>Refresh</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
            />
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          </div>
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', color: '#475569' }}
            />
          </div>
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', color: '#475569' }}
            />
          </div>
        </div>

        {loading ? (
          <p className="adminHint">Loading pipeline...</p>
        ) : filteredList.length === 0 ? (
          <p className="adminHint">No leads match filters.</p>
        ) : (
          <div className="tableList">
            {filteredList.map((en) => {
              const isSelected = selectedEnq?.id === en.id;
              return (
                <div 
                  className={`tableRow ${isSelected ? 'selected' : ''}`} 
                  key={en.id} 
                  onClick={() => setSelectedEnq(en)}
                  style={{ 
                    cursor: 'pointer',
                    borderLeftColor: en.status === 'CONVERTED' ? '#10b981' : (en.status === 'CLOSED' ? '#64748b' : '#e2262b'),
                    background: isSelected ? 'rgba(226,38,43,0.03)' : '#ffffff'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <b style={{ fontSize: '0.94rem' }}>{en.name}</b>
                      <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 'bold' }}>{en.trackId}</span>
                      <span style={{
                        background: en.status === 'CONVERTED' ? '#ecfdf5' : '#fffbeb',
                        color: en.status === 'CONVERTED' ? '#059669' : '#d97706',
                        fontSize: '0.64rem',
                        fontWeight: '800',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}>
                        {en.status || 'NEW'}
                      </span>
                    </div>
                    <div className="tableSub" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                      <span>Phone: <b>{en.phone}</b></span>
                      <span>Service: <b style={{ color: '#0f172a' }}>{en.service}</b></span>
                      <span>Date: <b>{new Date(en.createdAt).toLocaleDateString('en-IN')}</b></span>
                    </div>
                    {/* Visual Status Timeline Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px', gap: '4px', maxWidth: '380px' }}>
                      {['NEW', 'ASSIGNED', 'CONTACTED', 'CONVERTED'].map((stepName, stepIdx, arr) => {
                        const statusOrder = { 'NEW': 0, 'ASSIGNED': 1, 'CONTACTED': 2, 'CONVERTED': 3, 'CLOSED': -1 };
                        const currentIdx = statusOrder[en.status || 'NEW'];
                        const isCompleted = currentIdx >= stepIdx;
                        const isActive = currentIdx === stepIdx;
                        const stepLabels = {
                          'NEW': 'New',
                          'ASSIGNED': 'Assigned',
                          'CONTACTED': 'Contacted',
                          'CONVERTED': 'Converted'
                        };

                        return (
                          <React.Fragment key={stepName}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: en.status === 'CLOSED' ? '#cbd5e1' : (isCompleted ? '#e2262b' : '#e2e8f0'),
                                border: isActive ? '2px solid #fca5a5' : 'none',
                                boxSizing: 'content-box'
                              }} />
                              <span style={{ 
                                fontSize: '0.68rem', 
                                fontWeight: isActive ? '800' : '600',
                                color: en.status === 'CLOSED' ? '#94a3b8' : (isActive ? '#e2262b' : (isCompleted ? '#475569' : '#94a3b8'))
                              }}>
                                {stepLabels[stepName]}
                              </span>
                            </div>
                            {stepIdx < arr.length - 1 && (
                              <div style={{
                                flex: 1,
                                height: '2px',
                                background: en.status === 'CLOSED' ? '#e2e8f0' : (currentIdx > stepIdx ? '#e2262b' : '#e2e8f0'),
                                minWidth: '15px'
                              }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                      {en.status === 'CLOSED' && (
                        <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748b', marginLeft: '6px' }}>
                          (Closed)
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {en.location && (
                      <a 
                        href={en.location} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()} 
                        className="deleteBtn" 
                        style={{ color: '#059669', borderColor: '#bbf7d0', padding: '6px' }}
                      >
                        <MapPin size={14} />
                      </a>
                    )}
                    <button 
                      className="deleteBtn" 
                      onClick={(e) => { e.stopPropagation(); del(en.id); }}
                      style={{ padding: '6px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Detail / Action Panel */}
      {selectedEnq && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CRM Controls */}
          <section className="adminCard" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="eyebrow" style={{ justifyContent: 'flex-start' }}>CRM PIPELINE</span>
                <h3 style={{ margin: '4px 0 0' }}>Manage Lead Status</h3>
              </div>
              <button className="deleteBtn" onClick={() => setSelectedEnq(null)} style={{ border: 'none', background: 'transparent' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={updateCRM} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Dynamic Status Timeline Stepper */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: '#f8fafc', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                marginBottom: '4px',
                border: '1px solid #e2e8f0'
              }}>
                {['NEW', 'ASSIGNED', 'CONTACTED', 'CONVERTED'].map((stepName, stepIdx, arr) => {
                  const statusOrder = { 'NEW': 0, 'ASSIGNED': 1, 'CONTACTED': 2, 'CONVERTED': 3, 'CLOSED': -1 };
                  const currentIdx = statusOrder[status || 'NEW'];
                  const isCompleted = currentIdx >= stepIdx;
                  const isActive = currentIdx === stepIdx;
                  const stepLabels = {
                    'NEW': 'New',
                    'ASSIGNED': 'Assigned',
                    'CONTACTED': 'Contacted',
                    'CONVERTED': 'Converted'
                  };

                  return (
                    <React.Fragment key={stepName}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: status === 'CLOSED' ? '#cbd5e1' : (isCompleted ? '#e2262b' : '#e2e8f0'),
                          border: isActive ? '3px solid #fca5a5' : 'none',
                          boxSizing: 'content-box',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }} />
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: isActive ? '800' : '600',
                          color: status === 'CLOSED' ? '#94a3b8' : (isActive ? '#e2262b' : (isCompleted ? '#475569' : '#94a3b8'))
                        }}>
                          {stepLabels[stepName]}
                        </span>
                      </div>
                      {stepIdx < arr.length - 1 && (
                        <div style={{
                          height: '2px',
                          background: status === 'CLOSED' ? '#cbd5e1' : (currentIdx > stepIdx ? '#e2262b' : '#e2e8f0'),
                          flex: 1,
                          transform: 'translateY(-10px)'
                        }} />
                      )}
                    </React.Fragment>
                  );
                })}
                {status === 'CLOSED' && (
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', transform: 'translateY(-10px)' }}>
                    (Closed)
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Pipeline Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', background: '#fff' }}>
                    <option value="NEW">New Lead (NEW)</option>
                    <option value="ASSIGNED">Representative Assigned (ASSIGNED)</option>
                    <option value="CONTACTED">In Discussion (CONTACTED)</option>
                    <option value="CONVERTED">Project Awarded (CONVERTED)</option>
                    <option value="CLOSED">No Deal (CLOSED)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Assigned Site Engineer</label>
                  <select value={assignedEng} onChange={(e) => setAssignedEng(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', background: '#fff' }}>
                    <option value="NONE">Unassigned</option>
                    {engineers.map(eng => (
                      <option key={eng.id} value={eng.username}>@{eng.username} ({eng.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Engineer Notes &amp; Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter details about discussions, price matching, site conditions..."
                  style={{ padding: '10px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', height: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                {selectedEnq.status !== 'CONVERTED' ? (
                  <button 
                    type="button" 
                    className="primary" 
                    onClick={() => openConvert(selectedEnq)}
                    style={{ background: '#10b981', borderColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px', padding: '9px 16px' }}
                  >
                    <UserPlus size={15} /> Convert to Customer
                  </button>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={16} /> Converted to Customer
                  </span>
                )}
                <button className="primary" style={{ borderRadius: '8px', padding: '9px 20px' }}>Save Changes</button>
              </div>
            </form>
          </section>

          {/* Chat with Client */}
          <section className="adminCard" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '360px' }}>
            <h3 style={{ marginBottom: '14px' }}>Chat Conversation with Client</h3>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(() => {
                try {
                  const chatLogs = JSON.parse(selectedEnq.conversationHistory || '[]');
                  return chatLogs.map((m, idx) => {
                    const isStaff = m.sender === 'STAFF';
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isStaff ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}>
                        <div style={{
                          background: isStaff ? '#e2262b' : '#f1f5f9',
                          color: isStaff ? '#ffffff' : '#1e293b',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          maxWidth: '75%',
                          fontSize: '0.82rem'
                        }}>
                          {m.text}
                        </div>
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px', padding: '0 4px' }}>
                          {m.time} {isStaff && m.senderName && `· @${m.senderName}`}
                        </span>
                      </div>
                    );
                  });
                } catch (e) {
                  return <p className="adminHint">No conversation details logged.</p>;
                }
              })()}
            </div>

            <form onSubmit={sendReply} style={{ display: 'flex', gap: '10px', marginTop: '12px', padding: 0, background: 'transparent', border: 'none' }}>
              <input
                placeholder="Type reply to client..."
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
              />
              <button className="primary" style={{ padding: '0 16px', borderRadius: '8px' }}>Reply</button>
            </form>
          </section>

        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && (
        <div className="modalOverlay" onClick={() => setShowConvertModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '24px' }}>
            <button className="modalClose" onClick={() => setShowConvertModal(false)}><X size={20} /></button>
            
            <div className="modalHeader" style={{ marginBottom: '20px' }}>
              <span className="eyebrow" style={{ justifyContent: 'flex-start' }}>CLIENT ONBOARDING</span>
              <h2>Onboard to Permanent Portal</h2>
              <p className="modalDesc">This creates their main Customer account, moving pre-onboarding chat history to their new feed.</p>
            </div>

            <form onSubmit={submitConvert} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Login Username *</label>
                  <input
                    value={convertForm.username}
                    onChange={(e) => setConvertForm({ ...convertForm, username: e.target.value })}
                    required
                    style={{ padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Login Password *</label>
                  <input
                    type="password"
                    value={convertForm.password}
                    onChange={(e) => setConvertForm({ ...convertForm, password: e.target.value })}
                    required
                    style={{ padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Display Name *</label>
                <input
                  value={convertForm.displayName}
                  onChange={(e) => setConvertForm({ ...convertForm, displayName: e.target.value })}
                  required
                  style={{ padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Phone Number</label>
                  <input
                    value={convertForm.phone}
                    onChange={(e) => setConvertForm({ ...convertForm, phone: e.target.value })}
                    style={{ padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Estimated Sqft *</label>
                  <input
                    type="number"
                    value={convertForm.estimatedSqft}
                    onChange={(e) => setConvertForm({ ...convertForm, estimatedSqft: e.target.value })}
                    required
                    style={{ padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Project Name *</label>
                <input
                  value={convertForm.projectName}
                  onChange={(e) => setConvertForm({ ...convertForm, projectName: e.target.value })}
                  required
                  style={{ padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Email address</label>
                <input
                  type="email"
                  value={convertForm.email}
                  onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })}
                  style={{ padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              {convertMsg && (
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', fontWeight: '700', color: convertMsg.includes('successfully') ? '#059669' : '#dc2626' }}>
                  {convertMsg}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="stepBack" onClick={() => setShowConvertModal(false)} style={{ padding: '10px 18px', borderRadius: '8px' }}>Cancel</button>
                <button className="primary" style={{ background: '#10b981', borderColor: '#10b981', padding: '10px 22px', borderRadius: '8px' }}>Convert &amp; Onboard</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}

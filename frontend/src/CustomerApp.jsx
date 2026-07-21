import React, { useEffect, useState } from 'react';
import { LogOut, MapPin, Calendar, FileText, Upload, Trash2, Download, LayoutDashboard, Camera, Menu, X, Mail, Clock, Compass, ExternalLink } from 'lucide-react';
import './admin/admin.css';

const API = import.meta.env.VITE_API_URL || '/api';

const TABS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'tracking', label: 'Site Tracking', icon: Camera },
  { id: 'documents', label: 'Documents', icon: FileText }
];

function authHeader(auth) {
  return { Authorization: 'Bearer ' + auth.token };
}

function UpdateSlideshow({ images }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 6500);
    return () => clearInterval(t);
  }, [images]);
  if (!images || images.length === 0) return null;
  return (
    <div className="updateSlideshow">
      {images.map((src, i) => (
        <img key={i} src={src} alt="" className={i === idx ? 'active' : ''} />
      ))}
      {images.length > 1 && (
        <div className="slideDots">
          {images.map((_, i) => (
            <span key={i} className={i === idx ? 'on' : ''} />
          ))}
        </div>
      )}
    </div>
  );
}

function TempEnquiryPortal({ creds, onLogout }) {
  const [enq, setEnq] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const chatEndRef = React.useRef(null);

  useEffect(() => {
    loadEnquiry();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  function loadEnquiry() {
    fetch(`${API}/temp-enquiry/my-tracking`, {
      headers: { Authorization: 'Bearer ' + creds.token }
    })
      .then(res => res.json())
      .then(data => {
        setEnq(data);
        if (data.conversationHistory) {
          try {
            setChat(JSON.parse(data.conversationHistory));
          } catch (e) {
            setChat([]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setError('');
    try {
      const res = await fetch(`${API}/temp-enquiry/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + creds.token
        },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Send failed');
      
      setMessage('');
      setEnq(data);
      if (data.conversationHistory) {
        setChat(JSON.parse(data.conversationHistory));
      }
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
  }

  if (loading) return <div className="portalWrap"><p className="adminHint">Loading tracking details...</p></div>;

  return (
    <div className="adminShell">
      <aside className="adminSidebar open">
        <div className="adminSidebarTop">
          <a href="/" className="adminBrand">
            <img src="/logo-icon.png" alt="" className="loginBrandIcon" style={{ height: '32px' }} />
            <span>PSK <b>Brothers</b></span>
          </a>
        </div>
        <nav className="adminSidebarNav">
          <button className="adminSidebarBtn active">
            <Mail size={17} /> Enquiry Status
          </button>
        </nav>
        <div className="adminSidebarFoot">
          <div className="adminSidebarRole">Temporary Tracker</div>
          <button className="adminSidebarLogout" onClick={onLogout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <div className="adminMain">
        <header className="adminTopbar">
          <div>
            <h1>Enquiry Tracker: {enq?.trackId}</h1>
            <p>Temporary portal for {creds.displayName}</p>
          </div>
        </header>

        <div className="adminContent" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="adminCard" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Status Details</h3>
                <span style={{
                  background: enq?.status === 'NEW' ? '#eff6ff' : (enq?.status === 'CONVERTED' ? '#f0fdf4' : '#fef3c7'),
                  color: enq?.status === 'NEW' ? '#2563eb' : (enq?.status === 'CONVERTED' ? '#166534' : '#d97706'),
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: '1.5px solid currentColor'
                }}>
                  {enq?.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Service Enquired</label>
                    <p style={{ margin: '4px 0 0', fontWeight: '700', fontSize: '0.92rem' }}>{enq?.service}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Submitted On</label>
                    <p style={{ margin: '4px 0 0', fontWeight: '700', fontSize: '0.92rem' }}>{enq?.createdAt ? new Date(enq.createdAt).toLocaleDateString('en-IN') : '—'}</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                  <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Your Original Message</label>
                  <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#334155', fontStyle: 'italic', background: '#f8f8f7', padding: '12px', borderRadius: '8px' }}>
                    "{enq?.message}"
                  </p>
                </div>

                {enq?.assignedEngineerUsername && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                    <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Assigned Site Representative</label>
                    <p style={{ margin: '4px 0 0', fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>
                      Engineer: @{enq?.assignedEngineerUsername}
                    </p>
                  </div>
                )}

                {enq?.engineerRemarks && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                    <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Latest remarks / reply</label>
                    <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#1e293b', background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '8px', fontWeight: '600' }}>
                      {enq.engineerRemarks}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="adminCard" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '420px' }}>
              <h3 style={{ marginBottom: '14px' }}>Discuss Details with Engineer</h3>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chat.map((m, idx) => {
                  const isUser = m.sender === 'USER';
                  return (
                    <div key={idx} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}>
                      <div style={{
                        background: isUser ? '#e2262b' : '#f1f5f9',
                        color: isUser ? '#ffffff' : '#1e293b',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        borderTopRightRadius: isUser ? '2px' : '14px',
                        borderTopLeftRadius: isUser ? '14px' : '2px',
                        maxWidth: '75%',
                        fontSize: '0.86rem',
                        lineHeight: '1.4',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        {m.text}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '3px', padding: '0 4px' }}>
                        {m.time} {!isUser && m.senderName && `· @${m.senderName}`}
                      </span>
                    </div>
                  );
                })}
                {chat.length === 0 && (
                  <p className="adminHint" style={{ textAlign: 'center', marginTop: '40px' }}>
                    No messages yet. Ask any question below to get started!
                  </p>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', marginTop: '14px', padding: 0, background: 'transparent', border: 'none' }}>
                <input
                  placeholder="Ask a question or submit details..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem' }}
                />
                <button className="primary" style={{ padding: '0 20px', borderRadius: '10px' }}>Send</button>
              </form>
              {error && <p style={{ margin: '6px 0 0', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 'bold' }}>{error}</p>}
            </section>
          </div>

          <div>
            <section className="adminCard" style={{ padding: '24px' }}>
              <h3>Next Steps</h3>
              <ul style={{ paddingLeft: '20px', fontSize: '0.82rem', color: '#475569', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                <li><b>Site inspection</b>: Our engineer will visit the construction coordinates.</li>
                <li><b>Estimate Generation</b>: Once parameters are locked, we will draw up the fixed-cost estimate sheet.</li>
                <li><b>Onboarding</b>: If you proceed, you will get a permanent Customer account with full document flow and daily visual updates tracker.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Portal({ creds, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pre-onboarding history states
  const [pastEnquiry, setPastEnquiry] = useState(null);
  const [showPastChat, setShowPastChat] = useState(false);

  // File upload state
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('PLAN');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const loadData = () => {
    Promise.all([
      fetch(`${API}/customer/me`, { headers: authHeader(creds) }),
      fetch(`${API}/customer/updates`, { headers: authHeader(creds) }),
      fetch(`${API}/customer/files`, { headers: authHeader(creds) }),
      fetch(`${API}/customer/past-enquiry`, { headers: authHeader(creds) }).catch(() => null)
    ])
      .then(async ([meRes, updatesRes, filesRes, pastRes]) => {
        if (meRes.status === 401 || meRes.status === 403 || updatesRes.status === 401 || updatesRes.status === 403) {
          sessionStorage.removeItem('psk_auth');
          window.location.href = '/login';
          return;
        }
        setMe(await meRes.json());
        setUpdates(await updatesRes.json());
        setFiles(await filesRes.json());
        
        if (pastRes && pastRes.ok) {
          const pastData = await pastRes.json();
          if (pastData && pastData.hasPastEnquiry && pastData.enquiries.length > 0) {
            setPastEnquiry(pastData.enquiries[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file');
      return;
    }
    setUploadBusy(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('fileName', uploadName || selectedFile.name);
      formData.append('category', uploadCategory);
      formData.append('file', selectedFile);

      const res = await fetch(`${API}/customer/files`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + creds.token },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Upload failed');
      }

      setUploadName('');
      setSelectedFile(null);
      const fileInput = document.getElementById('customer-file-input');
      if (fileInput) fileInput.value = '';

      loadData();
    } catch (err) {
      setUploadError(err.message || 'Error uploading file');
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleFileDelete(id) {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`${API}/customer/files/${id}`, {
        method: 'DELETE',
        headers: authHeader(creds),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Delete failed');
      }
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="portalWrap"><p className="adminHint">Loading your project...</p></div>;

  return (
    <div className="adminShell">
      <aside className={'adminSidebar' + (sidebarOpen ? ' open' : '')}>
        <div className="adminSidebarTop">
          <a href="/" className="adminBrand">
            <img src="/logo-icon.png" alt="" className="adminBrandIcon" />
            <span>PSK <b>Brothers</b></span>
          </a>
          <button className="adminSidebarClose" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="adminSidebarNav">
          {TABS.map((t) => (
            <button key={t.id} className={'adminSidebarBtn' + (tab === t.id ? ' active' : '')} onClick={() => { setTab(t.id); setSidebarOpen(false); }}>
              <t.icon size={17} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="adminSidebarFoot">
          <div className="adminSidebarRole">Customer Portal</div>
          <button className="adminSidebarLogout" onClick={onLogout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      {sidebarOpen && <div className="adminSidebarBackdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="adminMain">
        <header className="adminTopbar">
          <button className="adminMenuBtn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div>
            <h1>{TABS.find((t) => t.id === tab)?.label}</h1>
            <p>Project tracking for {me?.displayName || creds.username}</p>
          </div>
        </header>

        <div className="adminContent">
          {tab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <section className="adminCard portalHero" style={{ animation: 'heroIn 0.3s ease' }}>
                <p className="adminHint">Welcome back,</p>
                <h2>{me?.displayName || 'there'}</h2>
                {me?.projectName && <p className="portalProject"><MapPin size={15} /> {me.projectName}</p>}
                {me?.estimatedSqft > 0 ? (
                  <div className="portalEstimate">
                    <div className="estCard">
                      <span>Project size</span>
                      <b>{me.estimatedSqft.toLocaleString('en-IN')} sqft</b>
                    </div>
                    <div className="estCard">
                      <span>Construction Rate</span>
                      <b>₹{me.ratePerSqft.toLocaleString('en-IN')}/sqft</b>
                    </div>
                    <div className="estCard highlight">
                      <span>Estimated cost</span>
                      <b>₹{me.estimatedCost.toLocaleString('en-IN')}</b>
                    </div>
                  </div>
                ) : (
                  <p className="adminHint">No estimations set yet. Contact us for estimation updates.</p>
                )}
              </section>

              {/* Show Pre-Onboarding Conversation Archive */}
              {pastEnquiry && (
                <section className="adminCard" style={{ animation: 'fadeIn 0.4s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Pre-Onboarding Enquiry History</h3>
                      <p className="adminHint" style={{ margin: '4px 0 0' }}>Conversation details imported from your temporary login account ({pastEnquiry.trackId})</p>
                    </div>
                    <button 
                      className="primary" 
                      onClick={() => setShowPastChat(!showPastChat)}
                      style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '0.8rem' }}
                    >
                      {showPastChat ? 'Hide Archive' : 'Show Chat Logs'}
                    </button>
                  </div>
                  
                  {showPastChat && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#f8f8f7', padding: '12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.85rem' }}>Enquiry Service: <b>{pastEnquiry.service}</b></span>
                        <span style={{ fontSize: '0.85rem' }}>Assigned Agent: <b>@{pastEnquiry.assignedEngineerUsername || 'admin'}</b></span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
                        {(() => {
                          try {
                            const chatLogs = JSON.parse(pastEnquiry.conversationHistory || '[]');
                            return chatLogs.map((m, idx) => (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'USER' ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                  background: m.sender === 'USER' ? '#f1f5f9' : '#eff6ff',
                                  color: '#1e293b',
                                  padding: '8px 12px',
                                  borderRadius: '10px',
                                  fontSize: '0.8rem',
                                  maxWidth: '80%',
                                  border: `1.5px solid ${m.sender === 'USER' ? '#cbd5e1' : '#bfdbfe'}`
                                }}>
                                  {m.text}
                                </div>
                                <span style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>
                                  {m.time} {m.senderName && `· @${m.senderName}`}
                                </span>
                              </div>
                            ));
                          } catch (e) {
                            return <p className="adminHint">No logs recorded.</p>;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {tab === 'tracking' && (
            <section className="adminCard">
              <h3>Construction Progress Photos</h3>
              <p className="adminHint" style={{ marginBottom: '20px' }}>Visual construction site tracking logs updated daily by engineers.</p>
              <div className="customerUpdates">
                {updates.map((u) => (
                  <div className="customerUpdateCard" key={u.id}>
                    <div className="updateHeader">
                      <b>{u.title}</b>
                      <span>{u.workDate}</span>
                    </div>
                    {u.description && <p className="updateDesc">{u.description}</p>}
                    {u.photoUrl && <UpdateSlideshow images={u.photoUrl.split('|||')} />}
                  </div>
                ))}
                {updates.length === 0 && <p className="adminHint">No site progress photos uploaded yet.</p>}
              </div>
            </section>
          )}

          {tab === 'documents' && (
            <section className="adminCard">
              <h3>Document Vault</h3>
              <p className="adminHint" style={{ marginBottom: '20px' }}>Official blueprints, approval records, invoices, and your uploaded sketches.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  {files.length === 0 ? (
                    <p className="adminHint">No files shared yet.</p>
                  ) : (
                    <div className="tableList">
                      {files.map((f) => (
                        <div className="tableRow" key={f.id}>
                          <div>
                            <b>{f.fileName}</b>
                            <span className="tableSub">
                              {f.category} · uploaded by {f.uploadedByRole === 'CUSTOMER' ? 'You' : f.uploadedByUsername}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a href={f.fileData} download={f.fileName} className="deleteBtn" style={{ textDecoration: 'none', padding: '6px 10px', color: '#166534', borderColor: '#bbf7d0', background: '#f0fdf4', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Download size={14} /> Download
                            </a>
                            {f.uploadedByRole === 'CUSTOMER' && (
                              <button onClick={() => handleFileDelete(f.id)} className="deleteBtn" style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center' }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: '#f8f8f7', padding: '20px', borderRadius: '12px', border: '1px solid #ececea' }}>
                  <h4>Upload Document</h4>
                  <p className="adminHint" style={{ fontSize: '0.78rem', marginBottom: '14px' }}>Share sketches or plans with our engineering team.</p>
                  <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'transparent', padding: 0, border: 'none' }}>
                    <input placeholder="Document Name (e.g. Sketch)" value={uploadName} onChange={(e) => setUploadName(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d8dcda', borderRadius: '6px', fontSize: '0.85rem' }} required />
                    <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d8dcda', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <option value="PLAN">Building Plan</option>
                      <option value="APPROVAL">Approval Doc</option>
                      <option value="ESTIMATE">Estimate/Invoice</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <input id="customer-file-input" type="file" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ fontSize: '0.75rem' }} required />
                    {uploadError && <div className="adminError" style={{ fontSize: '0.78rem', padding: '6px' }}>{uploadError}</div>}
                    <button type="submit" className="primary" style={{ padding: '8px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'center', borderRadius: '6px' }} disabled={uploadBusy}>
                      {uploadBusy ? 'Uploading...' : 'Upload Document'}
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}
        </div>
        <footer className="adminFooter">
          <span>© 2026 PSK Brothers Builders & Constructions</span>
          <a href="/">← Back to public site</a>
        </footer>
      </div>
    </div>
  );
}

export default function CustomerApp() {
  const [auth, setAuth] = useState(() => {
    const saved = sessionStorage.getItem('psk_auth');
    return saved ? JSON.parse(saved) : null;
  });

  function logout() {
    sessionStorage.removeItem('psk_auth');
    setAuth(null);
    window.location.href = '/login';
  }

  useEffect(() => {
    if (!auth || (auth.role !== 'CUSTOMER' && auth.role !== 'ADMIN' && auth.role !== 'TEMP_ENQUIRY')) {
      window.location.href = '/login';
    }
  }, [auth]);

  if (!auth || (auth.role !== 'CUSTOMER' && auth.role !== 'ADMIN' && auth.role !== 'TEMP_ENQUIRY')) return null;

  if (auth.role === 'TEMP_ENQUIRY') {
    return <TempEnquiryPortal creds={auth} onLogout={logout} />;
  }

  return <Portal creds={auth} onLogout={logout} />;
}

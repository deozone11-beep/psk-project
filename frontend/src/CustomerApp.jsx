import React, { useEffect, useState } from 'react';
import { LogOut, MapPin, Calendar, FileText, Upload, Trash2, Download, LayoutDashboard, Camera, Menu, X } from 'lucide-react';
import './admin/admin.css';

const API = '/api';

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
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 3500);
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

function Portal({ creds, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

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
    ])
      .then(async ([meRes, updatesRes, filesRes]) => {
        if (meRes.status === 401 || meRes.status === 403 || updatesRes.status === 401 || updatesRes.status === 403) {
          sessionStorage.removeItem('psk_auth');
          window.location.href = '/login';
          return;
        }
        setMe(await meRes.json());
        setUpdates(await updatesRes.json());
        setFiles(await filesRes.json());
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
      {/* Customer Sidebar */}
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

      {/* Customer Main Panel */}
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
          )}

          {tab === 'tracking' && (
            <section className="adminCard" style={{ animation: 'heroIn 0.3s ease' }}>
              <h3>Your Project's Progress</h3>
              <p className="adminHint" style={{ marginBottom: '18px' }}>Daily construction updates, status changes and photos uploaded by site engineers.</p>
              {updates.length === 0 ? (
                <p className="adminHint">No updates posted yet — check back soon, or contact us for a status update.</p>
              ) : (
                <div className="portalFeed">
                  {updates.map((u) => (
                    <div className="portalUpdate" key={u.id}>
                      {u.photoUrl && (
                        <div className="portalUpdateImgWrap">
                          <UpdateSlideshow images={u.photoUrl.split('|||')} />
                        </div>
                      )}
                      <div className="portalUpdateBody">
                        <span className="portalDate"><Calendar size={13} /> {u.workDate}</span>
                        <b>{u.title}</b>
                        {u.description && <p>{u.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'documents' && (
            <section className="adminCard" style={{ animation: 'heroIn 0.3s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'start' }} className="portalDocGrid">
                <div>
                  <h3>Project Documents</h3>
                  <p className="adminHint" style={{ marginBottom: '16px' }}>Estimates, building plans, and approval files shared for your project.</p>
                  {files.length === 0 ? (
                    <p className="adminHint">No documents uploaded yet.</p>
                  ) : (
                    <div className="tableList">
                      {files.map((f) => (
                        <div className="tableRow" key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileText size={20} style={{ color: '#e2262b' }} />
                            <div>
                              <b style={{ fontSize: '0.88rem', color: '#17201d' }}>{f.fileName}</b>
                              <span style={{ fontSize: '0.7rem', color: '#77807d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {f.category} · Uploaded by {f.uploadedByRole === 'CUSTOMER' ? 'You' : f.uploadedByRole}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a href={f.fileData} download={f.fileName} className="adminTabBtn" style={{ padding: '6px 10px', background: '#ececea', color: '#17201d', border: 'none', textDecoration: 'none', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
    if (!auth || (auth.role !== 'CUSTOMER' && auth.role !== 'ADMIN')) window.location.href = '/login';
  }, [auth]);

  if (!auth || (auth.role !== 'CUSTOMER' && auth.role !== 'ADMIN')) return null; // redirecting via the effect above
  return <Portal creds={auth} onLogout={logout} />;
}

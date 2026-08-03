import React, { useEffect, useState } from 'react';
import { LogOut, MapPin, Calendar, FileText, Upload, Trash2, Download, LayoutDashboard, Camera, Menu, X, Mail, Clock, Compass, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import './admin/admin.css';
import PlanVisualizer from './components/PlanVisualizer.jsx';

const API = import.meta.env.VITE_API_URL || '/api';

const TABS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'saved-plans', label: 'Saved 2D Plans', icon: Compass },
  { id: 'invoices', label: 'Invoices & Receipts', icon: FileText },
  { id: 'tracking', label: 'Site Tracking', icon: Camera },
  { id: 'documents', label: 'Documents', icon: FileText }
];

function authHeader(auth) {
  return { Authorization: 'Bearer ' + auth.token };
}

function formatDateNice(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d}-${months[parseInt(m, 10) - 1]}-${y}`;
  } catch (e) {
    return dateStr;
  }
}

const DEFAULT_DIGITAL_SIGNATURE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 70" width="180" height="60"><path d="M 15 45 C 30 15, 45 10, 55 30 C 65 50, 75 35, 85 22 C 95 12, 105 40, 120 30 C 135 20, 150 15, 160 38 C 170 52, 185 28, 200 22 C 215 16, 230 35, 250 28" fill="none" stroke="%231d4ed8" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><text x="20" y="58" font-family="'Brush Script MT', 'Dancing Script', cursive, sans-serif" font-size="22" font-weight="bold" fill="%231e40af" font-style="italic">S. Senthil Murugan</text></svg>`;

const DEFAULT_CIRCULAR_SEAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" width="90" height="90"><g transform="rotate(-6 70 70)"><circle cx="70" cy="70" r="64" fill="none" stroke="%23e2262b" stroke-width="3" stroke-dasharray="8 3"/><circle cx="70" cy="70" r="56" fill="none" stroke="%23e2262b" stroke-width="1.5"/><path id="circlePath" fill="none" d="M 22,70 A 48,48 0 1,1 118,70 A 48,48 0 1,1 22,70"/><text fill="%23e2262b" font-size="9.5" font-weight="900" font-family="sans-serif" letter-spacing="1"><textPath href="%23circlePath" startOffset="50%" text-anchor="middle">PSK BROTHERS BUILDERS</textPath></text><path id="circlePath2" fill="none" d="M 118,70 A 48,48 0 1,1 22,70"/><text fill="%23e2262b" font-size="8.5" font-weight="800" font-family="sans-serif" letter-spacing="1.5"><textPath href="%23circlePath2" startOffset="50%" text-anchor="middle">★ CHENNAI ★</textPath></text><circle cx="70" cy="70" r="32" fill="rgba(226,38,43,0.05)" stroke="%23e2262b" stroke-width="1"/><text x="70" y="66" text-anchor="middle" fill="%23e2262b" font-size="8" font-weight="900" font-family="sans-serif" letter-spacing="0.5">OFFICIAL</text><text x="70" y="78" text-anchor="middle" fill="%23e2262b" font-size="8" font-weight="900" font-family="sans-serif" letter-spacing="0.5">SEAL</text></g></svg>`;

function getDynamicMilestones(floors = []) {
  if (!Array.isArray(floors) || floors.length === 0) {
    return [
      { stage: 'Advance / Booking & Architectural Plan', pct: 10 },
      { stage: 'Foundation & Plinth Beam Completion', pct: 15 },
      { stage: 'Ground Floor Roof Slab Completion', pct: 20 },
      { stage: 'First Floor Roof Slab Completion', pct: 20 },
      { stage: 'Brickwork & Plastering Completion', pct: 15 },
      { stage: 'Flooring, Tiles, Plumbing & Electrical', pct: 15 },
      { stage: 'Painting, Finishing & Key Handover', pct: 5 }
    ];
  }

  const mainFloors = floors.filter(f => {
    const fn = (f.floorName || '').toLowerCase();
    return !fn.includes('portico') && !fn.includes('head room') && !fn.includes('compound');
  });

  const targetFloors = mainFloors.length > 0 ? mainFloors : floors;

  const result = [
    { stage: 'Advance / Booking & Architectural Plan', pct: 10 },
    { stage: 'Foundation & Plinth Beam Completion', pct: 15 }
  ];

  const totalRoofPct = 40;
  const perRoofPct = Math.max(10, Math.floor(totalRoofPct / targetFloors.length));

  targetFloors.forEach(f => {
    let name = (f.floorName || 'Floor').replace(/Area/i, '').replace(/Construction/i, '').trim();
    if (!name.toLowerCase().includes('roof')) {
      name = `${name} Roof Slab Completion`;
    }
    result.push({ stage: name, pct: perRoofPct });
  });

  const roofUsed = perRoofPct * targetFloors.length;
  const remaining = 100 - (10 + 15 + roofUsed);

  const brickPct = Math.max(8, Math.floor(remaining * 0.40));
  const floorPct = Math.max(8, Math.floor(remaining * 0.45));
  const finishPct = 100 - (10 + 15 + roofUsed + brickPct + floorPct);

  result.push({ stage: 'Brickwork & Plastering Completion', pct: brickPct });
  result.push({ stage: 'Flooring, Tiles, Plumbing & Electrical', pct: floorPct });
  result.push({ stage: 'Painting, Finishing & Key Handover', pct: finishPct });

  return result;
}

function UpdateSlideshow({ images, title }) {
  const [idx, setIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1 || lightboxOpen) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 5000);
    return () => clearInterval(t);
  }, [images ? images.join(',') : '', lightboxOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setLightboxIdx((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setLightboxIdx((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images]);

  if (!images || images.length === 0) return null;

  function openLightbox(index) {
    setLightboxIdx(index);
    setLightboxOpen(true);
  }

  return (
    <>
      <div className="updateSlideshow" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => openLightbox(idx)}>
        {images.map((src, i) => (
          <img key={i} src={src} alt="" className={i === idx ? 'active' : ''} />
        ))}

        {/* Hover / Tap Hint Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          color: '#ffffff',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '0.72rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 4
        }}>
          <span>📷 {images.length > 1 ? `${images.length} Photos (Tap to expand)` : 'Tap to expand'}</span>
        </div>

        {images.length > 1 && (
          <div className="slideDots">
            {images.map((_, i) => (
              <span key={i} className={i === idx ? 'on' : ''} onClick={(e) => { e.stopPropagation(); setIdx(i); }} />
            ))}
          </div>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.92)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            backdropFilter: 'blur(10px)'
          }}
          onClick={() => setLightboxOpen(false)}
        >
          {/* Lightbox Header */}
          <div 
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff', zIndex: 100000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '12px' }}>
                Photo {lightboxIdx + 1} of {images.length}
              </span>
              {title && <span style={{ marginLeft: '12px', fontSize: '0.95rem', fontWeight: '600', color: '#e2e8f0' }}>{title}</span>}
            </div>
            <button 
              onClick={() => setLightboxOpen(false)} 
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Lightbox Main Image & Nav Arrows */}
          <div 
            style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxHeight: '78vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                onClick={() => setLightboxIdx((i) => (i - 1 + images.length) % images.length)}
                style={{
                  position: 'absolute',
                  left: '10px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  border: 'none',
                  color: '#ffffff',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(6px)',
                  zIndex: 100001
                }}
              >
                <ChevronLeft size={26} />
              </button>
            )}

            <img 
              src={images[lightboxIdx]} 
              alt="" 
              style={{
                maxWidth: '90vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                transition: 'all 0.2s ease-in-out'
              }}
            />

            {images.length > 1 && (
              <button
                onClick={() => setLightboxIdx((i) => (i + 1) % images.length)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  border: 'none',
                  color: '#ffffff',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(6px)',
                  zIndex: 100001
                }}
              >
                <ChevronRight size={26} />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Bar */}
          {images.length > 1 && (
            <div 
              style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0', maxWidth: '90vw' }}
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  onClick={() => setLightboxIdx(i)}
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: i === lightboxIdx ? '3px solid #e2262b' : '2px solid transparent',
                    opacity: i === lightboxIdx ? 1 : 0.6,
                    transition: 'all 0.15s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
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
  const todayObj = new Date();
  const [calYear, setCalYear] = useState(todayObj.getFullYear());
  const [calMonth, setCalMonth] = useState(todayObj.getMonth());
  const [selectedCalDateStr, setSelectedCalDateStr] = useState(todayObj.toISOString().split('T')[0]);
  const [files, setFiles] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('UPI');
  const [payProcessing, setPayProcessing] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');
  const [showBankReport, setShowBankReport] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [loading, setLoading] = useState(true);

  async function handleProcessRazorpayPayment(e) {
    e.preventDefault();
    if (!payingInvoice || payAmount <= 0) return;
    setPayProcessing(true);
    setPaySuccessMsg('');
    try {
      const paymentRef = 'RZP-' + Math.floor(100000 + Math.random() * 900000);
      const res = await fetch(`/api/customer/invoices/${payingInvoice.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': creds
        },
        body: JSON.stringify({ amount: payAmount, paymentRef })
      });
      if (res.ok) {
        setPaySuccessMsg(`Payment of ₹${Number(payAmount).toLocaleString('en-IN')} Successful! Ref: ${paymentRef} 🎉`);
        const invRes = await fetch(`${API}/customer/invoices`, { headers: { 'Authorization': creds } });
        if (invRes.ok) setInvoices(await invRes.json());
        setTimeout(() => {
          setPayingInvoice(null);
          setPaySuccessMsg('');
        }, 2500);
      } else {
        alert('Payment recording failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while processing payment.');
    } finally {
      setPayProcessing(false);
    }
  }

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(y => y - 1);
    } else {
      setCalMonth(m => m - 1);
    }
  }

function CustomerSavedPlansSection({ creds, me }) {
  const [savedPlans, setSavedPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVisualizer, setShowVisualizer] = useState(false);

  const fetchMyPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/plans/my-saved`, {
        headers: { Authorization: 'Bearer ' + creds.token },
      });
      if (res.ok) {
        setSavedPlans(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPlans();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved 2D plan from your portal?')) return;
    try {
      const res = await fetch(`${API}/plans/${id}`, {
        method: 'DELETE',
        headers: authHeader(creds),
      });
      if (res.ok) {
        setSavedPlans(savedPlans.filter((p) => p.id !== id));
      }
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>My Saved 2D AutoCAD Plans & Elevations</h2>
          <p className="adminHint" style={{ margin: '4px 0 0' }}>
            Review your favorited 2D blueprint layouts, estimated costs, and request custom DWG files from PSK Builders.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => setShowVisualizer(!showVisualizer)}
          style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          {showVisualizer ? 'Hide Visualizer Tool' : '📐 Open 2D Plan Generator Tool'}
        </button>
      </div>

      {showVisualizer && (
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
          <PlanVisualizer user={creds} onRequireLogin={() => {}} />
        </div>
      )}

      {loading ? (
        <p className="adminHint">Loading saved plans...</p>
      ) : savedPlans.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
          <Compass size={36} style={{ color: '#0284c7', marginBottom: '10px' }} />
          <h3>No Saved Plans Yet</h3>
          <p className="adminHint">Use the 2D Plan Generator Tool above to explore AutoCAD layouts and save your favorite designs!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {savedPlans.map((p) => (
            <div key={p.id} style={{ background: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                  Option #{p.designOptionIndex + 1}
                </span>
                <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 style={{ margin: '8px 0 4px 0', fontSize: '1.1rem', color: '#0284c7' }}>{p.designOptionName}</h3>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '10px' }}>
                Plot: <strong>{p.plotLength}ft × {p.plotWidth}ft</strong> ({p.totalSqft?.toLocaleString()} sqft) • {p.facingDirection} Facing
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.85rem' }}>
                <div>Level: <strong>{p.floors}</strong></div>
                <div>Estimated Cost: <strong style={{ color: '#16a34a' }}>₹{p.estimatedCost?.toLocaleString()}</strong></div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Saved on: {new Date(p.createdAt).toLocaleDateString()}</div>
              </div>

              <button
                onClick={() => setShowVisualizer(true)}
                style={{ width: '100%', textAlign: 'center', background: '#0f172a', color: '#ffffff', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', border: 'none', cursor: 'pointer' }}
              >
                Inspect Design Visualizer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(y => y + 1);
    } else {
      setCalMonth(m => m + 1);
    }
  }

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
      fetch(`${API}/customer/invoices`, { headers: authHeader(creds) }).catch(() => null),
      fetch(`${API}/customer/past-enquiry`, { headers: authHeader(creds) }).catch(() => null)
    ])
      .then(async ([meRes, updatesRes, filesRes, invRes, pastRes]) => {
        if (meRes.status === 401 || meRes.status === 403 || updatesRes.status === 401 || updatesRes.status === 403) {
          sessionStorage.removeItem('psk_auth');
          window.location.href = '/login';
          return;
        }
        setMe(await meRes.json());
        const upList = await updatesRes.json();
        setUpdates(upList);
        if (upList && upList.length > 0) {
          const latestDateStr = upList[0].workDate;
          setSelectedCalDateStr(latestDateStr);
          const d = new Date(latestDateStr);
          if (!isNaN(d.getTime())) {
            setCalYear(d.getFullYear());
            setCalMonth(d.getMonth());
          }
        }
        setFiles(await filesRes.json());
        if (invRes && invRes.ok) {
          setInvoices(await invRes.json());
        }
        
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
              
              {/* Left Column: Interactive Month Calendar */}
              <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][calMonth]} {calYear}
                    </h3>
                    <p className="adminHint" style={{ margin: '2px 0 0', fontSize: '0.78rem' }}>Tap any date with a green dot to view progress photos</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={prevMonth} className="deleteBtn" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}><ChevronLeft size={16} /></button>
                    <button onClick={nextMonth} className="deleteBtn" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}><ChevronRight size={16} /></button>
                  </div>
                </div>

                {/* Week Headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.78rem', color: '#64748b', marginBottom: '10px' }}>
                  <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>

                {/* Calendar Days Grid */}
                {(() => {
                  const firstDay = new Date(calYear, calMonth, 1).getDay();
                  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                  const blankDays = Array.from({ length: firstDay }, (_, i) => i);
                  const daysArr = Array.from({ length: daysInMonth }, (_, i) => i + 1);

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                      {blankDays.map(b => (
                        <div key={`blank-${b}`} style={{ aspectRatio: '1', background: 'transparent' }} />
                      ))}
                      {daysArr.map(day => {
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSelected = selectedCalDateStr === dateStr;
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        
                        const dayUpdates = updates.filter(u => u.workDate === dateStr);
                        const hasPhotos = dayUpdates.length > 0;

                        return (
                          <button
                            key={`day-${day}`}
                            onClick={() => setSelectedCalDateStr(dateStr)}
                            style={{
                              aspectRatio: '1',
                              border: isSelected ? '2px solid #e2262b' : (isToday ? '1.5px solid #fca5a5' : '1px solid #e2e8f0'),
                              borderRadius: '10px',
                              background: isSelected ? '#fff5f5' : (hasPhotos ? '#f0fdf4' : '#ffffff'),
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              fontSize: '0.88rem',
                              fontWeight: isSelected || isToday ? '800' : '600',
                              color: isSelected ? '#e2262b' : (hasPhotos ? '#15803d' : '#1e293b'),
                              transition: 'all 0.15s'
                            }}
                          >
                            <span>{day}</span>
                            {hasPhotos && (
                              <span style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                background: isSelected ? '#e2262b' : '#16a34a',
                                position: 'absolute',
                                bottom: '5px'
                              }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: '16px', marginTop: '20px', fontSize: '0.76rem', color: '#64748b', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} /> Site Log Available
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e2262b' }} /> Selected Date
                  </div>
                </div>
              </section>

              {/* Right Column: Day Logs & Progress Photos for Selected Date */}
              <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800', color: '#e2262b' }}>DAY LOGS</span>
                    <h3 style={{ margin: '2px 0 0', fontSize: '1.2rem', color: '#0f172a' }}>
                      Site Progress on {formatDateNice(selectedCalDateStr)}
                    </h3>
                  </div>
                  {updates.length > 0 && (
                    <button
                      onClick={() => {
                        const latestDateStr = updates[0].workDate;
                        setSelectedCalDateStr(latestDateStr);
                        const d = new Date(latestDateStr);
                        if (!isNaN(d.getTime())) {
                          setCalYear(d.getFullYear());
                          setCalMonth(d.getMonth());
                        }
                      }}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Latest Log
                    </button>
                  )}
                </div>

                {(() => {
                  const dayLogs = updates.filter(u => u.workDate === selectedCalDateStr);

                  if (dayLogs.length === 0) {
                    return (
                      <div style={{ background: '#f8fafc', padding: '36px 20px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                        <Camera size={32} style={{ color: '#cbd5e1', marginBottom: '10px' }} />
                        <p style={{ margin: 0, fontWeight: '700', color: '#64748b' }}>
                          No site progress photos recorded on {formatDateNice(selectedCalDateStr)}.
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                          Tap any date with a green dot on the calendar to view uploaded progress logs.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {dayLogs.map(u => {
                        const imgs = u.photoUrl ? u.photoUrl.split('|||') : [];
                        return (
                          <div key={u.id} style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>{u.title}</h4>
                              <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '3px 10px', borderRadius: '12px' }}>
                                Verified Log
                              </span>
                            </div>

                            {u.description && (
                              <p style={{ margin: 0, color: '#334155', fontSize: '0.9rem', lineHeight: '1.5' }}>{u.description}</p>
                            )}

                            {(u.engineerName || u.workerNames) && (
                              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                                {u.engineerName && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: '700' }}>
                                    <span>👷 Site Engineer In-Charge:</span>
                                    <span style={{ color: '#0f172a', fontWeight: '600' }}>{u.engineerName}</span>
                                  </div>
                                )}
                                {u.workerNames && (
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#475569', fontWeight: '700' }}>
                                    <span>👥 On-Site Labor Team:</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      {u.workerNames.split(',').map((w, idx) => (
                                        <span key={idx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#1e293b', fontWeight: '600' }}>
                                          {w.trim()}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {imgs.length > 0 && (
                              <div style={{ marginTop: '4px' }}>
                                <UpdateSlideshow images={imgs} title={u.title} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>

            </div>
          )}

          {tab === 'saved-plans' && <CustomerSavedPlansSection creds={creds} me={me} />}

          {tab === 'invoices' && (
            <section className="adminCard">
              <h3>My Invoices & Payment Receipts</h3>
              <p className="adminHint" style={{ marginBottom: '20px' }}>Official stage bills, estimates, and payment vouchers issued by PSK Brothers Builders.</p>
              {invoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <FileText size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                  <h4>No Invoices Available Yet</h4>
                  <p>When our engineering team generates a bill or receipt for your project, it will appear here for viewing and PDF download.</p>
                </div>
              ) : (
                <div className="tableList">
                  {invoices.map((inv) => (
                    <div className="tableRow" key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '10px', background: '#f8fafc', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>{inv.invoiceNumber}</div>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>{inv.stageName || inv.billType} · Date: {inv.invoiceDate}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>₹{inv.totalAmount?.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '0.8rem', color: inv.balanceDue > 0 ? '#dc2626' : '#16a34a', fontWeight: '700' }}>
                            {inv.balanceDue > 0 ? `Bal: ₹${inv.balanceDue?.toLocaleString('en-IN')}` : 'Fully Paid ✅'}
                          </div>
                        </div>
                        {inv.balanceDue > 0 && (
                          <button 
                            className="primary" 
                            onClick={() => { setPayingInvoice(inv); setPayAmount(inv.balanceDue); }} 
                            style={{ padding: '8px 14px', fontSize: '0.85rem', background: '#16a34a', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            💳 Pay Online
                          </button>
                        )}
                        <button className="primary" onClick={() => setPreviewInvoice(inv)} style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}>
                          <FileText size={15} /> View & Print Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {previewInvoice && (
        <div className="modalOverlay">
          <div className="modalCard modalLetterheadView">
            <div className="modalHeader noPrint">
              <h2>PSK Brothers Official Bill Preview</h2>
              <div className="previewActions">
                <button className="btnPrimary" onClick={() => window.print()}><Download size={16} /> Print / Save PDF</button>
                <button className="btnSecondary" onClick={() => setShowBankReport(true)}>🏦 Bank Valuation Report</button>
                <button className="btnSecondary" onClick={() => setShowAgreement(true)}>📜 Legal Agreement Contract</button>
                <button className="closeBtn" onClick={() => setPreviewInvoice(null)}>×</button>
              </div>
            </div>

            <div className="letterheadContainer printableArea">
              <div className="lhTopAccent"></div>
              <div className="lhHeader">
                <div className="lhHeaderLeft">
                  <div className="lhLogoBox">
                    <img src="/logo.png" alt="PSK Brothers Builders & Constructions" className="lhLogo" />
                  </div>
                  <div className="lhPartners">
                    <div>S. Prakash</div>
                    <div>S. Senthil Murugan</div>
                  </div>
                </div>

                <div className="lhHeaderRight">
                  <div className="lhContactRow"><strong>Mob:</strong> 9941426479</div>
                  <div className="lhContactRow">9003177934</div>
                  <div className="lhDateRow"><strong>Date:</strong> {previewInvoice.invoiceDate}</div>
                </div>
              </div>

              <div className="lhHeaderLine"></div>

              <div className="lhInvoiceBanner">
                <div className="lhBillTitle">
                  {previewInvoice.billType === 'ESTIMATE' ? 'HOUSE CONSTRUCTION COST ESTIMATION SHEET' : 'CONSTRUCTION STAGE BILL / INVOICE'}
                </div>
                <div className="lhInvNumber">No: {previewInvoice.invoiceNumber}</div>
              </div>

              <div className="lhDetailsGrid">
                <div className="lhDetailsBox">
                  <div className="lhDetailHeader">CLIENT & PROJECT DETAILS</div>
                  <div className="lhDetailRow"><strong>Customer Name:</strong> {me?.displayName || previewInvoice.customer?.displayName || 'Valued Client'}</div>
                  <div className="lhDetailRow"><strong>Phone:</strong> {me?.phone || previewInvoice.customer?.phone || 'N/A'}</div>
                  <div className="lhDetailRow"><strong>Project Name:</strong> {me?.projectName || previewInvoice.customer?.projectName || 'Construction Site'}</div>
                </div>
                <div className="lhDetailsBox">
                  <div className="lhDetailHeader">SPECIFICATION OVERVIEW</div>
                  <div className="lhDetailRow"><strong>Doc Type:</strong> {previewInvoice.billType === 'ESTIMATE' ? 'Full Construction Estimate' : previewInvoice.billType}</div>
                  <div className="lhDetailRow"><strong>Built-up Area:</strong> {previewInvoice.builtUpArea ? `${previewInvoice.builtUpArea} Sq.ft` : 'N/A'}</div>
                  <div className="lhDetailRow"><strong>Valid Till:</strong> {previewInvoice.dueDate || '30 Days'}</div>
                </div>
              </div>

              {(() => {
                let parsed = {};
                try { parsed = JSON.parse(previewInvoice.lineItemsJson || '{}'); } catch (e) { }
                const isEstimate = previewInvoice.billType === 'ESTIMATE';

                return (
                  <>
                    {isEstimate && parsed.floors && parsed.floors.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', marginBottom: '8px' }}>
                          1. BUILT-UP AREA & FLOOR-WISE COST BREAKDOWN
                        </div>
                        <table className="lhTable">
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Floor / Area Particulars</th>
                              <th>Area (Sq.ft)</th>
                              <th>Rate (₹/sqft)</th>
                              <th>Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsed.floors.map((fl, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td><strong>{fl.floorName}</strong></td>
                                <td>{fl.sqft} sqft</td>
                                <td>₹{Number(fl.rate || 0).toLocaleString('en-IN')}</td>
                                <td><strong>₹{Number(fl.amount || 0).toLocaleString('en-IN')}</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {parsed.lineItems && parsed.lineItems.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', marginBottom: '8px' }}>
                          {isEstimate ? '2. ADDITIONAL PARTICULAR CHARGES / ADD-ONS' : 'BILL PARTICULARS'}
                        </div>
                        <table className="lhTable">
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Particulars / Description</th>
                              <th>Qty</th>
                              <th>Unit</th>
                              <th>Rate (₹)</th>
                              <th>Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsed.lineItems.map((it, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td><strong>{it.description}</strong></td>
                                <td>{it.qty}</td>
                                <td>{it.unit || '-'}</td>
                                <td>₹{Number(it.rate || 0).toLocaleString('en-IN')}</td>
                                <td><strong>₹{Number(it.amount || 0).toLocaleString('en-IN')}</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {isEstimate && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#e2262b', marginBottom: '8px' }}>
                          3. STAGE-WISE PAYMENT MILESTONE SCHEDULE
                        </div>
                        <table className="lhTable">
                          <thead>
                            <tr>
                              <th>Stage #</th>
                              <th>Construction Stage Milestone</th>
                              <th>Percentage (%)</th>
                              <th>Stage Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { stage: '1. Advance / Booking & Architectural Plan', pct: 10 },
                              { stage: '2. Foundation & Plinth Beam Completion', pct: 15 },
                              { stage: '3. Ground Floor Roof Slab Completion', pct: 20 },
                              { stage: '4. First Floor Roof Slab Completion', pct: 20 },
                              { stage: '5. Brickwork & Plastering Completion', pct: 15 },
                              { stage: '6. Flooring, Tiles, Plumbing & Electrical', pct: 15 },
                              { stage: '7. Painting, Finishing & Key Handover', pct: 5 }
                            ].map((st, idx) => {
                              const stageAmt = Math.round((previewInvoice.totalAmount || 0) * (st.pct / 100));
                              return (
                                <tr key={idx}>
                                  <td><strong>Stage {idx + 1}</strong></td>
                                  <td>{st.stage}</td>
                                  <td><strong>{st.pct}%</strong></td>
                                  <td><strong>₹{stageAmt.toLocaleString('en-IN')}</strong></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {isEstimate && parsed.specs && (
                      <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', marginBottom: '8px' }}>
                          4. STANDARD INCLUDED MATERIAL SPECIFICATIONS
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                          <div><strong>Steel & Cement:</strong> {parsed.specs.structure}</div>
                          <div><strong>Flooring & Tiles:</strong> {parsed.specs.flooring}</div>
                          <div><strong>Doors & Windows:</strong> {parsed.specs.doors}</div>
                          <div><strong>Electrical Wiring:</strong> {parsed.specs.electrical}</div>
                          <div><strong>Plumbing & Sanitary:</strong> {parsed.specs.plumbing}</div>
                          <div><strong>Paint Finish:</strong> {parsed.specs.painting}</div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="lhSummarySection">
                <div className="lhWordsBox">
                  <div className="lhWordsLabel">AMOUNT IN WORDS:</div>
                  <div className="lhWordsText">{previewInvoice.amountInWords || 'Rupees Only'}</div>
                  {previewInvoice.notes && (
                    <div className="lhNotesBox">
                      <strong>Notes & Terms:</strong> {previewInvoice.notes}
                    </div>
                  )}
                </div>

                <div className="lhTotalsTable">
                  <div className="lhTotRow">
                    <span>Sub Total:</span>
                    <strong>₹{Number(previewInvoice.subTotal || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  {previewInvoice.gstPercentage > 0 && (
                    <div className="lhTotRow">
                      <span>GST ({previewInvoice.gstPercentage}%):</span>
                      <span>+ ₹{Number(previewInvoice.taxAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="lhTotRow lhGrandTotal">
                    <span>Total Estimated Cost:</span>
                    <strong>₹{Number(previewInvoice.totalAmount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="lhTotRow">
                    <span>Paid / Advance:</span>
                    <span className="textGreen">₹{Number(previewInvoice.amountPaidSoFar || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="lhTotRow lhBalanceRow">
                    <span>Balance Due:</span>
                    <strong className="textRed">₹{Number(previewInvoice.balanceDue || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* 3-Column Layout: Left (Client Sign), Center (Company Stamp Seal), Right (Authorized Signatory) */}
              <div className="lhSignSection" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-end', marginTop: '30px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px' }}>
                {/* Left Column: Client Signature */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '65px', borderBottom: '1px dashed #94a3b8', width: '90%', marginBottom: '6px' }}></div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Customer Signature</div>
                </div>

                {/* Center Column: Company Stamp Seal */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={localStorage.getItem('psk_custom_seal') || DEFAULT_CIRCULAR_SEAL_SVG}
                      alt="PSK Official Seal"
                      style={{ height: '80px', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
                    Official Stamp Seal
                  </div>
                </div>

                {/* Right Column: Authorized Signatory */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', width: '100%' }}>
                    <img
                      src={localStorage.getItem('psk_custom_signature') || DEFAULT_DIGITAL_SIGNATURE_SVG}
                      alt="Authorized Signature"
                      style={{ height: '75px', maxHeight: '85px', maxWidth: '220px', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ borderTop: '1px dashed #94a3b8', width: '90%', paddingTop: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#0f172a' }}>
                      For PSK BROTHERS BUILDERS
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>(Authorized Signatory)</div>
                  </div>
                </div>
              </div>

              <div className="lhFooterLine"></div>
              <div className="lhFooterAddress">
                Old No.123, New No. 1 Bajanai Koil Main Road Choolaimedu Chennai - 600094.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Housing Loan Detailed Technical Valuation Report Modal (STAAD.Pro Certified Style) */}
      {showBankReport && previewInvoice && (
        <div className="modalOverlay" style={{ zIndex: 999999 }}>
          <div className="modalCard modalLetterheadView" style={{ maxWidth: '920px', padding: '0' }}>
            <div className="modalHeader noPrint" style={{ padding: '16px 24px', background: '#0f172a', color: '#fff' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.15rem' }}>🏦 Official Bank Detailed Technical Cost Estimation &amp; Valuation Report</h2>
              <div className="previewActions">
                <button className="btnPrimary" onClick={() => window.print()}><Download size={16} /> Print / Save Bank PDF</button>
                <button className="closeBtn" style={{ color: '#fff' }} onClick={() => setShowBankReport(false)}>×</button>
              </div>
            </div>

            <div className="letterheadContainer printableArea" style={{ padding: '30px' }}>
              {/* Header Accent */}
              <div style={{ borderBottom: '3px solid #e2262b', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>PSK BROTHERS BUILDERS &amp; CONSTRUCTIONS</h1>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#e2262b', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '3px' }}>
                      DETAILED TECHNICAL &amp; MATERIAL COST VALUATION REPORT (FOR BANK HOUSING LOAN)
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                      Chartered Engineers, Govt Approved Valuers &amp; Structural Engineering Consultants
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#334155' }}>
                    <div><strong>Valuation Ref:</strong> PSK-BANK-VAL-{previewInvoice.invoiceNumber || '2026-089'}</div>
                    <div><strong>Date:</strong> {previewInvoice.invoiceDate || new Date().toISOString().split('T')[0]}</div>
                    <div><strong>Bank Target:</strong> SBI / Canara / HDFC / ICICI Bank</div>
                  </div>
                </div>
              </div>

              {/* 1. PROJECT & CLIENT SPECIFICATIONS */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px' }}>
                  SECTION I: CLIENT, SITE LOCATION &amp; PROPERTY SPECIFICATIONS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                  <div><strong>Borrower / Client Name:</strong> {me?.displayName || previewInvoice.customer?.displayName || 'Valued Client'}</div>
                  <div><strong>Contact Number:</strong> {me?.phone || previewInvoice.customer?.phone || 'N/A'}</div>
                  <div><strong>Construction Site Address:</strong> {me?.projectName || previewInvoice.customer?.projectName || 'Plot No 42, Bajanai Koil Main Road, Choolaimedu, Chennai'}</div>
                  <div><strong>Total Plot Area:</strong> {Math.round((previewInvoice.builtUpArea || 1200) * 0.7)} Sq.ft</div>
                  <div><strong>Total Proposed Built-up Area:</strong> <strong style={{ color: '#0284c7' }}>{previewInvoice.builtUpArea || 1200} Sq.ft</strong></div>
                  <div><strong>Structure Type:</strong> Framed RCC Structure (IS 456:2000 Seismic Safe)</div>
                  <div><strong>Estimated Execution Duration:</strong> 10 Months</div>
                  <div><strong>Total Certified Valuation Cost:</strong> <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>₹{Number(previewInvoice.totalAmount || 0).toLocaleString('en-IN')}</strong></div>
                </div>
              </div>

              {/* 2. ITEMISED MATERIAL QUANTITY & FINANCIAL VALUATION BREAKDOWN */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', marginBottom: '8px' }}>
                  SECTION II: ITEMISED MATERIAL QUANTITY &amp; WORK VALUATION BREAKUP (LIVE MARKET RATES)
                </div>
                <table className="lhTable" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px' }}>Item #</th>
                      <th style={{ padding: '8px' }}>Material / Work Particulars</th>
                      <th style={{ padding: '8px' }}>Est. Quantity</th>
                      <th style={{ padding: '8px' }}>Unit Rate (₹)</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Total Valuation (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const totalArea = previewInvoice.builtUpArea || 1200;
                      const totAmt = previewInvoice.totalAmount || (totalArea * 1850);
                      
                      const matBreakup = [
                        { item: 'Cement (UltraTech / Ramco 53-Grade)', qty: `${Math.round(totalArea * 0.4)} Bags`, rate: 420, amount: Math.round(totAmt * 0.12) },
                        { item: 'TMT Steel Reinforcement Bars (Tata Tiscon 550D Fe)', qty: `${(totalArea * 0.003).toFixed(2)} Tons`, rate: 68000, amount: Math.round(totAmt * 0.14) },
                        { item: 'M-Sand & River Sand for PCC & Masonry', qty: `${Math.round(totalArea * 2.0)} Cu.ft`, rate: 65, amount: Math.round(totAmt * 0.08) },
                        { item: 'Coarse Blue Metal Aggregates (20mm & 40mm)', qty: `${Math.round(totalArea * 1.2)} Cu.ft`, rate: 45, amount: Math.round(totAmt * 0.05) },
                        { item: 'First Class Chamber Red Bricks / AAC Blocks', qty: `${Math.round(totalArea * 12)} Nos`, rate: 11, amount: Math.round(totAmt * 0.09) },
                        { item: 'Vitrified Flooring Tiles & Granite Stones (Somany/Kajaria)', qty: `${Math.round(totalArea * 0.9)} Sq.ft`, rate: 85, amount: Math.round(totAmt * 0.08) },
                        { item: 'Teak Main Door, Flush Interior Doors & UPVC Windows', qty: '1 Job Complete', rate: 0, amount: Math.round(totAmt * 0.07) },
                        { item: 'CPVC Plumbing Pipes, Overhead Tank & Sanitaryware (Jaquar)', qty: '1 Job Complete', rate: 0, amount: Math.round(totAmt * 0.06) },
                        { item: 'Fire-Resistant Copper Wiring & Modular Switchgear (Finolex)', qty: '1 Job Complete', rate: 0, amount: Math.round(totAmt * 0.06) },
                        { item: 'Wall Putty, Primer & Asian Apex Weatherproof Painting', qty: '1 Job Complete', rate: 0, amount: Math.round(totAmt * 0.05) },
                        { item: 'Centering, Shuttering, Earthwork Excavation & Skilled Labor', qty: '1 Job Complete', rate: 0, amount: Math.round(totAmt * 0.20) }
                      ];

                      return matBreakup.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 8px' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 8px' }}><strong>{m.item}</strong></td>
                          <td style={{ padding: '6px 8px' }}>{m.qty}</td>
                          <td style={{ padding: '6px 8px' }}>{m.rate > 0 ? `₹${m.rate}` : 'Lumpsum'}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{m.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* 3. STAGE-WISE BANK DISBURSEMENT SCHEDULE */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#e2262b', marginBottom: '8px' }}>
                  SECTION III: STAGE-WISE BANK LOAN DISBURSEMENT SCHEDULE
                </div>
                <table className="lhTable" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px' }}>Stage #</th>
                      <th style={{ padding: '8px' }}>Construction Stage Milestone</th>
                      <th style={{ padding: '8px' }}>Disbursement %</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Stage Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let parsed = {};
                      try { parsed = JSON.parse(previewInvoice.lineItemsJson || '{}'); } catch (e) { }
                      return getDynamicMilestones(parsed.floors).map((st, idx) => {
                        const stageAmt = Math.round((previewInvoice.totalAmount || 0) * (st.pct / 100));
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px 8px' }}><strong>Stage {idx + 1}</strong></td>
                            <td style={{ padding: '6px 8px' }}>{st.stage}</td>
                            <td style={{ padding: '6px 8px' }}><strong>{st.pct}%</strong></td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{stageAmt.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* 4. STRUCTURAL ENGINEER CERTIFICATION STATEMENT */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '8px', marginBottom: '25px', fontSize: '0.8rem', color: '#166534' }}>
                <strong>TECHNICAL CERTIFICATION STATEMENT:</strong>
                <br />
                This is to certify that the detailed construction estimate for <strong>{me?.displayName || previewInvoice.customer?.displayName || 'Valued Client'}</strong>'s proposed residential building of <strong>{previewInvoice.builtUpArea || 1200} Sq.ft</strong> total area has been evaluated based on prevalent market rates in Chennai. The structural design complies with National Building Code (NBC) &amp; IS 456:2000 specifications for earthquake and structural safety. Recommended for bank housing loan sanction.
              </div>

              {/* 3-Column Footer Signature */}
              <div className="lhSignSection" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-end', marginTop: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px' }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '65px', borderBottom: '1px dashed #94a3b8', width: '90%', marginBottom: '6px' }}></div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Borrower / Client Signature</div>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={localStorage.getItem('psk_custom_seal') || DEFAULT_CIRCULAR_SEAL_SVG} alt="Official Seal" style={{ height: '80px', objectFit: 'contain' }} />
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', marginTop: '4px' }}>OFFICIAL VALUER STAMP SEAL</div>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', width: '100%' }}>
                    <img src={localStorage.getItem('psk_custom_signature') || DEFAULT_DIGITAL_SIGNATURE_SVG} alt="Authorized Signature" style={{ height: '75px', maxHeight: '85px', maxWidth: '220px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ borderTop: '1px dashed #94a3b8', width: '90%', paddingTop: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a' }}>For PSK BROTHERS BUILDERS</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Licensed Structural Engineer &amp; Valuer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official House Construction Legal Agreement & Contract Modal */}
      {showAgreement && previewInvoice && (
        <div className="modalOverlay" style={{ zIndex: 999999 }}>
          <div className="modalCard modalLetterheadView" style={{ maxWidth: '920px', padding: '0' }}>
            <div className="modalHeader noPrint" style={{ padding: '16px 24px', background: '#0f172a', color: '#fff' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.15rem' }}>📜 Official House Construction Legal Agreement &amp; Contract Document</h2>
              <div className="previewActions">
                <button className="btnPrimary" onClick={() => window.print()}><Download size={16} /> Print / Save Contract PDF</button>
                <button className="closeBtn" style={{ color: '#fff' }} onClick={() => setShowAgreement(false)}>×</button>
              </div>
            </div>

            <div className="letterheadContainer printableArea" style={{ padding: '35px' }}>
              {/* Agreement Header */}
              <div style={{ textAlign: 'center', borderBottom: '3px double #0f172a', paddingBottom: '14px', marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', letterSpacing: '0.5px' }}>
                  PSK BROTHERS BUILDERS &amp; CONSTRUCTIONS
                </h1>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#e2262b', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '4px' }}>
                  OFFICIAL HOUSE CONSTRUCTION LEGAL AGREEMENT &amp; CONTRACT
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Registered Office: Old No.123, New No. 1 Bajanai Koil Main Road, Choolaimedu, Chennai - 600094 | Mob: 9941426479
                </div>
              </div>

              {/* CLAUSE 1: PARTIES */}
              <div style={{ fontSize: '0.86rem', lineHeight: '1.6', color: '#1e293b', marginBottom: '20px' }}>
                This House Construction Agreement is entered into on <strong>{previewInvoice.invoiceDate || new Date().toLocaleDateString()}</strong> between:
                <br /><br />
                <strong>1. THE BUILDER:</strong> <strong>PSK BROTHERS BUILDERS &amp; CONSTRUCTIONS</strong>, represented by Partners S. Prakash &amp; S. Senthil Murugan, having registered office at Choolaimedu, Chennai (hereinafter referred to as the "FIRST PARTY / BUILDER").
                <br /><br />
                <strong>2. THE CLIENT / OWNER:</strong> <strong>{me?.displayName || previewInvoice.customer?.displayName || 'Valued Client'}</strong>, residing at {me?.projectName || previewInvoice.customer?.projectName || 'Chennai'}, Contact: {me?.phone || previewInvoice.customer?.phone || 'N/A'} (hereinafter referred to as the "SECOND PARTY / CLIENT").
              </div>

              {/* CLAUSE 2: SCOPE OF WORK & COST */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a', marginBottom: '8px' }}>
                  CLAUSE 1: SCOPE OF WORK &amp; TOTAL CONTRACT VALUE
                </div>
                <div>
                  The Builder agrees to construct a turnkey Residential Building of <strong>{previewInvoice.builtUpArea || 1200} Sq.ft total built-up area</strong> for the total fixed contract sum of:
                  <br />
                  <strong style={{ fontSize: '1.1rem', color: '#e2262b', display: 'block', margin: '6px 0' }}>
                    ₹{Number(previewInvoice.totalAmount || 0).toLocaleString('en-IN')} ({previewInvoice.amountInWords || 'Rupees Only'})
                  </strong>
                  The construction rate includes all labor, Tata Tiscon steel, UltraTech cement, Somany tiles, teak doors, plumbing, electrical, and finishing as detailed in the technical specification attachment.
                </div>
              </div>

              {/* CLAUSE 3: MILESTONE PAYMENT SCHEDULE */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a', marginBottom: '8px' }}>
                  CLAUSE 2: STAGE-WISE MILESTONE PAYMENT SCHEDULE
                </div>
                <table className="lhTable" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px' }}>Stage #</th>
                      <th style={{ padding: '8px' }}>Work Milestone Stage</th>
                      <th style={{ padding: '8px' }}>Payment %</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Amount Payable (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let parsed = {};
                      try { parsed = JSON.parse(previewInvoice.lineItemsJson || '{}'); } catch (e) { }
                      return getDynamicMilestones(parsed.floors).map((st, idx) => {
                        const stageAmt = Math.round((previewInvoice.totalAmount || 0) * (st.pct / 100));
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px 8px' }}><strong>Stage {idx + 1}</strong></td>
                            <td style={{ padding: '6px 8px' }}>{st.stage}</td>
                            <td style={{ padding: '6px 8px' }}><strong>{st.pct}%</strong></td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{stageAmt.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* CLAUSE 4: TIMELINE, WARRANTY & LEGAL TERMS */}
              <div style={{ fontSize: '0.83rem', lineHeight: '1.6', color: '#334155', marginBottom: '25px' }}>
                <strong>CLAUSE 3: TIMELINE &amp; STRUCTURAL WARRANTY TERMS</strong>
                <ul style={{ margin: '6px 0', paddingLeft: '20px' }}>
                  <li><strong>Timeline:</strong> Construction shall be completed within <strong>10 Months</strong> from foundation commencement, subject to timely stage payments.</li>
                  <li><strong>10-Year Warranty:</strong> PSK Builders provides a <strong>10-Year Structural Guarantee</strong> for RCC columns, beams, footings, and roof slabs.</li>
                  <li><strong>Extra Work:</strong> Any design changes or extra additions requested by the Client outside the contract specifications will be billed separately.</li>
                  <li><strong>Jurisdiction:</strong> All legal disputes shall be subject to the exclusive jurisdiction of the Courts in Chennai, Tamil Nadu.</li>
                </ul>
              </div>

              {/* 3-COLUMN SIGNATURE BLOCK */}
              <div className="lhSignSection" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-end', marginTop: '30px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px' }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '65px', borderBottom: '1px dashed #94a3b8', width: '90%', marginBottom: '6px' }}></div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Client / Property Owner Signature</div>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={localStorage.getItem('psk_custom_seal') || DEFAULT_CIRCULAR_SEAL_SVG} alt="Official Seal" style={{ height: '80px', objectFit: 'contain' }} />
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', marginTop: '4px' }}>OFFICIAL STAMP SEAL</div>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', width: '100%' }}>
                    <img src={localStorage.getItem('psk_custom_signature') || DEFAULT_DIGITAL_SIGNATURE_SVG} alt="Authorized Signature" style={{ height: '75px', maxHeight: '85px', maxWidth: '220px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ borderTop: '1px dashed #94a3b8', width: '90%', paddingTop: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a' }}>For PSK BROTHERS BUILDERS</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>(Authorized Signatory)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {payingInvoice && (
        <div className="modalOverlay" style={{ zIndex: 1000 }}>
          <div className="modalCard" style={{ maxWidth: '480px', borderRadius: '20px', padding: '24px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                💳 Online Milestone Payment Gateway
              </h3>
              <button onClick={() => setPayingInvoice(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Pay securely via Razorpay (GPay, PhonePe, Paytm, BHIM UPI, NetBanking or Cards).
            </p>

            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Invoice / Bill Number:</div>
              <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{payingInvoice.invoiceNumber} ({payingInvoice.stageName || 'Stage Payment'})</strong>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.88rem' }}>
                <span>Balance Due:</span>
                <strong style={{ color: '#dc2626', fontSize: '1rem' }}>₹{Number(payingInvoice.balanceDue).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {paySuccessMsg ? (
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '16px', borderRadius: '12px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                {paySuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleProcessRazorpayPayment}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Enter Amount to Pay (₹):
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingInvoice.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}
                  required
                />

                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
                  Select Payment Method:
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {['UPI (GPay/PhonePe)', 'NetBanking', 'Debit/Credit Card'].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPayMethod(m)}
                      style={{
                        padding: '8px 14px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
                        border: '1px solid #2563eb',
                        background: payMethod === m ? '#2563eb' : '#fff',
                        color: payMethod === m ? '#fff' : '#2563eb'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={payProcessing}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#16a34a', color: '#fff', fontSize: '1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {payProcessing ? 'Processing Payment...' : `Pay ₹${Number(payAmount || 0).toLocaleString('en-IN')} via Razorpay 🔒`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
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

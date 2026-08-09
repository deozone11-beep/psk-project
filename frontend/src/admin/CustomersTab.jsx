import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  FolderOpen, 
  FileText, 
  Download, 
  X, 
  Eye, 
  EyeOff, 
  Search, 
  UserCheck, 
  Building2, 
  Mail, 
  Phone, 
  Edit3, 
  UploadCloud,
  Layers,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api, API } from './api';

export default function CustomersTab({ creds }) {
  const [list, setList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ username: '', password: '', displayName: '', phone: '', projectName: '', estimatedSqft: '', email: '' });
  const [msg, setMsg] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCust, setSelectedCust] = useState(null);
  const [custFiles, setCustFiles] = useState([]);
  const [detailedCust, setDetailedCust] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', phone: '', projectName: '', estimatedSqft: '', email: '', password: '' });
  const [showPasswordCreate, setShowPasswordCreate] = useState(false);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [fileForm, setFileForm] = useState({ name: '', category: 'PLAN', file: null });
  const [fileMsg, setFileMsg] = useState('');
  const [fileBusy, setFileBusy] = useState(false);

  useEffect(() => { load(); }, []);
  function load() { api('/admin/customers', creds).then(setList).catch(console.error); }

  useEffect(() => {
    if (selectedCust) {
      loadFiles(selectedCust.id);
    } else {
      setCustFiles([]);
    }
  }, [selectedCust]);

  function loadFiles(customerId) {
    api(`/admin/files?customerId=${customerId}`, creds)
      .then(setCustFiles)
      .catch(console.error);
  }

  async function add(e) {
    e.preventDefault();
    try {
      await api('/admin/customers', creds, { method: 'POST', body: JSON.stringify({ ...form, estimatedSqft: Number(form.estimatedSqft) || null }) });
      setForm({ username: '', password: '', displayName: '', phone: '', projectName: '', estimatedSqft: '', email: '' });
      setMsg('Customer login created successfully ✓');
      setShowCreateModal(false);
      load();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) { setMsg(err.message); }
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      const updated = await api(`/admin/customers/${detailedCust.id}`, creds, {
        method: 'PUT',
        body: JSON.stringify({
          ...editForm,
          estimatedSqft: Number(editForm.estimatedSqft) || null
        })
      });
      setDetailedCust(updated);
      setIsEditing(false);
      setMsg('Customer profile updated successfully ✓');
      load();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  }

  async function del(id) {
    if (!confirm('Remove this customer account? They will lose client portal access.')) return;
    try { 
      await api(`/admin/customers/${id}`, creds, { method: 'DELETE' }); 
      if (selectedCust?.id === id) setSelectedCust(null);
      if (detailedCust?.id === id) setDetailedCust(null);
      load(); 
    } catch (e) { console.error(e); }
  }

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!fileForm.file) {
      setFileMsg('Please select a file');
      return;
    }
    setFileBusy(true);
    setFileMsg('');
    try {
      const fd = new FormData();
      fd.append('customerId', selectedCust.id);
      fd.append('fileName', fileForm.name || fileForm.file.name);
      fd.append('category', fileForm.category);
      fd.append('file', fileForm.file);

      const r = await fetch(`${API}/admin/files`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + creds.token },
        body: fd
      });
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.message || 'Upload failed');
      }

      setFileForm({ name: '', category: 'PLAN', file: null });
      const fInput = document.getElementById('admin-file-input');
      if (fInput) fInput.value = '';

      setFileMsg('Document uploaded successfully ✓');
      loadFiles(selectedCust.id);
    } catch (err) {
      setFileMsg(err.message || 'Error uploading');
    } finally {
      setFileBusy(false);
    }
  }

  async function deleteFile(id) {
    if (!confirm('Are you sure you want to delete this shared document?')) return;
    try {
      await api(`/admin/files/${id}`, creds, { method: 'DELETE' });
      loadFiles(selectedCust.id);
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredList = list.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.displayName || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.projectName || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const totalSqft = list.reduce((sum, c) => sum + (Number(c.estimatedSqft) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Summary KPI Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Total Clients */}
        <div className="adminCard" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(226, 38, 43, 0.15)', color: '#ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registered Clients</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', margin: '2px 0' }}>{list.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Active Portal Access
            </div>
          </div>
        </div>

        {/* Card 2: Total Sqft Built */}
        <div className="adminCard" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Construction Area</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', margin: '2px 0' }}>{totalSqft.toLocaleString('en-IN')} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '600' }}>sq ft</span></div>
            <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: '600' }}>Across Active Sites</div>
          </div>
        </div>

        {/* Card 3: Document Vault Link */}
        <div className="adminCard" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client Portal URL</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#c084fc', margin: '4px 0 2px' }}>/portal</div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: '600' }}>Mobile Number Login Enabled</div>
          </div>
        </div>

      </div>

      {/* Main Customers List Card */}
      <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: '#ffffff' }}>Customer Logins &amp; Site Portals ({list.length})</h3>
            <p className="adminHint" style={{ margin: '4px 0 0', color: '#94a3b8' }}>Manage client credentials, job site details, and project document sharing for client tracking at <code>/portal</code>.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                placeholder="Search by client or project..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '9px 12px 9px 36px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <button 
              className="primary" 
              onClick={() => { setShowCreateModal(true); setMsg(''); }}
              style={{
                borderRadius: '10px',
                height: '40px',
                padding: '0 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)',
                boxShadow: '0 4px 14px rgba(226, 38, 43, 0.4)'
              }}
            >
              <Plus size={16} /> Create Login
            </button>
          </div>
        </div>

        {msg && (
          <div style={{ padding: '10px 16px', borderRadius: '10px', background: msg.includes('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: msg.includes('✓') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', color: msg.includes('✓') ? '#34d399' : '#f87171', fontWeight: '700', fontSize: '0.85rem', marginBottom: '16px' }}>
            {msg}
          </div>
        )}

        {/* Client Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredList.map((c) => {
            const isSelected = selectedCust?.id === c.id;
            return (
              <div 
                key={c.id} 
                style={{ 
                  display: 'flex', 
                  justify: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px 20px', 
                  borderRadius: '14px',
                  background: isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(30, 41, 59, 0.55)',
                  border: isSelected ? '1.5px solid #e2262b' : '1px solid rgba(255, 255, 255, 0.14)',
                  boxShadow: isSelected ? '0 10px 25px rgba(226, 38, 43, 0.25)' : '0 4px 14px rgba(0,0,0,0.35)',
                  transition: 'all 0.2s ease',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                {/* Client Main Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: 'linear-gradient(135deg, #e2262b 0%, #7f1d1d 100%)', 
                    color: '#ffffff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '900',
                    boxShadow: '0 4px 12px rgba(226, 38, 43, 0.35)'
                  }}>
                    {c.displayName ? c.displayName.charAt(0).toUpperCase() : 'C'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>
                        {c.displayName}
                      </span>
                      <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '2px 9px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                        @{c.username}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                      {c.projectName && (
                        <span style={{ background: 'rgba(239, 68, 68, 0.18)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          🏢 {c.projectName}
                        </span>
                      )}
                      {c.estimatedSqft && (
                        <span style={{ background: 'rgba(59, 130, 246, 0.18)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          📏 {c.estimatedSqft.toLocaleString('en-IN')} sq ft
                        </span>
                      )}
                      <span style={{ color: '#e2e8f0', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={14} style={{ color: '#60a5fa' }} /> {c.email}
                      </span>
                      {c.phone && (
                        <span style={{ color: '#e2e8f0', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={14} style={{ color: '#34d399' }} /> {c.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Group */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    onClick={() => { setDetailedCust(c); setIsEditing(false); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Edit3 size={14} /> Profile
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setSelectedCust(isSelected ? null : c)}
                    style={{
                      background: isSelected ? '#e2262b' : 'rgba(226, 38, 43, 0.15)',
                      border: '1px solid rgba(226, 38, 43, 0.4)',
                      color: isSelected ? '#ffffff' : '#ff6b6b',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 14px rgba(226, 38, 43, 0.4)' : 'none'
                    }}
                  >
                    <FolderOpen size={14} /> {isSelected ? 'Close Files' : 'Shared Documents'}
                  </button>

                  <button 
                    onClick={() => del(c.id)} 
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Remove Customer Account"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
                {searchQuery ? `No customer accounts matching "${searchQuery}".` : 'No customer accounts registered yet.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Shared Documents Manager Section */}
      {selectedCust && (
        <section className="adminCard" style={{ animation: 'heroIn 0.3s ease', padding: '24px', borderRadius: '16px', border: '1.5px solid rgba(226, 38, 43, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#ff6b6b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>DOCUMENT SHARING VAULT</div>
              <h3 style={{ margin: '2px 0 0', fontSize: '1.2rem', color: '#ffffff', fontWeight: '800' }}>
                Shared Documents for <span style={{ color: '#ff6b6b' }}>{selectedCust.displayName}</span> (@{selectedCust.username})
              </h3>
              <p className="adminHint" style={{ margin: '4px 0 0', color: '#94a3b8' }}>Plan drawings, structural PDFs, estimate files, and site updates shared directly with this client portal.</p>
            </div>
            <button 
              onClick={() => setSelectedCust(null)} 
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.8rem' }}
            >
              <X size={15} /> Close Vault
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
            
            {/* Shared Files List */}
            <div>
              <h4 style={{ margin: '0 0 12px', color: '#ffffff', fontSize: '0.95rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} style={{ color: '#ff6b6b' }} /> Shared Files ({custFiles.length})
              </h4>

              {custFiles.length === 0 ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.15)', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No documents shared with this customer yet. Use the upload panel to share plans or invoices.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {custFiles.map((f) => (
                    <div 
                      key={f.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justify: 'space-between', 
                        padding: '12px 16px', 
                        background: 'rgba(15, 23, 42, 0.8)', 
                        borderRadius: '10px', 
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(226, 38, 43, 0.15)', color: '#ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#ffffff' }}>{f.fileName}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ff6b6b', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '0.65rem' }}>
                              {f.category}
                            </span>
                            <span>• By {f.uploadedByRole === 'CUSTOMER' ? 'Client' : f.uploadedByRole}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <a 
                          href={f.fileData} 
                          download={f.fileName} 
                          style={{ 
                            padding: '6px 12px', 
                            background: 'rgba(255, 255, 255, 0.1)', 
                            color: '#ffffff', 
                            border: 'none', 
                            textDecoration: 'none', 
                            borderRadius: '6px', 
                            fontSize: '0.78rem', 
                            fontWeight: '700',
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px' 
                          }}
                        >
                          <Download size={13} /> Download
                        </a>
                        <button 
                          onClick={() => deleteFile(f.id)} 
                          style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}
                          title="Delete File"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload File Panel */}
            <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <h4 style={{ margin: '0 0 12px', color: '#ffffff', fontSize: '0.95rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={18} style={{ color: '#60a5fa' }} /> Upload Document to Client Portal
              </h4>

              <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'transparent', padding: 0, border: 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8' }}>Document Title *</label>
                  <input 
                    placeholder="e.g. Ground Floor Plan Drawing v2" 
                    value={fileForm.name} 
                    onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })} 
                    required 
                    style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px', fontSize: '0.85rem' }} 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8' }}>Document Category</label>
                  <select 
                    value={fileForm.category} 
                    onChange={(e) => setFileForm({ ...fileForm, category: e.target.value })} 
                    style={{ padding: '10px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="PLAN" style={{ background: '#0f172a' }}>Building Plan Drawing</option>
                    <option value="APPROVAL" style={{ background: '#0f172a' }}>Approval / Permit Document</option>
                    <option value="ESTIMATE" style={{ background: '#0f172a' }}>Estimate / Cost Invoice</option>
                    <option value="OTHER" style={{ background: '#0f172a' }}>Other Document / Photo</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8' }}>Select File (PDF / Image / Doc) *</label>
                  <input 
                    id="admin-file-input" 
                    type="file" 
                    onChange={(e) => setFileForm({ ...fileForm, file: e.target.files[0] })} 
                    required 
                    style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px dashed rgba(255, 255, 255, 0.2)', color: '#cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }} 
                  />
                </div>

                {fileMsg && (
                  <div style={{ color: fileMsg.includes('✓') ? '#34d399' : '#f87171', fontSize: '0.8rem', fontWeight: '700', marginTop: '4px' }}>
                    {fileMsg}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="primary" 
                  style={{ 
                    padding: '10px 16px', 
                    fontSize: '0.85rem', 
                    width: '100%', 
                    justify: 'center', 
                    borderRadius: '8px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)',
                    marginTop: '4px'
                  }} 
                  disabled={fileBusy}
                >
                  {fileBusy ? 'Uploading Document...' : 'Upload & Share with Client'}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Create Customer Login Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0d1322',
            borderRadius: '20px',
            padding: '28px 32px',
            width: '90%',
            maxWidth: '650px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            animation: 'heroIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>NEW CLIENT ACCOUNT</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>Create Customer Portal Login</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', padding: '6px', borderRadius: '50%', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <p className="adminHint" style={{ marginBottom: '20px', color: '#94a3b8', fontSize: '0.82rem' }}>
              Provide construction project details and credentials. The client will log in at <code>/portal</code> using their Mobile Number.
            </p>

            <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'transparent', border: 'none', padding: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Customer Name *</label>
                  <input placeholder="Ramesh Kumar" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Mobile Number / Login User ID *</label>
                  <input placeholder="e.g. 9876543210" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Password *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showPasswordCreate ? "text" : "password"} 
                      placeholder="Min 6 characters" 
                      value={form.password} 
                      onChange={(e) => setForm({ ...form, password: e.target.value })} 
                      required 
                      style={{ width: '100%', padding: '10px', paddingRight: '40px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', borderRadius: '8px' }} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordCreate(!showPasswordCreate)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                    >
                      {showPasswordCreate ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Email (For recovery) *</label>
                  <input type="email" placeholder="client@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Alternative Phone</label>
                  <input placeholder="Alternative number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Project / Job Site Name</label>
                  <input placeholder="e.g. Modern Family Residence" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Estimated Area (Sq Ft)</label>
                <input type="number" placeholder="e.g. 1800" value={form.estimatedSqft} onChange={(e) => setForm({ ...form, estimatedSqft: e.target.value })} style={{ padding: '10px', width: '100%', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#cbd5e1', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: '800', background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)' }}>
                  Create Customer Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile View Modal */}
      {detailedCust && !isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0d1322',
            borderRadius: '20px',
            padding: '30px',
            width: '90%',
            maxWidth: '520px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            animation: 'heroIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>CLIENT ACCOUNT DETAILS</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>Customer Profile</h3>
              </div>
              <button 
                onClick={() => setDetailedCust(null)}
                style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', padding: '6px', borderRadius: '50%', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'linear-gradient(135deg, #e2262b 0%, #7f1d1d 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '900', boxShadow: '0 4px 14px rgba(226, 38, 43, 0.4)' }}>
                  {detailedCust.displayName ? detailedCust.displayName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <b style={{ fontSize: '1.15rem', color: '#ffffff', display: 'block' }}>{detailedCust.displayName}</b>
                  <span style={{ display: 'inline-block', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', marginTop: '4px' }}>
                    @{detailedCust.username}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.86rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Mobile (User ID)</span>
                  <p style={{ margin: '4px 0 0', fontWeight: '700', color: '#ffffff' }}>{detailedCust.username}</p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Alt Phone</span>
                  <p style={{ margin: '4px 0 0', fontWeight: '700', color: '#ffffff' }}>{detailedCust.phone || '-'}</p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', gridColumn: 'span 2' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Recovery Email</span>
                  <p style={{ margin: '4px 0 0', fontWeight: '700', color: '#ffffff' }}>{detailedCust.email}</p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Job Site</span>
                  <p style={{ margin: '4px 0 0', fontWeight: '700', color: '#ff6b6b' }}>🏢 {detailedCust.projectName || 'Not set'}</p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Total Area</span>
                  <p style={{ margin: '4px 0 0', fontWeight: '700', color: '#ffffff' }}>{detailedCust.estimatedSqft ? `${detailedCust.estimatedSqft.toLocaleString('en-IN')} Sq Ft` : '-'}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  setIsEditing(true);
                  setEditForm({
                    displayName: detailedCust.displayName,
                    phone: detailedCust.phone || '',
                    projectName: detailedCust.projectName || '',
                    estimatedSqft: detailedCust.estimatedSqft || '',
                    email: detailedCust.email || '',
                    password: ''
                  });
                }}
                style={{ flex: 1, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Edit3 size={15} /> Edit Profile
              </button>
              <button 
                onClick={() => {
                  setSelectedCust(detailedCust);
                  setDetailedCust(null);
                }}
                style={{ flex: 1, background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <FolderOpen size={16} /> Shared Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile Edit Modal */}
      {detailedCust && isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0d1322',
            borderRadius: '20px',
            padding: '28px 32px',
            width: '90%',
            maxWidth: '550px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            animation: 'heroIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>UPDATE DETAILS</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>Edit Customer Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', padding: '6px', borderRadius: '50%', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'transparent', border: 'none', padding: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Customer Name *</label>
                  <input value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} required style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>Mobile (Username - Locked)</label>
                  <input value={detailedCust.username} disabled style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', color: '#94a3b8', cursor: 'not-allowed' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Alternative Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Recovery Email *</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Project / Job Site Name</label>
                  <input value={editForm.projectName} onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })} style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>New Password (Optional)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showPasswordEdit ? "text" : "password"} 
                      placeholder="Leave blank to keep current" 
                      value={editForm.password} 
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                      style={{ width: '100%', padding: '10px', paddingRight: '40px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px' }} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordEdit(!showPasswordEdit)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                    >
                      {showPasswordEdit ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>Estimated Area (Sq Ft)</label>
                <input type="number" value={editForm.estimatedSqft} onChange={(e) => setEditForm({ ...editForm, estimatedSqft: e.target.value })} style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', borderRadius: '8px', width: '100%' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#cbd5e1', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" style={{ padding: '10px 22px', borderRadius: '8px', fontWeight: '800', background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

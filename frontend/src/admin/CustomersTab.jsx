import React, { useEffect, useState } from 'react';
import { Plus, Trash2, FolderOpen, FileText, Download, X, Eye, EyeOff } from 'lucide-react';
import { api, API } from './api';

export default function CustomersTab({ creds }) {
  const [list, setList] = useState([]);
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
      setMsg('Customer login created ✓');
      setShowCreateModal(false);
      load();
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
      setMsg('Customer details updated successfully ✓');
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  }

  async function del(id) {
    if (!confirm('Remove this customer account? They will lose portal access.')) return;
    try { 
      await api(`/admin/customers/${id}`, creds, { method: 'DELETE' }); 
      if (selectedCust?.id === id) setSelectedCust(null);
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

      setFileMsg('Document uploaded ✓');
      loadFiles(selectedCust.id);
    } catch (err) {
      setFileMsg(err.message || 'Error uploading');
    } finally {
      setFileBusy(false);
    }
  }

  async function deleteFile(id) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api(`/admin/files/${id}`, creds, { method: 'DELETE' });
      loadFiles(selectedCust.id);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Customer Logins ({list.length})</h3>
            <p className="adminHint" style={{ margin: '4px 0 0' }}>Create and manage client credentials for tracking projects at <code>/portal</code>.</p>
          </div>
          <button 
            className="primary" 
            onClick={() => { setShowCreateModal(true); setMsg(''); }}
            style={{ borderRadius: '10px', height: '42px', padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Create Login
          </button>
        </div>
        {msg && <p className="adminHint" style={{ color: msg.includes('✓') ? 'green' : '#e2262b', fontWeight: 'bold', margin: '0 0 16px' }}>{msg}</p>}
        <div className="tableList">
          {list.map((c) => (
            <div className={'tableRow' + (selectedCust?.id === c.id ? ' activeCust' : '')} key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <div onClick={() => { setDetailedCust(c); setIsEditing(false); }} style={{ flex: 1, cursor: 'pointer' }}>
                <b style={{ color: '#17201d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  👤 {c.displayName}
                </b>
                <span className="tableSub">@{c.username} · {c.email} · {c.projectName || 'no project set'} · {c.estimatedSqft ? `${c.estimatedSqft} sqft` : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="adminTabBtn" style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => setSelectedCust(c)}>
                  <FolderOpen size={14} /> Documents
                </button>
                <button className="deleteBtn" onClick={() => del(c.id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="adminHint">No customer accounts yet.</p>}
        </div>
      </section>

      {selectedCust && (
        <section className="adminCard" style={{ animation: 'heroIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Document Sharing for {selectedCust.displayName}</h3>
              <p className="adminHint" style={{ margin: '4px 0 0' }}>Plan drawings, estimate PDFs, and approvals shared with this customer.</p>
            </div>
            <button onClick={() => setSelectedCust(null)} className="adminLogoutBtn" style={{ background: '#ececea', color: '#17201d', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <X size={15} /> Close
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'start' }} className="portalDocGrid">
            <div>
              <h4>Shared Files ({custFiles.length})</h4>
              {custFiles.length === 0 ? (
                <p className="adminHint" style={{ padding: '14px 0' }}>No files shared with this customer yet.</p>
              ) : (
                <div className="tableList">
                  {custFiles.map((f) => (
                    <div className="tableRow" key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} style={{ color: '#e2262b' }} />
                        <div>
                          <b style={{ fontSize: '0.85rem', color: '#17201d' }}>{f.fileName}</b>
                          <span style={{ fontSize: '0.68rem', color: '#77807d', textTransform: 'uppercase' }}>
                            {f.category} · By {f.uploadedByRole === 'CUSTOMER' ? 'Client' : f.uploadedByRole}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a href={f.fileData} download={f.fileName} className="adminTabBtn" style={{ padding: '4px 8px', background: '#ececea', color: '#17201d', border: 'none', textDecoration: 'none', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <Download size={12} /> Download
                        </a>
                        <button onClick={() => deleteFile(f.id)} className="deleteBtn" style={{ padding: '4px 8px' }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#f8f8f7', padding: '20px', borderRadius: '12px', border: '1px solid #ececea' }}>
              <h4>Upload New File</h4>
              <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'transparent', padding: 0, border: 'none' }}>
                <input placeholder="File Name (e.g. Plan Elevation)" value={fileForm.name} onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })} required style={{ padding: '8px 12px', border: '1px solid #d8dcda', borderRadius: '6px', fontSize: '0.85rem' }} />
                <select value={fileForm.category} onChange={(e) => setFileForm({ ...fileForm, category: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d8dcda', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <option value="PLAN">Building Plan</option>
                  <option value="APPROVAL">Approval Document</option>
                  <option value="ESTIMATE">Estimate/Invoice</option>
                  <option value="OTHER">Other</option>
                </select>
                <input id="admin-file-input" type="file" onChange={(e) => setFileForm({ ...fileForm, file: e.target.files[0] })} required style={{ fontSize: '0.75rem' }} />
                {fileMsg && <div className="adminHint" style={{ color: fileMsg.includes('✓') ? 'green' : '#e2262b', fontSize: '0.78rem', margin: 0 }}>{fileMsg}</div>}
                <button type="submit" className="primary" style={{ padding: '8px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'center', borderRadius: '6px' }} disabled={fileBusy}>
                  {fileBusy ? 'Uploading...' : 'Upload File'}
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
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '30px',
            width: '90%',
            maxWidth: '650px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            animation: 'heroIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Create Customer Login</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <p className="adminHint" style={{ marginBottom: '20px' }}>
              Provide construction project details and phone credentials. The client will log in at <code>/portal</code> using their Mobile Number.
            </p>

            <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'transparent', border: 'none', padding: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Customer Name *</label>
                  <input placeholder="Ramesh Kumar" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required style={{ padding: '10px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Mobile Number / User ID *</label>
                  <input placeholder="e.g. 9876543210" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required style={{ padding: '10px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Password *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showPasswordCreate ? "text" : "password"} 
                      placeholder="Min 6 characters" 
                      value={form.password} 
                      onChange={(e) => setForm({ ...form, password: e.target.value })} 
                      required 
                      style={{ width: '100%', padding: '10px', paddingRight: '40px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }} 
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
                        color: '#64748b',
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
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Email (For recovery) *</label>
                  <input type="email" placeholder="client@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ padding: '10px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Alternative Phone</label>
                  <input placeholder="Alternative number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: '10px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Project / Job Site Name</label>
                  <input placeholder="e.g. Modern Family Residence" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} style={{ padding: '10px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Estimated Area (Sq Ft)</label>
                <input type="number" placeholder="e.g. 1800" value={form.estimatedSqft} onChange={(e) => setForm({ ...form, estimatedSqft: e.target.value })} style={{ padding: '10px', width: '100%' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', color: '#475569', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" style={{ padding: '10px 24px', borderRadius: '8px' }}>
                  Create Customer
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
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            animation: 'heroIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Customer Profile</h3>
              <button 
                onClick={() => setDetailedCust(null)}
                style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', color: '#e2262b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '800' }}>
                  {detailedCust.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <b style={{ fontSize: '1.1rem', color: '#0f172a' }}>{detailedCust.displayName}</b>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b' }}>Project Client Account</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', fontSize: '0.86rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Mobile (User ID)</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '600', color: '#0f172a' }}>{detailedCust.username}</p>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Alternative Phone</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '600', color: '#0f172a' }}>{detailedCust.phone || '-'}</p>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Recovery Email</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '600', color: '#0f172a' }}>{detailedCust.email}</p>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Construction Job Site</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '600', color: '#e2262b' }}>🏢 {detailedCust.projectName || 'Not set'}</p>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Estimated Project Area</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '600', color: '#0f172a' }}>{detailedCust.estimatedSqft ? `${detailedCust.estimatedSqft.toLocaleString('en-IN')} Sq Ft` : '-'}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'stretch' }}>
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
                style={{ flex: 1, background: '#f8fafc', border: '1.5px solid #cbd5e1', color: '#475569', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Edit Profile
              </button>
              <button 
                onClick={() => {
                  setSelectedCust(detailedCust);
                  setDetailedCust(null);
                }}
                style={{ flex: 1, background: '#e2262b', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
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
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '30px',
            width: '90%',
            maxWidth: '550px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            animation: 'heroIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Edit Customer Profile</h3>
              <button 
                onClick={() => setIsEditing(false)}
                style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'transparent', border: 'none', padding: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Customer Name *</label>
                  <input value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} required style={{ padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>Mobile (Username - Locked)</label>
                  <input value={detailedCust.username} disabled style={{ padding: '9px', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: '#f1f5f9', cursor: 'not-allowed' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Alternative Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={{ padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Recovery Email *</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required style={{ padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Project / Job Site Name</label>
                  <input value={editForm.projectName} onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })} style={{ padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>New Password (Optional)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showPasswordEdit ? "text" : "password"} 
                      placeholder="Leave blank to keep current" 
                      value={editForm.password} 
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                      style={{ width: '100%', padding: '9px', paddingRight: '40px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }} 
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
                        color: '#64748b',
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
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Estimated Area (Sq Ft)</label>
                <input type="number" value={editForm.estimatedSqft} onChange={(e) => setEditForm({ ...editForm, estimatedSqft: e.target.value })} style={{ padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', width: '100%' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', color: '#475569', padding: '9px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" style={{ padding: '9px 20px', borderRadius: '8px' }}>
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

import React, { useEffect, useState } from 'react';
import { 
  Upload, 
  Plus, 
  Trash2, 
  X, 
  ImagePlus, 
  Pencil, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Layers, 
  Calendar as CalendarIcon, 
  User, 
  Ruler, 
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from './api';

export default function ProjectsTab({ creds }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    title: '',
    location: '',
    status: 'Completed',
    category: 'Residential',
    sqft: '',
    duration: '',
    client: '',
    year: '2024',
    description: ''
  });
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { load(); }, []);
  function load() { api('/admin/projects', creds).then(setList).catch(console.error); }

  async function add(e) {
    e.preventDefault();
    if (!form.title.trim()) { setMsg('Enter a project title first'); return; }
    if (files.length === 0) { setMsg('Choose at least one photo of the project first'); return; }
    setUploading(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('location', form.location);
      fd.append('status', form.status);
      fd.append('category', form.category);
      fd.append('sqft', form.sqft);
      fd.append('duration', form.duration);
      fd.append('client', form.client);
      fd.append('year', form.year);
      fd.append('description', form.description);
      files.forEach((f) => fd.append('photos', f));
      await api('/admin/projects', creds, { method: 'POST', body: fd });
      setForm({
        title: '',
        location: '',
        status: 'Completed',
        category: 'Residential',
        sqft: '',
        duration: '',
        client: '',
        year: '2024',
        description: ''
      });
      setFiles([]);
      setMsg('Project added to public portfolio successfully ✓');
      load();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) { setMsg(err.message); } finally { setUploading(false); }
  }

  async function del(id) {
    if (!confirm('Remove this project from the public portfolio site?')) return;
    try { await api(`/admin/projects/${id}`, creds, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  }

  const completedCount = list.filter(p => p.status === 'Completed').length;
  const ongoingCount = list.filter(p => p.status === 'Ongoing').length;
  const totalSqftSum = list.reduce((sum, p) => {
    const raw = (p.sqft || '').replace(/[^0-9]/g, '');
    return sum + (Number(raw) || 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top KPI Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Showcase Projects */}
        <div className="adminCard" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(226, 38, 43, 0.15)', color: '#ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Portfolio Showcase</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', margin: '2px 0' }}>{list.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Live on /projects Site
            </div>
          </div>
        </div>

        {/* Card 2: Total Sqft Showcase */}
        <div className="adminCard" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ruler size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Portfolio Built Area</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', margin: '2px 0' }}>{totalSqftSum ? totalSqftSum.toLocaleString('en-IN') : '4,600'} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '600' }}>sq ft</span></div>
            <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: '600' }}>Architectural Footprint</div>
          </div>
        </div>

        {/* Card 3: Project Status Breakdown */}
        <div className="adminCard" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Status</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#c084fc', margin: '4px 0 2px' }}>{completedCount} Completed</div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: '600' }}>{ongoingCount} Ongoing Project(s)</div>
          </div>
        </div>

      </div>

      {/* Main Portfolio Form & List Section */}
      <section className="adminCard" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: '900', color: '#ffffff' }}>Selected Projects (Portfolio)</h3>
        <p className="adminHint" style={{ marginBottom: '20px', color: '#94a3b8' }}>All projects added here are live on the public site and <code>/projects</code> portfolio. You can edit all specifications, built-up area (Sq.Ft.), location, client details, descriptions, and photos.</p>

        {msg && (
          <div style={{ padding: '10px 16px', borderRadius: '10px', background: msg.includes('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: msg.includes('✓') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', color: msg.includes('✓') ? '#34d399' : '#f87171', fontWeight: '700', fontSize: '0.85rem', marginBottom: '16px' }}>
            {msg}
          </div>
        )}
        
        {/* Form Container */}
        <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(15, 23, 42, 0.75)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)', marginBottom: '28px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: '#ff6b6b' }} /> Add New Project Showcase
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Project Title *</label>
              <input placeholder="e.g. Modern Family Residence" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Location / City *</label>
              <input placeholder="e.g. Porur, Chennai" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(15, 23, 42, 0.9)', color: '#ffffff', fontSize: '0.88rem' }}>
                <option value="Residential" style={{ background: '#0f172a' }}>Residential</option>
                <option value="Villa" style={{ background: '#0f172a' }}>Villa</option>
                <option value="Commercial" style={{ background: '#0f172a' }}>Commercial</option>
                <option value="Renovation" style={{ background: '#0f172a' }}>Renovation</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Status *</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(15, 23, 42, 0.9)', color: '#ffffff', fontSize: '0.88rem' }}>
                <option value="Completed" style={{ background: '#0f172a' }}>Completed</option>
                <option value="Ongoing" style={{ background: '#0f172a' }}>Ongoing</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Built-Up Area (Sq.Ft.)</label>
              <input placeholder="e.g. 2,800 Sq.Ft." value={form.sqft} onChange={(e) => setForm({ ...form, sqft: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Construction Duration</label>
              <input placeholder="e.g. 10 Months" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Client / Owner Name</label>
              <input placeholder="e.g. Karthik &amp; Family" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Completion Year</label>
              <input placeholder="e.g. 2024" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Project Overview / Architectural Highlights</label>
            <textarea rows={2} placeholder="e.g. Ultra-modern 3-story luxury residential home built with RCC framed structure, modular kitchen, and glass elevation..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', paddingTop: '4px' }}>
            <label 
              style={{ 
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1.5px dashed rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: '700'
              }}
            >
              <Upload size={16} style={{ color: '#60a5fa' }} /> 
              {files.length ? `${files.length} Photo${files.length > 1 ? 's' : ''} Selected` : 'Choose Project Photos (Multiple)'}
              <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files))} hidden />
            </label>

            <button 
              className="primary" 
              disabled={uploading} 
              style={{ 
                padding: '12px 28px', 
                borderRadius: '10px', 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #e2262b 0%, #991b1b 100%)',
                boxShadow: '0 4px 14px rgba(226, 38, 43, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} /> {uploading ? 'Uploading Project Photos...' : 'Save & Publish Project'}
            </button>
          </div>
        </form>

        {/* Portfolio Cards Grid */}
        <h4 style={{ margin: '0 0 16px', fontSize: '1.15rem', color: '#ffffff', fontWeight: '900' }}>Live Portfolio Showcase ({list.length})</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {list.map((p) => <ProjectCard key={p.id} project={p} creds={creds} onChanged={load} onDelete={() => del(p.id)} />)}
          {list.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>No projects added yet — the public site will show default projects until you add your custom portfolio.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProjectCard({ project: p, creds, onChanged, onDelete }) {
  const [addingFiles, setAddingFiles] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(p.title || '');
  const [editLocation, setEditLocation] = useState(p.location || '');
  const [editStatus, setEditStatus] = useState(p.status || 'Completed');
  const [editCategory, setEditCategory] = useState(p.category || 'Residential');
  const [editSqft, setEditSqft] = useState(p.sqft || '');
  const [editDuration, setEditDuration] = useState(p.duration || '');
  const [editClient, setEditClient] = useState(p.client || '');
  const [editYear, setEditYear] = useState(p.year || '2024');
  const [editDescription, setEditDescription] = useState(p.description || '');

  const images = p.imageUrls || (p.imageUrl ? [p.imageUrl] : []);

  async function saveDetails(e) {
    e.preventDefault();
    try {
      const res = await api(`/admin/projects/${p.id}`, creds, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle,
          location: editLocation,
          status: editStatus,
          category: editCategory,
          sqft: editSqft,
          duration: editDuration,
          client: editClient,
          year: editYear,
          description: editDescription
        })
      });
      if (res.message) throw new Error(res.message);
      setIsEditing(false);
      onChanged();
    } catch (err) {
      alert(err.message || 'Failed to save details');
    }
  }

  async function addMore(fileList) {
    const chosen = Array.from(fileList);
    if (chosen.length === 0) return;
    setAddingFiles(true);
    try {
      const fd = new FormData();
      chosen.forEach((f) => fd.append('photos', f));
      await api(`/admin/projects/${p.id}/images`, creds, { method: 'POST', body: fd });
      onChanged();
    } catch (e) { alert(e.message); } finally { setAddingFiles(false); }
  }

  async function removeImage(index) {
    if (images.length === 1) { alert('A project needs at least one photo — add another before removing this one.'); return; }
    if (!confirm('Remove this photo from the gallery?')) return;
    try { await api(`/admin/projects/${p.id}/images/${index}`, creds, { method: 'DELETE' }); onChanged(); } catch (e) { alert(e.message); }
  }

  return (
    <div 
      className="updateCard" 
      style={{
        background: 'rgba(30, 41, 59, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Cover Image Header */}
      {images[0] && (
        <div style={{ position: 'relative', width: '100%', height: '190px', overflow: 'hidden' }}>
          <img src={images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <span style={{ position: 'absolute', top: '12px', left: '12px', background: p.status === 'Completed' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(234, 179, 8, 0.9)', color: '#ffffff', fontSize: '0.7rem', fontWeight: '900', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(4px)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {p.status === 'Completed' ? '🟢 Completed' : '🏗️ Ongoing'}
          </span>
          <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.85)', color: '#ffffff', fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)' }}>
            {images.length} Photo{images.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <button className="deleteBtn" onClick={onDelete} title="Remove Project"><Trash2 size={15} /></button>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {isEditing ? (
          <form onSubmit={saveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'transparent', padding: 0, border: 'none', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '700', color: '#94a3b8' }}>Project Title</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required style={{ padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '700', color: '#94a3b8' }}>Location</label>
              <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required style={{ padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '700', color: '#94a3b8', display: 'block' }}>Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontSize: '0.8rem', background: '#0f172a', color: '#ffffff' }}>
                  <option value="Residential">Residential</option>
                  <option value="Villa">Villa</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Renovation">Renovation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '700', color: '#94a3b8', display: 'block' }}>Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontSize: '0.8rem', background: '#0f172a', color: '#ffffff' }}>
                  <option value="Completed">Completed</option>
                  <option value="Ongoing">Ongoing</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '700', color: '#94a3b8', display: 'block' }}>Built-Up Area</label>
                <input placeholder="2,800 Sq.Ft." value={editSqft} onChange={(e) => setEditSqft(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '700', color: '#94a3b8', display: 'block' }}>Duration</label>
                <input placeholder="10 Months" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '700', color: '#94a3b8', display: 'block' }}>Client Name</label>
                <input placeholder="Karthik &amp; Family" value={editClient} onChange={(e) => setEditClient(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '700', color: '#94a3b8', display: 'block' }}>Year</label>
                <input placeholder="2024" value={editYear} onChange={(e) => setEditYear(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '700', color: '#94a3b8', display: 'block' }}>Description</label>
              <textarea rows={2} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontSize: '0.8rem', resize: 'vertical', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button className="primary" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.15)', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div>
              <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem', fontWeight: '900' }}>{p.title}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span style={{ background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} /> {p.location}
                </span>
                <span style={{ background: 'rgba(168, 85, 247, 0.18)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.35)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800' }}>
                  {p.category || 'Residential'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#cbd5e1' }}>
              {p.sqft && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Ruler size={13} style={{ color: '#60a5fa' }} /> 
                  <span>Area: <strong style={{ color: '#ffffff' }}>{p.sqft}</strong> {p.duration ? `• ${p.duration}` : ''}</span>
                </div>
              )}
              {p.client && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} style={{ color: '#ff6b6b' }} /> 
                  <span>Client: <strong style={{ color: '#ffffff' }}>{p.client}</strong> ({p.year || '2024'})</span>
                </div>
              )}
            </div>

            {p.description && (
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {p.description}
              </p>
            )}
            
            <button 
              type="button" 
              onClick={() => setIsEditing(true)} 
              style={{ 
                alignSelf: 'flex-start', 
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#ffffff', 
                fontSize: '0.8rem', 
                fontWeight: '800', 
                padding: '8px 14px', 
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Pencil size={13} /> Edit Specifications &amp; Details
            </button>
          </>
        )}
        
        {/* Horizontal Photo Gallery Thumbnail Grid */}
        {images.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Project Gallery ({images.length} Photos):
            </div>
            <div className="projectThumbStrip">
              {images.map((src, i) => (
                <div className="projectThumb" key={i}>
                  <img src={src} alt="" />
                  <button type="button" onClick={() => removeImage(i)} title="Remove Photo"><X size={11} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <label 
          style={{ 
            marginTop: '8px',
            alignSelf: 'flex-start',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px dashed rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#60a5fa',
            fontSize: '0.78rem',
            fontWeight: '700'
          }}
        >
          <ImagePlus size={14} /> {addingFiles ? 'Adding...' : 'Add more gallery photos'}
          <input type="file" accept="image/*" multiple hidden disabled={addingFiles} onChange={(e) => addMore(e.target.files)} />
        </label>
      </div>
    </div>
  );
}

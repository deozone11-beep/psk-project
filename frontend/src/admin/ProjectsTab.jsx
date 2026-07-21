import React, { useEffect, useState } from 'react';
import { Upload, Plus, Trash2, X, ImagePlus, Pencil } from 'lucide-react';
import { api } from './api';

export default function ProjectsTab({ creds }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: '', location: '', status: 'Completed' });
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
      files.forEach((f) => fd.append('photos', f));
      await api('/admin/projects', creds, { method: 'POST', body: fd });
      setForm({ title: '', location: '', status: 'Completed' });
      setFiles([]);
      setMsg('Project added to the public site ✓');
      load();
    } catch (err) { setMsg(err.message); } finally { setUploading(false); }
  }
  async function del(id) {
    if (!confirm('Remove this project from the public site?')) return;
    try { await api(`/admin/projects/${id}`, creds, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  }

  return (
    <section className="adminCard">
      <h3>Selected Projects (Portfolio)</h3>
      <p className="adminHint">These photos show up on the public site under "Selected Projects" as an auto-rotating slideshow. Add several photos per project for a richer slideshow — replace the demo ones before going live.</p>
      <form onSubmit={add} className="inlineForm wrap2">
        <input placeholder="Project title (e.g. Modern Family Residence)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Location (e.g. Coimbatore)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="Completed">Completed</option>
          <option value="Ongoing">Ongoing</option>
        </select>
        <label className="fileInput">
          <Upload size={15} /> {files.length ? `${files.length} photo${files.length > 1 ? 's' : ''} selected` : 'Choose photos (multiple allowed)'}
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files))} hidden />
        </label>
        <button className="primary" disabled={uploading}><Plus size={15} /> {uploading ? 'Uploading...' : 'Add Project'}</button>
      </form>
      {msg && <p className="adminHint">{msg}</p>}
      <div className="updateGrid">
        {list.map((p) => <ProjectCard key={p.id} project={p} creds={creds} onChanged={load} onDelete={() => del(p.id)} />)}
        {list.length === 0 && <p className="adminHint">No projects added yet — the public site will show nothing here until you add some.</p>}
      </div>
    </section>
  );
}

function ProjectCard({ project: p, creds, onChanged, onDelete }) {
  const [addingFiles, setAddingFiles] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(p.title);
  const [editLocation, setEditLocation] = useState(p.location);
  const [editStatus, setEditStatus] = useState(p.status);

  const images = p.imageUrls || (p.imageUrl ? [p.imageUrl] : []);

  async function saveDetails(e) {
    e.preventDefault();
    try {
      const res = await api(`/admin/projects/${p.id}`, creds, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle, location: editLocation, status: editStatus })
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
    if (!confirm('Remove this photo from the slideshow?')) return;
    try { await api(`/admin/projects/${p.id}/images/${index}`, creds, { method: 'DELETE' }); onChanged(); } catch (e) { alert(e.message); }
  }

  return (
    <div className="updateCard">
      {images[0] && <img src={images[0]} alt={p.title} />}
      <div className="updateCardBody">
        {isEditing ? (
          <form onSubmit={saveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'transparent', padding: 0, border: 'none', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>Project Title</label>
              <input 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
                required 
                style={{ padding: '6px 8px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>Location</label>
              <input 
                value={editLocation} 
                onChange={(e) => setEditLocation(e.target.value)} 
                required 
                style={{ padding: '6px 8px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>Status</label>
              <select 
                value={editStatus} 
                onChange={(e) => setEditStatus(e.target.value)}
                style={{ padding: '6px 8px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', background: '#fff' }}
              >
                <option value="Completed">Completed</option>
                <option value="Ongoing">Ongoing</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button className="primary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
              <button 
                type="button" 
                className="stepBack" 
                onClick={() => { setIsEditing(false); setEditTitle(p.title); setEditLocation(p.location); setEditStatus(p.status); }} 
                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <b>{p.title}</b>
            <span className="tableSub">{p.location} · {p.status} · {images.length} photo{images.length !== 1 ? 's' : ''}</span>
            <button 
              type="button" 
              className="deleteBtn"
              onClick={() => setIsEditing(true)} 
              style={{ 
                alignSelf: 'flex-start', 
                borderColor: '#cbd5e1',
                color: '#4b5563', 
                fontSize: '0.76rem', 
                fontWeight: '700', 
                padding: '4px 10px', 
                borderRadius: '6px',
                cursor: 'pointer',
                marginTop: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Pencil size={11} /> Edit Details
            </button>
          </>
        )}
        
        {images.length > 1 && (
          <div className="projectThumbStrip" style={{ marginTop: '10px' }}>
            {images.map((src, i) => (
              <div className="projectThumb" key={i}>
                <img src={src} alt="" />
                <button type="button" onClick={() => removeImage(i)}><X size={11} /></button>
              </div>
            ))}
          </div>
        )}
        <label className="addPhotoBtn">
          <ImagePlus size={13} /> {addingFiles ? 'Adding...' : 'Add more photos'}
          <input type="file" accept="image/*" multiple hidden disabled={addingFiles} onChange={(e) => addMore(e.target.files)} />
        </label>
      </div>
      <button className="deleteBtn" onClick={onDelete}><Trash2 size={15} /></button>
    </div>
  );
}

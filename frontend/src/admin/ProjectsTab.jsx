import React, { useEffect, useState } from 'react';
import { Upload, Plus, Trash2, X, ImagePlus } from 'lucide-react';
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
  const images = p.imageUrls || (p.imageUrl ? [p.imageUrl] : []);

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
        <b>{p.title}</b>
        <span className="tableSub">{p.location} · {p.status} · {images.length} photo{images.length !== 1 ? 's' : ''}</span>
        {images.length > 1 && (
          <div className="projectThumbStrip">
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

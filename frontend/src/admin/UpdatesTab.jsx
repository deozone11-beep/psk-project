import React, { useEffect, useState } from 'react';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { api, API } from './api';

export default function UpdatesTab({ creds }) {
  const [customers, setCustomers] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ customerId: '', title: '', description: '', workDate: new Date().toLocaleDateString('en-CA') });
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api('/admin/customers', creds).then(setCustomers).catch(console.error);
    load();
  }, []);
  function load() { api('/admin/updates', creds).then(setList).catch(console.error); }

  async function post(e) {
    e.preventDefault();
    if (!form.customerId) { setMsg('Select a customer first'); return; }
    setUploading(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('customerId', form.customerId);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('workDate', form.workDate);
      if (files && files.length > 0) {
        files.forEach((f) => fd.append('photos', f));
      }
      
      const r = await fetch(`${API}/admin/updates`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + creds.token },
        body: fd
      });
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.message || 'Update failed');
      }

      setForm({ ...form, title: '', description: '' });
      setFiles([]);
      setMsg('Update posted ✓ — visible to that customer only.');
      load();
    } catch (err) { setMsg(err.message); } finally { setUploading(false); }
  }
  async function del(id) {
    if (!confirm('Delete this site update?')) return;
    try { await api(`/admin/updates/${id}`, creds, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  }
  function custName(id) { return customers.find((c) => c.id === id)?.displayName || `#${id}`; }

  return (
    <section className="adminCard">
      <h3>Site Progress Updates</h3>
      <p className="adminHint">Post a progress update with one or more photos for a customer. Only that customer sees it in their portal.</p>
      <form onSubmit={post} className="inlineForm wrap2">
        <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
          <option value="">Select customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
        </select>
        <input type="date" value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} required />
        <input placeholder="Title (e.g. Roof slab casting)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Notes (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label className="fileInput">
          <Upload size={15} /> {files.length > 0 ? `${files.length} photo(s) chosen` : 'Choose photos'}
          <input type="file" accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files))} multiple hidden />
        </label>
        <button className="primary" disabled={uploading}><Plus size={15} /> {uploading ? 'Posting...' : 'Post Update'}</button>
      </form>
      {msg && <p className="adminHint" style={{ color: msg.includes('✓') ? 'green' : '#e2262b' }}>{msg}</p>}
      <div className="updateGrid">
        {list.map((u) => {
          const imgs = u.photoUrl ? u.photoUrl.split('|||') : [];
          const thumb = imgs.length > 0 ? imgs[0] : null;
          return (
            <div className="updateCard" key={u.id}>
              {thumb && <img src={thumb} alt={u.title} />}
              {imgs.length > 1 && (
                <span className="calcBadge" style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(226,38,43,0.9)', color: '#fff', fontSize: '0.65rem', padding: '3px 8px', borderRadius: '10px' }}>
                  +{imgs.length - 1} more
                </span>
              )}
              <div className="updateCardBody">
                <b>{u.title}</b>
                <span className="tableSub">{custName(u.customer.id)} · {u.workDate}</span>
                {u.description && <p>{u.description}</p>}
              </div>
              <button className="deleteBtn" onClick={() => del(u.id)} style={{ zIndex: 5 }}><Trash2 size={15} /></button>
            </div>
          );
        })}
        {list.length === 0 && <p className="adminHint">No updates posted yet.</p>}
      </div>
    </section>
  );
}

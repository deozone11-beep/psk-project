import React, { useEffect, useState } from 'react';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { api } from './api';

export default function UpdatesTab({ creds }) {
  const [customers, setCustomers] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ customerId: '', title: '', description: '', workDate: new Date().toISOString().slice(0, 10) });
  const [file, setFile] = useState(null);
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
      if (file) fd.append('photo', file);
      await api('/admin/updates', creds, { method: 'POST', body: fd });
      setForm({ ...form, title: '', description: '' });
      setFile(null);
      setMsg('Update posted ✓ — visible to that customer only.');
      load();
    } catch (err) { setMsg(err.message); } finally { setUploading(false); }
  }
  async function del(id) {
    try { await api(`/admin/updates/${id}`, creds, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  }
  function custName(id) { return customers.find((c) => c.id === id)?.displayName || `#${id}`; }

  return (
    <section className="adminCard">
      <h3>Site Progress Updates</h3>
      <p className="adminHint">Post a photo + note for a specific customer. Only that customer sees it in their portal.</p>
      <form onSubmit={post} className="inlineForm wrap2">
        <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
          <option value="">Select customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
        </select>
        <input type="date" value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} required />
        <input placeholder="Title (e.g. Roof slab casting)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Notes (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label className="fileInput">
          <Upload size={15} /> {file ? file.name : 'Choose photo'}
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} hidden />
        </label>
        <button className="primary" disabled={uploading}><Plus size={15} /> {uploading ? 'Posting...' : 'Post Update'}</button>
      </form>
      {msg && <p className="adminHint">{msg}</p>}
      <div className="updateGrid">
        {list.map((u) => (
          <div className="updateCard" key={u.id}>
            {u.photoUrl && <img src={u.photoUrl} alt={u.title} />}
            <div className="updateCardBody">
              <b>{u.title}</b>
              <span className="tableSub">{custName(u.customer.id)} · {u.workDate}</span>
              {u.description && <p>{u.description}</p>}
            </div>
            <button className="deleteBtn" onClick={() => del(u.id)}><Trash2 size={15} /></button>
          </div>
        ))}
        {list.length === 0 && <p className="adminHint">No updates posted yet.</p>}
      </div>
    </section>
  );
}

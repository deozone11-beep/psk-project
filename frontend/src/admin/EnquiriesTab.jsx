import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from './api';

export default function EnquiriesTab({ creds }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  function load() {
    setLoading(true);
    api('/admin/enquiries', creds).then(setList).catch(console.error).finally(() => setLoading(false));
  }
  async function del(id) {
    if (!confirm('Delete this enquiry?')) return;
    try { await api(`/admin/enquiries/${id}`, creds, { method: 'DELETE' }); setList((p) => p.filter((x) => x.id !== id)); } catch (e) { console.error(e); }
  }

  return (
    <section className="adminCard">
      <h3>Enquiries ({list.length})</h3>
      {loading ? <p className="adminHint">Loading...</p> : list.length === 0 ? <p className="adminHint">No enquiries yet.</p> : (
        <div className="enquiryList">
          {list.map((en) => (
            <div className="enquiryRow" key={en.id}>
              <div>
                <b>{en.name}</b> · {en.phone} {en.email ? `· ${en.email}` : ''}
                <div className="enquiryMeta">{en.service} — {new Date(en.createdAt).toLocaleString('en-IN')}</div>
                <p>{en.message}</p>
              </div>
              <button className="deleteBtn" onClick={() => del(en.id)}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

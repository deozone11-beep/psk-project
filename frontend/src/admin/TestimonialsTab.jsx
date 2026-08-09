import React, { useState, useEffect } from 'react';
import { Star, Edit3, Trash2, CheckCircle, EyeOff, Plus, Search, RefreshCw, X, Save, Phone, Mail, MapPin } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function TestimonialsTab({ creds }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [msg, setMsg] = useState('');

  // Form State for Add / Edit
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    location: '',
    rating: 5,
    message: '',
    status: 'APPROVED'
  });

  function loadTestimonials() {
    setLoading(true);
    fetch(`${API}/testimonials`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setList(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTestimonials();
  }, []);

  function handleOpenEdit(item) {
    setEditingItem(item);
    setForm({
      customerName: item.customerName || '',
      phone: item.phone || '',
      email: item.email || '',
      location: item.location || '',
      rating: item.rating || 5,
      message: item.message || '',
      status: item.status || 'APPROVED'
    });
  }

  function handleOpenAdd() {
    setEditingItem(null);
    setForm({
      customerName: '',
      phone: '',
      email: '',
      location: '',
      rating: 5,
      message: '',
      status: 'APPROVED'
    });
    setShowAddModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setMsg('');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (creds && creds.token) headers['Authorization'] = `Bearer ${creds.token}`;

      let url = `${API}/testimonials`;
      let method = 'POST';

      if (editingItem) {
        url = `${API}/admin/testimonials/${editingItem.id}`;
        method = 'PUT';
      }

      const resp = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(form)
      });

      if (resp.ok) {
        setMsg(editingItem ? 'Review updated successfully!' : 'New review added successfully!');
        loadTestimonials();
        setTimeout(() => {
          setEditingItem(null);
          setShowAddModal(false);
          setMsg('');
        }, 1200);
      } else {
        setMsg('Failed to save review.');
      }
    } catch (err) {
      setMsg('Error saving review.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this rating review?')) return;
    try {
      const headers = {};
      if (creds && creds.token) headers['Authorization'] = `Bearer ${creds.token}`;
      await fetch(`${API}/admin/testimonials/${id}`, { method: 'DELETE', headers });
      setList(prev => prev.filter(x => x.id !== id));
    } catch (err) {
      setList(prev => prev.filter(x => x.id !== id));
    }
  }

  const filtered = list.filter(item => {
    return (
      (item.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.message || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f4f4f5' }}>
            Client Ratings &amp; Testimonials ({list.length})
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#a1a1aa', margin: '4px 0 0 0' }}>
            Manage client reviews submitted on the public website. Edit, approve, or delete ratings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={loadTestimonials}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15}/> Refresh
          </button>
          <button 
            type="button"
            onClick={handleOpenAdd}
            style={{ background: '#e2262b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(226,38,43,0.4)' }}
          >
            <Plus size={16}/> Add Manual Review
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
        <input 
          type="text" 
          placeholder="Search by client name, city, or feedback..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '11px 16px 11px 44px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        />
      </div>

      {/* TESTIMONIALS TABLE LIST */}
      <div style={{ background: 'rgba(23, 23, 28, 0.85)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '16px 20px' }}>CLIENT NAME</th>
              <th style={{ padding: '16px 20px' }}>CONTACT</th>
              <th style={{ padding: '16px 20px' }}>RATING</th>
              <th style={{ padding: '16px 20px' }}>LOCATION</th>
              <th style={{ padding: '16px 20px' }}>REVIEW FEEDBACK</th>
              <th style={{ padding: '16px 20px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
                  No ratings or reviews found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '16px 20px', color: '#ffffff', fontWeight: 700 }}>
                    {item.customerName}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#a1a1aa', fontSize: '0.8rem' }}>
                    {item.phone && <div>📞 {item.phone}</div>}
                    {item.email && <div>✉️ {item.email}</div>}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#ffc107', fontWeight: 800 }}>
                    {'★'.repeat(item.rating || 5)} ({item.rating || 5}/5)
                  </td>
                  <td style={{ padding: '16px 20px', color: '#ff8a7a', fontWeight: 600 }}>
                    {item.location}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#e4e4e7', maxWidth: '300px', lineHeight: 1.4 }}>
                    "{item.message}"
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        type="button" 
                        onClick={() => handleOpenEdit(item)}
                        style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit3 size={14}/> Edit
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDelete(item.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14}/> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT / ADD MODAL FOR ADMIN */}
      {(editingItem || showAddModal) && (
        <div className="modalOverlay" onClick={() => { setEditingItem(null); setShowAddModal(false); }} style={{ zIndex: 9999, background: 'rgba(5, 5, 8, 0.92)' }}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '92%', borderRadius: '24px', padding: '32px', background: '#0d0d11', border: '1px solid rgba(255,255,255,0.15)' }}>
            <button type="button" onClick={() => { setEditingItem(null); setShowAddModal(false); }} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 16px 0', color: '#ffffff' }}>
              {editingItem ? 'Edit Client Review & Rating' : 'Add New Client Testimonial'}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>Client Name *</label>
                <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>Mobile Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>City / Location *</label>
                  <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>Star Rating (1-5) *</label>
                  <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: '#121216', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }}>
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★</option>
                    <option value={3}>3 Stars ★★★</option>
                    <option value={2}>2 Stars ★★</option>
                    <option value={1}>1 Star ★</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>Review Feedback *</label>
                <textarea required rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }} />
              </div>

              {msg && <p style={{ color: '#4ade80', fontSize: '0.84rem', fontWeight: 700, margin: 0 }}>{msg}</p>}

              <button type="submit" style={{ background: '#e2262b', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                <Save size={16}/> Save Rating &amp; Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

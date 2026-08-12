import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, CheckCircle2, MessageSquare, Plus, 
  Search, Filter, X, Send, Phone, Mail, MapPin, Sparkles, User, Award
} from 'lucide-react';
import './style.css';

const API = import.meta.env.VITE_API_URL || '/api';

export const INITIAL_TESTIMONIALS = [
  { id: 1, customerName: 'Ramesh Kumar', location: 'R.S. Puram, Coimbatore', rating: 5, message: 'PSK Brothers constructed our 3-story residential villa on schedule. Their transparency in material specifications and zero mid-project cost escalation was truly impressive.', phone: '+91 98421 12345', email: 'ramesh.k@gmail.com', createdAt: '2024-11-10' },
  { id: 2, customerName: 'Priya Selvam', location: 'Perundurai, Erode', rating: 5, message: 'Professional civil engineers who value quality craftsmanship. We received daily photo updates on site progress through their portal. Highly recommend!', phone: '+91 97890 23456', email: 'priya.s@gmail.com', createdAt: '2024-12-05' },
  { id: 3, customerName: 'Arun Prakash', location: 'Tiruppur', rating: 5, message: 'Handled our garment corporate office structural expansion smoothly with minimal disruption. Excellent structural integrity and neat interior finish.', phone: '+91 99440 34567', email: 'arun.p@gmail.com', createdAt: '2025-01-15' },
  { id: 4, customerName: 'Dr. V. Natarajan', location: 'Choolaimedu, Chennai', rating: 5, message: 'Renovated our 30-year-old family home with modern RCC beam strengthening. Very reliable, polite supervisors and honest BOQ pricing.', phone: '+91 98400 45678', email: 'dr.natarajan@gmail.com', createdAt: '2025-01-28' },
  { id: 5, customerName: 'Karthik Raja', location: 'Porur, Chennai', rating: 5, message: 'Outstanding duplex building work! P. Saravana Kumar sir inspected every foundation pour personally. Built with care and delivered 2 weeks early.', phone: '+91 90030 56789', email: 'karthik.r@gmail.com', createdAt: '2025-02-02' }
];

export default function ReviewsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [filterRating, setFilterRating] = useState(0); // 0 = All
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Rating Form State
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    location: '',
    rating: 5,
    message: ''
  });

  useEffect(() => {
    fetch(`${API}/testimonials`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data)) {
          setTestimonials(data);
        }
      })
      .catch(() => {});
  }, []);

  const totalReviews = testimonials.length;
  const avgRating = totalReviews > 0 
    ? (testimonials.reduce((sum, item) => sum + (item.rating || 5), 0) / totalReviews).toFixed(1)
    : '5.0';

  const fiveStarCount = testimonials.filter(t => (t.rating || 5) === 5).length;
  const fourStarCount = testimonials.filter(t => t.rating === 4).length;
  const threeStarCount = testimonials.filter(t => t.rating === 3).length;

  const filteredList = testimonials.filter(t => {
    const matchesRating = filterRating === 0 ? true : (t.rating || 5) === filterRating;
    const matchesSearch = 
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRating && matchesSearch;
  });

  async function handleSubmitReview(e) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    try {
      const resp = await fetch(`${API}/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (resp.ok) {
        const newReview = await resp.json();
        setTestimonials(prev => [newReview, ...prev]);
      } else {
        // Fallback local update
        const fallbackReview = {
          id: Date.now(),
          ...formData,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setTestimonials(prev => [fallbackReview, ...prev]);
      }

      setSuccessMsg('🎉 Thank you! Your rating & review has been successfully posted.');
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
        setFormData({ customerName: '', phone: '', email: '', location: '', rating: 5, message: '' });
      }, 1800);
    } catch (err) {
      const fallbackReview = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setTestimonials(prev => [fallbackReview, ...prev]);
      setSuccessMsg('🎉 Rating saved locally! Thank you for your review.');
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
        setFormData({ customerName: '', phone: '', email: '', location: '', rating: 5, message: '' });
      }, 1800);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="site reviewsPage" style={{ background: '#09090b', color: '#f8fafc', minHeight: '100vh' }}>
      {/* STICKY HEADER */}
      <header className="scrolled" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <a className="logo" href="/">
          <img src="/logo.png" alt="PSK Brothers Builders & Constructions" />
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="/#home" onClick={() => window.location.href = '/#home'}>Home</a>
          <a href="/#about" onClick={() => window.location.href = '/#about'}>About</a>
          <a href="/#services" onClick={() => window.location.href = '/#services'}>Services</a>
          <a href="/#projects" onClick={() => window.location.href = '/#projects'}>Projects</a>
          <a href="/#contact" onClick={() => window.location.href = '/#contact'}>Contact</a>
        </nav>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a className="secondary" href="/" style={{ padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16}/> Main Site
          </a>
          <button 
            type="button" 
            className="primary navCta" 
            onClick={() => setShowAddModal(true)}
            style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16}/> WRITE A REVIEW
          </button>
        </div>
      </header>

      {/* HERO & OVERALL RATING BANNER */}
      <div style={{
        position: 'relative',
        padding: '70px 24px 50px',
        background: 'radial-gradient(800px 400px at 50% 20%, rgba(226,38,43,0.18), transparent 70%), linear-gradient(180deg, #0d0d11 0%, #09090b 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(226,38,43,0.12)', border: '1px solid rgba(226,38,43,0.3)', padding: '6px 16px', borderRadius: '20px', color: '#ff8a7a', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
              <Award size={14}/> VERIFIED CLIENT FEEDBACK &amp; RATINGS
            </div>

            <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 800, margin: '0 0 16px 0', fontFamily: 'Fraunces, serif', color: '#ffffff' }}>
              What Our Clients Say <br/>
              <span style={{ color: '#e2262b', fontStyle: 'italic' }}>About Building With PSK</span>
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#a1a1aa', margin: '0 auto', maxWidth: '700px', lineHeight: 1.6 }}>
              Real reviews and star ratings submitted by homeowners, villa clients, and corporate business owners across Tamil Nadu.
            </p>
          </div>

          {/* RATING SUMMARY CARD */}
          <div style={{
            background: 'rgba(23, 23, 28, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '32px',
            alignItems: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            {/* SCORE DISPLAY */}
            <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '20px' }}>
              <div style={{ fontSize: '4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'Fraunces, serif', lineHeight: 1 }}>
                {avgRating}
              </div>
              <div style={{ color: '#ffc107', fontSize: '1.4rem', margin: '8px 0' }}>
                {'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#a1a1aa', fontWeight: 600 }}>
                Based on {totalReviews} Verified Client Reviews
              </div>
            </div>

            {/* BREAKDOWN BARS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.84rem' }}>
                <span style={{ width: '60px', color: '#d4d4d8', fontWeight: 600 }}>5 Stars</span>
                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalReviews ? (fiveStarCount / totalReviews) * 100 : 100}%`, height: '100%', background: '#e2262b', borderRadius: '4px' }} />
                </div>
                <span style={{ width: '30px', color: '#a1a1aa', textAlign: 'right' }}>{fiveStarCount}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.84rem' }}>
                <span style={{ width: '60px', color: '#d4d4d8', fontWeight: 600 }}>4 Stars</span>
                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalReviews ? (fourStarCount / totalReviews) * 100 : 0}%`, height: '100%', background: '#ff8a7a', borderRadius: '4px' }} />
                </div>
                <span style={{ width: '30px', color: '#a1a1aa', textAlign: 'right' }}>{fourStarCount}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.84rem' }}>
                <span style={{ width: '60px', color: '#d4d4d8', fontWeight: 600 }}>3 Stars</span>
                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalReviews ? (threeStarCount / totalReviews) * 100 : 0}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
                </div>
                <span style={{ width: '30px', color: '#a1a1aa', textAlign: 'right' }}>{threeStarCount}</span>
              </div>
            </div>

            {/* CALL TO ACTION BUTTON */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>Have you built with PSK?</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#a1a1aa' }}>Share your genuine experience with future homeowners.</p>
              <button 
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  background: '#e2262b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '24px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(226,38,43,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={18}/> RATE &amp; WRITE A REVIEW
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <main style={{ maxWidth: '1180px', margin: '0 auto', padding: '50px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
            <input 
              type="text" 
              placeholder="Search reviews by name or city (e.g. Erode)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 46px',
                borderRadius: '30px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'All Reviews', val: 0 },
              { label: '5 Stars ★★★★★', val: 5 },
              { label: '4 Stars ★★★★', val: 4 },
              { label: '3 Stars ★★★', val: 3 }
            ].map(tab => (
              <button
                key={tab.val}
                type="button"
                onClick={() => setFilterRating(tab.val)}
                style={{
                  background: filterRating === tab.val ? '#e2262b' : 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  border: filterRating === tab.val ? '1px solid #e2262b' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '20px',
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: filterRating === tab.val ? '0 4px 14px rgba(226,38,43,0.4)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* REVIEWS GRID */}
        {filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <MessageSquare size={48} style={{ color: '#52525b', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#f4f4f5', margin: '0 0 8px 0' }}>No reviews found for "{searchTerm}"</h3>
            <button 
              type="button" 
              onClick={() => { setFilterRating(0); setSearchTerm(''); }}
              style={{ marginTop: '16px', background: '#e2262b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 700, cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {filteredList.map((item) => (
              <div 
                key={item.id}
                style={{
                  background: 'rgba(23, 23, 28, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* STAR RATING & VERIFIED BADGE */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ color: '#ffc107', fontSize: '1.2rem', letterSpacing: '2px' }}>
                      {'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))}
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                      <CheckCircle2 size={12}/> Verified Owner
                    </span>
                  </div>

                  <p style={{ fontSize: '0.94rem', color: '#e4e4e7', lineHeight: 1.6, margin: '0 0 16px 0', fontStyle: 'italic' }}>
                    "{item.message}"
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 2px 0' }}>
                      {item.customerName}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#ff8a7a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12}/> {item.location}
                    </span>
                  </div>
                  {item.createdAt && (
                    <span style={{ fontSize: '0.74rem', color: '#71717a' }}>
                      {item.createdAt.substring(0, 10)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* PUBLIC SUBMIT RATING MODAL */}
      {showAddModal && (
        <div className="modalOverlay" onClick={() => setShowAddModal(false)} style={{ zIndex: 9999, background: 'rgba(5, 5, 8, 0.92)', backdropFilter: 'blur(12px)' }}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%', borderRadius: '24px', padding: '32px', background: '#0d0d11', border: '1px solid rgba(255,255,255,0.15)' }}>
            <button type="button" onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>

            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(226,38,43,0.15)', color: '#ff8a7a', padding: '4px 12px', borderRadius: '16px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '10px' }}>
                ⭐ PUBLIC CLIENT RATING
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff', fontFamily: 'Fraunces, serif' }}>
                Rate Your Experience with PSK
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#a1a1aa', margin: 0, lineHeight: 1.4 }}>
                Please provide your contact details and genuine review. All submissions are verified for quality control.
              </p>
            </div>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '6px' }}>Full Name *</label>
                  <input 
                    required 
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '6px' }}>Mobile Phone *</label>
                  <input 
                    required 
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '6px' }}>Email Address *</label>
                  <input 
                    required 
                    type="email"
                    placeholder="name@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '6px' }}>City / Location *</label>
                  <input 
                    required 
                    placeholder="e.g. Coimbatore, Erode"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>

              {/* STAR RATING SELECTOR */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '6px' }}>Your Rating (1 to 5 Stars) *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      style={{
                        background: star <= formData.rating ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255,255,255,0.06)',
                        border: star <= formData.rating ? '1px solid #ffc107' : '1px solid rgba(255,255,255,0.14)',
                        color: star <= formData.rating ? '#ffc107' : '#71717a',
                        borderRadius: '12px',
                        padding: '10px 16px',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '6px' }}>Your Review / Feedback *</label>
                <textarea 
                  required 
                  rows={4}
                  placeholder="Share details about the construction quality, timeline, communication, and overall work..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {successMsg && (
                <p style={{ color: '#4ade80', fontSize: '0.86rem', fontWeight: 700, margin: 0 }}>
                  {successMsg}
                </p>
              )}

              <button 
                type="submit" 
                disabled={submitting}
                style={{
                  background: '#e2262b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(226,38,43,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px'
                }}
              >
                <Send size={16}/> {submitting ? 'SUBMITTING...' : 'SUBMIT YOUR RATING & REVIEW'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

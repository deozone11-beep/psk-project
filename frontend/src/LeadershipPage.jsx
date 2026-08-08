import React from 'react';
import { Phone, Mail, MapPin, ArrowRight, CheckCircle2, Building2, Sparkles, ShieldCheck, Hammer, ArrowLeft, Clock, Calendar } from 'lucide-react';
import './style.css';

export default function LeadershipPage() {
  return (
    <div className="site leadershipPage">
      {/* HEADER */}
      <header className="scrolled" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <a className="logo" href="/">
          <img src="/logo.png" alt="PSK Brothers Builders & Constructions" />
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="/#home" onClick={() => window.location.href = '/#home'}>Home</a>
          <a href="/#about" onClick={() => window.location.href = '/#about'}>About Us</a>
          <a href="/#services" onClick={() => window.location.href = '/#services'}>Services</a>
          <a href="/#calculator" onClick={() => window.location.href = '/#calculator'}>Cost Calculator</a>
          <a href="/#contact" onClick={() => window.location.href = '/#contact'}>Contact</a>
        </nav>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a className="secondary" href="/" style={{ padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16}/> Back to Main Site
          </a>
          <a className="primary navCta" href="/#contact" style={{ padding: '8px 20px', borderRadius: '20px', textDecoration: 'none', fontSize: '0.85rem' }}>
            GET A QUOTE
          </a>
        </div>
      </header>

      <main style={{ background: '#0a0a0b', color: '#f5f5f4', minHeight: '100vh', paddingBottom: '80px' }}>
        {/* HERO BANNER */}
        <section style={{ position: 'relative', padding: '100px 5% 70px', background: 'radial-gradient(900px 500px at 50% 0%, rgba(226,38,43,0.18), transparent 70%), linear-gradient(180deg, #0f1015 0%, #0a0a0b 100%)', textAlignment: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(226,38,43,0.12)', border: '1px solid rgba(226,38,43,0.3)', padding: '6px 16px', borderRadius: '20px', color: '#ff8a7a', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '20px' }}>
              <ShieldCheck size={16}/> PSK BROTHERS LEADERSHIP &amp; HEAD OFFICE
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: '0 0 16px 0', lineHeight: 1.15, color: '#ffffff' }}>
              The Engineers &amp; Visionaries <br/><em style={{ color: '#e2262b', fontStyle: 'italic' }}>Behind PSK Brothers</em>
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#a1a1aa', maxWdith: '700px', margin: '0 auto 36px', lineHeight: 1.6 }}>
              24+ years of civil engineering integrity, direct site ownership, 100% transparent pricing, and our headquarters in Choolaimedu, Chennai.
            </p>

            {/* STATS BAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', background: 'rgba(23,23,28,0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>
              <div>
                <b style={{ display: 'block', fontSize: '1.8rem', color: '#ffffff', fontFamily: 'Manrope, sans-serif' }}>24+</b>
                <span style={{ fontSize: '0.75rem', color: '#ff8a7a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Years Civil Expertise</span>
              </div>
              <div>
                <b style={{ display: 'block', fontSize: '1.8rem', color: '#ffffff', fontFamily: 'Manrope, sans-serif' }}>75+</b>
                <span style={{ fontSize: '0.75rem', color: '#ff8a7a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Landmarks Delivered</span>
              </div>
              <div>
                <b style={{ display: 'block', fontSize: '1.8rem', color: '#ffffff', fontFamily: 'Manrope, sans-serif' }}>100%</b>
                <span style={{ fontSize: '0.75rem', color: '#ff8a7a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>On-Time Handover</span>
              </div>
              <div>
                <b style={{ display: 'block', fontSize: '1.8rem', color: '#ffffff', fontFamily: 'Manrope, sans-serif' }}>Zero</b>
                <span style={{ fontSize: '0.75rem', color: '#ff8a7a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Hidden Mid-Costs</span>
              </div>
            </div>
          </div>
        </section>

        {/* FOUNDER 1: S Senthil Murugan */}
        <section style={{ padding: '80px 6%', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '60px', alignItems: 'center' }} className="leadershipDetailRow">
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '24px', overflow: 'hidden', border: '2px solid rgba(226,38,43,0.3)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', position: 'relative' }}>
                <img 
                  src="/owner1.png" 
                  alt="S. Senthil Murugan - Founder & Managing Director" 
                  style={{ width: '100%', height: '480px', objectFit: 'cover', objectPosition: '50% 12%', display: 'block' }} 
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(10,10,12,0.85) 0%, transparent 40%)' }} />
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ color: '#ff8a7a', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>FOUNDER &amp; MANAGING DIRECTOR</div>
                  <div style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>S. Senthil Murugan</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ff8a7a', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                <Sparkles size={16}/> STRUCTURAL DIRECTION &amp; FOUNDING VISION
              </div>
              <h2 style={{ fontSize: '2.4rem', fontFamily: 'Fraunces, serif', margin: '0 0 16px 0', color: '#ffffff' }}>
                S. Senthil Murugan
              </h2>
              <p style={{ color: '#d4d4d8', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '16px' }}>
                With over two decades of distinguished experience in civil engineering and structural planning across Tamil Nadu, S. Senthil Murugan leads PSK Brothers Builders &amp; Constructions as Founder and Managing Director. Under his strategic guidance, the firm has successfully engineered and executed over 75+ residential villas, commercial complexes, and turnkey developments.
              </p>
              <p style={{ color: '#a1a1aa', fontSize: '0.96rem', lineHeight: 1.7, marginBottom: '24px' }}>
                A staunch advocate for institutional engineering standards, he personally validates site foundation designs, soil-bearing capacity assessments, and RCC beam reinforcement parameters. His relentless emphasis on transparent BOQ (Bill of Quantities) estimation has established PSK Brothers as one of Chennai's most trusted building contractors.
              </p>

              <div style={{ background: 'rgba(226,38,43,0.08)', borderLeft: '4px solid #e2262b', padding: '18px 24px', borderRadius: '0 14px 14px 0', marginBottom: '28px', fontStyle: 'italic', color: '#e4e4e7', fontSize: '0.98rem', lineHeight: 1.6 }}>
                "Constructing landmarks with uncompromised engineering precision, structural integrity, and institutional transparency. Every foundation we excavate is built as if our own family lived inside."
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '18px', borderRadius: '14px' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> Structural Engineering Rigor
                  </h4>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.84rem', lineHeight: 1.5 }}>
                    Personal validation on beam reinforcement, load calculations, and soil foundation depth for every build.
                  </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '18px', borderRadius: '14px' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> Itemized Fixed Estimates
                  </h4>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.84rem', lineHeight: 1.5 }}>
                    Itemized BOQ billing signed upfront — guaranteed zero mid-way budget hikes or hidden site surcharges.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <a href="https://wa.me/919003177934?text=Hello%20S.%20Senthil%20Murugan,%20I%20would%20like%20to%20discuss%20a%20construction%20project" target="_blank" rel="noreferrer" className="profileBtnPrimary">
                  <Phone size={16}/> Connect on WhatsApp (+91 90031 77934)
                </a>
                <a href="tel:+919003177934" className="profileBtnSecondary">
                  <Phone size={16}/> Call Direct
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

        {/* FOUNDER 2: S Prakash */}
        <section style={{ padding: '80px 6%', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '60px', alignItems: 'center' }} className="leadershipDetailRow">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ff8a7a', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                <Hammer size={16}/> ON-SITE OPERATIONS &amp; QUALITY EXECUTION
              </div>
              <h2 style={{ fontSize: '2.4rem', fontFamily: 'Fraunces, serif', margin: '0 0 16px 0', color: '#ffffff' }}>
                S. Prakash
              </h2>
              <p style={{ color: '#d4d4d8', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '16px' }}>
                S. Prakash serves as Co-Founder and Head of Site Operations, driving field execution excellence, material quality assurance, and project timeline enforcement across all active construction sites. Leading a dedicated team of site engineers, supervisors, and skilled craftsmen, he guarantees seamless progress from excavation to final handover.
              </p>
              <p style={{ color: '#a1a1aa', fontSize: '0.96rem', lineHeight: 1.7, marginBottom: '24px' }}>
                He has pioneered PSK's signature 100% On-Time Handover Framework and Live Photo Progress Tracking System, giving clients complete transparency. Under his operational leadership, PSK Brothers maintains strict adherence to grade-53 cement standards, Fe-550 TMT steel testing, and zero-defect quality checklists at every stage.
              </p>

              <div style={{ background: 'rgba(226,38,43,0.08)', borderLeft: '4px solid #e2262b', padding: '18px 24px', borderRadius: '0 14px 14px 0', marginBottom: '28px', fontStyle: 'italic', color: '#e4e4e7', fontSize: '0.98rem', lineHeight: 1.6 }}>
                "A delay on site is a cost to our client's dream. We enforce daily progress milestones, slump tests, and strict material quality audits on every single project."
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '18px', borderRadius: '14px' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> Daily Quality Audits
                  </h4>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.84rem', lineHeight: 1.5 }}>
                    Rigorously tests concrete slump, curing timelines, waterproofing coats, and masonry verticality.
                  </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '18px', borderRadius: '14px' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> Live Customer Tracking
                  </h4>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.84rem', lineHeight: 1.5 }}>
                    Directly manages daily site photo updates uploaded into each client's dedicated Customer Portal.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <a href="https://wa.me/919941426479?text=Hello%20S.%20Prakash,%20I%20would%20like%20to%20discuss%20site%20operations" target="_blank" rel="noreferrer" className="profileBtnPrimary">
                  <Phone size={16}/> Connect on WhatsApp (+91 99414 26479)
                </a>
                <a href="tel:+919941426479" className="profileBtnSecondary">
                  <Phone size={16}/> Call Operations
                </a>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '24px', overflow: 'hidden', border: '2px solid rgba(226,38,43,0.3)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', position: 'relative' }}>
                <img 
                  src="/owner2.png" 
                  alt="S. Prakash - Co-Founder & Head of Operations" 
                  style={{ width: '100%', height: '480px', objectFit: 'cover', objectPosition: '50% 12%', display: 'block' }} 
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(10,10,12,0.85) 0%, transparent 40%)' }} />
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ color: '#ff8a7a', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>CO-FOUNDER &amp; HEAD OF OPERATIONS</div>
                  <div style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>S. Prakash</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HEAD OFFICE SHOWCASE */}
        <section style={{ padding: '80px 6%', background: 'linear-gradient(180deg, #0d0e12 0%, #12131a 100%)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 50px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                <Building2 size={16}/> HEADQUARTERS &amp; CUSTOMER EXPERIENCE SUITE
              </div>
              <h2 style={{ fontSize: '2.4rem', fontFamily: 'Fraunces, serif', margin: '0 0 12px 0', color: '#ffffff' }}>
                PSK Main Head Office
              </h2>
              <p style={{ color: '#a1a1aa', fontSize: '1rem', lineHeight: 1.6 }}>
                Located at Choolaimedu, Chennai. Visit our state-of-the-art office to experience 3D plan visualizations, material samples, and digital cost estimation.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '50px', alignItems: 'center' }} className="leadershipDetailRow">
              <div style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', position: 'relative' }}>
                <img 
                  src="/office.png" 
                  alt="PSK Head Office Chennai" 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'; }} 
                  style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }} 
                />
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', background: 'rgba(15,23,42,0.88)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700, fontSize: '0.82rem' }}>
                    <MapPin size={16}/> CHENNAI HEADQUARTERS
                  </div>
                  <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.05rem', marginTop: '4px' }}>
                    Choolaimedu, Chennai, Tamil Nadu - 600094
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '20px', fontWeight: 700 }}>
                  What You Can Experience At Our Head Office:
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
                      <Building2 size={20}/>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.95rem' }}>3D Floor Plan &amp; Elevation Studio</h4>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.84rem' }}>Walk through your house floor plans in 3D before a single brick is laid.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
                      <Hammer size={20}/>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.95rem' }}>Material Sample Showcase</h4>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.84rem' }}>Inspect 1st grade chamber bricks, Fe-550 TMT bars, granite, tiles, and plumbing samples.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
                      <Clock size={20}/>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.95rem' }}>Office Hours</h4>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.84rem' }}>Monday – Saturday: 9:00 AM to 7:30 PM • Sunday visits by appointment.</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <a href="https://maps.google.com/?q=Choolaimedu,+Chennai,+Tamil+Nadu+-+600094" target="_blank" rel="noreferrer" className="profileBtnPrimary" style={{ background: '#2563eb' }}>
                    <MapPin size={16}/> Directions on Google Maps
                  </a>
                  <a href="/#contact" className="profileBtnSecondary">
                    <Calendar size={16}/> Schedule Office Visit
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ background: '#08080a', padding: '30px 6%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <a className="logo" href="/"><img src="/logo.png" alt="PSK Brothers" style={{ height: '40px' }}/></a>
        <p style={{ color: '#71717a', fontSize: '0.85rem', margin: 0 }}>© 2026 PSK Brothers Builders &amp; Constructions. All rights reserved.</p>
        <a href="/" style={{ color: '#ff8a7a', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>Back to Home →</a>
      </footer>
    </div>
  );
}

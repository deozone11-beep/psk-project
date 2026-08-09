import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle2, Hammer, MapPin, Calendar, 
  Ruler, Clock, Search, Filter, X, ChevronLeft, ChevronRight, 
  ExternalLink, Building2, Phone, Sparkles, Layers 
} from 'lucide-react';
import './style.css';

export const PROJECTS_DATA = [
  {
    id: 1,
    title: 'Modern Family Residence',
    location: 'Porur, Chennai',
    category: 'Residential',
    status: 'Completed',
    year: '2024',
    sqft: '2,800 Sq.Ft.',
    duration: '10 Months',
    client: 'Karthik & Family',
    description: 'Ultra-modern 3-story luxury residential home built with RCC framed structure, Italian marble flooring, teakwood joinery, and custom glass elevation.',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 2,
    title: 'Premium Contemporary Villa',
    location: 'Perundurai, Erode',
    category: 'Villa',
    status: 'Completed',
    year: '2024',
    sqft: '4,500 Sq.Ft.',
    duration: '12 Months',
    client: 'Senthil Kumar',
    description: 'Spacious 4BHK architectural masterpiece with indoor courtyard, private swimming pool, home automation, and solar roofing system.',
    coverImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 3,
    title: 'Urban Business Centre & Complex',
    location: 'Tiruppur',
    category: 'Commercial',
    status: 'Ongoing',
    year: '2025 (Expected)',
    sqft: '14,000 Sq.Ft.',
    duration: '14 Months',
    client: 'Apex Garment Exports',
    description: '5-story commercial corporate headquarters with glass curtain wall facade, basement parking, high-speed elevator shafts, and fire safety systems.',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 4,
    title: 'Grand Horizon Luxury Apartments',
    location: 'R.S. Puram, Coimbatore',
    category: 'Residential',
    status: 'Completed',
    year: '2023',
    sqft: '18,500 Sq.Ft.',
    duration: '18 Months',
    client: 'Horizon Realty Group',
    description: 'Boutique multi-family residential complex featuring 12 luxury 3BHK apartments with underground parking, gym, and rooftop garden.',
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 5,
    title: 'Heritage Villa Structural Renovation',
    location: 'Choolaimedu, Chennai',
    category: 'Renovation',
    status: 'Completed',
    year: '2023',
    sqft: '3,200 Sq.Ft.',
    duration: '6 Months',
    client: 'Dr. V. Natarajan',
    description: 'Complete modern structural overhaul of a 35-year-old traditional home, adding a modern floor, new RCC beams, updated plumbing, and contemporary interiors.',
    coverImage: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 6,
    title: 'Eco-Green Gated Community',
    location: 'Saravanampatti, Coimbatore',
    category: 'Residential',
    status: 'Ongoing',
    year: '2025 (Expected)',
    sqft: '22,000 Sq.Ft.',
    duration: '20 Months',
    client: 'PSK Green Enclave',
    description: 'Gated community featuring 8 eco-friendly smart villas with rainwater harvesting, solar integration, and landscaped private gardens.',
    coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 7,
    title: 'Imperial Plaza Commercial Retail Hub',
    location: 'Fairlands, Salem',
    category: 'Commercial',
    status: 'Completed',
    year: '2024',
    sqft: '9,800 Sq.Ft.',
    duration: '11 Months',
    client: 'Imperial Retails Ltd',
    description: 'Modern multi-retail shopping plaza with structural steel glass front, high durability epoxy flooring, and centralized air conditioning ducting.',
    coverImage: 'https://images.unsplash.com/photo-1555636222-cae831e670b3?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555636222-cae831e670b3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 8,
    title: 'Skyline Duplex Villa',
    location: 'Thillai Nagar, Trichy',
    category: 'Villa',
    status: 'Ongoing',
    year: '2025 (Expected)',
    sqft: '3,600 Sq.Ft.',
    duration: '10 Months',
    client: 'Anand Kumar',
    description: 'Duplex villa featuring double-height ceiling living hall, modern cantilevered staircase, master bedroom balconies, and exterior wood louvers.',
    coverImage: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ]
  }
];

export default function ProjectsPage() {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [dbProjects, setDbProjects] = useState([]);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setDbProjects(data);
        }
      })
      .catch(console.error);
  }, []);

  const formattedDbProjects = dbProjects.map((p) => {
    const gallery = p.imageUrls && p.imageUrls.length > 0 
      ? p.imageUrls 
      : (p.imageUrl ? [p.imageUrl] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80']);
    
    const titleLower = (p.title || '').toLowerCase();
    let category = p.category;
    if (!category) {
      if (titleLower.includes('villa')) category = 'Villa';
      else if (titleLower.includes('commercial') || titleLower.includes('business') || titleLower.includes('plaza') || titleLower.includes('complex')) category = 'Commercial';
      else if (titleLower.includes('renovat')) category = 'Renovation';
      else category = 'Residential';
    }

    return {
      id: 'db-' + (p.id || Math.random()),
      title: p.title || 'Landmark Construction Project',
      location: p.location || 'Tamil Nadu',
      category: category,
      status: p.status || 'Completed',
      year: p.year || '2024',
      sqft: p.sqft || 'Custom Sq.Ft.',
      duration: p.duration || 'On Schedule',
      client: p.client || 'Valued Client',
      description: p.description || `${p.title} executed with RCC framed structure, premium fittings, and architectural perfection in ${p.location}.`,
      coverImage: gallery[0],
      gallery: gallery
    };
  });

  const allProjects = formattedDbProjects.length > 0 ? formattedDbProjects : PROJECTS_DATA;

  const filteredProjects = allProjects.filter((item) => {
    const matchesFilter = 
      filter === 'All' ? true :
      filter === 'Completed' ? item.status === 'Completed' :
      filter === 'Ongoing' ? item.status === 'Ongoing' :
      item.category === filter;
    
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="site projectsPage" style={{ background: '#09090b', color: '#f8fafc', minHeight: '100vh' }}>
      {/* HEADER */}
      <header className="scrolled" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <a className="logo" href="/">
          <img src="/logo.png" alt="PSK Brothers Builders & Constructions" />
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="/#home" onClick={() => window.location.href = '/#home'}>Home</a>
          <a href="/#about" onClick={() => window.location.href = '/#about'}>About</a>
          <a href="/#services" onClick={() => window.location.href = '/#services'}>Services</a>
          <a href="/#calculator" onClick={() => window.location.href = '/#calculator'}>Calculator</a>
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

      {/* HERO BANNER FOR PROJECTS PAGE */}
      <div style={{
        position: 'relative',
        padding: '70px 24px 50px',
        textAlign: 'center',
        background: 'radial-gradient(800px 400px at 50% 20%, rgba(226,38,43,0.18), transparent 70%), linear-gradient(180deg, #0d0d11 0%, #09090b 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(226,38,43,0.12)', border: '1px solid rgba(226,38,43,0.3)', padding: '6px 16px', borderRadius: '20px', color: '#ff8a7a', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
            <Layers size={14}/> COMPLETE CONSTRUCTION PORTFOLIO
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 800, margin: '0 0 16px 0', fontFamily: 'Fraunces, serif', color: '#ffffff', lineHeight: 1.15 }}>
            Our Completed &amp; Ongoing <br/>
            <span style={{ color: '#e2262b', fontStyle: 'italic' }}>Landmark Projects</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#a1a1aa', margin: '0 0 32px 0', lineHeight: 1.6 }}>
            Explore our extensive portfolio of residential homes, luxury villas, commercial complexes, and modern renovations executed across Chennai, Coimbatore, Erode, Tiruppur, Salem, &amp; Tamil Nadu.
          </p>

          {/* SEARCH & CATEGORY FILTER BAR */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              <input 
                type="text" 
                placeholder="Search site name or location (e.g. Porur, Erode)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 46px',
                  borderRadius: '30px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['All', 'Completed', 'Ongoing', 'Residential', 'Villa', 'Commercial', 'Renovation'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  style={{
                    background: filter === tab ? '#e2262b' : 'rgba(255,255,255,0.06)',
                    color: '#ffffff',
                    border: filter === tab ? '1px solid #e2262b' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '20px',
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: filter === tab ? '0 4px 14px rgba(226,38,43,0.4)' : 'none'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PROJECTS GALLERY GRID */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f4f4f5' }}>
            Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
          </h2>
          {filter !== 'All' && (
            <span style={{ fontSize: '0.85rem', color: '#ff8a7a' }}>
              Filtered by: <strong>{filter}</strong>
            </span>
          )}
        </div>

        {filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Building2 size={48} style={{ color: '#52525b', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.3rem', color: '#f4f4f5', margin: '0 0 8px 0' }}>No projects found matching "{searchTerm}"</h3>
            <p style={{ color: '#71717a', fontSize: '0.9rem', margin: 0 }}>Try clearing your search term or selecting a different category filter.</p>
            <button 
              type="button" 
              onClick={() => { setFilter('All'); setSearchTerm(''); }}
              style={{ marginTop: '20px', background: '#e2262b', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '20px', fontWeight: 700, cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
            {filteredProjects.map((project) => (
              <div 
                key={project.id}
                onClick={() => {
                  setSelectedProject(project);
                  setActivePhotoIdx(0);
                }}
                style={{
                  background: 'rgba(23, 23, 28, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                  position: 'relative'
                }}
                className="projectCardHover"
              >
                {/* COVER IMAGE WITH BADGE */}
                <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                  <img 
                    src={project.coverImage} 
                    alt={project.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    className="cardImgZoom"
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)' }} />

                  {/* Status Badge */}
                  <span style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: project.status === 'Completed' ? 'rgba(34, 197, 94, 0.92)' : 'rgba(226, 38, 43, 0.92)',
                    color: '#ffffff',
                    padding: '5px 12px',
                    borderRadius: '16px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}>
                    {project.status === 'Completed' ? <CheckCircle2 size={13} /> : <Hammer size={13} />}
                    {project.status}
                  </span>

                  {/* Photo Count Badge */}
                  <span style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    📷 {project.gallery.length} Photos
                  </span>
                </div>

                {/* CONTENT AREA */}
                <div style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff8a7a', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                      <MapPin size={14} /> {project.location}
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0', lineHeight: 1.3 }}>
                      {project.title}
                    </h3>

                    <p style={{ fontSize: '0.86rem', color: '#a1a1aa', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {project.description}
                    </p>
                  </div>

                  {/* SPECIFICATION CHIPS */}
                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', fontSize: '0.76rem', color: '#d4d4d8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Ruler size={13} style={{ color: '#e2262b' }}/> {project.sqft}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} style={{ color: '#e2262b' }}/> {project.duration}</span>
                  </div>

                  <button 
                    type="button"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    className="viewProjectBtn"
                  >
                    View Site Details &amp; Photos <ExternalLink size={14}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DETAILED PROJECT MODAL LIGHTBOX */}
      {selectedProject && (
        <div 
          className="modalOverlay" 
          onClick={() => setSelectedProject(null)} 
          style={{ zIndex: 9999, background: 'rgba(5, 5, 8, 0.92)', backdropFilter: 'blur(12px)' }}
        >
          <div 
            className="modalContent" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '920px', 
              width: '95%', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              borderRadius: '24px', 
              padding: '0', 
              background: '#0d0d11',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.9)'
            }}
          >
            {/* CLOSE BUTTON */}
            <button 
              type="button" 
              onClick={() => setSelectedProject(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20
              }}
            >
              <X size={20} />
            </button>

            {/* MAIN IMAGE DISPLAY LIGHTBOX */}
            <div style={{ position: 'relative', height: '420px', background: '#000' }}>
              <img 
                src={selectedProject.gallery[activePhotoIdx] || selectedProject.coverImage} 
                alt={selectedProject.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)' }} />

              {/* NEXT / PREV PHOTO ARROWS */}
              {selectedProject.gallery.length > 1 && (
                <>
                  <button 
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev === 0 ? selectedProject.gallery.length - 1 : prev - 1))}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      width: '42px',
                      height: '42px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <button 
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev === selectedProject.gallery.length - 1 ? 0 : prev + 1))}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      width: '42px',
                      height: '42px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* PROJECT TITLE & STATUS ON PHOTO OVERLAY */}
              <div style={{ position: 'absolute', bottom: '20px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff8a7a', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                    <MapPin size={16}/> {selectedProject.location}
                  </div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.8)', fontFamily: 'Fraunces, serif' }}>
                    {selectedProject.title}
                  </h2>
                </div>

                <span style={{
                  background: selectedProject.status === 'Completed' ? '#22c55e' : '#e2262b',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {selectedProject.status === 'Completed' ? <CheckCircle2 size={14}/> : <Hammer size={14}/>}
                  {selectedProject.status}
                </span>
              </div>
            </div>

            {/* THUMBNAIL STRIP */}
            {selectedProject.gallery.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', padding: '14px 24px', background: '#070709', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}>
                {selectedProject.gallery.map((img, idx) => (
                  <img 
                    key={idx}
                    src={img}
                    alt={`Photo ${idx + 1}`}
                    onClick={() => setActivePhotoIdx(idx)}
                    style={{
                      width: '72px',
                      height: '52px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: activePhotoIdx === idx ? '2px solid #e2262b' : '2px solid transparent',
                      opacity: activePhotoIdx === idx ? 1 : 0.6,
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>
            )}

            {/* PROJECT SPECIFICATIONS & DESCRIPTION */}
            <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', background: 'rgba(255,255,255,0.04)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <small style={{ color: '#a1a1aa', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>BUILT-UP AREA</small>
                  <strong style={{ color: '#ffffff', fontSize: '1rem' }}>{selectedProject.sqft}</strong>
                </div>
                <div>
                  <small style={{ color: '#a1a1aa', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>CONSTRUCTION DURATION</small>
                  <strong style={{ color: '#ffffff', fontSize: '1rem' }}>{selectedProject.duration}</strong>
                </div>
                <div>
                  <small style={{ color: '#a1a1aa', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>PROJECT TYPE</small>
                  <strong style={{ color: '#ff8a7a', fontSize: '1rem' }}>{selectedProject.category}</strong>
                </div>
                <div>
                  <small style={{ color: '#a1a1aa', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>CLIENT / OWNER</small>
                  <strong style={{ color: '#ffffff', fontSize: '1rem' }}>{selectedProject.client}</strong>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f4f4f5', margin: '0 0 8px 0' }}>Project Architecture &amp; Execution Overview</h4>
                <p style={{ fontSize: '0.94rem', color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>
                  {selectedProject.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <a 
                  href="/#contact"
                  onClick={() => setSelectedProject(null)}
                  style={{
                    background: '#e2262b',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: '20px',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Enquire About Similar Construction Project <Phone size={16}/>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

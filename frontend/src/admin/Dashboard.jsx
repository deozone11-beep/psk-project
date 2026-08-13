import React, { useState } from 'react';
import { LogOut, Menu, X, Mail, Save, Image, Users, Calendar, Wallet, Camera, LayoutDashboard, FileText, Layers, Star, MapPin, ClipboardList } from 'lucide-react';
import OverviewTab from './OverviewTab.jsx';
import EnquiriesTab from './EnquiriesTab.jsx';
import RateTab from './RateTab.jsx';
import ProjectsTab from './ProjectsTab.jsx';
import EmployeesTab from './EmployeesTab.jsx';
import AttendanceTab from './AttendanceTab.jsx';
import PaymentsTab from './PaymentsTab.jsx';
import CustomersTab from './CustomersTab.jsx';
import UpdatesTab from './UpdatesTab.jsx';
import InvoicesTab from './InvoicesTab.jsx';
import SavedPlansTab from './SavedPlansTab.jsx';
import TestimonialsTab from './TestimonialsTab.jsx';
import CensusWorkTab from './CensusWorkTab.jsx';
import CensusModule2 from './CensusModule2.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'census', label: 'Census Work', icon: MapPin },
  { id: 'testimonials', label: 'Client Reviews', icon: Star },
  { id: 'plans', label: 'Customer 2D Plans', icon: Layers },
  { id: 'invoices', label: 'Bills & Invoices', icon: FileText },
  { id: 'enquiries', label: 'Enquiries', icon: Mail },
  { id: 'rate', label: 'Rate', icon: Save },
  { id: 'projects', label: 'Portfolio', icon: Image },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'updates', label: 'Site Updates', icon: Camera },
];

// ── Census Enumerator Portal ────────────────────────────────────────────────
// A clean, focused view shown only to CENSUS_USER role employees.
// CensusModule2 inner sticky header is hidden (hideHeader=true) so only
// this single portal top bar is visible — no duplicate navigation.
function CensusPortal({ creds, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d0f1a', display: 'flex', flexDirection: 'column' }}>
      {/* Single clean top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'rgba(10,10,22,0.98)',
        borderBottom: '1px solid rgba(168,85,247,0.2)',
        position: 'sticky', top: 0, zIndex: 200
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={19} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              PSK Census Portal
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {creds.displayName || creds.username} · Census Staff
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '7px 14px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Census Module 2 — inner header hidden, only content shows */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <CensusModule2 onBack={null} hideHeader={true} creds={creds} />
      </div>
    </div>
  );
}


export default function Dashboard({ creds, onLogout }) {
  // Census users get a dedicated portal — no sidebar, census data only
  if (creds.role === 'CENSUS_USER') {
    return <CensusPortal creds={creds} onLogout={onLogout} />;
  }

  const availableTabs = TABS.filter((t) => {
    if (creds.role === 'ENGINEER') {
      return ['overview', 'census', 'plans', 'invoices', 'enquiries', 'customers', 'updates', 'attendance', 'payments', 'employees'].includes(t.id);
    }
    return true;
  });

  const [tab, setTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeTabMeta = TABS.find((t) => t.id === tab);

  function selectTab(id) {
    setTab(id);
    setSidebarOpen(false);
  }

  return (
    <div className="adminShell">
      <aside className={'adminSidebar' + (sidebarOpen ? ' open' : '')}>
        <div className="adminSidebarTop">
          <a href="/" className="adminBrand">
            <img src="/logo-icon.png" alt="" className="adminBrandIcon" />
            <span>PSK <b>Brothers</b></span>
          </a>
          <button className="adminSidebarClose" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="adminSidebarNav">
          {availableTabs.map((t) => (
            <button key={t.id} className={'adminSidebarBtn' + (tab === t.id ? ' active' : '')} onClick={() => selectTab(t.id)}>
              <t.icon size={17} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="adminSidebarFoot">
          <div className="adminSidebarRole">{creds.role === 'ADMIN' ? 'Owner / Staff' : 'Site Engineer'}</div>
          <button className="adminSidebarLogout" onClick={onLogout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      {sidebarOpen && <div className="adminSidebarBackdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="adminMain">
        <header className="adminTopbar">
          <button className="adminMenuBtn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div>
            <h1>{activeTabMeta?.label}</h1>
            <p>Welcome back, {creds.displayName || creds.username}</p>
          </div>
        </header>
        <div className="adminContent">
          {tab === 'overview' && <OverviewTab creds={creds} setTab={selectTab} />}
          {tab === 'testimonials' && <TestimonialsTab creds={creds} />}
          {tab === 'plans' && <SavedPlansTab userRole={creds.role} />}
          {tab === 'invoices' && <InvoicesTab creds={creds} />}
          {tab === 'enquiries' && <EnquiriesTab creds={creds} />}
          {tab === 'rate' && <RateTab creds={creds} />}
          {tab === 'projects' && <ProjectsTab creds={creds} />}
          {tab === 'employees' && <EmployeesTab creds={creds} />}
          {tab === 'attendance' && <AttendanceTab creds={creds} />}
          {tab === 'payments' && <PaymentsTab creds={creds} />}
          {tab === 'customers' && <CustomersTab creds={creds} />}
          {tab === 'updates' && <UpdatesTab creds={creds} />}
          {tab === 'census' && <CensusWorkTab creds={creds} />}
        </div>
        <footer className="adminFooter">
          <span>© 2026 PSK Brothers Builders & Constructions</span>
          <a href="/">← Back to public site</a>
        </footer>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { LogOut, Menu, X, Mail, Save, Image, Users, Calendar, Wallet, Camera } from 'lucide-react';
import EnquiriesTab from './EnquiriesTab.jsx';
import RateTab from './RateTab.jsx';
import ProjectsTab from './ProjectsTab.jsx';
import EmployeesTab from './EmployeesTab.jsx';
import AttendanceTab from './AttendanceTab.jsx';
import PaymentsTab from './PaymentsTab.jsx';
import CustomersTab from './CustomersTab.jsx';
import UpdatesTab from './UpdatesTab.jsx';

const TABS = [
  { id: 'enquiries', label: 'Enquiries', icon: Mail },
  { id: 'rate', label: 'Rate', icon: Save },
  { id: 'projects', label: 'Portfolio', icon: Image },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'updates', label: 'Site Updates', icon: Camera },
];

export default function Dashboard({ creds, onLogout }) {
  const [tab, setTab] = useState('enquiries');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeTabMeta = TABS.find((t) => t.id === tab);

  function selectTab(id) {
    setTab(id);
    setSidebarOpen(false); // auto-close on mobile after picking a section
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
          {TABS.map((t) => (
            <button key={t.id} className={'adminSidebarBtn' + (tab === t.id ? ' active' : '')} onClick={() => selectTab(t.id)}>
              <t.icon size={17} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="adminSidebarFoot">
          <div className="adminSidebarRole">{creds.role === 'ADMIN' ? 'Owner / Staff' : creds.role}</div>
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
          {tab === 'enquiries' && <EnquiriesTab creds={creds} />}
          {tab === 'rate' && <RateTab creds={creds} />}
          {tab === 'projects' && <ProjectsTab creds={creds} />}
          {tab === 'employees' && <EmployeesTab creds={creds} />}
          {tab === 'attendance' && <AttendanceTab creds={creds} />}
          {tab === 'payments' && <PaymentsTab creds={creds} />}
          {tab === 'customers' && <CustomersTab creds={creds} />}
          {tab === 'updates' && <UpdatesTab creds={creds} />}
        </div>
        <footer className="adminFooter">
          <span>© 2026 PSK Brothers Builders & Constructions</span>
          <a href="/">← Back to public site</a>
        </footer>
      </div>
    </div>
  );
}

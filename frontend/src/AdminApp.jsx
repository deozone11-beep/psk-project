import React, { useEffect, useState } from 'react';
import Dashboard from './admin/Dashboard.jsx';
import './admin/admin.css';

export default function AdminApp() {
  const [auth, setAuth] = useState(() => {
    const saved = sessionStorage.getItem('psk_auth');
    return saved ? JSON.parse(saved) : null;
  });

  function logout() {
    sessionStorage.removeItem('psk_auth');
    setAuth(null);
    window.location.href = '/login';
  }

  useEffect(() => {
    if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'ENGINEER')) window.location.href = '/login';
  }, [auth]);

  if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'ENGINEER')) return null; // redirecting via the effect above
  return <Dashboard creds={auth} onLogout={logout} />;
}

import React, { useEffect, useState } from 'react';
import CensusModule2 from './admin/CensusModule2.jsx';

export default function CensusStandalonePage() {
  const [auth, setAuth] = useState(() => {
    try {
      const s = sessionStorage.getItem('psk_auth') || localStorage.getItem('psk_auth');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (!auth) window.location.href = '/login';
  }, [auth]);

  if (!auth) return null;

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#0d0f1a', margin: 0, padding: 0 }}>
      <CensusModule2
        onBack={() => { window.location.href = '/admin'; }}
        hideHeader={false}
        creds={auth}
      />
    </div>
  );
}

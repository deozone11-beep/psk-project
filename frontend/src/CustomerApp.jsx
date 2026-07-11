import React, { useEffect, useState } from 'react';
import { LogOut, MapPin, Calendar } from 'lucide-react';
import './admin/admin.css';

const API = '/api';

function authHeader(auth) {
  return { Authorization: 'Bearer ' + auth.token };
}

function Portal({ creds, onLogout }) {
  const [me, setMe] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/customer/me`, { headers: authHeader(creds) }),
      fetch(`${API}/customer/updates`, { headers: authHeader(creds) }),
    ])
      .then(async ([meRes, updatesRes]) => {
        if (meRes.status === 401 || meRes.status === 403 || updatesRes.status === 401 || updatesRes.status === 403) {
          sessionStorage.removeItem('psk_auth');
          window.location.href = '/login';
          return;
        }
        setMe(await meRes.json());
        setUpdates(await updatesRes.json());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="portalWrap"><p className="adminHint">Loading your project...</p></div>;

  return (
    <div className="adminWrap">
      <header className="adminHeader">
        <img src="/logo.png" alt="PSK Brothers" className="adminLogo" />
        <button className="adminLogoutBtn" onClick={onLogout}><LogOut size={16} /> Logout</button>
      </header>
      <div className="portalWrap">
        <section className="adminCard portalHero">
          <p className="adminHint">Welcome back,</p>
          <h2>{me?.displayName || 'there'}</h2>
          {me?.projectName && <p className="portalProject"><MapPin size={15} /> {me.projectName}</p>}
          {me?.estimatedSqft > 0 && (
            <div className="portalEstimate">
              <div><span>Project size</span><b>{me.estimatedSqft.toLocaleString('en-IN')} sqft</b></div>
              <div><span>Rate</span><b>₹{me.ratePerSqft.toLocaleString('en-IN')}/sqft</b></div>
              <div><span>Estimated cost</span><b>₹{me.estimatedCost.toLocaleString('en-IN')}</b></div>
            </div>
          )}
        </section>

        <section className="adminCard">
          <h3>Your Project's Progress</h3>
          {updates.length === 0 ? (
            <p className="adminHint">No updates posted yet — check back soon, or contact us for a status update.</p>
          ) : (
            <div className="portalFeed">
              {updates.map((u) => (
                <div className="portalUpdate" key={u.id}>
                  {u.photoUrl && <img src={u.photoUrl} alt={u.title} />}
                  <div className="portalUpdateBody">
                    <span className="portalDate"><Calendar size={13} /> {u.workDate}</span>
                    <b>{u.title}</b>
                    {u.description && <p>{u.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function CustomerApp() {
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
    if (!auth || (auth.role !== 'CUSTOMER' && auth.role !== 'ADMIN')) window.location.href = '/login';
  }, [auth]);

  if (!auth || (auth.role !== 'CUSTOMER' && auth.role !== 'ADMIN')) return null; // redirecting via the effect above
  return <Portal creds={auth} onLogout={logout} />;
}

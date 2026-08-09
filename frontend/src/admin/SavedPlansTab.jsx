import React, { useState, useEffect } from 'react';
import { Eye, Trash2, UserCheck, Calendar, Compass, Layers, CheckCircle2, X } from 'lucide-react';
import PlanVisualizer from '../components/PlanVisualizer';

export default function SavedPlansTab({ userRole }) {
  const [plans, setPlans] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [assigningEngineers, setAssigningEngineers] = useState({});

  const isFullAdmin = userRole === 'ADMIN';

  const getAuthToken = () => {
    try {
      const saved = sessionStorage.getItem('psk_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.token) return parsed.token;
      }
    } catch (e) {}
    return localStorage.getItem('psk_token') || '';
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plans/admin/all', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (e) {
      console.error('Failed to fetch saved plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    if (!isFullAdmin) return;
    try {
      const res = await fetch('/api/admin/employees', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        // filter or list engineers / users
        setEngineers(data.filter((e) => (e.role || '').toUpperCase().includes('ENGINEER') || e.name));
      }
    } catch (e) {
      console.error('Failed to fetch engineers:', e);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchEngineers();
  }, []);

  const handleAssignEngineer = async (customerId, engineerUsername) => {
    try {
      const res = await fetch('/api/plans/assign-engineer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ customerId, engineerUsername }),
      });
      if (res.ok) {
        fetchPlans();
      } else {
        alert('Failed to assign engineer');
      }
    } catch (e) {
      alert('Error assigning engineer: ' + e.message);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved plan?')) return;
    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        setPlans(plans.filter((p) => p.id !== id));
      }
    } catch (e) {
      alert('Failed to delete plan: ' + e.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: '800' }}>
            Customer 2D AutoCAD Plans & Favorites
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            {isFullAdmin
              ? 'Viewing all customer favorited designs & plot dimensions across all projects.'
              : 'Viewing 2D plans for customers assigned to your engineer account.'}
          </p>
        </div>

        <button
          onClick={fetchPlans}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#ffffff',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading customer plans...</div>
      ) : plans.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
          }}
        >
          No saved customer plans found. When customers favorite a 2D AutoCAD layout, it will appear here!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {plans.map((p) => {
            const customerName = p.customer?.displayName || p.customer?.username || 'Guest Customer';
            const assignedEng = p.customer?.assignedEngineerUsername || 'Unassigned';

            return (
              <div
                key={p.id}
                style={{
                  background: 'rgba(19, 27, 45, 0.8)',
                  borderRadius: '14px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span
                        style={{
                          background: 'rgba(3, 105, 161, 0.25)',
                          color: '#38bdf8',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                        }}
                      >
                        Option #{p.designOptionIndex + 1}
                      </span>
                      <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.15rem', color: '#ffffff', fontWeight: '700' }}>
                        {customerName}
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        Phone: {p.customer?.phone || 'N/A'} • {p.customer?.email || ''}
                      </div>
                    </div>

                    {isFullAdmin && (
                      <button
                        onClick={() => handleDeletePlan(p.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '14px 0' }} />

                  {/* Plan Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                    <div>
                      <strong style={{ color: '#94a3b8' }}>Plot Dimensions:</strong>
                      <div style={{ fontWeight: '700', color: '#ffffff' }}>
                        {p.plotLength}ft × {p.plotWidth}ft ({p.totalSqft?.toLocaleString()} sqft)
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#94a3b8' }}>Facing / Floors:</strong>
                      <div style={{ fontWeight: '700', color: '#ffffff' }}>
                        {p.facingDirection} • {p.floors}
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                      <strong style={{ color: '#94a3b8' }}>Selected Design Style:</strong>
                      <div style={{ color: '#38bdf8', fontWeight: '700' }}>{p.designOptionName}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong style={{ color: '#94a3b8' }}>Estimated Cost:</strong>
                      <div style={{ color: '#34d399', fontWeight: '800', fontSize: '1.05rem' }}>
                        ₹{p.estimatedCost?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Section & Engineer Assignment */}
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {isFullAdmin ? (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Assigned Site Engineer:
                      </label>
                      <select
                        value={assignedEng}
                        onChange={(e) => handleAssignEngineer(p.customer?.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          background: 'rgba(15, 23, 42, 0.7)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        <option value="Unassigned" style={{ background: '#0f172a' }}>Unassigned</option>
                        <option value="engineer" style={{ background: '#0f172a' }}>engineer (Er. Dinesh)</option>
                        {engineers.map((eng) => (
                          <option key={eng.id} value={eng.name} style={{ background: '#0f172a' }}>
                            {eng.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                      Assigned Engineer: <strong style={{ color: '#ffffff' }}>{assignedEng}</strong>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedPlan(p)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Eye size={16} /> Inspect 2D Plan Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Full 2D & 3D Architectural Visualizer Inspection Modal */}
      {selectedPlan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => setSelectedPlan(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '25px',
              maxWidth: '1100px',
              width: '100%',
              maxHeight: '94vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Customer Header Info Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#0284c7', fontWeight: '800', letterSpacing: '1px' }}>
                  ADMIN ARCHITECTURAL INSPECTION STUDIO
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.4rem', color: '#0f172a', fontWeight: '800' }}>
                  {selectedPlan.customer?.displayName || selectedPlan.customer?.username}'s Saved 2D &amp; 3D Plan
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Metadata Pill Summary */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '12px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <div>👤 <strong>Customer:</strong> {selectedPlan.customer?.displayName || selectedPlan.customer?.username} ({selectedPlan.customer?.phoneNumber || 'No Phone'})</div>
              <div>📐 <strong>Plot:</strong> {selectedPlan.plotLength}ft × {selectedPlan.plotWidth}ft ({selectedPlan.totalSqft} sqft)</div>
              <div>🧭 <strong>Facing:</strong> {selectedPlan.facingDirection} Facing</div>
              <div>🏢 <strong>Option:</strong> Design #{selectedPlan.designOptionIndex + 1}: {selectedPlan.designOptionName}</div>
              <div>💰 <strong>Est. Cost:</strong> <strong style={{ color: '#16a34a' }}>₹{selectedPlan.estimatedCost?.toLocaleString()}</strong></div>
              <div>📅 <strong>Saved Date:</strong> {new Date(selectedPlan.createdAt).toLocaleString()}</div>
            </div>

            {/* Render Full Interactive Visualizer Pre-Loaded with Customer's Exact Plan Specifications */}
            <PlanVisualizer
              key={selectedPlan.id}
              initialLength={selectedPlan.plotLength || 30}
              initialWidth={selectedPlan.plotWidth || 40}
              initialFacing={selectedPlan.facingDirection || 'East'}
              initialFloors={selectedPlan.floors || 'Ground Floor'}
              initialDesignIndex={selectedPlan.designOptionIndex || 0}
            />

            <div style={{ textAlign: 'right', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <button
                onClick={() => setSelectedPlan(null)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Close Inspection View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

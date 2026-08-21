import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check, Plus, X, Layers, Sparkles, Building2 } from 'lucide-react';
import { useCensusZone } from './CensusZoneContext.jsx';

export default function CensusZoneSelector({ compact = false, style = {} }) {
  const { selectedZone, selectedZoneObj, zoneList, changeZone, addZone } = useCensusZone();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZoneNo, setNewZoneNo] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneWards, setNewZoneWards] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newZoneNo.trim()) return;
    addZone({
      zoneNo: newZoneNo.trim(),
      name: newZoneName.trim() || `Zone ${newZoneNo.trim().padStart(2, '0')}`,
      wards: newZoneWards.trim()
    });
    setNewZoneNo('');
    setNewZoneName('');
    setNewZoneWards('');
    setShowAddModal(false);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Zone Selector Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '10px',
          padding: compact ? '4px 8px' : '6px 12px',
          color: '#f8fafc',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.2s ease',
          outline: 'none',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#38bdf8';
          e.currentTarget.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
          padding: '4px 6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <MapPin size={compact ? 12 : 14} />
        </div>

        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              fontSize: compact ? '11px' : '12px',
              fontWeight: 900,
              color: '#38bdf8',
              letterSpacing: '0.5px'
            }}>
              Zone {selectedZone}
            </span>
            {selectedZoneObj?.wards && (
              <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px', color: '#94a3b8' }}>
                Wards {selectedZoneObj.wards}
              </span>
            )}
          </div>
          {!compact && (
            <div style={{ fontSize: '10px', color: '#cbd5e1', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedZoneObj?.name?.replace(/Zone \d+\s*/i, '').replace(/[\(\)]/g, '') || 'Active Zone'}
            </div>
          )}
        </div>

        <ChevronDown size={14} color="#94a3b8" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          minWidth: '260px',
          background: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.15)',
          backdropFilter: 'blur(16px)',
          zIndex: 9999,
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px 8px 8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              Select Active Zone
            </span>
            <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>
              {zoneList.length} Zones
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
            {zoneList.map((z) => {
              const isCurrent = z.zoneNo === selectedZone;
              return (
                <button
                  key={z.zoneNo}
                  onClick={() => {
                    changeZone(z.zoneNo);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isCurrent ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    border: isCurrent ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    color: isCurrent ? '#ffffff' : '#cbd5e1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        color: isCurrent ? '#38bdf8' : '#e2e8f0',
                        background: isCurrent ? '#0284c7' : 'rgba(255,255,255,0.08)',
                        padding: '1px 6px',
                        borderRadius: '5px'
                      }}>
                        Zone {z.zoneNo}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: isCurrent ? 700 : 500, color: '#f8fafc' }}>
                        {z.name?.replace(/Zone \d+\s*/i, '').replace(/[\(\)]/g, '') || `Zone ${z.zoneNo}`}
                      </span>
                    </div>
                    {z.wards && (
                      <span style={{ fontSize: '9.5px', color: '#94a3b8', marginLeft: '2px' }}>
                        Wards: {z.wards} · Table: <code style={{ color: '#38bdf8' }}>{z.table || `hlb_records_zone_${z.zoneNo}`}</code>
                      </span>
                    )}
                  </div>

                  {isCurrent && <Check size={14} color="#38bdf8" />}
                </button>
              );
            })}
          </div>

          {/* Add Zone Trigger */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '8px', paddingTop: '6px' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                padding: '7px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px dashed rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                e.currentTarget.style.borderColor = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              }}
            >
              <Plus size={13} />
              + Add New Zone
            </button>
          </div>
        </div>
      )}

      {/* Add New Zone Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '16px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            padding: '20px',
            boxShadow: '0 20px 48px rgba(0,0,0,0.8), 0 0 32px rgba(56, 189, 248, 0.2)',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#0284c7', padding: '6px', borderRadius: '8px' }}>
                  <Building2 size={16} color="#ffffff" />
                </div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>Add New GCC Zone</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '0 0 14px 0', lineHeight: 1.5 }}>
              Register a new administrative zone. A dedicated <code style={{ color: '#38bdf8' }}>hlb_records_zone_XX</code> table will automatically be provisioned.
            </p>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                  Zone Number (e.g. 01, 02, 15) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15"
                  value={newZoneNo}
                  onChange={(e) => setNewZoneNo(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                  Zone Name / Area Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zone 15 (Sholinganallur)"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                  Wards Range (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 192-200"
                  value={newZoneWards}
                  onChange={(e) => setNewZoneWards(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  Create & Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

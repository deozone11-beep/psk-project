import React from 'react';
import { ArrowLeft, AlertCircle, FileText, Sparkles, ExternalLink } from 'lucide-react';

export default function CensusModule3Hub({ onBack, onSelectSubModule, creds }) {
  const isAdmin = !creds || !creds.role || creds.role === 'ADMIN' || creds.role === 'OWNER';

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 99999,
      background: '#0a0d16',
      color: '#f8fafc',
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      overflowY: 'auto'
    }}>
      {/* Back Button to main module selection */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <button 
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            padding: '10px 18px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={16} /> Back to All Modules
        </button>
        
        <span style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 14px', borderRadius: 20 }}>
          Module 3 Hub
        </span>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '10px auto 20px auto' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 900, color: '#ffffff', margin: '0 0 10px 0', fontFamily: 'serif' }}>
          Work Module 3 — Select Sub-Module
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {isAdmin ? 'Select one of the 3 error & abstract report sub-modules below to open its dedicated view.' : 'Open Option 1 Error Base Report view below.'}
        </p>
      </div>

      {/* 3 SUB-MODULE CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* SUB-CARD 1: ERROR BASE REPORT */}
        <div 
          onClick={() => onSelectSubModule('MODULE_3_ERROR_BASE')}
          style={{
            background: 'linear-gradient(145deg, rgba(38, 18, 30, 0.95) 0%, rgba(24, 12, 20, 0.98) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.38)',
            borderRadius: '24px',
            padding: '34px 28px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 14px 40px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '280px'
          }}
          className="censusModuleCard"
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.35) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={30} />
              </div>
              <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '4px 12px', borderRadius: '16px', fontSize: '0.74rem', fontWeight: 800 }}>
                Option 1
              </span>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0' }}>
              Error Base Report
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Filter census records using 6 Default Error cards with dual-language (Tamil &amp; English) search matching.
            </p>
          </div>
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fca5a5', fontSize: '0.88rem', fontWeight: 700 }}>Open Error Base Report →</span>
            <ExternalLink size={16} color="#fca5a5" />
          </div>
        </div>

        {/* SUB-CARD 2: SUPERVISOR BASE REPORT (ADMIN ONLY) */}
        {isAdmin && (
          <div 
            onClick={() => onSelectSubModule('MODULE_3_SUPERVISOR_BASE')}
            style={{
              background: 'linear-gradient(145deg, rgba(20, 26, 42, 0.95) 0%, rgba(13, 19, 34, 0.98) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.38)',
              borderRadius: '24px',
              padding: '34px 28px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 14px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px'
            }}
            className="censusModuleCard"
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.35) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.45)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={30} />
                </div>
                <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '4px 12px', borderRadius: '16px', fontSize: '0.74rem', fontWeight: 800 }}>
                  Option 2
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0' }}>
                Supervisor Base Report
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                View hierarchical error abstract report for 75 Supervisor Circles (3 digits), 450 Enumerators, and 470 Allotted HLBs.
              </p>
            </div>
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#60a5fa', fontSize: '0.88rem', fontWeight: 700 }}>Open Supervisor Report →</span>
              <ExternalLink size={16} color="#60a5fa" />
            </div>
          </div>
        )}

        {/* SUB-CARD 3: 6 ERRORS USER-WISE SUPERVISOR & ENUMERATOR ABSTRACT REPORT (ADMIN ONLY) */}
        {isAdmin && (
          <div 
            onClick={() => onSelectSubModule('MODULE_3_CUSTOM')}
            style={{
              background: 'linear-gradient(145deg, rgba(34, 19, 44, 0.95) 0%, rgba(22, 12, 30, 0.98) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.38)',
              borderRadius: '24px',
              padding: '34px 28px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 14px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px'
            }}
            className="censusModuleCard"
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.35) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.45)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={30} />
                </div>
                <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '4px 12px', borderRadius: '16px', fontSize: '0.74rem', fontWeight: 800 }}>
                  Option 3
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0' }}>
                6 Errors Userwise Abstract Report
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                View 6 Default Error headings with system counts and hierarchical userwise (Supervisor &amp; Enumerator) error matrix.
              </p>
            </div>
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#c084fc', fontSize: '0.88rem', fontWeight: 700 }}>Open 6 Errors Custom Report →</span>
              <ExternalLink size={16} color="#c084fc" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

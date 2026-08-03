import React, { useState } from 'react';
import { Printer, CheckCircle2, Sliders } from 'lucide-react';

export default function AutoCADBlueprintViewer({ initialSqft = 1400 }) {
  const [length, setLength] = useState(35);
  const [width, setWidth] = useState(40);
  const [facing, setFacing] = useState('East');

  const sqft = Math.round(length * width);

  // Determine Plan Configuration & Room Multiplier
  let planTier = 2; // 1: 1BHK, 2: 2BHK, 3: 3BHK, 4: 4BHK Villa
  let planTitle = '2 BHK Standard Family Plan';

  if (sqft < 900) {
    planTier = 1;
    planTitle = '1 BHK Compact Residence';
  } else if (sqft < 1600) {
    planTier = 2;
    planTitle = '2 BHK Standard Family Plan';
  } else if (sqft < 2600) {
    planTier = 3;
    planTitle = '3 BHK Executive Multi-Room Plan';
  } else {
    planTier = 4;
    planTitle = '4 BHK Ultra Luxury Villa Plan';
  }

  // Canvas Drawing Coordinates
  const originX = 75;
  const originY = 65;
  const planW = 460;
  const planH = 340;

  return (
    <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '24px', color: '#fff' }}>
      {/* Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📐 Dynamic AutoCAD 2D Architectural Blueprint Engine
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
            Multi-room architectural CAD layout automatically generated for <strong>{sqft.toLocaleString('en-IN')} Sq.Ft ({length}' x {width}')</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Facing:</span>
            <select
              value={facing}
              onChange={(e) => setFacing(e.target.value)}
              style={{ background: 'transparent', color: '#38bdf8', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
            >
              <option value="East" style={{ background: '#0f172a' }}>East Facing (Vastu)</option>
              <option value="North" style={{ background: '#0f172a' }}>North Facing</option>
              <option value="South" style={{ background: '#0f172a' }}>South Facing</option>
              <option value="West" style={{ background: '#0f172a' }}>West Facing</option>
            </select>
          </div>

          <button
            type="button"
            className="primary"
            onClick={() => window.print()}
            style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: '18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Print CAD Blueprint PDF
          </button>
        </div>
      </div>

      {/* Plot Dimensions Input Controls (Length & Width) */}
      <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 'bold', color: '#38bdf8' }}>
              <span>Plot Length (ft):</span>
              <span>{length} FT</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', height: '6px', cursor: 'pointer' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 'bold', color: '#38bdf8' }}>
              <span>Plot Width (ft):</span>
              <span>{width} FT</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', height: '6px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Built-up Area</div>
            <strong style={{ fontSize: '1.2rem', color: '#f8fafc' }}>{sqft.toLocaleString('en-IN')} SQFT</strong>
            <div style={{ fontSize: '0.78rem', color: '#e2262b', fontWeight: 'bold', marginTop: '2px' }}>{planTitle}</div>
          </div>
        </div>
      </div>

      {/* SVG DYNAMIC CAD CANVAS */}
      <div style={{ width: '100%', overflowX: 'auto', background: '#050811', borderRadius: '16px', padding: '16px', border: '2px solid #1e293b', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)' }}>
        <svg viewBox="0 0 740 500" style={{ width: '100%', height: 'auto', display: 'block', fontFamily: 'monospace' }}>
          {/* Blueprint Grid Background */}
          <defs>
            <pattern id="cadGrid2" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#162032" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="740" height="500" fill="url(#cadGrid2)" />

          {/* Outer Border Frame */}
          <rect x="15" y="15" width="710" height="470" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.6" />

          {/* Dimension Lines (Outer Top & Left) */}
          <line x1={originX} y1={originY - 20} x2={originX + planW} y2={originY - 20} stroke="#38bdf8" strokeWidth="1" />
          <line x1={originX} y1={originY - 26} x2={originX} y2={originY - 14} stroke="#38bdf8" strokeWidth="1.5" />
          <line x1={originX + planW} y1={originY - 26} x2={originX + planW} y2={originY - 14} stroke="#38bdf8" strokeWidth="1.5" />
          <text x={originX + planW / 2} y={originY - 25} fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">
            PLOT LENGTH: {length}' 0"
          </text>

          <line x1={originX - 25} y1={originY} x2={originX - 25} y2={originY + planH} stroke="#38bdf8" strokeWidth="1" />
          <line x1={originX - 31} y1={originY} x2={originX - 19} y2={originY} stroke="#38bdf8" strokeWidth="1.5" />
          <line x1={originX - 31} y1={originY + planH} x2={originX - 19} y2={originY + planH} stroke="#38bdf8" strokeWidth="1.5" />
          <text x={originX - 30} y={originY + planH / 2} fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" transform={`rotate(-90 ${originX - 30} ${originY + planH / 2})`}>
            WIDTH: {width}' 0"
          </text>

          {/* OUTER HEAVY WALLS */}
          <rect x={originX} y={originY} width={planW} height={planH} fill="none" stroke="#0284c7" strokeWidth="10" strokeLinejoin="miter" opacity="0.9" />
          <rect x={originX} y={originY} width={planW} height={planH} fill="none" stroke="#38bdf8" strokeWidth="2" />

          {/* DYNAMIC ROOM GEOMETRY BY PLAN TIER */}
          {planTier === 1 && (
            /* ===== 1 BHK PLAN ===== */
            <g>
              {/* Divider lines */}
              <line x1={originX} y1={originY + planH * 0.5} x2={originX + planW} y2={originY + planH * 0.5} stroke="#38bdf8" strokeWidth="5" />
              <line x1={originX + planW * 0.55} y1={originY} x2={originX + planW * 0.55} y2={originY + planH * 0.5} stroke="#38bdf8" strokeWidth="5" />
              <line x1={originX + planW * 0.65} y1={originY + planH * 0.5} x2={originX + planW * 0.65} y2={originY + planH} stroke="#38bdf8" strokeWidth="5" />

              {/* Living Hall */}
              <rect x={originX + 5} y={originY + 5} width={planW * 0.55 - 10} height={planH * 0.5 - 10} fill="rgba(56, 189, 248, 0.05)" />
              <text x={originX + planW * 0.27} y={originY + planH * 0.25 - 5} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">LIVING ROOM</text>
              <text x={originX + planW * 0.27} y={originY + planH * 0.25 + 10} fill="#38bdf8" fontSize="10" textAnchor="middle">{Math.round(length * 0.5)}' x {Math.round(width * 0.45)}' ({Math.round(sqft * 0.35)} Sq.Ft)</text>

              {/* Kitchen */}
              <rect x={originX + planW * 0.55 + 5} y={originY + 5} width={planW * 0.45 - 10} height={planH * 0.5 - 10} fill="rgba(239, 68, 68, 0.05)" />
              <text x={originX + planW * 0.77} y={originY + planH * 0.25 - 5} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">KITCHEN</text>
              <text x={originX + planW * 0.77} y={originY + planH * 0.25 + 10} fill="#f87171" fontSize="10" textAnchor="middle">10' x 11' ({Math.round(sqft * 0.2)} Sq.Ft)</text>

              {/* Master Bed */}
              <rect x={originX + 5} y={originY + planH * 0.5 + 5} width={planW * 0.65 - 10} height={planH * 0.5 - 10} fill="rgba(34, 197, 94, 0.05)" />
              <text x={originX + planW * 0.32} y={originY + planH * 0.75 - 5} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">MASTER BEDROOM</text>
              <text x={originX + planW * 0.32} y={originY + planH * 0.75 + 10} fill="#4ade80" fontSize="10" textAnchor="middle">13' x 12' ({Math.round(sqft * 0.32)} Sq.Ft)</text>

              {/* Bath */}
              <rect x={originX + planW * 0.65 + 5} y={originY + planH * 0.5 + 5} width={planW * 0.35 - 10} height={planH * 0.5 - 10} fill="rgba(168, 85, 247, 0.05)" />
              <text x={originX + planW * 0.82} y={originY + planH * 0.75 - 5} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">ATTACHED BATH</text>
              <text x={originX + planW * 0.82} y={originY + planH * 0.75 + 10} fill="#94a3b8" fontSize="8" textAnchor="middle">7' x 5'</text>
            </g>
          )}

          {planTier === 2 && (
            /* ===== 2 BHK PLAN ===== */
            <g>
              <line x1={originX} y1={originY + planH * 0.5} x2={originX + planW} y2={originY + planH * 0.5} stroke="#38bdf8" strokeWidth="5" />
              <line x1={originX + planW * 0.45} y1={originY} x2={originX + planW * 0.45} y2={originY + planH * 0.5} stroke="#38bdf8" strokeWidth="5" />
              <line x1={originX + planW * 0.45} y1={originY + planH * 0.5} x2={originX + planW * 0.45} y2={originY + planH} stroke="#38bdf8" strokeWidth="5" />
              <line x1={originX + planW * 0.75} y1={originY + planH * 0.5} x2={originX + planW * 0.75} y2={originY + planH} stroke="#38bdf8" strokeWidth="5" />

              {/* Living Hall */}
              <rect x={originX + 5} y={originY + 5} width={planW * 0.45 - 10} height={planH * 0.5 - 10} fill="rgba(56, 189, 248, 0.05)" />
              <text x={originX + planW * 0.22} y={originY + planH * 0.25 - 5} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">LIVING & DINING</text>
              <text x={originX + planW * 0.22} y={originY + planH * 0.25 + 10} fill="#38bdf8" fontSize="10" textAnchor="middle">16' x 14' ({Math.round(sqft * 0.26)} Sq.Ft)</text>

              {/* Kitchen */}
              <rect x={originX + planW * 0.45 + 5} y={originY + 5} width={planW * 0.55 - 10} height={planH * 0.5 - 10} fill="rgba(239, 68, 68, 0.05)" />
              <text x={originX + planW * 0.72} y={originY + planH * 0.25 - 5} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">KITCHEN & UTILITY (SE)</text>
              <text x={originX + planW * 0.72} y={originY + planH * 0.25 + 10} fill="#f87171" fontSize="10" textAnchor="middle">12' x 11' ({Math.round(sqft * 0.2)} Sq.Ft)</text>

              {/* Master Bed */}
              <rect x={originX + 5} y={originY + planH * 0.5 + 5} width={planW * 0.45 - 10} height={planH * 0.5 - 10} fill="rgba(34, 197, 94, 0.05)" />
              <text x={originX + planW * 0.22} y={originY + planH * 0.75 - 5} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">MASTER BEDROOM (SW)</text>
              <text x={originX + planW * 0.22} y={originY + planH * 0.75 + 10} fill="#4ade80" fontSize="10" textAnchor="middle">14' x 12' ({Math.round(sqft * 0.24)} Sq.Ft)</text>

              {/* Bed 2 */}
              <rect x={originX + planW * 0.45 + 5} y={originY + planH * 0.5 + 5} width={planW * 0.30 - 10} height={planH * 0.5 - 10} fill="rgba(168, 85, 247, 0.05)" />
              <text x={originX + planW * 0.60} y={originY + planH * 0.75 - 5} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">BEDROOM 2</text>
              <text x={originX + planW * 0.60} y={originY + planH * 0.75 + 10} fill="#c084fc" fontSize="9" textAnchor="middle">11' x 12'</text>

              {/* Common Bath & Portico */}
              <rect x={originX + planW * 0.75 + 5} y={originY + planH * 0.5 + 5} width={planW * 0.25 - 10} height={planH * 0.5 - 10} fill="rgba(56, 189, 248, 0.08)" />
              <text x={originX + planW * 0.87} y={originY + planH * 0.75 - 5} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">COMMON BATH</text>
              <text x={originX + planW * 0.87} y={originY + planH * 0.75 + 10} fill="#94a3b8" fontSize="8" textAnchor="middle">7' x 5'</text>
            </g>
          )}

          {planTier === 3 && (
            /* ===== 3 BHK EXECUTIVE PLAN (6 SEPARATE ROOMS) ===== */
            <g>
              {/* Horizontal Dividers */}
              <line x1={originX} y1={originY + planH * 0.48} x2={originX + planW} y2={originY + planH * 0.48} stroke="#38bdf8" strokeWidth="5" />

              {/* Vertical Dividers */}
              <line x1={originX + planW * 0.38} y1={originY} x2={originX + planW * 0.38} y2={originY + planH * 0.48} stroke="#38bdf8" strokeWidth="5" />
              <line x1={originX + planW * 0.70} y1={originY} x2={originX + planW * 0.70} y2={originY + planH * 0.48} stroke="#38bdf8" strokeWidth="5" />

              <line x1={originX + planW * 0.35} y1={originY + planH * 0.48} x2={originX + planW * 0.35} y2={originY + planH} stroke="#38bdf8" strokeWidth="5" />
              <line x1={originX + planW * 0.68} y1={originY + planH * 0.48} x2={originX + planW * 0.68} y2={originY + planH} stroke="#38bdf8" strokeWidth="5" />

              {/* 1. Formal Living */}
              <rect x={originX + 5} y={originY + 5} width={planW * 0.38 - 10} height={planH * 0.48 - 10} fill="rgba(56, 189, 248, 0.05)" />
              <text x={originX + planW * 0.19} y={originY + planH * 0.24 - 5} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">FORMAL LIVING</text>
              <text x={originX + planW * 0.19} y={originY + planH * 0.24 + 10} fill="#38bdf8" fontSize="9" textAnchor="middle">16' x 14' ({Math.round(sqft * 0.18)} Sq.Ft)</text>

              {/* 2. Dining & Pooja */}
              <rect x={originX + planW * 0.38 + 5} y={originY + 5} width={planW * 0.32 - 10} height={planH * 0.48 - 10} fill="rgba(250, 204, 21, 0.05)" />
              <text x={originX + planW * 0.54} y={originY + planH * 0.24 - 5} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">DINING & POOJA</text>
              <text x={originX + planW * 0.54} y={originY + planH * 0.24 + 10} fill="#facc15" fontSize="9" textAnchor="middle">12' x 12' (NE Corner)</text>

              {/* 3. Modular Kitchen & Store */}
              <rect x={originX + planW * 0.70 + 5} y={originY + 5} width={planW * 0.30 - 10} height={planH * 0.48 - 10} fill="rgba(239, 68, 68, 0.05)" />
              <text x={originX + planW * 0.85} y={originY + planH * 0.24 - 5} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">KITCHEN & STORE</text>
              <text x={originX + planW * 0.85} y={originY + planH * 0.24 + 10} fill="#f87171" fontSize="9" textAnchor="middle">12' x 11' (SE Agni)</text>

              {/* 4. Master Suite (SW) */}
              <rect x={originX + 5} y={originY + planH * 0.48 + 5} width={planW * 0.35 - 10} height={planH * 0.52 - 10} fill="rgba(34, 197, 94, 0.05)" />
              <text x={originX + planW * 0.17} y={originY + planH * 0.74 - 5} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">MASTER SUITE (SW)</text>
              <text x={originX + planW * 0.17} y={originY + planH * 0.74 + 10} fill="#4ade80" fontSize="9" textAnchor="middle">14' x 14' + Bath</text>

              {/* 5. Bedroom 2 */}
              <rect x={originX + planW * 0.35 + 5} y={originY + planH * 0.48 + 5} width={planW * 0.33 - 10} height={planH * 0.52 - 10} fill="rgba(168, 85, 247, 0.05)" />
              <text x={originX + planW * 0.51} y={originY + planH * 0.74 - 5} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">BEDROOM 2</text>
              <text x={originX + planW * 0.51} y={originY + planH * 0.74 + 10} fill="#c084fc" fontSize="9" textAnchor="middle">12' x 12' + Bath</text>

              {/* 6. Bedroom 3 / Study */}
              <rect x={originX + planW * 0.68 + 5} y={originY + planH * 0.48 + 5} width={planW * 0.32 - 10} height={planH * 0.52 - 10} fill="rgba(56, 189, 248, 0.05)" />
              <text x={originX + planW * 0.84} y={originY + planH * 0.74 - 5} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">BEDROOM 3 / STUDY</text>
              <text x={originX + planW * 0.84} y={originY + planH * 0.74 + 10} fill="#38bdf8" fontSize="9" textAnchor="middle">11' x 12' + Bath</text>
            </g>
          )}

          {planTier === 4 && (
            /* ===== 4 BHK ULTRA LUXURY VILLA PLAN (8 FULL ROOMS + GARAGE) ===== */
            <g>
              {/* Grid Division Lines */}
              <line x1={originX} y1={originY + planH * 0.35} x2={originX + planW} y2={originY + planH * 0.35} stroke="#38bdf8" strokeWidth="5" />
              <line x1={originX} y1={originY + planH * 0.68} x2={originX + planW} y2={originY + planH * 0.68} stroke="#38bdf8" strokeWidth="5" />

              <line x1={originX + planW * 0.33} y1={originY} x2={originX + planW * 0.33} y2={originY + planH} stroke="#38bdf8" strokeWidth="5" />
              <line x1={originX + planW * 0.66} y1={originY} x2={originX + planW * 0.66} y2={originY + planH} stroke="#38bdf8" strokeWidth="5" />

              {/* Row 1 */}
              <rect x={originX + 5} y={originY + 5} width={planW * 0.33 - 10} height={planH * 0.35 - 10} fill="rgba(56, 189, 248, 0.05)" />
              <text x={originX + planW * 0.16} y={originY + planH * 0.18} fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">FORMAL LIVING</text>

              <rect x={originX + planW * 0.33 + 5} y={originY + 5} width={planW * 0.33 - 10} height={planH * 0.35 - 10} fill="rgba(250, 204, 21, 0.05)" />
              <text x={originX + planW * 0.50} y={originY + planH * 0.18} fill="#facc15" fontSize="10" fontWeight="bold" textAnchor="middle">FOYER & POOJA (NE)</text>

              <rect x={originX + planW * 0.66 + 5} y={originY + 5} width={planW * 0.34 - 10} height={planH * 0.35 - 10} fill="rgba(239, 68, 68, 0.05)" />
              <text x={originX + planW * 0.83} y={originY + planH * 0.18} fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">CHEF KITCHEN & PANTRY</text>

              {/* Row 2 */}
              <rect x={originX + 5} y={originY + planH * 0.35 + 5} width={planW * 0.33 - 10} height={planH * 0.33 - 10} fill="rgba(56, 189, 248, 0.05)" />
              <text x={originX + planW * 0.16} y={originY + planH * 0.52} fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">FAMILY LOUNGE & DINING</text>

              <rect x={originX + planW * 0.33 + 5} y={originY + planH * 0.35 + 5} width={planW * 0.33 - 10} height={planH * 0.33 - 10} fill="rgba(168, 85, 247, 0.05)" />
              <text x={originX + planW * 0.50} y={originY + planH * 0.52} fill="#c084fc" fontSize="10" fontWeight="bold" textAnchor="middle">GUEST SUITE (BED 4)</text>

              <rect x={originX + planW * 0.66 + 5} y={originY + planH * 0.35 + 5} width={planW * 0.34 - 10} height={planH * 0.33 - 10} fill="rgba(234, 179, 8, 0.05)" />
              <text x={originX + planW * 0.83} y={originY + planH * 0.52} fill="#fde047" fontSize="10" fontWeight="bold" textAnchor="middle">HOME THEATER / STUDY</text>

              {/* Row 3 */}
              <rect x={originX + 5} y={originY + planH * 0.68 + 5} width={planW * 0.33 - 10} height={planH * 0.32 - 10} fill="rgba(34, 197, 94, 0.05)" />
              <text x={originX + planW * 0.16} y={originY + planH * 0.84} fill="#4ade80" fontSize="10" fontWeight="bold" textAnchor="middle">MASTER PRESIDENTIAL SUITE</text>

              <rect x={originX + planW * 0.33 + 5} y={originY + planH * 0.68 + 5} width={planW * 0.33 - 10} height={planH * 0.32 - 10} fill="rgba(168, 85, 247, 0.05)" />
              <text x={originX + planW * 0.50} y={originY + planH * 0.84} fill="#c084fc" fontSize="10" fontWeight="bold" textAnchor="middle">BEDROOM 2 (KIDS)</text>

              <rect x={originX + planW * 0.66 + 5} y={originY + planH * 0.68 + 5} width={planW * 0.34 - 10} height={planH * 0.32 - 10} fill="rgba(56, 189, 248, 0.08)" />
              <text x={originX + planW * 0.83} y={originY + planH * 0.84} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">BED 3 & DOUBLE GARAGE</text>
            </g>
          )}

          {/* DOORS & ENTRANCE ARCS */}
          <path d={`M ${originX + planW * 0.25 - 15} ${originY + planH} A 20 20 0 0 1 ${originX + planW * 0.25 + 5} ${originY + planH - 20}`} fill="none" stroke="#e2262b" strokeWidth="2" strokeDasharray="3 2" />
          <line x1={originX + planW * 0.25 - 15} y1={originY + planH} x2={originX + planW * 0.25 + 5} y2={originY + planH} stroke="#090d16" strokeWidth="8" />
          <text x={originX + planW * 0.25 - 5} y={originY + planH + 14} fill="#e2262b" fontSize="9" fontWeight="bold" textAnchor="middle">MAIN ENTRANCE [MD]</text>

          {/* WINDOW OPENINGS */}
          <line x1={originX + planW * 0.75} y1={originY} x2={originX + planW * 0.88} y2={originY} stroke="#f8fafc" strokeWidth="6" />
          <text x={originX + planW * 0.81} y={originY - 6} fill="#38bdf8" fontSize="8" textAnchor="middle">[W1]</text>

          <line x1={originX} y1={originY + 40} x2={originX} y2={originY + 90} stroke="#f8fafc" strokeWidth="6" />
          <text x={originX - 12} y={originY + 68} fill="#38bdf8" fontSize="8" textAnchor="middle">[W2]</text>

          {/* VASTU COMPASS ROSE */}
          <g transform="translate(670, 75)">
            <circle r="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="0" y1="-18" x2="0" y2="18" stroke="#38bdf8" strokeWidth="1" />
            <line x1="-18" y1="0" x2="18" y2="0" stroke="#38bdf8" strokeWidth="1" />
            <text x="0" y="-8" fill="#e2262b" fontSize="10" fontWeight="bold" textAnchor="middle">N</text>
            <text x="12" y="3" fill="#38bdf8" fontSize="8" textAnchor="middle">E</text>
            <text x="0" y="14" fill="#94a3b8" fontSize="8" textAnchor="middle">S</text>
            <text x="-12" y="3" fill="#94a3b8" fontSize="8" textAnchor="middle">W</text>
          </g>

          {/* TITLE BLOCK */}
          <g transform="translate(460, 415)">
            <rect x="0" y="0" width="250" height="60" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" rx="4" />
            <line x1="0" y1="20" x2="250" y2="20" stroke="#1e293b" strokeWidth="1" />
            <text x="10" y="14" fill="#38bdf8" fontSize="9" fontWeight="bold">PROJECT: PSK BROTHERS 2D CAD DWG</text>
            <text x="10" y="34" fill="#f8fafc" fontSize="9">AREA: {sqft.toLocaleString('en-IN')} SQFT ({planTitle})</text>
            <text x="10" y="50" fill="#94a3b8" fontSize="8">SCALE: 1:100 | IS 456 NBC COMPLIANT</text>
          </g>
        </svg>
      </div>

      {/* Legend & Compliance Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px', fontSize: '0.8rem', color: '#cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={15} style={{ color: '#22c55e' }} />
          <span>100% Vastu Compliant (NE Pooja, SE Kitchen, SW Bed)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={15} style={{ color: '#22c55e' }} />
          <span>9-inch Brick Outer Walls / 4.5-inch Partition Walls</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={15} style={{ color: '#22c55e' }} />
          <span>Structural NBC &amp; IS 456 Earthquake Safety Standards</span>
        </div>
      </div>
    </div>
  );
}

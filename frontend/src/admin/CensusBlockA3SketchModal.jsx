import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, Download, X, Layers, Compass, ZoomIn, ZoomOut, 
  RotateCcw, Eye, FileText, CheckCircle2, Building, MapPin, 
  Sparkles, PenTool, Hash
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CensusBlockA3SketchModal({ block, onClose }) {
  const [sketchStyle, setSketchStyle] = useState('PENCIL'); // 'PENCIL' | 'BLUEPRINT' | 'CADASTRAL' | 'SATELLITE'
  const [showDoorNumbers, setShowDoorNumbers] = useState(true);
  const [showStreetNames, setShowStreetNames] = useState(true);
  const [showHatching, setShowHatching] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const [enumeratorName, setEnumeratorName] = useState('R. Sundaram (Enumerator #0482)');
  const [supervisorName, setSupervisorName] = useState('K. Murugan (Supervisor #0112)');
  const [notes, setNotes] = useState('All buildings numbered sequentially following clockwise route from North-West corner.');
  
  const [loading, setLoading] = useState(true);
  const [blockPoly, setBlockPoly] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [streetLabels, setStreetLabels] = useState([]);
  const [stats, setStats] = useState({ total: 0, residential: 0, commercial: 0, other: 0, areaSqft: 0 });

  const a3PrintRef = useRef(null);

  const rawWard = block.wardNo || block.code_ward || block.ward_no || '144';
  const cleanWard = String(parseInt(rawWard, 10) || 1).padStart(3, '0');
  const blockNo = block.blockNo || block.code_block || block.hlb_id || '0144';
  const zoneNo = block.zoneNo || block.code_st || block.zone_number || '11';
  const centerLat = parseFloat(block.lat || block.centerLat || 13.0645);
  const centerLng = parseFloat(block.lng || block.centerLng || 80.1760);

  // Load building polygons & block boundary
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadData() {
      try {
        // 1. Fetch Ward Buildings
        const bRes = await fetch(`/gcc_buildings/ward_${cleanWard}.json`);
        let allWardBuildings = [];
        if (bRes.ok) {
          const bData = await bRes.json();
          allWardBuildings = bData.features || [];
        }

        // 2. Fetch HLB Block Polygon from hlb_polys.json
        const pRes = await fetch('/hlb_polys.json');
        let matchedPoly = null;
        if (pRes.ok) {
          const pData = await pRes.json();
          const found = (pData.features || []).find(f => {
            const p = f.properties || {};
            const bId = String(p.hlb_id || p.code_block || '');
            const wId = String(p.ward_no || p.code_ward || '');
            return (bId === String(blockNo) || bId.includes(String(blockNo))) && 
                   (wId === String(cleanWard) || wId === String(rawWard) || !wId);
          });
          if (found) {
            matchedPoly = found.geometry;
          }
        }

        if (!isMounted) return;

        // Calculate bounding box around center or block polygon
        let minLat = centerLat - 0.0022;
        let maxLat = centerLat + 0.0022;
        let minLng = centerLng - 0.0030;
        let maxLng = centerLng + 0.0030;

        if (matchedPoly && matchedPoly.coordinates) {
          let pts = [];
          function extractPts(arr) {
            if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number') {
              pts.push(arr);
            } else if (Array.isArray(arr)) {
              arr.forEach(extractPts);
            }
          }
          extractPts(matchedPoly.coordinates);
          if (pts.length > 0) {
            minLng = Math.min(...pts.map(p => p[0])) - 0.0004;
            maxLng = Math.max(...pts.map(p => p[0])) + 0.0004;
            minLat = Math.min(...pts.map(p => p[1])) - 0.0003;
            maxLat = Math.max(...pts.map(p => p[1])) + 0.0003;
          }
          setBlockPoly(matchedPoly);
        }

        // Filter buildings within block bounding box
        const filtered = allWardBuildings.filter(f => {
          if (!f.geometry || !f.geometry.coordinates) return false;
          let firstPt = null;
          function findFirst(arr) {
            if (firstPt) return;
            if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number') {
              firstPt = arr;
            } else if (Array.isArray(arr)) {
              arr.forEach(findFirst);
            }
          }
          findFirst(f.geometry.coordinates);
          if (!firstPt) return false;
          const [lng, lat] = firstPt;
          return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
        });

        // Compute stats and extract unique street names
        let resCount = 0, commCount = 0, othCount = 0, totalArea = 0;
        const streetMap = new Map();

        filtered.forEach(b => {
          const p = b.properties || {};
          const usage = String(p.building_used_as || '').toLowerCase();
          if (usage.includes('residen')) resCount++;
          else if (usage.includes('commerc') || usage.includes('shop')) commCount++;
          else othCount++;

          totalArea += (p.drone_area_in_sqft || 0);

          const rName = p.road_name ? p.road_name.trim() : '';
          if (rName && rName.length > 3 && !rName.toLowerCase().includes('null')) {
            let bCenter = getFeatureCenter(b.geometry);
            if (bCenter && !streetMap.has(rName)) {
              streetMap.set(rName, bCenter);
            }
          }
        });

        setBuildings(filtered);
        setStreetLabels(Array.from(streetMap.entries()).map(([name, pt]) => ({ name, ...pt })));
        setStats({
          total: filtered.length,
          residential: resCount,
          commercial: commCount,
          other: othCount,
          areaSqft: Math.round(totalArea)
        });
        setLoading(false);
      } catch (err) {
        console.error('Error loading sketch block data:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [cleanWard, blockNo, centerLat, centerLng]);

  function getFeatureCenter(geom) {
    if (!geom || !geom.coordinates) return null;
    let sumX = 0, sumY = 0, count = 0;
    function collect(arr) {
      if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number') {
        sumX += arr[0];
        sumY += arr[1];
        count++;
      } else if (Array.isArray(arr)) {
        arr.forEach(collect);
      }
    }
    collect(geom.coordinates);
    return count > 0 ? { lng: sumX / count, lat: sumY / count } : null;
  }

  // Calculate SVG ViewBox Bounds
  let minLng = centerLng - 0.0025, maxLng = centerLng + 0.0025;
  let minLat = centerLat - 0.0018, maxLat = centerLat + 0.0018;

  if (buildings.length > 0) {
    const allLngs = [], allLats = [];
    buildings.forEach(b => {
      function collect(arr) {
        if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number') {
          allLngs.push(arr[0]);
          allLats.push(arr[1]);
        } else if (Array.isArray(arr)) {
          arr.forEach(collect);
        }
      }
      collect(b.geometry.coordinates);
    });
    if (allLngs.length > 0) {
      const padLng = (Math.max(...allLngs) - Math.min(...allLngs)) * 0.12 || 0.0005;
      const padLat = (Math.max(...allLats) - Math.min(...allLats)) * 0.12 || 0.0004;
      minLng = Math.min(...allLngs) - padLng;
      maxLng = Math.max(...allLngs) + padLng;
      minLat = Math.min(...allLats) - padLat;
      maxLat = Math.max(...allLats) + padLat;
    }
  }

  const svgW = 1200;
  const svgH = 750;

  function projectToSvg(lng, lat) {
    const x = ((lng - minLng) / (maxLng - minLng)) * svgW;
    const y = svgH - ((lat - minLat) / (maxLat - minLat)) * svgH; // Invert Y
    return [x, y];
  }

  function renderPolygonPath(coordinates, type) {
    let d = '';
    const rings = type === 'MultiPolygon' ? coordinates : [coordinates];
    rings.forEach(poly => {
      poly.forEach(ring => {
        if (ring.length < 3) return;
        const [x0, y0] = projectToSvg(ring[0][0], ring[0][1]);
        d += ` M ${x0.toFixed(1)} ${y0.toFixed(1)}`;
        for (let i = 1; i < ring.length; i++) {
          const [xi, yi] = projectToSvg(ring[i][0], ring[i][1]);
          d += ` L ${xi.toFixed(1)} ${yi.toFixed(1)}`;
        }
        d += ' Z';
      });
    });
    return d;
  }

  // Styles configuration
  const theme = {
    PENCIL: {
      bg: '#faf8f5',
      paperGrid: 'rgba(30, 41, 59, 0.05)',
      stroke: '#1e293b',
      strokeWidth: 2,
      fill: 'url(#pencilHatch)',
      commFill: 'url(#commHatch)',
      boundaryStroke: '#0f172a',
      text: '#0f172a',
      subText: '#475569',
      roadText: '#1e293b',
      badgeBg: '#ffffff',
      badgeBorder: '#1e293b',
      headerBg: '#ffffff'
    },
    BLUEPRINT: {
      bg: '#0c2340',
      paperGrid: 'rgba(56, 189, 248, 0.12)',
      stroke: '#e0f2fe',
      strokeWidth: 2,
      fill: 'rgba(56, 189, 248, 0.25)',
      commFill: 'rgba(251, 191, 36, 0.35)',
      boundaryStroke: '#38bdf8',
      text: '#f0f9ff',
      subText: '#bae6fd',
      roadText: '#ffffff',
      badgeBg: '#082f49',
      badgeBorder: '#38bdf8',
      headerBg: '#0f172a'
    },
    CADASTRAL: {
      bg: '#f8fafc',
      paperGrid: 'rgba(100, 116, 139, 0.06)',
      stroke: '#2563eb',
      strokeWidth: 1.8,
      fill: 'rgba(96, 165, 250, 0.35)',
      commFill: 'rgba(251, 191, 36, 0.45)',
      boundaryStroke: '#dc2626',
      text: '#0f172a',
      subText: '#334155',
      roadText: '#1e40af',
      badgeBg: '#ffffff',
      badgeBorder: '#2563eb',
      headerBg: '#f1f5f9'
    }
  }[sketchStyle] || theme.PENCIL;

  // Print function
  function handlePrintA3() {
    window.print();
  }

  // Export PDF function
  async function handleDownloadPdf() {
    if (!a3PrintRef.current) return;
    try {
      const canvas = await html2canvas(a3PrintRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, 420, 297);
      pdf.save(`Census_2027_HLB_Block_${cleanWard}_${blockNo}_A3_Layout.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  }

  // Export PNG
  async function handleDownloadPng() {
    if (!a3PrintRef.current) return;
    try {
      const canvas = await html2canvas(a3PrintRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `Census_2027_HLB_Block_${cleanWard}_${blockNo}_Layout.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG export error:', err);
    }
  }

  return (
    <div className="a3SketchModalOverlay">
      {/* Top Floating Control Bar */}
      <div className="a3SketchControlBar no-print">
        <div className="a3ControlLeft">
          <div className="a3TitleBadge">
            <PenTool size={18} color="#2563eb" />
            <span className="a3MainTitle">A3 Hand-Drawn Pencil Layout Map</span>
            <span className="a3SubBadge">Ward {cleanWard} | Block #{blockNo}</span>
          </div>

          {/* Style Selector */}
          <div className="a3StyleGroup">
            {[
              { key: 'PENCIL', label: '✏️ Pencil Sketch' },
              { key: 'BLUEPRINT', label: '📐 Blueprint' },
              { key: 'CADASTRAL', label: '🎨 Cadastral GIS' }
            ].map(s => (
              <button
                key={s.key}
                className={`a3StyleBtn ${sketchStyle === s.key ? 'active' : ''}`}
                onClick={() => setSketchStyle(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Layer Toggles */}
          <div className="a3ToggleGroup">
            <button 
              className={`a3ToggleBtn ${showDoorNumbers ? 'active' : ''}`}
              onClick={() => setShowDoorNumbers(!showDoorNumbers)}
              title="Toggle Door Numbers inside buildings"
            >
              <Hash size={14} /> Door Numbers
            </button>
            <button 
              className={`a3ToggleBtn ${showStreetNames ? 'active' : ''}`}
              onClick={() => setShowStreetNames(!showStreetNames)}
              title="Toggle Road & Street Names"
            >
              <MapPin size={14} /> Street Names
            </button>
            <button 
              className={`a3ToggleBtn ${showHatching ? 'active' : ''}`}
              onClick={() => setShowHatching(!showHatching)}
              title="Toggle Hand-drawn cross-hatch shading"
            >
              <Layers size={14} /> Hatching
            </button>
          </div>
        </div>

        <div className="a3ControlRight">
          <div className="a3ZoomGroup">
            <button onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.1))} title="Zoom Out"><ZoomOut size={16} /></button>
            <span className="a3ZoomLabel">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel(Math.min(1.6, zoomLevel + 0.1))} title="Zoom In"><ZoomIn size={16} /></button>
            <button onClick={() => setZoomLevel(1)} title="Reset Zoom"><RotateCcw size={15} /></button>
          </div>

          <button className="a3ExportBtn a3PrintBtn" onClick={handlePrintA3}>
            <Printer size={16} /> <b>Print A3 Sheet</b>
          </button>
          <button className="a3ExportBtn a3PdfBtn" onClick={handleDownloadPdf}>
            <Download size={16} /> <b>PDF (A3)</b>
          </button>
          <button className="a3ExportBtn a3PngBtn" onClick={handleDownloadPng}>
            <FileText size={16} /> PNG
          </button>
          <button className="a3CloseBtn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main A3 Drawing Canvas Viewport */}
      <div className="a3CanvasScrollContainer">
        <div 
          ref={a3PrintRef}
          className={`a3SheetContainer a3Theme_${sketchStyle}`}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
        >
          {/* Outer Drafting Border */}
          <div className="a3DraftBorder">
            
            {/* Top Census Header Box */}
            <header className="a3CensusHeader">
              <div className="a3HeaderLeft">
                <img src="/logo-icon.png" alt="Census Seal" className="a3Emblem" />
                <div className="a3HeaderText">
                  <h1 className="a3CensusMainTitle">CENSUS OF INDIA 2027</h1>
                  <h2 className="a3CensusSubTitle">HOUSE LISTING & HOUSING CENSUS — NOTIONAL / LAYOUT MAP</h2>
                  <p className="a3CensusGovt">OFFICE OF THE REGISTRAR GENERAL & CENSUS COMMISSIONER, INDIA</p>
                </div>
              </div>

              <div className="a3HeaderRightMeta">
                <table className="a3MetaTable">
                  <tbody>
                    <tr>
                      <td className="metaLabel">STATE:</td>
                      <td className="metaVal">TAMIL NADU (34)</td>
                      <td className="metaLabel">DISTRICT:</td>
                      <td className="metaVal">CHENNAI (02)</td>
                    </tr>
                    <tr>
                      <td className="metaLabel">ZONE / SUB-DIST:</td>
                      <td className="metaVal">ZONE {zoneNo}</td>
                      <td className="metaLabel">WARD NO:</td>
                      <td className="metaVal">WARD {cleanWard}</td>
                    </tr>
                    <tr>
                      <td className="metaLabel">HLB BLOCK NO:</td>
                      <td className="metaVal highlight">BLOCK #{blockNo}</td>
                      <td className="metaLabel">SCALE:</td>
                      <td className="metaVal">1 : 1500 (A3)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </header>

            {/* Main Layout Drawing Frame with SVG Vector Drafting Engine */}
            <div className="a3DrawingFrame">
              {loading ? (
                <div className="a3LoadingState">
                  <Sparkles size={32} className="spinning" />
                  <p>Rendering Hand-Drawn Vector Layout for Block #{blockNo}...</p>
                  <span>Loading {cleanWard} building footprints & street network...</span>
                </div>
              ) : (
                <div className="a3SvgWrapper" style={{ background: theme.bg }}>
                  <svg 
                    viewBox={`0 0 ${svgW} ${svgH}`} 
                    className="a3VectorSvg"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      {/* Paper Grid Pattern */}
                      <pattern id="draftsmanGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke={theme.paperGrid} strokeWidth="0.8" />
                      </pattern>

                      {/* Pencil Cross-Hatch Shading Pattern */}
                      <pattern id="pencilHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="8" stroke={theme.stroke} strokeWidth="0.9" strokeOpacity="0.45" />
                      </pattern>

                      {/* Commercial Cross-Hatch (Double diagonal) */}
                      <pattern id="commHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.6" />
                        <line x1="0" y1="0" x2="6" y2="0" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.6" />
                      </pattern>

                      {/* Pencil Charcoal Texture Filter */}
                      <filter id="pencilStrokeFilter" x="-10%" y="-10%" width="120%" height="120%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
                      </filter>
                    </defs>

                    {/* 1. Drafting Paper Grid */}
                    <rect width={svgW} height={svgH} fill="url(#draftsmanGrid)" />

                    {/* 2. Block Outer Boundary (Thick dashed draftsman border) */}
                    {blockPoly && (
                      <path 
                        d={renderPolygonPath(blockPoly.coordinates, blockPoly.type)}
                        fill="none"
                        stroke={theme.boundaryStroke}
                        strokeWidth="3.5"
                        strokeDasharray="8,4"
                        strokeLinejoin="round"
                        filter="url(#pencilStrokeFilter)"
                      />
                    )}

                    {/* 3. Building Footprint Polygons (Hand-drawn charcoal lines + hatching) */}
                    {buildings.map((b, idx) => {
                      const p = b.properties || {};
                      const pathD = renderPolygonPath(b.geometry.coordinates, b.geometry.type);
                      const isComm = String(p.building_used_as || '').toLowerCase().includes('commerc') || String(p.building_used_as || '').toLowerCase().includes('shop');
                      const doorNo = p.door_new_no || p.door_old_no || String(idx + 1);
                      const center = getFeatureCenter(b.geometry);
                      const [cx, cy] = center ? projectToSvg(center.lng, center.lat) : [0, 0];

                      return (
                        <g key={b.id || idx} className="a3BuildingGroup">
                          {/* Building Polygon Outline & Hatching */}
                          <path 
                            d={pathD}
                            fill={showHatching ? (isComm ? theme.commFill : theme.fill) : 'none'}
                            stroke={theme.stroke}
                            strokeWidth={theme.strokeWidth}
                            strokeLinejoin="round"
                            filter="url(#pencilStrokeFilter)"
                          />

                          {/* Sequential / Door Number Label */}
                          {showDoorNumbers && center && (
                            <text
                              x={cx}
                              y={cy + 3}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="a3DoorNumberText"
                              fill={theme.text}
                              fontSize={buildings.length > 80 ? "8" : "10"}
                              fontWeight="800"
                              fontFamily="'Courier New', Courier, monospace"
                            >
                              {doorNo}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* 4. Street / Road Names (Rendered along road corridors) */}
                    {showStreetNames && streetLabels.map((st, idx) => {
                      const [sx, sy] = projectToSvg(st.lng, st.lat);
                      return (
                        <g key={idx} transform={`translate(${sx}, ${sy})`}>
                          <rect
                            x="-60"
                            y="-10"
                            width="120"
                            height="20"
                            rx="3"
                            fill={theme.badgeBg}
                            stroke={theme.badgeBorder}
                            strokeWidth="1"
                            opacity="0.85"
                          />
                          <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fill={theme.roadText}
                            fontSize="9"
                            fontWeight="900"
                            letterSpacing="0.8px"
                            fontFamily="'Segoe UI', Roboto, sans-serif"
                          >
                            🛣️ {st.name.toUpperCase()}
                          </text>
                        </g>
                      );
                    })}

                    {/* 5. Topological North Indicator (Compass Rose) */}
                    <g transform={`translate(${svgW - 70}, 70)`} className="a3CompassRose">
                      <circle r="26" fill={theme.badgeBg} stroke={theme.stroke} strokeWidth="1.5" />
                      <polygon points="0,-22 5,-4 0,0 -5,-4" fill="#ef4444" />
                      <polygon points="0,22 5,4 0,0 -5,4" fill={theme.stroke} />
                      <polygon points="22,0 4,5 0,0 4,-5" fill={theme.stroke} />
                      <polygon points="-22,0 -4,5 0,0 -4,-5" fill={theme.stroke} />
                      <text x="0" y="-26" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="900">N</text>
                    </g>

                    {/* 6. Hand-Drawn Scale Bar */}
                    <g transform="translate(40, 710)" className="a3ScaleBar">
                      <rect width="180" height="24" rx="4" fill={theme.badgeBg} stroke={theme.stroke} strokeWidth="1" opacity="0.9" />
                      <line x1="15" y1="12" x2="165" y2="12" stroke={theme.stroke} strokeWidth="2" />
                      <line x1="15" y1="6" x2="15" y2="18" stroke={theme.stroke} strokeWidth="2" />
                      <line x1="90" y1="8" x2="90" y2="16" stroke={theme.stroke} strokeWidth="1.5" />
                      <line x1="165" y1="6" x2="165" y2="18" stroke={theme.stroke} strokeWidth="2" />
                      <text x="15" y="22" fontSize="8" fontWeight="700" fill={theme.text}>0m</text>
                      <text x="90" y="22" fontSize="8" fontWeight="700" fill={theme.text}>50m</text>
                      <text x="165" y="22" fontSize="8" fontWeight="700" fill={theme.text}>100m</text>
                    </g>
                  </svg>
                </div>
              )}
            </div>

            {/* Bottom Metadata, Drafting Legend & Signatures Frame */}
            <footer className="a3CensusFooter">
              {/* Left: Summary Statistics */}
              <div className="a3FooterStats">
                <h4 className="footerBoxTitle">📊 BLOCK INVENTORY SUMMARY</h4>
                <div className="statsGrid">
                  <div className="statItem">
                    <span className="statLabel">Total Buildings:</span>
                    <b className="statVal">{stats.total}</b>
                  </div>
                  <div className="statItem">
                    <span className="statLabel">Residential Units:</span>
                    <b className="statVal">{stats.residential}</b>
                  </div>
                  <div className="statItem">
                    <span className="statLabel">Commercial / Shops:</span>
                    <b className="statVal">{stats.commercial}</b>
                  </div>
                  <div className="statItem">
                    <span className="statLabel">Total Roof Footprint:</span>
                    <b className="statVal">{stats.areaSqft.toLocaleString()} sq.ft</b>
                  </div>
                </div>
              </div>

              {/* Middle: Official Drafting Legend */}
              <div className="a3FooterLegend">
                <h4 className="footerBoxTitle">📝 DRAFTING SYMBOLS & LEGEND</h4>
                <div className="legendItemsGrid">
                  <div className="legendItem">
                    <span className="legendBox puccaBox" />
                    <span>Pucca Building (Residential)</span>
                  </div>
                  <div className="legendItem">
                    <span className="legendBox commBox" />
                    <span>Commercial / Mixed Use</span>
                  </div>
                  <div className="legendItem">
                    <span className="legendLine roadLine" />
                    <span>Pucca Tar / Concrete Road</span>
                  </div>
                  <div className="legendItem">
                    <span className="legendLine blockBoundLine" />
                    <span>HLB Block Boundary</span>
                  </div>
                </div>
              </div>

              {/* Right: Enumerator & Supervisor Verification Box */}
              <div className="a3FooterSignatures">
                <h4 className="footerBoxTitle">✍️ OFFICIAL CERTIFICATION & SIGNATURES</h4>
                <div className="sigColumns">
                  <div className="sigCol">
                    <p className="sigLabel">Field Enumerator:</p>
                    <input 
                      type="text" 
                      className="sigInput" 
                      value={enumeratorName} 
                      onChange={e => setEnumeratorName(e.target.value)}
                    />
                    <div className="sigLine" />
                    <span className="sigDate">Date: {new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="sigCol">
                    <p className="sigLabel">Census Supervisor:</p>
                    <input 
                      type="text" 
                      className="sigInput" 
                      value={supervisorName} 
                      onChange={e => setSupervisorName(e.target.value)}
                    />
                    <div className="sigLine" />
                    <span className="sigDate">Seal & Signature</span>
                  </div>
                </div>
              </div>
            </footer>

          </div>
        </div>
      </div>
    </div>
  );
}

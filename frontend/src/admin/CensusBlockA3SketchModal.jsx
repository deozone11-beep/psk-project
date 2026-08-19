import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, Download, X, Layers, Compass, ZoomIn, ZoomOut, 
  RotateCcw, Eye, FileText, CheckCircle2, Building, MapPin, 
  Sparkles, PenTool, Hash, FileDown
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
  const [surroundingBlocks, setSurroundingBlocks] = useState([]);
  const [osmRoads, setOsmRoads] = useState([]);
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

        // 2. Fetch HLB Block Polygon and surrounding blocks from hlb_polys.json
        const pRes = await fetch('/hlb_polys.json');
        let matchedPoly = null;
        let neighbors = [];
        if (pRes.ok) {
          const pData = await pRes.json();
          const allFeatures = pData.features || [];
          const found = allFeatures.find(f => {
            const p = f.properties || {};
            const bId = String(p.hlb_id || p.code_block || '');
            const wId = String(p.ward_no || p.code_ward || '');
            return (bId === String(blockNo) || bId.includes(String(blockNo))) && 
                   (wId === String(cleanWard) || wId === String(rawWard) || !wId);
          });
          if (found) {
            matchedPoly = found.geometry;
          }

          // Collect other HLB blocks in this ward / nearby for contextual surrounding display
          allFeatures.forEach(f => {
            const p = f.properties || {};
            const bId = String(p.hlb_id || p.code_block || '');
            const wId = String(p.ward_no || p.code_ward || '');
            if (bId !== String(blockNo) && (wId === String(cleanWard) || wId === String(rawWard) || !wId)) {
              const c = getFeatureCenter(f.geometry);
              neighbors.push({
                hlb_id: p.hlb_id || p.code_block || 'N/A',
                geometry: f.geometry,
                center: c,
                properties: p
              });
            }
          });
        }

        if (!isMounted) return;

        // Calculate bounding box around block polygon with generous padding for surroundings
        let minLat = centerLat - 0.0035;
        let maxLat = centerLat + 0.0035;
        let minLng = centerLng - 0.0045;
        let maxLng = centerLng + 0.0045;

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
            const spanLng = Math.max(...pts.map(p => p[0])) - Math.min(...pts.map(p => p[0]));
            const spanLat = Math.max(...pts.map(p => p[1])) - Math.min(...pts.map(p => p[1]));
            const padLng = Math.max(spanLng * 0.35, 0.0012);
            const padLat = Math.max(spanLat * 0.35, 0.0010);
            minLng = Math.min(...pts.map(p => p[0])) - padLng;
            maxLng = Math.max(...pts.map(p => p[0])) + padLng;
            minLat = Math.min(...pts.map(p => p[1])) - padLat;
            maxLat = Math.max(...pts.map(p => p[1])) + padLat;
          }
          setBlockPoly(matchedPoly);
        }

        // 3. Fetch real OpenStreetMap road geometries via backend proxy (0 CORS / instant cache)
        try {
          const roadRes = await fetch(`/api/admin/census/roads?minLat=${minLat}&minLng=${minLng}&maxLat=${maxLat}&maxLng=${maxLng}`);
          if (roadRes.ok) {
            const elements = await roadRes.json();
            if (isMounted && Array.isArray(elements) && elements.length > 0) {
              setOsmRoads(elements);
            }
          }
        } catch (rErr) {
          console.warn('Real OSM road network fetch error:', rErr);
        }

        // Filter visible neighboring blocks
        const visibleNeighbors = neighbors.filter(n => {
          if (!n.center) return false;
          return n.center.lng >= minLng - 0.001 && n.center.lng <= maxLng + 0.001 &&
                 n.center.lat >= minLat - 0.001 && n.center.lat <= maxLat + 0.001;
        });
        setSurroundingBlocks(visibleNeighbors);

        // Filter buildings within expanded bounding box and determine inside vs outside active block
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
        }).map(b => {
          const center = getFeatureCenter(b.geometry);
          const isInside = matchedPoly ? isPointInPolygon(center, matchedPoly) : true;
          return { ...b, isInside };
        });

        // Compute stats for ACTIVE block buildings and collect street names across the area
        let resCount = 0, commCount = 0, othCount = 0, totalArea = 0;
        const streetMap = new Map(); // roadName -> [{ lng, lat }]

        filtered.forEach(b => {
          const p = b.properties || {};
          const usage = String(p.building_used_as || '').toLowerCase();

          // Only count active block buildings in stats
          if (b.isInside) {
            if (usage.includes('residen')) resCount++;
            else if (usage.includes('commerc') || usage.includes('shop')) commCount++;
            else othCount++;
            totalArea += (p.drone_area_in_sqft || 0);
          }

          const rName = p.road_name ? p.road_name.trim() : '';
          if (rName && rName.length > 3 && !rName.toLowerCase().includes('null')) {
            let bCenter = getFeatureCenter(b.geometry);
            if (bCenter) {
              if (!streetMap.has(rName)) streetMap.set(rName, []);
              streetMap.get(rName).push(bCenter);
            }
          }
        });

        // Build street label objects: midpoint + snapped angle (H or V grid)
        const streetLabelList = Array.from(streetMap.entries()).map(([name, pts]) => {
          const midLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
          const midLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
          let angle = 0;
          if (pts.length >= 2) {
            const lngs = pts.map(p => p.lng);
            const lats = pts.map(p => p.lat);
            const spreadLng = Math.max(...lngs) - Math.min(...lngs);
            const spreadLat = Math.max(...lats) - Math.min(...lats);
            if (spreadLat > spreadLng * 1.5) {
              angle = -90; // vertical road
            } else {
              angle = 0;   // horizontal road
            }
          }
          return { name, lng: midLng, lat: midLat, angle, pts };
        });

        setBuildings(filtered);
        setStreetLabels(streetLabelList);
        setStats({
          total: resCount + commCount + othCount,
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

  function isPointInPolygon(pt, geom) {
    if (!pt || !geom || !geom.coordinates) return true;
    const { lng, lat } = pt;
    const rings = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
    for (const poly of rings) {
      const ring = poly[0];
      if (!ring || ring.length < 3) continue;
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        const intersect = ((yi > lat) !== (yj > lat)) &&
          (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      if (inside) return true;
    }
    return false;
  }

  // Calculate SVG ViewBox Bounds — tightly focused on the ACTIVE block as the MAJOR figure
  let minLng = centerLng - 0.0018, maxLng = centerLng + 0.0018;
  let minLat = centerLat - 0.0014, maxLat = centerLat + 0.0014;

  const activeBuildings = buildings.filter(b => b.isInside !== false);
  const targetBuildings = activeBuildings.length > 0 ? activeBuildings : buildings;

  if (blockPoly && blockPoly.coordinates) {
    let pts = [];
    function extractPts(arr) {
      if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number') {
        pts.push(arr);
      } else if (Array.isArray(arr)) {
        arr.forEach(extractPts);
      }
    }
    extractPts(blockPoly.coordinates);
    if (pts.length > 0) {
      const spanLng = Math.max(...pts.map(p => p[0])) - Math.min(...pts.map(p => p[0]));
      const spanLat = Math.max(...pts.map(p => p[1])) - Math.min(...pts.map(p => p[1]));
      // Modest margin (~14%) so active block is large & prominent in the center
      const padLng = Math.max(spanLng * 0.14, 0.0004);
      const padLat = Math.max(spanLat * 0.14, 0.0003);
      minLng = Math.min(...pts.map(p => p[0])) - padLng;
      maxLng = Math.max(...pts.map(p => p[0])) + padLng;
      minLat = Math.min(...pts.map(p => p[1])) - padLat;
      maxLat = Math.max(...pts.map(p => p[1])) + padLat;
    }
  } else if (targetBuildings.length > 0) {
    const allLngs = [], allLats = [];
    targetBuildings.forEach(b => {
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
      const padLng = (Math.max(...allLngs) - Math.min(...allLngs)) * 0.14 || 0.0004;
      const padLat = (Math.max(...allLats) - Math.min(...allLats)) * 0.14 || 0.0003;
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

  // Generate real-world Google Maps Roadmap background tiles matching the exact viewport
  const tileZ = 18;
  const googleTiles = (() => {
    if (!minLng || !minLat || !maxLng || !maxLat) return [];
    function lngToTileX(lng, z) {
      return Math.floor((lng + 180) / 360 * Math.pow(2, z));
    }
    function latToTileY(lat, z) {
      return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    }
    function tileToLng(x, z) {
      return (x / Math.pow(2, z) * 360 - 180);
    }
    function tileToLat(y, z) {
      const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
      return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
    }

    const minTx = lngToTileX(minLng, tileZ);
    const maxTx = lngToTileX(maxLng, tileZ);
    const minTy = latToTileY(maxLat, tileZ);
    const maxTy = latToTileY(minLat, tileZ);

    const tiles = [];
    for (let tx = minTx; tx <= maxTx; tx++) {
      for (let ty = minTy; ty <= maxTy; ty++) {
        const nwLng = tileToLng(tx, tileZ);
        const nwLat = tileToLat(ty, tileZ);
        const seLng = tileToLng(tx + 1, tileZ);
        const seLat = tileToLat(ty + 1, tileZ);

        const [x1, y1] = projectToSvg(nwLng, nwLat);
        const [x2, y2] = projectToSvg(seLng, seLat);

        tiles.push({
          key: `${tx}-${ty}`,
          url: `https://mt1.google.com/vt/lyrs=m&x=${tx}&y=${ty}&z=${tileZ}`,
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1
        });
      }
    }
    return tiles;
  })();

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

  // Pre-compute accurate street corridors aligned strictly to block layout (horizontal, vertical, or oriented)
  const roadLines = (() => {
    if (loading || buildings.length === 0) return [];

    // Group buildings by road_name
    const streetGroups = new Map();
    buildings.forEach(b => {
      const p = b.properties || {};
      const rName = (p.road_name || '').trim();
      if (rName && rName.length >= 3 && !rName.toLowerCase().includes('null') && !rName.toLowerCase().includes('unknown')) {
        const center = getFeatureCenter(b.geometry);
        if (center) {
          const [sx, sy] = projectToSvg(center.lng, center.lat);
          if (!streetGroups.has(rName)) streetGroups.set(rName, []);
          streetGroups.get(rName).push({ b, sx, sy, isInside: b.isInside });
        }
      }
    });

    const roads = [];
    let rId = 0;

    streetGroups.forEach((pts, name) => {
      const activePts = pts.filter(p => p.isInside !== false);
      const usePts = activePts.length >= 2 ? activePts : pts;
      if (usePts.length === 0) return;

      const xs = usePts.map(p => p.sx);
      const ys = usePts.map(p => p.sy);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const spanX = maxX - minX;
      const spanY = maxY - minY;

      let x1, y1, x2, y2;

      if (spanX >= spanY * 1.15) {
        // 1. PURELY HORIZONTAL STREET (0° angle — strictly level, never slants)
        const sortedY = [...ys].sort((a, b) => a - b);
        let gapY = (minY + maxY) / 2;
        let maxGap = 0;
        for (let i = 0; i < sortedY.length - 1; i++) {
          const gap = sortedY[i + 1] - sortedY[i];
          if (gap > maxGap && gap > 12) {
            maxGap = gap;
            gapY = (sortedY[i] + sortedY[i + 1]) / 2;
          }
        }
        x1 = Math.max(30, minX - 25);
        x2 = Math.min(svgW - 30, maxX + 25);
        y1 = gapY;
        y2 = gapY;
      } else if (spanY >= spanX * 1.15) {
        // 2. PURELY VERTICAL STREET (90° angle — strictly plumb, never slants)
        const sortedX = [...xs].sort((a, b) => a - b);
        let gapX = (minX + maxX) / 2;
        let maxGap = 0;
        for (let i = 0; i < sortedX.length - 1; i++) {
          const gap = sortedX[i + 1] - sortedX[i];
          if (gap > maxGap && gap > 12) {
            maxGap = gap;
            gapX = (sortedX[i] + sortedX[i + 1]) / 2;
          }
        }
        x1 = gapX;
        x2 = gapX;
        y1 = Math.max(30, minY - 25);
        y2 = Math.min(svgH - 30, maxY + 25);
      } else {
        // 3. ANGLED STREET (e.g. diagonal column of houses on right)
        const n = usePts.length;
        let mx = xs.reduce((a, b) => a + b, 0) / n;
        let my = ys.reduce((a, b) => a + b, 0) / n;
        let varX = 0, varY = 0, covXY = 0;
        for (let i = 0; i < n; i++) {
          const dx = xs[i] - mx, dy = ys[i] - my;
          varX += dx * dx;
          varY += dy * dy;
          covXY += dx * dy;
        }
        const theta = 0.5 * Math.atan2(2 * covXY, varX - varY);
        let ux = Math.cos(theta), uy = Math.sin(theta);
        if (ux < -0.1 || (Math.abs(ux) <= 0.1 && uy < 0)) {
          ux = -ux;
          uy = -uy;
        }
        const tVals = usePts.map(p => (p.sx - mx) * ux + (p.sy - my) * uy);
        const tMin = Math.min(...tVals) - 15;
        const tMax = Math.max(...tVals) + 15;
        x1 = mx + tMin * ux;
        y1 = my + tMin * uy;
        x2 = mx + tMax * ux;
        y2 = my + tMax * uy;
      }

      const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      const len = Math.hypot(x2 - x1, y2 - y1);

      roads.push({
        id: rId++,
        name,
        pathD: d,
        length: len,
        isOsm: false
      });
    });

    return roads.sort((a, b) => b.length - a.length);
  })();

  return (
    <div className="a3SketchModalOverlay">

      {/* ─── FLOATING CONTROL BAR (no-print) ─── */}
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
            <label className="a3ToggleLbl">
              <input type="checkbox" checked={showStreetNames} onChange={e => setShowStreetNames(e.target.checked)} />
              <span>Streets</span>
            </label>
            <label className="a3ToggleLbl">
              <input type="checkbox" checked={showDoorNumbers} onChange={e => setShowDoorNumbers(e.target.checked)} />
              <span>Door Nos</span>
            </label>
            <label className="a3ToggleLbl">
              <input type="checkbox" checked={showHatching} onChange={e => setShowHatching(e.target.checked)} />
              <span>Hatching</span>
            </label>
            <label className="a3ToggleLbl">
              <input type="checkbox" checked={showLegend} onChange={e => setShowLegend(e.target.checked)} />
              <span>Legend</span>
            </label>
          </div>
        </div>

        {/* Action buttons */}
        <div className="a3ControlRight">
          {/* Zoom */}
          <div className="a3ZoomGroup">
            <button className="a3ZoomBtn" onClick={() => setZoomLevel(z => Math.max(0.6, +(z - 0.1).toFixed(1)))}><ZoomOut size={16} /></button>
            <span className="a3ZoomText">{Math.round(zoomLevel * 100)}%</span>
            <button className="a3ZoomBtn" onClick={() => setZoomLevel(z => Math.min(2.0, +(z + 0.1).toFixed(1)))}><ZoomIn size={16} /></button>
          </div>

          <button className="a3ActionBtn btnPrint" onClick={handlePrintA3}>
            <Printer size={16} /> Print / Save PDF
          </button>
          <button className="a3ActionBtn btnPdf" onClick={handleDownloadPdf}>
            <FileDown size={16} /> Export A3 PDF
          </button>
          <button className="a3ActionBtn btnPng" onClick={handleDownloadPng}>
            <Download size={16} /> Export PNG
          </button>
          <button className="a3CloseBtn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ─── SCROLLABLE CANVAS CONTAINER ─── */}
      <div className="a3CanvasScroll">
        <div
          ref={a3PrintRef}
          className={`a3OfficialSheet ${sketchStyle.toLowerCase()}`}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
        >

          {/* FULL-WIDTH TOP HEADER */}
          <div className="a3OffHdr">
            <div className="a3OffHdrTitle">
              <div>
                <div className="a3OffTamilTitle">{'\u0B87\u0BA8\u0BCD\u0BA4\u0BBF\u0BAF \u0BAE\u0B95\u0BCD\u0B95\u0BB3\u0BCD \u0BA4\u0BCA\u0B95\u0BC8 \u0B95\u0BA3\u0B95\u0BCD\u0B95\u0BC6\u0B9F\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1 2027'}</div>
                <div className="a3OffEngTitle">CENSUS OF INDIA 2027</div>
              </div>
            </div>
            <div className="a3OffHdrCenter">
              <p>{'\u0B87\u0BA8\u0BCD\u0BA4 75 \u0BAE\u0B95\u0BCD\u0B95\u0BB3\u0BCD\u0BA4\u0BCA\u0B95\u0BC8. \u0B92\u0BB0\u0BC1 \u0BB5\u0BC0\u0B9F\u0BCD\u0B9F\u0BC8 \u0BAE\u0B9F\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD \u0B92\u0BB0\u0BC1 \u0B9A\u0BC6\u0BB5\u0BCD\u0BB5\u0B95\u0BA4\u0BCD\u0BA4\u0BBF\u0BB2\u0BCD \u0B95\u0B9F\u0BCD\u0B9F\u0BBF\u0B9F \u0BB5\u0BB0\u0BC8\u0BA8\u0BCD\u0BA4\u0BC1 \u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BB5\u0BC1\u0BAE\u0BCD.'}</p>
              <strong>{'\u0BB5\u0BC0\u0B9F\u0BCD\u0B9F\u0BBE\u0BA9\u0BCD \u0BB5\u0BC0\u0B9F\u0BCD\u0B9F\u0BC1 \u0BB5\u0BB0\u0BC8\u0BAA\u0BCD\u0BAA\u0B9F\u0BAE\u0BCD'} / HOUSE LISTING LAYOUT MAP (NOTIONAL)</strong>
            </div>
            <div className="a3OffHdrSign">
              <div className="a3OffSignLabel">{'\u0B95\u0B9F\u0BCD\u0B9F\u0BC1\u0BAA\u0BCD\u0BAA\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1 \u0B95\u0BA3\u0B95\u0BCD\u0B95\u0BC6\u0B9F\u0BC1\u0BAA\u0BCD\u0BAA\u0BBE\u0BB3\u0BB0\u0BCD'}<br/>{'\u0B95\u0BC8\u0BAF\u0BCA\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD'}</div>
              <div className="a3OffSignLine" />
            </div>
          </div>

          {/* BODY: LEFT PANEL + RIGHT MAP */}
          <div className="a3OffBody">

            {/* LEFT LEGEND PANEL */}
            <div className="a3OffLeft">

              {/* Admin Code Boxes */}
              <div className="a3OffAdminSection">
                {[
                  { label: '\u0BAE\u0BBE\u0BA8\u0BBF\u0BB2\u0BAE\u0BCD/\u0B95\u0BC7\u0BA8\u0BCD\u0BA4\u0BBF\u0BB0\u0BAA\u0BCD \u0BAA\u0B95\u0BC1\u0BA4\u0BBF', val: '34', boxes: 2 },
                  { label: '\u0BAE\u0BBE\u0BB5\u0B9F\u0BCD\u0B9F\u0BAE\u0BCD', val: '02', boxes: 2 },
                  { label: '\u0BA4\u0BC1\u0BA3\u0BC8 \u0BAE\u0BBE\u0BB5\u0B9F\u0BCD\u0B9F\u0BAE\u0BCD', val: '', boxes: 4 },
                  { label: '\u0BA8\u0B95\u0BB0\u0BAE\u0BCD / \u0B95\u0BBF\u0BB0\u0BBE\u0BAE\u0BAE\u0BCD', val: '', boxes: 4 },
                  { label: '\u0BB5\u0BBE\u0BB0\u0BCD\u0B9F\u0BC1 \u0B8E\u0BA3\u0BCD', val: String(parseInt(cleanWard, 10) || 0).padStart(3, '0'), boxes: 3 },
                  { label: '\u0BB5\u0BC0\u0B9F\u0BCD\u0B9F\u0BC1 \u0BAA\u0B9F\u0BCD\u0B9F\u0BBF\u0BAF\u0BB2\u0BCD \u0BA4\u0BCA\u0B95\u0BC1\u0BA4\u0BBF \u0B8E\u0BA3\u0BCD', val: String(blockNo).replace(/\D/g, '').padStart(4, '0'), boxes: 4 },
                ].map((row, i) => (
                  <div key={i} className="a3OffAdminRow">
                    <span className="a3OffAdminLbl">{row.label}</span>
                    <div className="a3OffAdminBoxes">
                      {Array.from({ length: row.boxes }).map((_, j) => (
                        <span key={j} className="a3OffAdminBox">{(row.val || '')[j] || ''}</span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="a3OffAdminRow">
                  <span className="a3OffAdminLbl">{'\u0BA4\u0BC7\u0BA4\u0BBF'}</span>
                  <span className="a3OffDateLine">{new Date().toLocaleDateString('en-GB')} ............</span>
                </div>
              </div>
              <div className="a3OffDivider" />
              {/* Instructions */}
              <div className="a3OffNote">
                <strong>{'\u0B95\u0BC1\u0BB1\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD'}:</strong>
                <p>{'\u0B95\u0BC0\u0BB4\u0BC7 \u0B95\u0BCA\u0B9F\u0BC1\u0B95\u0BCD\u0B95\u0BAA\u0BCD \u0BAA\u0B9F\u0BCD\u0B9F \u0BB5\u0BB0\u0BC8\u0BAA\u0BCD\u0BAA\u0B9F \u0B95\u0BC1\u0BB1\u0BBF\u0BAF\u0BC0\u0B9F\u0BC1\u0B95\u0BB3\u0BBF\u0BB2\u0BCD \u0B92\u0BB5\u0BCD\u0BB5\u0BCA\u0BB0\u0BC1 \u0B95\u0B9F\u0BCD\u0B9F\u0BBF\u0B9F\u0BA4\u0BCD\u0BA4\u0BC8\u0BAF\u0BC1\u0BAE\u0BCD \u0BB5\u0BB0\u0BC8\u0BA8\u0BCD\u0BA4\u0BC1 \u0BA4\u0BCA\u0B9F\u0BB0\u0BCD \u0B8E\u0BA3\u0BCD \u0B95\u0BC1\u0BB1\u0BBF\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD.'}</p>
              </div>
              {/* Legend */}
              <div className="a3OffLegend">
                <div className="a3OffLegTitle">{'\u0BAA\u0B95\u0BCD\u0B95\u0BBE \u0B95\u0B9F\u0BCD\u0B9F\u0BBF\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BCD'} (Pucca):</div>
                <div className="a3OffLegRow"><span>{'\u0B95\u0BC1\u0B9F\u0BBF\u0BAF\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1'}</span><span className="a3OffSymPucca" /></div>
                <div className="a3OffLegRow"><span>{'\u0BB5\u0BC7\u0BB1\u0BC1 \u0B95\u0B9F\u0BCD\u0B9F\u0BBF\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BCD'}</span><span className="a3OffSymPuccaOther" /></div>
                <div className="a3OffLegTitle">{'\u0B95\u0BC1\u0B9A\u0BCD\u0B9A\u0BBE \u0B95\u0B9F\u0BCD\u0B9F\u0BBF\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BCD'} (Kutcha):</div>
                <div className="a3OffLegRow">
                  <span>{'\u0B95\u0BC1\u0B9F\u0BBF\u0BAF\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1'}</span>
                  <svg width="18" height="16" style={{flexShrink:0}}><polygon points="9,1 17,15 1,15" fill="none" stroke="#1e293b" strokeWidth="1.5"/></svg>
                </div>
                <div className="a3OffLegRow">
                  <span>{'\u0BB5\u0BC7\u0BB1\u0BC1 \u0B95\u0B9F\u0BCD\u0B9F\u0BBF\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BCD'}</span>
                  <svg width="18" height="16" style={{flexShrink:0}}><polygon points="9,1 17,15 1,15" fill="rgba(245,158,11,0.3)" stroke="#b45309" strokeWidth="1.5" strokeDasharray="3,2"/></svg>
                </div>
                <div className="a3OffLegTitle" style={{marginTop:'3px'}}>{'\u0B9A\u0BBE\u0BB2\u0BC8\u0B95\u0BB3\u0BCD'}:</div>
                <div className="a3OffLegRow"><span>{'\u0BAA\u0B95\u0BCD\u0B95\u0BBE \u0B9A\u0BBE\u0BB2\u0BC8'}</span><span className="a3OffLineSolid" /></div>
                <div className="a3OffLegRow"><span>{'\u0B95\u0BC1\u0B9A\u0BCD\u0B9A\u0BBE \u0B9A\u0BBE\u0BB2\u0BC8'}</span><span className="a3OffLineDash" /></div>
                <div className="a3OffLegRow"><span>{'\u0BA4\u0BBE\u0BB0\u0BCD \u0BAA\u0BBE\u0BA4\u0BC8'}</span><span className="a3OffLineTar" /></div>
                <div className="a3OffLegRow"><span>{'\u0B87\u0BB0\u0BAF\u0BBF\u0BB2\u0BCD \u0BAA\u0BBE\u0BA4\u0BC8'}</span><span className="a3OffLineRail" /></div>
                <div className="a3OffLegRow"><span>{'\u0B86\u0BB1\u0BC1'}</span><span className="a3OffLineRiver" /></div>
                <div className="a3OffLegRow"><span>{'\u0B95\u0BBE\u0BB2\u0BCD\u0BB5\u0BBE\u0BAF\u0BCD'}</span><span className="a3OffLineCanal" /></div>
                <div className="a3OffLegRow"><span>{'\u0B95\u0BBF\u0BA3\u0BB1\u0BC1 / \u0B95\u0BC1\u0BB3\u0BAE\u0BCD'}</span><span style={{fontSize:'12px'}}>{'\u2295'}</span></div>
                <div className="a3OffLegRow"><span>{'\u0BB5\u0BC7\u0BB1\u0BC1 / \u0B95\u0BCB\u0BB5\u0BBF\u0BB2\u0BCD'}</span><span style={{fontSize:'11px'}}>{'\u2295 + \u271D'}</span></div>
              </div>
              {/* Numbering example */}
              <div className="a3OffNumRow">
                {['1','2','3','A'].map(n => <span key={n} className="a3OffNumBox">{n}</span>)}
              </div>
              <p className="a3OffNumText">{'\u0BAA\u0BB2\u0BCD\u0BB5\u0BC7\u0BB1\u0BC1 \u0B95\u0B9F\u0BCD\u0B9F\u0BBF\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0BB5\u0BC0\u0B9F\u0BCD\u0B9F\u0BC1\u0BAA\u0BCD\u0BAA\u0B9F\u0BBF \u0BA4\u0BCA\u0B9F\u0BB0\u0BCD \u0B8E\u0BA3\u0BCD\u0B95\u0BB3\u0BCD \u0B95\u0BCA\u0B9F\u0BC1\u0B95\u0BCD\u0B95\u0BC1\u0BAE\u0BCD \u0BB5\u0BB4\u0BBF\u0BAE\u0BC1\u0BB1\u0BC8.'}</p>
              {/* Stats */}
              <div className="a3OffStats">
                <div className="a3OffStatsRow"><span>{'\u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0B95\u0B9F\u0BCD\u0B9F\u0BBF\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BCD'}</span><b>{stats.total}</b></div>
                <div className="a3OffStatsRow"><span>{'\u0B95\u0BC1\u0B9F\u0BBF\u0BAF\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1'}</span><b>{stats.residential}</b></div>
                <div className="a3OffStatsRow"><span>{'\u0BB5\u0BA3\u0BBF\u0B95'}</span><b>{stats.commercial}</b></div>
              </div>
              {/* Signatures */}
              <div className="a3OffSigs">
                <div className="a3OffSigField">
                  <span>{'\u0B95\u0BA3\u0B95\u0BCD\u0B95\u0BC6\u0B9F\u0BC1\u0BAA\u0BCD\u0BAA\u0BBE\u0BB3\u0BB0\u0BCD \u0BAA\u0BC6\u0BAF\u0BCD\u0BAF\u0BB0\u0BCD'}</span>
                  <input className="a3OffSigInput" value={enumeratorName} onChange={e => setEnumeratorName(e.target.value)} />
                </div>
                <div className="a3OffSigField">
                  <span>{'\u0B95\u0BA3\u0B95\u0BCD\u0B95\u0BC6\u0B9F\u0BC1\u0BAA\u0BCD\u0BAA\u0BBE\u0BB3\u0BB0\u0BCD \u0B95\u0BC8\u0BAF\u0BCA\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD'}</span>
                  <div className="a3OffSigLine" />
                </div>
                <div className="a3OffSigField">
                  <span>{'\u0BAE\u0BC7\u0BB1\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0BB5\u0BC8\u0BAF\u0BBE\u0BB3\u0BB0\u0BCD \u0BAA\u0BC6\u0BAF\u0BCD\u0BAF\u0BB0\u0BCD'}</span>
                  <input className="a3OffSigInput" value={supervisorName} onChange={e => setSupervisorName(e.target.value)} />
                </div>
                <div className="a3OffSigField">
                  <span>{'\u0BAE\u0BC7\u0BB1\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0BB5\u0BC8\u0BAF\u0BBE\u0BB3\u0BB0\u0BCD \u0B95\u0BC8\u0BAF\u0BCA\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD'}</span>
                  <div className="a3OffSigLine" />
                </div>
              </div>
              <div className="a3OffTamilTag">TAMIL</div>
            </div>

            {/* RIGHT MAP PANEL */}
            <div className="a3OffRight">
              {loading ? (
                <div className="a3LoadingState">
                  <Sparkles size={32} className="spinning" />
                  <p>{'\u0BB5\u0BB0\u0BC8\u0BAA\u0BCD\u0BAA\u0B9F\u0BAE\u0BCD \u0BA4\u0BAF\u0BBE\u0BB0\u0BBF\u0B95\u0BCD\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0B95\u0BBF\u0BB1\u0BA4\u0BC1...'}</p>
                  <span>Block #{blockNo} loading...</span>
                </div>
              ) : (
                <>
                  {/* North Arrow – top right corner */}
                  <div className="a3OffNorth">
                    <svg width="20" height="38" viewBox="0 0 20 38">
                      <line x1="10" y1="34" x2="10" y2="4" stroke="#1e293b" strokeWidth="1.5"/>
                      <polygon points="10,0 5,12 10,8 15,12" fill="#1e293b"/>
                    </svg>
                    <span>{'\u0BB5.\u0B95\u0BBF'}</span>
                  </div>
                  {/* Scale tag */}
                  <div className="a3OffScaleTag">{'\u0B85\u0BB3\u0BB5\u0BC1\u0B95\u0BCB\u0BB2\u0BCD 1 : 1500'}</div>

                  {/* SVG Map — same vector engine, new container */}
                  <svg
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    className="a3VectorSvg"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern id="draftsmanGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke={theme.paperGrid} strokeWidth="0.8" />
                      </pattern>
                      <pattern id="pencilHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="8" stroke={theme.stroke} strokeWidth="0.9" strokeOpacity="0.45" />
                      </pattern>
                      <pattern id="commHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.6" />
                        <line x1="0" y1="0" x2="6" y2="0" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.6" />
                      </pattern>
                      <filter id="pencilStrokeFilter" x="-10%" y="-10%" width="120%" height="120%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
                      </filter>
                      {buildings.map((b, idx) => (
                        <clipPath key={`cp-${b.id || idx}`} id={`bclip-${b.id || idx}`}>
                          <path d={renderPolygonPath(b.geometry.coordinates, b.geometry.type)} />
                        </clipPath>
                      ))}
                      {roadLines.map(rl => (
                        <path key={`rp-${rl.id}`} id={`roadPath-${rl.id}`}
                          d={rl.pathD} fill="none" />
                      ))}
                    </defs>

                    {/* 1. Paper grid */}
                    <rect width={svgW} height={svgH} fill="url(#draftsmanGrid)" />

                    {/* 1.5 Actual Google Roadmap Streets & Real-World Roads (100% Ground Truth Accuracy) */}
                    {showStreetNames && googleTiles.length > 0 && (
                      <g
                        className="a3ActualGoogleRoadmapLayer"
                        opacity={sketchStyle === 'PENCIL' ? 0.75 : sketchStyle === 'BLUEPRINT' ? 0.45 : 0.85}
                        style={{
                          filter: sketchStyle === 'PENCIL'
                            ? 'grayscale(0.75) contrast(1.18) brightness(1.04)'
                            : sketchStyle === 'BLUEPRINT'
                            ? 'invert(1) hue-rotate(185deg) brightness(0.85) contrast(1.25)'
                            : 'none'
                        }}
                      >
                        {googleTiles.map(t => (
                          <image
                            key={t.key}
                            href={t.url}
                            x={t.x}
                            y={t.y}
                            width={t.width}
                            height={t.height}
                            preserveAspectRatio="none"
                          />
                        ))}
                      </g>
                    )}

                    {/* 2. Surrounding / Neighboring HLB Block Boundaries with labels */}
                    {surroundingBlocks.map((sb, sIdx) => {
                      const pathD = renderPolygonPath(sb.geometry.coordinates, sb.geometry.type);
                      if (!sb.center) return null;
                      const [cx, cy] = projectToSvg(sb.center.lng, sb.center.lat);
                      // Clamp badge to viewport margins so adjacent block IDs are visible
                      const clampedX = Math.max(55, Math.min(svgW - 55, cx));
                      const clampedY = Math.max(25, Math.min(svgH - 25, cy));
                      return (
                        <g key={`sb-${sIdx}`} className="a3SurroundingBlock">
                          <path
                            d={pathD}
                            fill="rgba(148, 163, 184, 0.02)"
                            stroke="#94a3b8"
                            strokeWidth="1.6"
                            strokeDasharray="6,4"
                            strokeLinejoin="round"
                          />
                          <g transform={`translate(${clampedX}, ${clampedY})`}>
                            <rect
                              x="-42" y="-11" width="84" height="22" rx="4"
                              fill="#f8fafc" stroke="#94a3b8" strokeWidth="1"
                              strokeDasharray="3,2" opacity="0.92"
                            />
                            <text
                              x="0" y="1"
                              textAnchor="middle" dominantBaseline="middle"
                              fontSize="8.5" fontWeight="800" fill="#64748b"
                              fontFamily="'Segoe UI', Roboto, sans-serif"
                              letterSpacing="0.5px"
                            >
                              HLB #{sb.hlb_id}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* 2.2 Active HLB Block Outer Boundary (BOLD draftsman highlight) */}
                    {blockPoly && (
                      <g className="a3ActiveBlockHighlight">
                        {/* Subtle blue accent glow underneath */}
                        <path
                          d={renderPolygonPath(blockPoly.coordinates, blockPoly.type)}
                          fill="none"
                          stroke="rgba(37, 99, 235, 0.12)"
                          strokeWidth="10"
                          strokeLinejoin="round"
                        />
                        {/* Bold dashed boundary stroke */}
                        <path
                          d={renderPolygonPath(blockPoly.coordinates, blockPoly.type)}
                          fill="none"
                          stroke={theme.boundaryStroke}
                          strokeWidth="4.5"
                          strokeDasharray="10,5"
                          strokeLinejoin="round"
                          filter="url(#pencilStrokeFilter)"
                        />
                      </g>
                    )}

                    {/* 2.5 Real Road Corridors fallback if tiles not available */}
                    {showStreetNames && googleTiles.length === 0 && roadLines.map(rl => {
                      const isMain = rl.highway === 'tertiary' || rl.highway === 'secondary' || rl.highway === 'primary' || rl.highway === 'trunk' || (rl.name || '').toLowerCase().includes('main') || (rl.name || '').toLowerCase().includes('bypass');
                      const roadW = isMain ? 17 : 12;
                      const roadFill = theme.bg;
                      const edgeColor = sketchStyle === 'BLUEPRINT' ? 'rgba(56,189,248,0.5)'
                        : sketchStyle === 'CADASTRAL' ? 'rgba(37,99,235,0.35)'
                        : 'rgba(51,65,85,0.28)';
                      return (
                        <g key={`rc-${rl.id}`}>
                          {/* Road casing / kerb */}
                          <path
                            d={rl.pathD}
                            fill="none"
                            stroke={edgeColor}
                            strokeWidth={roadW}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Road inner surface */}
                          <path
                            d={rl.pathD}
                            fill="none"
                            stroke={roadFill}
                            strokeWidth={roadW - 2.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      );
                    })}

                    {/* 3. Buildings: Active block = BOLD + door numbers; Surrounding = DULL */}
                    {buildings.map((b, idx) => {
                      const p = b.properties || {};
                      const pathD = renderPolygonPath(b.geometry.coordinates, b.geometry.type);
                      const isComm = String(p.building_used_as || '').toLowerCase().includes('commerc') || String(p.building_used_as || '').toLowerCase().includes('shop');
                      const doorNo = p.door_new_no || p.door_old_no || String(idx + 1);
                      const center = getFeatureCenter(b.geometry);
                      const [cx, cy] = center ? projectToSvg(center.lng, center.lat) : [0, 0];
                      const isInside = b.isInside !== false;

                      if (!isInside) {
                        // Surrounding outside buildings: Dull, light gray, no door numbers
                        return (
                          <g key={b.id || idx} opacity="0.35">
                            <path
                              d={pathD}
                              fill="rgba(148, 163, 184, 0.08)"
                              stroke="#64748b"
                              strokeWidth="0.9"
                              strokeLinejoin="round"
                            />
                          </g>
                        );
                      }

                      // Active block buildings: BOLD, hatched, with sequential / door number
                      return (
                        <g key={b.id || idx}>
                          <path
                            d={pathD}
                            fill={showHatching ? (isComm ? theme.commFill : theme.fill) : 'none'}
                            stroke={theme.stroke}
                            strokeWidth={theme.strokeWidth}
                            strokeLinejoin="round"
                            filter="url(#pencilStrokeFilter)"
                          />
                          {showDoorNumbers && center && (
                            <text
                              clipPath={`url(#bclip-${b.id || idx})`}
                              x={cx}
                              y={cy + 3}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={theme.text}
                              fontSize={buildings.length > 120 ? "7" : buildings.length > 60 ? "8" : "10"}
                              fontWeight="800"
                              fontFamily="'Courier New', Courier, monospace"
                            >
                              {doorNo}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* 4. Street names via textPath along real road paths (fallback) */}
                    {showStreetNames && googleTiles.length === 0 && roadLines.map(rl => {
                      if (!rl.name || rl.name.toLowerCase().includes('unnamed') || rl.length < 35) return null;
                      const fontSize = 8.5;
                      const roadColor = sketchStyle === 'BLUEPRINT' ? '#7dd3fc'
                        : sketchStyle === 'CADASTRAL' ? '#1e40af' : '#1e293b';
                      const haloColor = sketchStyle === 'BLUEPRINT' ? '#0c2340' : '#ffffff';
                      return (
                        <g key={`rlt-${rl.id}`}>
                          <text
                            fontSize={fontSize}
                            fontWeight="900"
                            fontFamily="'Segoe UI', Roboto, sans-serif"
                            letterSpacing="0.7px"
                            fill="none"
                            stroke={haloColor}
                            strokeWidth="3.2"
                            strokeLinejoin="round"
                          >
                            <textPath href={`#roadPath-${rl.id}`} xlinkHref={`#roadPath-${rl.id}`}
                              startOffset="50%" textAnchor="middle">
                              {rl.name.toUpperCase()}
                            </textPath>
                          </text>
                          <text
                            fontSize={fontSize}
                            fontWeight="900"
                            fontFamily="'Segoe UI', Roboto, sans-serif"
                            letterSpacing="0.7px"
                            fill={roadColor}
                          >
                            <textPath href={`#roadPath-${rl.id}`} xlinkHref={`#roadPath-${rl.id}`}
                              startOffset="50%" textAnchor="middle">
                              {rl.name.toUpperCase()}
                            </textPath>
                          </text>
                        </g>
                      );
                    })}

                    {/* 5. North compass */}
                    <g transform={`translate(${svgW - 55}, 55)`}>
                      <circle r="22" fill={theme.badgeBg} stroke={theme.stroke} strokeWidth="1.5" opacity="0.9" />
                      <polygon points="0,-18 4,-4 0,0 -4,-4" fill="#ef4444" />
                      <polygon points="0,18 4,4 0,0 -4,4" fill={theme.stroke} />
                      <text x="0" y="-20" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="900">N</text>
                    </g>

                    {/* 6. Scale bar */}
                    <g transform="translate(30, 720)">
                      <rect width="150" height="20" rx="3" fill={theme.badgeBg} stroke={theme.stroke} strokeWidth="1" opacity="0.9" />
                      <line x1="12" y1="10" x2="138" y2="10" stroke={theme.stroke} strokeWidth="2" />
                      <line x1="12" y1="5" x2="12" y2="15" stroke={theme.stroke} strokeWidth="2" />
                      <line x1="75" y1="7" x2="75" y2="13" stroke={theme.stroke} strokeWidth="1.5" />
                      <line x1="138" y1="5" x2="138" y2="15" stroke={theme.stroke} strokeWidth="2" />
                      <text x="12" y="19" fontSize="7" fontWeight="700" fill={theme.text}>0m</text>
                      <text x="75" y="19" fontSize="7" fontWeight="700" fill={theme.text}>50m</text>
                      <text x="138" y="19" fontSize="7" fontWeight="700" fill={theme.text}>100m</text>
                    </g>
                  </svg>
                </>
              )}
            </div>

          </div>{/* end body */}
        </div>{/* end official sheet */}
      </div>{/* end canvas scroll */}
    </div>
  );
}

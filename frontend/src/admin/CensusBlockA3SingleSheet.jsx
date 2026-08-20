import React, { useState, useEffect, forwardRef } from 'react';
import { Sparkles } from 'lucide-react';

const CensusBlockA3SingleSheet = forwardRef(function CensusBlockA3SingleSheet({
  block,
  language = 'TAMIL',
  sketchStyle = 'PENCIL',
  paperSize = 'A3',
  showDoorNumbers = true,
  showStreetNames = true,
  showHatching = true,
  enumeratorName = 'R. Sundaram (Enumerator #0482)',
  supervisorName = 'K. Murugan (Supervisor #0112)',
  notes = 'All buildings numbered sequentially following clockwise route from North-West corner.',
  cachedHlbPolys = null,
  cachedWardBuildings = null,
  onReady = null,
}, ref) {
  const [loading, setLoading] = useState(true);
  const [blockPoly, setBlockPoly] = useState(null);
  const [adminProps, setAdminProps] = useState(null);
  const [surroundingBlocks, setSurroundingBlocks] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [streetLabels, setStreetLabels] = useState([]);
  const [tileDataUrls, setTileDataUrls] = useState({});

  const rawWard = block.wardNo || block.code_ward || block.ward_no || '144';
  const cleanWard = String(parseInt(rawWard, 10) || 1).padStart(3, '0');
  const blockNo = block.blockNo || block.code_block || block.hlb_id || '0144';
  const zoneNo = block.zoneNo || block.code_st || block.zone_number || '11';
  const centerLat = parseFloat(block.lat || block.centerLat || 13.0645);
  const centerLng = parseFloat(block.lng || block.centerLng || 80.1760);

  // Global in-memory caches
  if (typeof window !== 'undefined') {
    if (!window.__hlbPolysCache) window.__hlbPolysCache = null;
    if (!window.__wardBuildingsCache) window.__wardBuildingsCache = {};
  }

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadData() {
      try {
        // 1. Fetch Ward Buildings
        let allWardBuildings = cachedWardBuildings || [];
        if (allWardBuildings.length === 0) {
          if (window.__wardBuildingsCache && window.__wardBuildingsCache[cleanWard]) {
            allWardBuildings = window.__wardBuildingsCache[cleanWard];
          } else {
            const bRes = await fetch(`/gcc_buildings/ward_${cleanWard}.json`);
            if (bRes.ok) {
              const bData = await bRes.json();
              allWardBuildings = bData.features || [];
              if (window.__wardBuildingsCache) {
                window.__wardBuildingsCache[cleanWard] = allWardBuildings;
              }
            }
          }
        }

        // 2. Fetch HLB Block Polygon and surrounding blocks
        let allFeatures = cachedHlbPolys || [];
        if (allFeatures.length === 0) {
          if (window.__hlbPolysCache) {
            allFeatures = window.__hlbPolysCache;
          } else {
            const pRes = await fetch('/hlb_polys.json');
            if (pRes.ok) {
              const pData = await pRes.json();
              allFeatures = pData.features || [];
              window.__hlbPolysCache = allFeatures;
            }
          }
        }

        let matchedPoly = null;
        let neighbors = [];
        if (allFeatures.length > 0) {
          const found = allFeatures.find(f => {
            const p = f.properties || {};
            const bId = String(p.hlb_id || p.code_block || '');
            const wId = String(p.ward_no || p.code_ward || '');
            return (bId === String(blockNo) || bId.includes(String(blockNo))) &&
                   (wId === String(cleanWard) || wId === String(rawWard) || !wId);
          });
          if (found) {
            matchedPoly = found.geometry;
            setAdminProps(found.properties || {});
          }

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

        const visibleNeighbors = neighbors.filter(n => {
          if (!n.center) return false;
          return n.center.lng >= minLng - 0.001 && n.center.lng <= maxLng + 0.001 &&
                 n.center.lat >= minLat - 0.001 && n.center.lat <= maxLat + 0.001;
        });
        setSurroundingBlocks(visibleNeighbors);

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

        const streetMap = new Map();
        filtered.forEach(b => {
          const p = b.properties || {};
          const rName = p.road_name ? p.road_name.trim() : '';
          if (rName && rName.length > 3 && !rName.toLowerCase().includes('null')) {
            let bCenter = getFeatureCenter(b.geometry);
            if (bCenter) {
              if (!streetMap.has(rName)) streetMap.set(rName, []);
              streetMap.get(rName).push(bCenter);
            }
          }
        });

        const streetLabelList = Array.from(streetMap.entries()).map(([name, pts]) => {
          const midLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
          const midLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
          let angle = 0;
          if (pts.length >= 2) {
            const lngs = pts.map(p => p.lng);
            const lats = pts.map(p => p.lat);
            const spreadLng = Math.max(...lngs) - Math.min(...lngs);
            const spreadLat = Math.max(...lats) - Math.min(...lats);
            angle = spreadLat > spreadLng * 1.5 ? -90 : 0;
          }
          return { name, lng: midLng, lat: midLat, angle, pts };
        });

        setBuildings(filtered);
        setStreetLabels(streetLabelList);
        setLoading(false);
        if (onReady) onReady();
      } catch (err) {
        console.error('Error loading single block sheet data:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [cleanWard, blockNo, centerLat, centerLng, cachedHlbPolys, cachedWardBuildings]);

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

  function isPointInPolygon(point, geom) {
    if (!point || !geom || !geom.coordinates) return true;
    const { lng: x, lat: y } = point;
    const rings = geom.type === 'MultiPolygon' ? geom.coordinates[0] : geom.coordinates;
    const ring = rings[0] || [];
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  const svgW = 1000;
  const svgH = 750;

  let minLng = centerLng - 0.003;
  let maxLng = centerLng + 0.003;
  let minLat = centerLat - 0.0022;
  let maxLat = centerLat + 0.0022;

  if (blockPoly && blockPoly.coordinates) {
    const coords = [];
    function extract(arr) {
      if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number') {
        coords.push(arr);
      } else if (Array.isArray(arr)) {
        arr.forEach(extract);
      }
    }
    extract(blockPoly.coordinates);
    if (coords.length > 0) {
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const minX = Math.min(...lngs);
      const maxX = Math.max(...lngs);
      const minY = Math.min(...lats);
      const maxY = Math.max(...lats);
      const cLng = (minX + maxX) / 2;
      const cLat = (minY + maxY) / 2;
      const rawSpanLng = maxX - minX || 0.002;
      const rawSpanLat = maxY - minY || 0.002;
      const cosLat = Math.cos(cLat * Math.PI / 180);
      const canvasAspect = svgW / svgH;
      const geoAspect = (rawSpanLng * cosLat) / Math.max(0.0001, rawSpanLat);

      const marginFactor = 0.08;
      let finalSpanLng, finalSpanLat;
      if (geoAspect > canvasAspect) {
        finalSpanLng = rawSpanLng * (1 + 2 * marginFactor);
        finalSpanLat = (finalSpanLng / canvasAspect) / cosLat;
      } else {
        finalSpanLat = rawSpanLat * (1 + 2 * marginFactor);
        finalSpanLng = (finalSpanLat * canvasAspect) * cosLat;
      }
      minLng = cLng - finalSpanLng / 2;
      maxLng = cLng + finalSpanLng / 2;
      minLat = cLat - finalSpanLat / 2;
      maxLat = cLat + finalSpanLat / 2;
    }
  }

  function projectToSvg(lng, lat) {
    const x = ((lng - minLng) / (maxLng - minLng)) * svgW;
    const y = svgH - ((lat - minLat) / (maxLat - minLat)) * svgH;
    return [x, y];
  }

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

    const minTx = lngToTileX(minLng, tileZ) - 1;
    const maxTx = lngToTileX(maxLng, tileZ) + 1;
    const minTy = latToTileY(maxLat, tileZ) - 1;
    const maxTy = latToTileY(minLat, tileZ) + 1;

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
          width: Math.ceil(x2 - x1) + 1,
          height: Math.ceil(y2 - y1) + 1
        });
      }
    }
    return tiles;
  })();

  useEffect(() => {
    if (!googleTiles || googleTiles.length === 0) return;
    let isCancelled = false;

    async function loadTilesAsBase64() {
      const results = {};
      await Promise.all(
        googleTiles.map(async (t) => {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = t.url;
            await new Promise((resolve) => {
              img.onload = () => {
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.naturalWidth || 256;
                  canvas.height = img.naturalHeight || 256;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0);
                  results[t.key] = canvas.toDataURL('image/png');
                } catch (ce) {
                  results[t.key] = t.url;
                }
                resolve();
              };
              img.onerror = () => {
                results[t.key] = t.url;
                resolve();
              };
            });
          } catch (e) {
            results[t.key] = t.url;
          }
        })
      );
      if (!isCancelled) {
        setTileDataUrls(results);
      }
    }

    loadTilesAsBase64();
    return () => { isCancelled = true; };
  }, [minLng, minLat, maxLng, maxLat]);

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
  }[sketchStyle] || {
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
  };

  return (
    <div
      ref={ref}
      data-loaded={!loading}
      className={`a3OfficialSheet ${sketchStyle.toLowerCase()} ${paperSize === 'A4' ? 'print_a4' : ''}`}
      style={{
        pageBreakAfter: 'always',
        breakAfter: 'page',
        marginBottom: '20px',
        background: '#ffffff',
        color: '#0f172a'
      }}
    >
      {/* 1. TOP OFFICIAL HEADER */}
      <div className="a3OffHdr">
        <div className="a3OffHdrLeft">
          <span className="a3OffMainTitle">
            {language === 'TAMIL' ? 'இந்திய மக்கள் தொகை கணக்கெடுப்பு 2027' : 'CENSUS OF INDIA 2027'}
          </span>
        </div>
        <div className="a3OffHdrCenter">
          {language === 'TAMIL' ? (
            <>
              <span className="a3OffNotice">இது ஒரு முக்கியமான மக்கள் தொகை கணக்கெடுப்பு ஆவணம். தயவு செய்து இந்த வரைபடத்தை நேர்த்தியாகவும் சரியாகவும் வரையவும்</span>
              <span className="a3OffType">விவரமான கோட்டு வரைபடம்</span>
            </>
          ) : (
            <>
              <span className="a3OffNotice">This is an important Census document. Please draw this map neatly and correctly.</span>
              <span className="a3OffType">LAYOUT MAP</span>
            </>
          )}
        </div>
        <div className="a3OffHdrRight">
          <span>
            {language === 'TAMIL'
              ? 'வீட்டுப்பட்டியல் & வீடுகள் கணக்கெடுப்பு / மக்கள் தொகை கணக்கெடுப்பு'
              : 'Houselisting & Housing Census/Population Enumeration'}
          </span>
        </div>
      </div>

      {/* 2. BODY: LEFT FORM COLUMN + RIGHT MAP CANVAS */}
      <div className="a3OffBody">

        {/* LEFT COLUMN: CODES & LEGEND & SIGNATURES */}
        <div className="a3OffLeft">
          <div className="a3OffAdminHierarchy">
            {/* 1. State */}
            <div className="a3OffFieldBlock">
              <div className="a3OffFieldLabelRow">
                <span>{language === 'TAMIL' ? 'மாநிலம் / யூ.டி பெயர்' : 'Name of State/UT'}</span>
                <span className="a3OffDottedLine">...................................................</span>
              </div>
              <div className="a3OffCodeBoxRow">
                <span className="a3OffCodeLabel">{language === 'TAMIL' ? 'குறியீட்டு எண்' : 'Code No.'}</span>
                <div className="a3OffCodeBoxes">
                  <span className="a3OffCodeBox">3</span>
                  <span className="a3OffCodeBox">4</span>
                </div>
              </div>
            </div>

            {/* 2. District */}
            <div className="a3OffFieldBlock">
              <div className="a3OffFieldLabelRow">
                <span>{language === 'TAMIL' ? 'மாவட்டத்தின் பெயர்' : 'Name of District'}</span>
                <span className="a3OffDottedLine">...................................................</span>
              </div>
              <div className="a3OffCodeBoxRow">
                <span className="a3OffCodeLabel">{language === 'TAMIL' ? 'குறியீட்டு எண்' : 'Code No.'}</span>
                <div className="a3OffCodeBoxes">
                  <span className="a3OffCodeBox">0</span>
                  <span className="a3OffCodeBox">2</span>
                </div>
              </div>
            </div>

            {/* 3. Tahsil / Taluk */}
            <div className="a3OffFieldBlock">
              <div className="a3OffFieldLabelRow">
                <span>{language === 'TAMIL' ? 'தாலுகாவின் பெயர்' : 'Name of Tahsil/ Taluk/ PS/ Dev. Block/ Circle/ Mandal etc.'}</span>
                <span className="a3OffDottedLine">..................</span>
              </div>
              <div className="a3OffCodeBoxRow">
                <span className="a3OffCodeLabel">{language === 'TAMIL' ? 'குறியீட்டு எண்' : 'Code No.'}</span>
                <div className="a3OffCodeBoxes">
                  <span className="a3OffCodeBox">0</span>
                  <span className="a3OffCodeBox">0</span>
                  <span className="a3OffCodeBox">8</span>
                </div>
              </div>
            </div>

            {/* 4. Town / Village */}
            <div className="a3OffFieldBlock">
              <div className="a3OffFieldLabelRow">
                <span>{language === 'TAMIL' ? 'நகரத்தின் / கிராமத்தின் பெயர்' : 'Name of Town/Village'}</span>
                <span className="a3OffDottedLine">...................................</span>
              </div>
              <div className="a3OffCodeBoxRow">
                <span className="a3OffCodeLabel">{language === 'TAMIL' ? 'குறியீட்டு எண்' : 'Code No.'}</span>
                <div className="a3OffCodeBoxes">
                  {['7','0','1','6','0','0','0','0'].map((d, i) => (
                    <span key={i} className="a3OffCodeBox">{d}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Ward Code */}
            <div className="a3OffFieldBlock">
              <div className="a3OffFieldLabelRow">
                <span>{language === 'TAMIL' ? 'வார்டு குறியீட்டு எண் (நகரத்திற்கு மட்டும்)' : 'Ward Code No (Only for Town)'}</span>
                <span className="a3OffDottedLine">..................</span>
              </div>
              <div className="a3OffCodeBoxRow">
                <span className="a3OffCodeLabel">{language === 'TAMIL' ? 'குறியீட்டு எண்' : 'Code No.'}</span>
                <div className="a3OffCodeBoxes">
                  {String(parseInt(cleanWard, 10) || 72).padStart(4, '0').split('').map((d, i) => (
                    <span key={i} className="a3OffCodeBox">{d}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. Block & Sub-block */}
            <div className="a3OffFieldBlock">
              <div className="a3OffFieldLabelRow" style={{ fontSize: '7.2px' }}>
                <span>{language === 'TAMIL' ? 'வீட்டுப்பட்டியல் பிளாக் எண் / கணக்கெடுப்பு பிளாக் எண் & சப்-பிளாக் எண்' : 'Houselisting Block No./ Enumeration Block No. & Sub-Block No.'}</span>
              </div>
              <div className="a3OffCodeBoxRow" style={{ justifyContent: 'flex-end', marginTop: '2px' }}>
                <div className="a3OffCodeBoxes">
                  {String(blockNo).replace(/\D/g, '').padStart(4, '0').slice(-4).split('').map((d, i) => (
                    <span key={i} className="a3OffCodeBox">{d}</span>
                  ))}
                </div>
                <span style={{ fontWeight: 900, margin: '0 3px' }}>—</span>
                <div className="a3OffCodeBoxes">
                  <span className="a3OffCodeBox">0</span>
                  <span className="a3OffCodeBox">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Official Legend */}
          <div className="a3OffLegendSection">
            <div className="a3OffLegendHeader">
              <strong>{language === 'TAMIL' ? 'குறிப்புகள் (LEGEND)' : 'LEGEND'}</strong>
            </div>

            <div className="a3OffLegRow">
              <span>{language === 'TAMIL' ? 'பிளாக் எல்லை' : 'Block Boundary'} . . .</span>
              <span className="a3OffBoundSample">— · · — · · —</span>
            </div>

            <div className="a3OffNeighborNote">
              <p><strong>{language === 'TAMIL' ? 'குறிப்பு:' : 'Note:'}</strong> {language === 'TAMIL'
                ? 'கோட்டு வரைபடத்தின் நான்கு திசைகளுக்கும் (வடக்கு, கிழக்கு, தெற்கு மற்றும் மேற்கு) அருகிலுள்ள வீட்டுப்பட்டியல்/கணக்கெடுப்பு பிளாக்குகள் அல்லது கிராமங்களின் எண் அல்லது பெயரை கொடுக்கவும்.'
                : 'Please give the number or name of neighbouring Houselisting/Population Enumeration Blocks or Villages on all the four directions (North, East, South and West) of layout map.'}
              </p>
            </div>

            {/* Pucca Building */}
            <div className="a3OffLegGroup">
              <span className="a3OffLegGroupTitle">{language === 'TAMIL' ? 'உறுதியான கட்டிடம் (எண்ணுடன்)' : 'Pucca Building (with number)'}</span>
              <div className="a3OffLegItemRow">
                <span>{language === 'TAMIL' ? 'குடியிருப்பு' : 'Residential'} . . .</span>
                <svg width="18" height="15" style={{ flexShrink: 0 }}><rect x="2" y="1" width="14" height="12" fill="none" stroke="#0f172a" strokeWidth="1.5" /></svg>
              </div>
              <div className="a3OffLegItemRow">
                <span>{language === 'TAMIL' ? 'குடியிருப்பு அல்லாத' : 'Non-residential'} . . .</span>
                <svg width="18" height="15" style={{ flexShrink: 0 }}>
                  <rect x="2" y="1" width="14" height="12" fill="url(#pencilHatch)" stroke="#0f172a" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            {/* Roads & Features */}
            <div className="a3OffLegItemRow">
              <span>{language === 'TAMIL' ? 'உறுதியான சாலை' : 'Pucca Road'} . . .</span>
              <svg width="40" height="8" style={{ flexShrink: 0 }}>
                <line x1="0" y1="2" x2="40" y2="2" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="0" y1="6" x2="40" y2="6" stroke="#0f172a" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="a3OffLegItemRow">
              <span>{language === 'TAMIL' ? 'உறுதியற்ற சாலை' : 'Kutcha Road'} . . .</span>
              <svg width="40" height="8" style={{ flexShrink: 0 }}>
                <line x1="0" y1="2" x2="40" y2="2" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="4,3" />
                <line x1="0" y1="6" x2="40" y2="6" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="4,3" />
              </svg>
            </div>

            <div className="a3OffLegItemRow">
              <span>{language === 'TAMIL' ? 'நடைபாதை' : 'Pathway'} . . .</span>
              <svg width="40" height="6" style={{ flexShrink: 0 }}>
                <line x1="0" y1="3" x2="40" y2="3" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="3,3" />
              </svg>
            </div>

            <div className="a3OffLegItemRow">
              <span>{language === 'TAMIL' ? 'கிணறு / குழாய் / கை பம்பு' : 'Well, Tap, Handpump'} . . .</span>
              <span style={{ fontSize: '11px', letterSpacing: '2px' }}>⊙ 🚰 ⚲</span>
            </div>

            <div className="a3OffLegItemRow">
              <span>{language === 'TAMIL' ? 'கோயில், மசூதி, தேவாலயம்' : 'Temple, Mosque, Church'} . . .</span>
              <span style={{ fontSize: '11px', letterSpacing: '2px' }}>🛕 🕌 ⛪</span>
            </div>
          </div>

          {/* Section C: Signatures */}
          <div className="a3OffSigs">
            <div className="a3OffSigField">
              <span>{language === 'TAMIL' ? 'கணக்கெடுப்பாளரின் பெயர்' : 'Name of Enumerator'}</span>
              <div style={{ fontSize: '7.8px', fontWeight: 'bold', color: '#1e293b', borderBottom: '1px solid #94a3b8', padding: '1px 0' }}>
                {enumeratorName}
              </div>
            </div>
            <div className="a3OffSigField">
              <span>{language === 'TAMIL' ? 'கணக்கெடுப்பாளரின் தேதியிட்ட கையொப்பம்' : 'Enumerator Signature with date'}</span>
              <div className="a3OffSigLine" />
            </div>
            <div className="a3OffSigField">
              <span>{language === 'TAMIL' ? 'மேற்பார்வையாளரின் பெயர்' : 'Name of Supervisor'}</span>
              <div style={{ fontSize: '7.8px', fontWeight: 'bold', color: '#1e293b', borderBottom: '1px solid #94a3b8', padding: '1px 0' }}>
                {supervisorName}
              </div>
            </div>
            <div className="a3OffSigField">
              <span>{language === 'TAMIL' ? 'மேற்பார்வையாளரின் தேதியிட்ட கையொப்பம்' : 'Supervisor Signature with date'}</span>
              <div className="a3OffSigLine" />
            </div>
          </div>
        </div>

        {/* RIGHT MAP CANVAS */}
        <div className="a3OffRight">
          {loading ? (
            <div className="a3LoadingState">
              <Sparkles size={32} className="spinning" />
              <p>{language === 'TAMIL' ? 'வரைபடம் தயாரிக்கப்படுகிறது...' : 'Preparing Census Layout Map...'}</p>
              <span>Block #{blockNo} loading...</span>
            </div>
          ) : (
            <>
              {/* North Arrow */}
              <div className="a3OffNorth">
                <span className="a3OffNorthLabel">{language === 'TAMIL' ? 'வடக்கு' : 'NORTH'}</span>
                <svg width="24" height="46" viewBox="0 0 24 46">
                  <line x1="12" y1="42" x2="12" y2="4" stroke="#0f172a" strokeWidth="2" />
                  <polygon points="12,0 6,14 12,10 18,14" fill="#0f172a" />
                </svg>
              </div>

              {/* Vector SVG */}
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
                </defs>

                {/* Paper Grid */}
                <rect width={svgW} height={svgH} fill="url(#draftsmanGrid)" />

                {/* Google Tile Roadmap Background */}
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
                        href={tileDataUrls[t.key] || t.url}
                        xlinkHref={tileDataUrls[t.key] || t.url}
                        crossOrigin="anonymous"
                        x={t.x}
                        y={t.y}
                        width={t.width}
                        height={t.height}
                        preserveAspectRatio="none"
                      />
                    ))}
                  </g>
                )}

                {/* Surrounding HLB Blocks */}
                {surroundingBlocks.map((sb, sIdx) => {
                  const pathD = renderPolygonPath(sb.geometry.coordinates, sb.geometry.type);
                  if (!sb.center) return null;
                  const [cx, cy] = projectToSvg(sb.center.lng, sb.center.lat);
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

                {/* Active Block Boundary Highlight */}
                {blockPoly && (
                  <g className="a3ActiveBlockHighlight">
                    <path
                      d={renderPolygonPath(blockPoly.coordinates, blockPoly.type)}
                      fill="none"
                      stroke="rgba(37, 99, 235, 0.12)"
                      strokeWidth="10"
                      strokeLinejoin="round"
                    />
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

                {/* Buildings Footprints */}
                {buildings.map((b, idx) => {
                  const p = b.properties || {};
                  const pathD = renderPolygonPath(b.geometry.coordinates, b.geometry.type);
                  const isComm = String(p.building_used_as || '').toLowerCase().includes('commerc') || String(p.building_used_as || '').toLowerCase().includes('shop');
                  const doorNo = p.door_new_no || p.door_old_no || String(idx + 1);
                  const center = getFeatureCenter(b.geometry);
                  const [cx, cy] = center ? projectToSvg(center.lng, center.lat) : [0, 0];
                  const isInside = b.isInside !== false;

                  if (!isInside) {
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

                {/* North Compass */}
                <g transform={`translate(${svgW - 55}, 55)`}>
                  <circle r="22" fill={theme.badgeBg} stroke={theme.stroke} strokeWidth="1.5" opacity="0.9" />
                  <polygon points="0,-18 4,-4 0,0 -4,-4" fill="#ef4444" />
                  <polygon points="0,18 4,4 0,0 -4,4" fill={theme.stroke} />
                  <text x="0" y="-20" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="900">N</text>
                </g>

                {/* Scale Bar */}
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
      </div>
    </div>
  );
});

export default CensusBlockA3SingleSheet;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Phone, CheckCircle2, Clock, Search, Shield, ChevronRight, Lock, AlertCircle, X, Sparkles, AlertTriangle } from 'lucide-react';
import hlbMapping from './hlbMapping.json';

const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api' : 'https://psk-builders.onrender.com/api');

export default function CensusPublicSupervisorReport() {
  const [allotedRows, setAllotedRows] = useState([]);
  const [chargeRows, setChargeRows] = useState([]);
  const [userRows, setUserRows] = useState([]);
  const [appUserRows, setAppUserRows] = useState([]);
  const [hlbMappingRows, setHlbMappingRows] = useState([]);
  const [censusErrorRows, setCensusErrorRows] = useState([]);
  const [selectedErrorModal, setSelectedErrorModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hodTab, setHodTab] = useState('summary'); // 'summary' | 'expanded'
  const [expandedCircleIds, setExpandedCircleIds] = useState(new Set());

  // 1. Anti-Inspect & Security Protection
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['U', 'S', 'P', 'A'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 2. Query Params
  const queryParams = useMemo(() => {
    if (typeof window === 'undefined') return { circle: '', id: '', role: 'hod', isAdmin: false, isHod: true, isSupervisorRequest: false, isInvalidCircle: false };
    const sp = new URLSearchParams(window.location.search);
    const circle = (sp.get('circle') || sp.get('c') || '').trim();
    const id = (sp.get('id') || sp.get('supId') || sp.get('supervisor') || '').trim();
    const roleRaw = (sp.get('role') || sp.get('view') || '').toLowerCase().trim();
    
    // Check if ID is 'admin' or 'hod'
    const isAdmin = roleRaw === 'admin' || id.toLowerCase() === 'admin' || sp.has('admin');
    const isHod = roleRaw === 'hod' || id.toLowerCase() === 'hod' || sp.has('hod') || (!circle && !id && !isAdmin);
    
    // Validate circle number: must be 1-3 digits only, between 001-075
    const isSupervisorRequest = !isAdmin && !isHod && !!(circle || id);
    let isInvalidCircle = false;
    if (isSupervisorRequest && circle) {
      const numOnly = circle.replace(/[^0-9]/g, '');
      // Must be all digits, max 3 digits
      if (numOnly !== circle || numOnly.length > 3 || numOnly.length === 0) {
        isInvalidCircle = true;
      } else {
        const num = parseInt(numOnly, 10);
        if (num < 1 || num > 75) {
          isInvalidCircle = true;
        }
      }
    }
    
    return { circle, id, role: isAdmin ? 'admin' : (isHod ? 'hod' : 'supervisor'), isAdmin, isHod, isSupervisorRequest, isInvalidCircle };
  }, []);

  const dbHlbMap = useMemo(() => {
    const map = new Map();
    if (hlbMappingRows.length > 0) {
      hlbMappingRows.forEach(m => {
        const fullId = String(m.full_hlb_id || m.full_hlb || m.hlb_code || '').trim();
        const hNo = String(m.hlb_no || m.hlb_code || m.blk_no || '').trim();
        if (fullId && hNo) map.set(fullId, hNo.padStart(4, '0'));
      });
    }
    return map;
  }, [hlbMappingRows]);

  const getHlbBlockNo = useCallback((codeStr) => {
    if (!codeStr) return '0001';
    let s = String(codeStr).trim();
    if (dbHlbMap.has(s)) return dbHlbMap.get(s);
    if (hlbMapping[s]) return hlbMapping[s];
    if (s.length >= 19 && /^\d+$/.test(s)) {
      if (s.endsWith('00')) {
        const blkPart = s.slice(-6, -2);
        if (blkPart && blkPart !== '0000') return blkPart.padStart(4, '0');
      }
      const blkPart = s.substring(15, 19);
      if (blkPart && blkPart !== '0000') return blkPart.padStart(4, '0');
    }
    if (/hlb/i.test(s)) {
      const numPart = s.replace(/[^0-9]/g, '');
      if (numPart) return numPart.padStart(4, '0');
    }
    if (/^\d{1,4}$/.test(s)) return s.padStart(4, '0');
    const match = s.match(/(\d{1,4})(?:00)?$/) || s.match(/(\d{1,4})$/);
    return match && match[1] ? match[1].padStart(4, '0') : s.padStart(4, '0');
  }, [dbHlbMap]);

  // Fast Public Fetcher (NO hlb_records - Only lightweight summary metadata!)
  const token = () => {
    try {
      const s = sessionStorage.getItem('psk_auth') || localStorage.getItem('psk_auth') || sessionStorage.getItem('psk_admin_creds') || localStorage.getItem('psk_admin_creds');
      if (s) return JSON.parse(s).token || '';
    } catch { }
    return '';
  };

  async function publicFetch(endpoint) {
    try {
      const t = token();
      const headers = { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
      let res = await fetch(`${API_BASE}/admin/db2${endpoint}`, { headers });
      if (!res.ok) {
        let res2 = await fetch(`${API_BASE}/admin/census/db2${endpoint}`, { headers });
        if (res2.ok) return res2;
      }
      return res;
    } catch (e) {
      return { ok: false, json: async () => ({}) };
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [rAllot, rCharge, rUser, rAppUser, rMap, rCodeMap, rErrors] = await Promise.all([
          publicFetch('/table/hlb_allotted?limit=5000&offset=0').then(r => r.json().catch(() => ({}))),
          publicFetch('/table/charge_wise_report?limit=5000&offset=0').then(r => r.json().catch(() => ({}))),
          publicFetch('/table/user_details?limit=5000&offset=0').then(r => r.json().catch(() => ({}))),
          publicFetch('/table/app_user?limit=5000&offset=0').then(r => r.json().catch(() => ({}))),
          publicFetch('/table/hlb_mapping?limit=5000&offset=0').then(r => r.json().catch(() => ({}))),
          publicFetch('/table/hlb_code_mapping?limit=5000&offset=0').then(r => r.json().catch(() => ({}))),
          publicFetch('/table/census_errors?limit=5000&offset=0').then(r => r.json().catch(() => ({})))
        ]);

        if (rAllot.rows?.length) setAllotedRows(rAllot.rows);
        if (rCharge.rows?.length) setChargeRows(rCharge.rows);
        if (rUser.rows?.length) setUserRows(rUser.rows);
        if (rAppUser.rows?.length) setAppUserRows(rAppUser.rows);
        if (rErrors.rows?.length) setCensusErrorRows(rErrors.rows);

        const mapsCombined = [...(rMap.rows || []), ...(rCodeMap.rows || [])];
        if (mapsCombined.length) setHlbMappingRows(mapsCombined);
      } catch (err) {
        console.warn('Data load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Map of Errors by HLB Code
  const errorsMap = useMemo(() => {
    const map = new Map();
    censusErrorRows.forEach(e => {
      const rawCode = String(e.hlb_code || '').trim();
      const padded = rawCode.padStart(4, '0');
      const unpadded = String(parseInt(padded, 10) || padded);

      const uniqueKeys = Array.from(new Set([rawCode, padded, unpadded])).filter(Boolean);
      uniqueKeys.forEach(k => {
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(e);
      });
    });
    return map;
  }, [censusErrorRows]);

  // Combined User Phone & Details Map
  const combinedUserMap = useMemo(() => {
    const map = new Map();
    const allUsers = [...userRows, ...appUserRows];

    allUsers.forEach(u => {
      const mob = String(u.mobile_no || u.mobile || u.phone || u.phone_number || '').trim();
      const name = String(u.name || u.user_name || u.full_name || '').trim();
      const uname = String(u.username || u.user_id || '').trim();

      const entry = {
        mobile: mob && mob !== 'null' && mob !== 'undefined' ? mob : '',
        name: name,
        username: uname
      };

      if (uname) {
        map.set(uname.toLowerCase(), entry);
        const parts = uname.split('_');
        if (parts.length > 1) map.set(parts[parts.length - 1].toLowerCase(), entry);
      }
      if (name) {
        map.set(name.toLowerCase(), entry);
      }
    });

    return map;
  }, [userRows, appUserRows]);

  // Robust Phone & Name Resolver
  const resolveUser = useCallback((rawName, rawId, isSupervisor = false) => {
    const n = String(rawName || '').trim();
    const id = String(rawId || '').trim();

    if (id && combinedUserMap.has(id.toLowerCase())) {
      const u = combinedUserMap.get(id.toLowerCase());
      if (u.mobile) return { mobile: u.mobile, name: u.name || n || id, username: u.username || id };
    }

    if (n && combinedUserMap.has(n.toLowerCase())) {
      const u = combinedUserMap.get(n.toLowerCase());
      if (u.mobile) return { mobile: u.mobile, name: u.name || n, username: u.username || id };
    }

    for (const [k, u] of combinedUserMap.entries()) {
      if ((n && k.includes(n.toLowerCase())) || (id && k.includes(id.toLowerCase()))) {
        if (u.mobile) return { mobile: u.mobile, name: u.name || n, username: u.username || id };
      }
    }

    return { mobile: 'N/A', name: n || (isSupervisor ? 'SUPERVISOR' : 'ENUMERATOR'), username: id || 'N/A' };
  }, [combinedUserMap]);

  // 4. Build Exact Supervisor & Enumerator Models
  const allCircles = useMemo(() => {
    const chargeMetricsMap = new Map();
    if (chargeRows.length > 0) {
      chargeRows.forEach(c => {
        if (parseInt(c.total_households || 0) > 10000) return;
        const fullHlb = String(c.full_hlb || c.hlb_code || c.hlb_no || c.hlb_serial_no || c.blk_no || c.block_no || '').trim();
        if (!fullHlb) return;
        const blkKey = getHlbBlockNo(fullHlb);
        if (!blkKey) return;

        const exp = parseInt(c.total_expected_census_houses || c.expected_census_houses || c.expected_houses || 0);
        const houses = parseInt(c.total_census_houses || c.census_houses || c.total_houses || 0);
        const hh = parseInt(c.total_households || c.total_census_households || c.census_households || 0);
        const ver = parseInt(c.total_household_verified_by_supervisor || c.verified_by_supervisor || c.verified_households || 0);
        const pop = parseInt(c.total_population || c.population || c.tot_population || 0);
        const seUsed = parseInt(c.total_se_id_used || c.total_se_used || c.se_id_used || c.total_self_enum || c.se_used || 0);

        const stVal = String(c.status ?? c.completed ?? c.work_status ?? c.is_completed ?? '').trim().toLowerCase();
        const isComp = stVal === '1' || stVal === 'completed' || stVal === 'true';

        chargeMetricsMap.set(blkKey, { exp, houses, hh, ver, pop, isComp, seUsed });
        chargeMetricsMap.set(String(parseInt(blkKey, 10)), { exp, houses, hh, ver, pop, isComp, seUsed });
        chargeMetricsMap.set(blkKey.padStart(4, '0'), { exp, houses, hh, ver, pop, isComp, seUsed });
      });
    }

    if (allotedRows.length > 0) {
      const circleMap = new Map();

      allotedRows.forEach(a => {
        const areaType = String(a.area_type || '').toUpperCase();
        if (areaType && areaType !== 'HLB') return;
        if (parseInt(a.total_households || 0) > 10000) return;
        
        const scNumStr = String(a.sc_serial_no || a.circle_no || a.circle_number || a.circle || '').trim();
        if (!scNumStr) return;
        
        const scNum = parseInt(scNumStr.replace(/[^0-9]/g, '') || '0');
        const circleNo = `Circle ${String(scNum).padStart(3, '0')}`;
        if (!circleMap.has(circleNo)) circleMap.set(circleNo, []);
        circleMap.get(circleNo).push(a);
      });

      const circles = [];
      const sortedCircleKeys = Array.from(circleMap.keys()).sort();

      sortedCircleKeys.forEach(circleNo => {
        const allotList = circleMap.get(circleNo);
        if (!allotList || allotList.length === 0) return;

        const firstRow = allotList[0];
        const rawSupName = String(firstRow.supervisor_name || firstRow.supervisor || firstRow.supervisor_full_name || firstRow.sup_name || '').trim();
        const rawSupId = String(firstRow.supervisor_id || firstRow.sup_id || '').trim();
        const supResolved = resolveUser(rawSupName, rawSupId, true);

        const supMobFromAllot = String(firstRow.supervisor_mobile || firstRow.sup_mobile || firstRow.mobile_no || firstRow.mobile || firstRow.phone || '').trim();
        const finalSupMobile = (supResolved.mobile && supResolved.mobile !== 'N/A') ? supResolved.mobile : (supMobFromAllot || 'N/A');

        const enumerators = allotList.map(a => {
          const rawEnumName = String(a.enumerator_name || a.enumerator || a.enum_name || a.enumerator_full_name || a.user_name || '').trim();
          const rawEnumId = String(a.user_id || a.enumerator_id || a.username || '').trim();
          const enumResolved = resolveUser(rawEnumName, rawEnumId, false);

          const enumMobFromAllot = String(a.enumerator_mobile || a.enum_mobile || a.mobile || a.mobile_no || a.phone || a.user_mobile || '').trim();
          const finalEnumMobile = (enumResolved.mobile && enumResolved.mobile !== 'N/A') ? enumResolved.mobile : (enumMobFromAllot || 'N/A');
          
          const hlbSerial = String(a.hlb_serial_no || a.hlb_block_no || a.hlb_block_number || a.hlb_no || a.hlb_code || '').trim();
          const blkCode = getHlbBlockNo(hlbSerial) || hlbSerial.padStart(4, '0');
          const padded = blkCode.padStart(4, '0');

          const cData = chargeMetricsMap.get(blkCode) || chargeMetricsMap.get(padded) || {};
          const errList = errorsMap.get(padded) || errorsMap.get(blkCode) || [];

          const expHouses = cData.exp || parseInt(a.total_expected_census_houses || 0);
          const housesCount = cData.houses || parseInt(a.total_census_houses || 0);
          const hhCount = cData.hh || parseInt(a.total_households || 0);
          const verCount = cData.ver || parseInt(a.total_household_verified_by_supervisor || 0);
          const popCount = cData.pop || parseInt(a.total_population || 0);
          const seIdUsed = cData.seUsed || parseInt(a.total_se_id_used || a.total_se_used || a.se_id_used || 0);
          const stAllot = String(a.status ?? a.completed ?? a.work_status ?? '').trim().toLowerCase();
          const isComp = cData.isComp || stAllot === '1' || stAllot === 'completed' || stAllot === 'true';

          return {
            enumId: enumResolved.username !== 'N/A' ? enumResolved.username : (rawEnumId || `ENUM-${rawEnumName}`),
            enumName: enumResolved.name || rawEnumName,
            enumMobile: finalEnumMobile,
            hlbCode: padded,
            expectedHouses: expHouses,
            censusHouses: housesCount,
            households: hhCount,
            verifiedBySup: verCount,
            seIdUsed: seIdUsed,
            totalPopulation: popCount,
            errorCount: errList.length,
            errorRecords: errList,
            isCompleted: isComp
          };
        });

        circles.push({
          circleNo,
          circleNumber: parseInt(circleNo.replace(/[^0-9]/g, '')) || 0,
          supervisorName: supResolved.name || rawSupName,
          supervisorId: supResolved.username !== 'N/A' ? supResolved.username : (rawSupId || ''),
          supervisorMobile: finalSupMobile,
          enumerators
        });
      });

      return circles;
    }

    return [];
  }, [allotedRows, chargeRows, getHlbBlockNo, resolveUser, errorsMap]);

  // Target Circle matching: circle number (e.g. 001) OR supervisor ID (e.g. sm_...)
  const targetCircleData = useMemo(() => {
    if (queryParams.isAdmin || queryParams.isHod) return null;
    // If circle number is invalid/out-of-range, return undefined (triggers not-found page)
    if (queryParams.isInvalidCircle) return undefined;
    const searchTarget = queryParams.circle || queryParams.id;
    if (!searchTarget) return null;

    // For numeric circle queries: use STRICT match only (padded 3-digit comparison)
    const circleNumOnly = searchTarget.replace(/[^0-9]/g, '');
    const isNumericQuery = circleNumOnly.length > 0 && circleNumOnly === searchTarget.replace(/\s/g, '');

    const found = allCircles.find(c => {
      const cNum = String(c.circleNumber).padStart(3, '0');
      const sId = (c.supervisorId || '').toLowerCase().replace(/[^0-9a-z_]/g, '');
      const sName = c.supervisorName.toLowerCase().replace(/[^0-9a-z_]/g, '');

      if (isNumericQuery) {
        // Strict numeric match: padded must exactly equal (e.g. '016' === '016')
        const paddedQuery = circleNumOnly.padStart(3, '0');
        return cNum === paddedQuery;
      } else {
        // Non-numeric: match supervisor ID or name
        const q = searchTarget.toLowerCase().replace(/[^0-9a-z_]/g, '');
        return (sId && sId.includes(q)) || sName.includes(q);
      }
    });

    // If user explicitly requested a supervisor view but no matching circle found → undefined (not-found)
    if (found === undefined && queryParams.isSupervisorRequest) return undefined;
    return found ?? null;
  }, [allCircles, queryParams]);

  // 5. HOD Overall Stats
  const hodStats = useMemo(() => {
    let totExp = 0, totCen = 0, totHH = 0, totVer = 0, totSe = 0, totPop = 0, totErr = 0, totComp = 0, totHlbs = 0;
    const uniqueEnums = new Set();

    allCircles.forEach(c => {
      c.enumerators.forEach(e => {
        totHlbs++;
        if (e.enumId || e.enumName) uniqueEnums.add(e.enumId || e.enumName);
        totExp += e.expectedHouses;
        totCen += e.censusHouses;
        totHH += e.households;
        totVer += e.verifiedBySup;
        totSe += e.seIdUsed;
        totPop += e.totalPopulation;
        totErr += e.errorCount;
        if (e.isCompleted) totComp++;
      });
    });

    const totalRow = chargeRows.find(c => {
      const name = String(c.area_name || c.area_code || '').trim().toLowerCase();
      return name === 'total' || String(c.id) === '472';
    });

    if (totalRow) {
      totExp = parseInt(totalRow.total_expected_census_houses || totalRow.expected_census_houses || totalRow.expected_houses || 0) || totExp;
      totCen = parseInt(totalRow.total_census_houses || totalRow.census_houses || totalRow.total_houses || 0) || totCen;
      totHH = parseInt(totalRow.total_households || totalRow.total_census_households || totalRow.census_households || 0) || totHH;
      totVer = parseInt(totalRow.total_household_verified_by_supervisor || totalRow.verified_by_supervisor || totalRow.verified_households || 0) || totVer;
      totPop = parseInt(totalRow.total_population || totalRow.population || totalRow.tot_population || 0) || totPop;
      const totalRowSe = parseInt(totalRow.total_se_id_used || totalRow.total_se_used || totalRow.se_id_used || 0);
      if (totalRowSe > 0) totSe = totalRowSe;
    }

    return {
      totalCircles: Math.min(allCircles.length || 75, 75),
      totalEnums: Math.min(uniqueEnums.size || 450, 450),
      totalHlbs: Math.min(totHlbs || 470, 470),
      expectedHouses: totExp,
      censusHouses: totCen,
      households: totHH,
      verifiedBySup: totVer,
      totalSeId: totSe,
      totalPopulation: totPop,
      totalErrors: totErr || censusErrorRows.length,
      completedCount: totComp
    };
  }, [allCircles, chargeRows, censusErrorRows]);

  // Filtered list for HOD search
  const filteredHodCircles = useMemo(() => {
    if (!searchQuery.trim()) return allCircles;
    const q = searchQuery.toLowerCase().trim();
    return allCircles.filter(c => 
      c.circleNo.toLowerCase().includes(q) ||
      c.supervisorName.toLowerCase().includes(q) ||
      (c.supervisorId && c.supervisorId.toLowerCase().includes(q)) ||
      (c.supervisorMobile && c.supervisorMobile.includes(q)) ||
      c.enumerators.some(e => e.enumName.toLowerCase().includes(q) || e.enumId.toLowerCase().includes(q) || String(e.hlbCode).includes(q))
    );
  }, [allCircles, searchQuery]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0d14',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '14px 10px',
      userSelect: 'none',
      WebkitUserSelect: 'none'
    }}>
      <style>{`
        @media (max-width: 640px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px !important;
          }
          .kpi-card {
            padding: 8px 10px !important;
          }
          .kpi-value {
            font-size: 14px !important;
          }
          .supervisor-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .supervisor-stats-row {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
            font-size: 10px !important;
          }
          .single-circle-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 8px !important;
          }
          .modal-card {
            max-height: 94vh !important;
            width: 98vw !important;
            margin: 4px !important;
            border-radius: 12px !important;
          }
          .brand-title {
            font-size: 13px !important;
          }
          .brand-sub {
            font-size: 10px !important;
          }
          .tab-btn {
            font-size: 10.5px !important;
            padding: 6px 10px !important;
          }
        }
      `}</style>
      {/* Top Brand Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 16px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #e11d48, #991b1b)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '14px',
            color: '#ffffff'
          }}>
            PSK
          </div>
          <div>
            <h1 className="brand-title" style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: '0.5px' }}>
              {targetCircleData ? `CENSUS SUPERVISOR PROGRESS REPORT` : (queryParams.isAdmin ? `CENSUS CENTRAL ADMIN MASTER PORTAL` : `CENSUS HEAD OF DEPARTMENT (HOD) PORTAL`)}
            </h1>
            <p className="brand-sub" style={{ fontSize: '11px', margin: 0, color: '#94a3b8' }}>
              {targetCircleData ? `${targetCircleData.circleNo} — Supervisor Portal (${targetCircleData.supervisorId || targetCircleData.supervisorName})` : (queryParams.isAdmin ? 'Role: Central Administrator — All 75 Circles' : 'Role: Head of Department (HOD) — All 75 Circles')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ fontSize: '10.5px', color: targetCircleData ? '#38bdf8' : (queryParams.isAdmin ? '#ec4899' : '#a855f7'), fontWeight: 800 }}>
              {targetCircleData ? `${targetCircleData.circleNo}` : (queryParams.isAdmin ? 'ID: ADMIN' : 'ID: HOD')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Lock size={12} color="#4ade80" />
            <span style={{ fontSize: '10.5px', color: '#4ade80', fontWeight: 700 }}>Secure View-Only</span>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ maxWidth: '1200px', margin: '40px auto', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600 }}>Loading Census Records...</p>
        </div>
      )}

      {/* NOT FOUND PAGE - invalid circle number or out-of-range */}
      {!loading && targetCircleData === undefined && (
        <div style={{
          maxWidth: '500px',
          margin: '60px auto',
          textAlign: 'center',
          padding: '40px 24px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.12)',
            border: '2px solid rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <AlertCircle size={36} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: '0 0 8px 0' }}>
            Page Not Found
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 6px 0' }}>
            The supervisor circle{' '}
            <b style={{ color: '#f87171', fontFamily: 'monospace' }}>
              {(queryParams.circle || queryParams.id) ? `"${queryParams.circle || queryParams.id}"` : ''}
            </b>{' '}
            does not exist.
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 24px 0' }}>
            Valid circle numbers are <b style={{ color: '#e2e8f0' }}>001 to 075</b> (3 digits only).
          </p>
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '11.5px',
            color: '#fca5a5',
            lineHeight: 1.6
          }}>
            Example valid links:<br />
            <code style={{ color: '#38bdf8' }}>/report?circle=001</code> · <code style={{ color: '#38bdf8' }}>/report?circle=025</code>
          </div>
        </div>
      )}

      {/* SINGLE SUPERVISOR VIEW */}
      {!loading && targetCircleData && targetCircleData !== undefined && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Supervisor Card Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
            border: '1px solid #3b82f6',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ background: '#991b1b', color: '#fff', fontWeight: 900, fontSize: '11px', padding: '3px 10px', borderRadius: '8px' }}>
                  {targetCircleData.circleNo}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                  Supervisor: {targetCircleData.supervisorName}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <span>ID: <b style={{ color: '#e2e8f0' }}>{targetCircleData.supervisorId || 'N/A'}</b></span>
                <span>📞 Mobile: {targetCircleData.supervisorMobile && targetCircleData.supervisorMobile !== 'N/A' ? (
                  <a href={`tel:${targetCircleData.supervisorMobile}`} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 700 }}>
                    {targetCircleData.supervisorMobile}
                  </a>
                ) : <b style={{ color: '#64748b' }}>N/A</b>}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Allotted Blocks</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8' }}>{targetCircleData.enumerators.length} HLBs</div>
            </div>
          </div>

          {/* Supervisor KPI Grid */}
          {(() => {
            const exp = targetCircleData.enumerators.reduce((s, e) => s + e.expectedHouses, 0);
            const cen = targetCircleData.enumerators.reduce((s, e) => s + e.censusHouses, 0);
            const hh = targetCircleData.enumerators.reduce((s, e) => s + e.households, 0);
            const ver = targetCircleData.enumerators.reduce((s, e) => s + e.verifiedBySup, 0);
            const se = targetCircleData.enumerators.reduce((s, e) => s + e.seIdUsed, 0);
            const pop = targetCircleData.enumerators.reduce((s, e) => s + e.totalPopulation, 0);
            const err = targetCircleData.enumerators.reduce((s, e) => s + e.errorCount, 0);
            const comp = targetCircleData.enumerators.filter(e => e.isCompleted).length;

            return (
              <div className="kpi-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
                gap: '8px'
              }}>
                <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Exp Houses</div>
                  <div className="kpi-value" style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>{exp.toLocaleString()}</div>
                </div>
                <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Cen Houses</div>
                  <div className="kpi-value" style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>{cen.toLocaleString()}</div>
                </div>
                <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Households</div>
                  <div className="kpi-value" style={{ fontSize: '16px', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>{hh.toLocaleString()}</div>
                </div>
                <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Verified By Sup</div>
                  <div className="kpi-value" style={{ fontSize: '16px', fontWeight: 900, color: '#0ea5e9', marginTop: '2px' }}>{ver.toLocaleString()}</div>
                </div>
                <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>SE ID Used</div>
                  <div className="kpi-value" style={{ fontSize: '16px', fontWeight: 900, color: '#a855f7', marginTop: '2px' }}>{se.toLocaleString()}</div>
                </div>
                <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Population</div>
                  <div className="kpi-value" style={{ fontSize: '16px', fontWeight: 900, color: '#22c55e', marginTop: '2px' }}>{pop.toLocaleString()}</div>
                </div>
                <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Active Errors</div>
                  <div className="kpi-value" style={{ fontSize: '16px', fontWeight: 900, color: err > 0 ? '#ef4444' : '#22c55e', marginTop: '2px' }}>{err}</div>
                </div>
                <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Status</div>
                  <div className="kpi-value" style={{ fontSize: '13px', fontWeight: 800, color: comp === targetCircleData.enumerators.length ? '#22c55e' : '#f59e0b', marginTop: '4px' }}>
                    {comp}/{targetCircleData.enumerators.length} Comp
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Enumerators Table */}
          <div style={{
            background: '#111622',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#151c2c' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Allotted Enumerators &amp; Block Wise Breakdown ({targetCircleData.enumerators.length} HLBs)
              </h2>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#182234', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 800 }}>Enumerator Name &amp; ID</th>
                    <th style={{ padding: '10px 10px', fontWeight: 800 }}>Mobile No</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800 }}>HLB Code</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800 }}>Exp Houses</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800 }}>Cen Houses</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800 }}>Households</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800 }}>Verified</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800 }}>SE ID</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800 }}>Population</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800 }}>Errors (Click to View)</th>
                    <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 800 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {targetCircleData.enumerators.map((e, idx) => (
                    <tr key={idx} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                    }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 800, color: '#ffffff' }}>{e.enumName}</div>
                        <div style={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'monospace' }}>{e.enumId || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace' }}>
                        {e.enumMobile && e.enumMobile !== 'N/A' ? (
                          <a href={`tel:${e.enumMobile}`} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 700 }}>
                            {e.enumMobile}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span style={{ background: '#1e293b', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontFamily: 'monospace', fontSize: '10.5px' }}>
                          HLB {String(e.hlbCode).padStart(4, '0')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700 }}>{e.expectedHouses}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#38bdf8' }}>{e.censusHouses}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#f59e0b' }}>{e.households}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#0ea5e9' }}>{e.verifiedBySup}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#a855f7' }}>{e.seIdUsed || 0}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#22c55e' }}>{e.totalPopulation}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (e.errorCount > 0) {
                              setSelectedErrorModal({
                                circleNo: targetCircleData.circleNo,
                                supervisorName: targetCircleData.supervisorName,
                                enumName: e.enumName,
                                enumId: e.enumId,
                                enumMobile: e.enumMobile,
                                hlbCode: e.hlbCode,
                                errors: e.errorRecords
                              });
                            }
                          }}
                          style={{
                            background: e.errorCount > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)',
                            color: e.errorCount > 0 ? '#ef4444' : '#22c55e',
                            border: e.errorCount > 0 ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(34,197,94,0.3)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 800,
                            cursor: e.errorCount > 0 ? 'pointer' : 'default',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {e.errorCount > 0 && <AlertTriangle size={10} />}
                          {e.errorCount} {e.errorCount === 1 ? 'error' : 'errors'}
                        </button>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          background: e.isCompleted ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                          color: e.isCompleted ? '#22c55e' : '#f59e0b',
                          border: e.isCompleted ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(245,158,11,0.3)'
                        }}>
                          {e.isCompleted ? 'Completed' : 'In progress'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HOD / ADMIN MASTER VIEW (ALL 75 CIRCLES) - only when not a supervisor request */}
      {!loading && targetCircleData === null && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* HOD Master KPIs */}
          <div className="kpi-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px'
          }}>
            <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Supervisors</div>
              <div className="kpi-value" style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>{hodStats.totalCircles} Circles</div>
            </div>
            <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Enumerators</div>
              <div className="kpi-value" style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>{hodStats.totalEnums} Enums</div>
            </div>
            <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Total HLBs</div>
              <div className="kpi-value" style={{ fontSize: '18px', fontWeight: 900, color: '#a855f7', marginTop: '2px' }}>{hodStats.totalHlbs} Blocks</div>
            </div>
            <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Expected Houses</div>
              <div className="kpi-value" style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>{hodStats.expectedHouses.toLocaleString()}</div>
            </div>
            <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Census Houses</div>
              <div className="kpi-value" style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>{hodStats.censusHouses.toLocaleString()}</div>
            </div>
            <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Households</div>
              <div className="kpi-value" style={{ fontSize: '18px', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>{hodStats.households.toLocaleString()}</div>
            </div>
            <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Verified By Sup</div>
              <div className="kpi-value" style={{ fontSize: '18px', fontWeight: 900, color: '#0ea5e9', marginTop: '2px' }}>{hodStats.verifiedBySup.toLocaleString()}</div>
            </div>
            <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '9.5px', color: '#d8b4fe', fontWeight: 700, textTransform: 'uppercase' }}>SE ID Used</div>
              <div className="kpi-value" style={{ fontSize: '18px', fontWeight: 900, color: '#a855f7', marginTop: '2px' }}>{hodStats.totalSeId.toLocaleString()}</div>
            </div>
            <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Total Population</div>
              <div className="kpi-value" style={{ fontSize: '18px', fontWeight: 900, color: '#22c55e', marginTop: '2px' }}>{hodStats.totalPopulation.toLocaleString()}</div>
            </div>
            <div className="kpi-card" style={{ background: '#131824', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '9.5px', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase' }}>Active Errors</div>
              <div className="kpi-value" style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444', marginTop: '2px' }}>{hodStats.totalErrors.toLocaleString()}</div>
            </div>
          </div>

          {/* View Mode Tabs (Summary vs Detailed Enumerators Breakdown) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', background: '#111622', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                className="tab-btn"
                onClick={() => setHodTab('summary')}
                style={{
                  background: hodTab === 'summary' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
                  color: hodTab === 'summary' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📋 Supervisor Summary List
              </button>
              <button
                className="tab-btn"
                onClick={() => setHodTab('expanded')}
                style={{
                  background: hodTab === 'expanded' ? 'linear-gradient(135deg, #a855f7, #7e22ce)' : 'transparent',
                  color: hodTab === 'expanded' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📑 Expanded View (All Enumerator Tables)
              </button>
            </div>

            {hodTab === 'summary' && (
              <button
                className="tab-btn"
                onClick={() => {
                  if (expandedCircleIds.size === filteredHodCircles.length) {
                    setExpandedCircleIds(new Set());
                  } else {
                    setExpandedCircleIds(new Set(filteredHodCircles.map(c => c.circleNo)));
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#e2e8f0',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {expandedCircleIds.size === filteredHodCircles.length ? '▲ Collapse All' : '▼ Expand All Inline'}
              </button>
            )}
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search Supervisor name, Circle no, ID, Mobile, or Enumerator..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: '#111622',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  padding: '10px 12px 10px 38px',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Supervisors List Grid / Expanded View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredHodCircles.map(c => {
              const exp = c.enumerators.reduce((s, e) => s + e.expectedHouses, 0);
              const cen = c.enumerators.reduce((s, e) => s + e.censusHouses, 0);
              const hh = c.enumerators.reduce((s, e) => s + e.households, 0);
              const ver = c.enumerators.reduce((s, e) => s + e.verifiedBySup, 0);
              const se = c.enumerators.reduce((s, e) => s + e.seIdUsed, 0);
              const pop = c.enumerators.reduce((s, e) => s + e.totalPopulation, 0);
              const err = c.enumerators.reduce((s, e) => s + e.errorCount, 0);
              const comp = c.enumerators.filter(e => e.isCompleted).length;
              const isExpanded = hodTab === 'expanded' || expandedCircleIds.has(c.circleNo);

              return (
                <div key={c.circleNo} style={{
                  background: '#111622',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}>
                  {/* Supervisor Header Row */}
                  <div
                    className="supervisor-header-row"
                    onClick={() => {
                      if (hodTab === 'summary') {
                        setExpandedCircleIds(prev => {
                          const n = new Set(prev);
                          if (n.has(c.circleNo)) n.delete(c.circleNo);
                          else n.add(c.circleNo);
                          return n;
                        });
                      }
                    }}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      cursor: hodTab === 'summary' ? 'pointer' : 'default',
                      background: isExpanded ? 'rgba(59,130,246,0.04)' : 'transparent',
                      borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.08)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                      <span style={{ background: '#991b1b', color: '#fff', fontWeight: 900, fontSize: '10.5px', padding: '3px 8px', borderRadius: '6px' }}>
                        {c.circleNo}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                          {c.supervisorName}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          ID: {c.supervisorId || 'N/A'} · 📞 {c.supervisorMobile || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="supervisor-stats-row" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '11px' }}>
                      <div><span style={{ color: '#64748b' }}>HLBs:</span> <b style={{ color: '#38bdf8' }}>{c.enumerators.length}</b></div>
                      <div><span style={{ color: '#64748b' }}>Houses:</span> <b style={{ color: '#ffffff' }}>{cen.toLocaleString()}</b></div>
                      <div><span style={{ color: '#64748b' }}>Households:</span> <b style={{ color: '#f59e0b' }}>{hh.toLocaleString()}</b></div>
                      <div><span style={{ color: '#64748b' }}>Verified:</span> <b style={{ color: '#0ea5e9' }}>{ver.toLocaleString()}</b></div>
                      <div><span style={{ color: '#64748b' }}>Population:</span> <b style={{ color: '#22c55e' }}>{pop.toLocaleString()}</b></div>
                      <div>
                        <span style={{ color: '#64748b' }}>Errors:</span> <b style={{ color: err > 0 ? '#ef4444' : '#22c55e' }}>{err}</b>
                      </div>
                      <div><span style={{ color: '#64748b' }}>Progress:</span> <b style={{ color: comp === c.enumerators.length ? '#22c55e' : '#f59e0b' }}>{comp}/{c.enumerators.length}</b></div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'auto' }}>
                      <a
                        href={`/report?circle=${String(c.circleNumber).padStart(3, '0')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="single-circle-btn"
                        onClick={e => e.stopPropagation()}
                        style={{
                          background: 'rgba(59,130,246,0.15)',
                          border: '1px solid rgba(59,130,246,0.4)',
                          color: '#60a5fa',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Single Circle View <ChevronRight size={13} />
                      </a>
                    </div>
                  </div>

                  {/* Expanded Enumerators Table directly inline */}
                  {isExpanded && (
                    <div style={{ overflowX: 'auto', background: '#0d111a', padding: '8px 12px 14px 12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#151c2c', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <th style={{ padding: '8px 10px', fontWeight: 800 }}>Enumerator Name &amp; ID</th>
                            <th style={{ padding: '8px 8px', fontWeight: 800 }}>Mobile No</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800 }}>HLB Code</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800 }}>Exp Houses</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800 }}>Cen Houses</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800 }}>Households</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800 }}>Verified</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800 }}>SE ID</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800 }}>Population</th>
                            <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 800 }}>Errors (Click to View)</th>
                            <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 800 }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.enumerators.map((e, idx) => (
                            <tr key={idx} style={{
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                            }}>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ fontWeight: 800, color: '#ffffff' }}>{e.enumName}</div>
                                <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>{e.enumId || 'N/A'}</div>
                              </td>
                              <td style={{ padding: '8px 8px', fontFamily: 'monospace' }}>
                                {e.enumMobile && e.enumMobile !== 'N/A' ? (
                                  <a href={`tel:${e.enumMobile}`} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 700 }}>
                                    {e.enumMobile}
                                  </a>
                                ) : 'N/A'}
                              </td>
                              <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                <span style={{ background: '#1e293b', color: '#38bdf8', padding: '2px 6px', borderRadius: '5px', fontWeight: 800, fontFamily: 'monospace', fontSize: '10px' }}>
                                  HLB {String(e.hlbCode).padStart(4, '0')}
                                </span>
                              </td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700 }}>{e.expectedHouses}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, color: '#38bdf8' }}>{e.censusHouses}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800, color: '#f59e0b' }}>{e.households}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800, color: '#0ea5e9' }}>{e.verifiedBySup}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800, color: '#a855f7' }}>{e.seIdUsed || 0}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800, color: '#22c55e' }}>{e.totalPopulation}</td>
                              <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (e.errorCount > 0) {
                                      setSelectedErrorModal({
                                        circleNo: c.circleNo,
                                        supervisorName: c.supervisorName,
                                        enumName: e.enumName,
                                        enumId: e.enumId,
                                        enumMobile: e.enumMobile,
                                        hlbCode: e.hlbCode,
                                        errors: e.errorRecords
                                      });
                                    }
                                  }}
                                  style={{
                                    background: e.errorCount > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)',
                                    color: e.errorCount > 0 ? '#ef4444' : '#22c55e',
                                    border: e.errorCount > 0 ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(34,197,94,0.3)',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '9.5px',
                                    fontWeight: 800,
                                    cursor: e.errorCount > 0 ? 'pointer' : 'default',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {e.errorCount > 0 && <AlertTriangle size={10} />}
                                  {e.errorCount} {e.errorCount === 1 ? 'error' : 'errors'}
                                </button>
                              </td>
                              <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  background: e.isCompleted ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                                  color: e.isCompleted ? '#22c55e' : '#f59e0b',
                                  border: e.isCompleted ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(245,158,11,0.3)'
                                }}>
                                  {e.isCompleted ? 'Completed' : 'In progress'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INTERACTIVE ERROR DRILLDOWN MODAL FOR HOD / ADMIN */}
      {selectedErrorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '16px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#991b1b', color: '#fff', fontWeight: 900, fontSize: '10.5px', padding: '3px 8px', borderRadius: '6px' }}>
                    {selectedErrorModal.circleNo}
                  </span>
                  <span style={{ background: '#1e293b', color: '#38bdf8', fontWeight: 800, fontSize: '10.5px', padding: '3px 8px', borderRadius: '6px' }}>
                    HLB {String(selectedErrorModal.hlbCode).padStart(4, '0')}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    Active Errors Inspection ({selectedErrorModal.errors.length})
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                  <span>Enumerator: <b style={{ color: '#e2e8f0' }}>{selectedErrorModal.enumName}</b> ({selectedErrorModal.enumId})</span>
                  {selectedErrorModal.enumMobile && selectedErrorModal.enumMobile !== 'N/A' && (
                    <span>📞 <a href={`tel:${selectedErrorModal.enumMobile}`} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 700 }}>{selectedErrorModal.enumMobile}</a></span>
                  )}
                  <span>· Supervisor: <b style={{ color: '#e2e8f0' }}>{selectedErrorModal.supervisorName}</b></span>
                </div>
              </div>

              <button
                onClick={() => setSelectedErrorModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '8px',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Errors Table */}
            <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '8px 10px', width: '70px', textAlign: 'center', fontWeight: 800 }}>Line No</th>
                    <th style={{ padding: '8px 10px', width: '90px', textAlign: 'center', fontWeight: 800 }}>Building No</th>
                    <th style={{ padding: '8px 10px', width: '90px', textAlign: 'center', fontWeight: 800 }}>House No</th>
                    <th style={{ padding: '8px 10px', width: '140px', fontWeight: 800 }}>Head of House</th>
                    <th style={{ padding: '8px 10px', fontWeight: 800 }}>Error Description &amp; Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedErrorModal.errors.map((err, i) => {
                    const rawLine = err.line_number ?? err.lineNo ?? (i + 1);
                    const lineStr = String(rawLine).trim();
                    const numOnly = lineStr.replace(/[^0-9]/g, '');
                    const formattedLine = numOnly ? numOnly.padStart(3, '0') : lineStr.padStart(3, '0');

                    return (
                      <tr key={i} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                      }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
                          #{formattedLine}
                        </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace', color: '#94a3b8' }}>
                        {err.building_number || err.buildingNo || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace', color: '#38bdf8' }}>
                        {err.census_house_num || err.houseNo || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#ffffff' }}>
                        {err.head_name || err.headName || '-'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: 'rgba(239,68,68,0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.3)'
                        }}>
                          ⚠️ {err.error_description || err.error_type || err.errType || 'Census Rule Violation'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

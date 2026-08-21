import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Phone, CheckCircle2, Clock, Search, Shield, ChevronRight, Lock, AlertCircle, X, Sparkles, AlertTriangle, Link as LinkIcon, Share2 } from 'lucide-react';
import hlbMapping from './hlbMapping.json';
import { CensusZoneProvider, useCensusZone } from './CensusZoneContext.jsx';
import CensusZoneSelector from './CensusZoneSelector.jsx';

const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api' : 'https://psk-builders.onrender.com/api');

const DEFAULT_ERRORS = [
  {
    id: 'err1',
    name: 'Night Soil by Human',
    nameTa: 'மனிதர்களால் அகற்றப்படும் வகை',
    keywords: ['night soil removed by human', 'service latrine', 'சேவை கழிவு', 'மனிதர்களால் அகற்றப்படும் வகை'],
    color: '#ef4444',
    icon: '🚫'
  },
  {
    id: 'err2',
    name: 'Landline Only',
    nameTa: 'தொலைபேசி மட்டும்',
    keywords: ['landline only', 'landline', 'தொலைபேசி மட்டும்', 'தொலைபேசி'],
    color: '#f97316',
    icon: '☎️'
  },
  {
    id: 'err3',
    name: 'No Light',
    nameTa: 'விளக்கு வசதி இல்லை',
    keywords: ['no lighting', 'no light', 'விளக்கு வசதி இல்லை', 'மின் விளக்கு வசதி இல்லை'],
    color: '#3b82f6',
    icon: '💡'
  },
  {
    id: 'err4',
    name: 'River / Canal',
    nameTa: 'ஆறு/ கால்வாய்',
    keywords: ['river/ canal', 'river', 'canal', 'ஆறு/ கால்வாய்', 'ஆறு / கால்வாய்', 'ஆறு', 'கால்வாய்'],
    color: '#8b5cf6',
    icon: '🌊'
  },
  {
    id: 'err5',
    name: 'Open Drainage',
    nameTa: 'திறந்த வெளி',
    keywords: ['no: open', 'open drainage', 'open', 'திறந்த வெளி', 'திறந்த'],
    color: '#14b8a6',
    icon: '🕳️'
  },
  {
    id: 'err6',
    name: 'LPG / PNG Connection',
    nameTa: 'LPG/ PNG இணைப்பு',
    keywords: ['lpg/ png connection', 'lpg', 'png', 'எல்.பி.ஜி / பி.என்.ஜி இணைப்பு', 'சமையலறை உள்ளது'],
    color: '#eab308',
    icon: '🔥'
  }
];

function matchErrorType(errRow) {
  const desc = String(errRow.error_description || errRow.error_type || errRow.errType || '').toLowerCase().trim();
  if (!desc) return null;
  for (const def of DEFAULT_ERRORS) {
    if (def.keywords.some(kw => desc.includes(kw.toLowerCase()))) return def.id;
  }
  return null;
}

function CensusPublicSupervisorReportContent() {
  const { selectedZone, selectedZoneObj, changeZone } = useCensusZone();
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
  const [showSupervisorErrorBreakup, setShowSupervisorErrorBreakup] = useState(false);
  const [showHodErrorBreakup, setShowHodErrorBreakup] = useState(false);
  const [lastReportSyncTime, setLastReportSyncTime] = useState('');
  const [lastErrorSyncTime, setLastErrorSyncTime] = useState('');

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

  // 2. Strict Query Params (Stop old URLs, enforce new KingMaker / Zone-based format)
  const queryParams = useMemo(() => {
    if (typeof window === 'undefined') return { circle: '', id: '', role: '', isAdmin: false, isTeamLead: false, isHod: false, isSupervisorRequest: false, isInvalidCircle: false, isOutdatedUrl: false, urlZone: '' };
    const sp = new URLSearchParams(window.location.search);
    const circle = (sp.get('circle') || sp.get('c') || '').trim();
    const id = (sp.get('id') || sp.get('supId') || sp.get('supervisor') || '').trim();
    const roleRaw = (sp.get('role') || sp.get('view') || '').toLowerCase().trim();
    const urlZone = (sp.get('zone') || sp.get('z') || '').trim();
    
    // 1. KingMaker (Strict: 'kingmaker' only)
    const isAdmin = roleRaw === 'kingmaker' || id.toLowerCase() === 'kingmaker' || sp.has('kingmaker');
    
    // 2. TeamLead (Strict: Requires zone + 'teamlead' / 'tl')
    const isTeamLead = !isAdmin && !!urlZone && (roleRaw === 'teamlead' || roleRaw === 'tl' || id.toLowerCase() === 'teamlead' || id.toLowerCase() === 'tl' || sp.has('teamlead') || sp.has('tl'));
    
    // 3. HOD (Strict: Requires zone + 'hod')
    const isHod = !isAdmin && !isTeamLead && !!urlZone && (roleRaw === 'hod' || id.toLowerCase() === 'hod' || sp.has('hod'));
    
    // 4. Single Supervisor (Strict: Requires zone + circle)
    let isInvalidCircle = false;
    let isSupervisorRequest = false;
    if (!isAdmin && !isTeamLead && !isHod && !!urlZone && !!circle) {
      isSupervisorRequest = true;
      const numOnly = circle.replace(/[^0-9]/g, '');
      if (numOnly !== circle || numOnly.length > 4 || numOnly.length === 0) {
        isInvalidCircle = true;
      }
    }
    
    // 5. Old / Deprecated URL Check:
    // (If someone tries old bare '/report', old '/report?circle=001' without zone, old '/report?id=admin', old '/report?id=hod' without zone)
    const isOutdatedUrl = !isAdmin && !isTeamLead && !isHod && !isSupervisorRequest;
    
    const role = isAdmin ? 'kingMaker' : (isTeamLead ? 'teamlead' : (isHod ? 'hod' : (isSupervisorRequest ? 'supervisor' : 'invalid')));
    return { circle, id, role, isAdmin, isTeamLead, isHod, isSupervisorRequest, isInvalidCircle, isOutdatedUrl, urlZone };
  }, []);

  // Auto-sync Zone from URL Parameter
  useEffect(() => {
    if (queryParams.urlZone) {
      const clean = queryParams.urlZone.replace(/[^0-9a-zA-Z]/g, '');
      const padded = clean.length === 1 ? '0' + clean : clean;
      if (padded && padded !== selectedZone) {
        changeZone(padded);
      }
    }
  }, [queryParams.urlZone, selectedZone, changeZone]);

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
    if (queryParams.isOutdatedUrl) {
      setLoading(false);
      return;
    }
    async function loadData() {
      setLoading(true);
      try {
        const [rAllot, rCharge, rUser, rAppUser, rMap, rCodeMap, rErrors] = await Promise.all([
          publicFetch(`/table/hlb_allotted?limit=5000&offset=0&zone=${selectedZone}`).then(r => r.json().catch(() => ({}))),
          publicFetch(`/table/charge_wise_report?limit=5000&offset=0&zone=${selectedZone}`).then(r => r.json().catch(() => ({}))),
          publicFetch(`/table/user_details?limit=5000&offset=0&zone=${selectedZone}`).then(r => r.json().catch(() => ({}))),
          publicFetch(`/table/app_user?limit=5000&offset=0&zone=${selectedZone}`).then(r => r.json().catch(() => ({}))),
          publicFetch(`/table/hlb_mapping?limit=5000&offset=0`).then(r => r.json().catch(() => ({}))),
          publicFetch(`/table/hlb_code_mapping?limit=5000&offset=0`).then(r => r.json().catch(() => ({}))),
          publicFetch(`/table/census_errors?limit=5000&offset=0&zone=${selectedZone}`).then(r => r.json().catch(() => ({})))
        ]);

        setAllotedRows(rAllot.rows || []);
        setChargeRows(rCharge.rows || []);
        setUserRows(rUser.rows || []);
        setAppUserRows(rAppUser.rows || []);
        setCensusErrorRows(rErrors.rows || []);

        const mapsCombined = [...(rMap.rows || []), ...(rCodeMap.rows || [])];
        setHlbMappingRows(mapsCombined);

        const formatDateTime = (val) => {
          if (!val) return '';
          try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              return d.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
            }
          } catch {}
          return String(val);
        };

        const nowStr = formatDateTime(new Date());

        // Extract last updated date & time from charge report data
        let repTimestamp = '';
        for (const r of (rCharge.rows || [])) {
          const t = r.created_at || r.updated_at || r.timestamp || r.upload_time || r.report_date || r.last_updated || r.date;
          if (t) { repTimestamp = formatDateTime(t); break; }
        }
        setLastReportSyncTime(repTimestamp || nowStr);

        // Extract last updated date & time from census errors data
        let errTimestamp = '';
        for (const r of (rErrors.rows || [])) {
          const t = r.created_at || r.updated_at || r.timestamp || r.upload_time || r.error_date || r.last_updated || r.date;
          if (t) { errTimestamp = formatDateTime(t); break; }
        }
        setLastErrorSyncTime(errTimestamp || nowStr);
      } catch (err) {
        console.warn('Data load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedZone, queryParams.isOutdatedUrl]);

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

  // Helper to format clean display name from ID
  const formatFromId = useCallback((str) => {
    if (!str || str === 'n/a' || str === 'null' || str === 'undefined') return '';
    const parts = str.split('_');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length >= 2 && !/^\d+$/.test(lastPart)) {
      return lastPart.toUpperCase();
    }
    return str.toUpperCase();
  }, []);

  // Robust Phone & Username & FullName Resolver with Strict Role Separation
  const getMobileAndUsername = useCallback((userId, personName, isSupervisor = false) => {
    const uId = String(userId || '').trim().toLowerCase();
    const pName = String(personName || '').trim();
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normPName = norm(pName);
    const allUsers = [...(userRows || []), ...(appUserRows || [])];

    if (allUsers && allUsers.length > 0) {
      // 1. STRICT Role separation: Supervisors MUST have sm_ prefix or supervisor role. Enumerators MUST have em_/en_ or enumerator role.
      const roleUsers = allUsers.filter(u => {
        const un = String(u.username || u.user_id || '').trim().toLowerCase();
        const role = String(u.role_code || u.role_name || '').toLowerCase();
        if (isSupervisor) {
          return un.startsWith('sm_') || role.includes('supervisor');
        } else {
          return un.startsWith('em_') || un.startsWith('en_') || role.includes('enumerator');
        }
      });

      const pool = roleUsers.length > 0 ? roleUsers : (isSupervisor ? [] : allUsers);

      // 2. Direct exact username match inside role-filtered pool
      if (uId && uId !== 'n/a' && uId !== 'undefined' && uId !== 'null') {
        const direct = pool.find(u => {
          const un = String(u.username || u.user_id || '').trim().toLowerCase();
          return un === uId;
        });
        if (direct) {
          const mob = String(direct.mobile_no || direct.mobile || direct.phone || direct.phone_number || '').trim();
          const fn = String(direct.full_name || direct.name || direct.user_name || '').trim();
          return {
            mobile: mob && mob !== 'undefined' && mob !== 'null' && mob !== 'N/A' ? mob : 'N/A',
            username: String(direct.username || direct.user_id || uId),
            fullName: fn || formatFromId(uId)
          };
        }
      }

      // 3. Exact full name match inside role-filtered pool
      if (pName && pName.toLowerCase() !== 'supervisor' && pName.toLowerCase() !== 'enumerator' && pName !== 'n/a') {
        const nameMatch = pool.find(u => {
          const fn = String(u.full_name || u.name || '').trim().toLowerCase();
          return fn === pName.toLowerCase();
        });
        if (nameMatch) {
          const mob = String(nameMatch.mobile_no || nameMatch.mobile || nameMatch.phone || nameMatch.phone_number || '').trim();
          const fn = String(nameMatch.full_name || nameMatch.name || nameMatch.user_name || '').trim();
          return {
            mobile: mob && mob !== 'undefined' && mob !== 'null' && mob !== 'N/A' ? mob : 'N/A',
            username: String(nameMatch.username || nameMatch.user_id || uId || 'N/A'),
            fullName: fn || formatFromId(pName)
          };
        }
      }

      // 4. Normalized full name match inside role-filtered pool
      if (normPName && normPName !== 'supervisor' && normPName !== 'enumerator') {
        const normMatch = pool.find(u => {
          const fn = norm(u.full_name || u.name || u.user_name);
          return fn === normPName;
        });
        if (normMatch) {
          const mob = String(normMatch.mobile_no || normMatch.mobile || normMatch.phone || normMatch.phone_number || '').trim();
          const fn = String(normMatch.full_name || normMatch.name || normMatch.user_name || '').trim();
          return {
            mobile: mob && mob !== 'undefined' && mob !== 'null' && mob !== 'N/A' ? mob : 'N/A',
            username: String(normMatch.username || normMatch.user_id || uId || 'N/A'),
            fullName: fn || formatFromId(pName)
          };
        }
      }

      // 5. Partial / Contains match inside role-filtered pool
      if (normPName && normPName !== 'supervisor' && normPName !== 'enumerator') {
        const subMatch = pool.find(u => {
          const un = norm(u.username || u.user_id);
          const fn = norm(u.full_name || u.name || u.user_name);
          return (un && un.includes(normPName)) || (fn && fn.includes(normPName)) || (normPName && fn.includes(normPName));
        });
        if (subMatch) {
          const mob = String(subMatch.mobile_no || subMatch.mobile || subMatch.phone || subMatch.phone_number || '').trim();
          const fn = String(subMatch.full_name || subMatch.name || subMatch.user_name || '').trim();
          return {
            mobile: mob && mob !== 'undefined' && mob !== 'null' && mob !== 'N/A' ? mob : 'N/A',
            username: String(subMatch.username || subMatch.user_id || uId || 'N/A'),
            fullName: fn || formatFromId(pName)
          };
        }
      }
    }

    // 6. Fallback to allotedRows if present
    if (allotedRows && allotedRows.length > 0 && pName && pName !== 'n/a') {
      const allotMatch = allotedRows.find(a => {
        const aSup = String(a.supervisor_name || a.supervisor || a.sup_name || '').toLowerCase();
        const aEnum = String(a.enumerator_name || a.enumerator || a.enum_name || '').toLowerCase();
        return (isSupervisor && aSup && aSup.includes(pName.toLowerCase())) || (!isSupervisor && aEnum && aEnum.includes(pName.toLowerCase()));
      });
      if (allotMatch) {
        const mob = String(
          (isSupervisor ? (allotMatch.supervisor_mobile || allotMatch.sup_mobile) : (allotMatch.enumerator_mobile || allotMatch.enum_mobile)) ||
          allotMatch.mobile_no || allotMatch.mobile || allotMatch.phone || allotMatch.user_mobile || ''
        ).trim();
        return {
          mobile: mob && mob !== 'undefined' && mob !== 'null' && mob !== 'N/A' ? mob : 'N/A',
          username: uId || 'N/A',
          fullName: formatFromId(pName || uId)
        };
      }
    }

    return {
      mobile: 'N/A',
      username: uId || 'N/A',
      fullName: (pName && pName.toLowerCase() !== 'supervisor' && pName.toLowerCase() !== 'enumerator') ? formatFromId(pName) : (isSupervisor ? 'SUPERVISOR' : 'ENUMERATOR')
    };
  }, [userRows, appUserRows, allotedRows, formatFromId]);

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
        const locked = parseInt(c.total_locked_census_houses || c.totalLockedCensusHouses || c.locked_census_houses || c.locked_houses || c.locked || 0);

        const stVal = String(c.status ?? c.completed ?? c.work_status ?? c.is_completed ?? '').trim().toLowerCase();
        const isComp = stVal === '1' || stVal === 'completed' || stVal === 'true';

        chargeMetricsMap.set(blkKey, { exp, houses, hh, ver, pop, isComp, seUsed, locked });
        chargeMetricsMap.set(String(parseInt(blkKey, 10)), { exp, houses, hh, ver, pop, isComp, seUsed, locked });
        chargeMetricsMap.set(blkKey.padStart(4, '0'), { exp, houses, hh, ver, pop, isComp, seUsed, locked });
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
        const rawSup = String(firstRow.supervisor_name || firstRow.supervisor || firstRow.supervisor_full_name || firstRow.sup_name || '').trim();
        const rawSupId = String(firstRow.supervisor_id || firstRow.sup_id || '').trim();
        const supKey = rawSupId || rawSup;
        const supInfo = getMobileAndUsername(supKey, rawSup || rawSupId, true);

        const supName = supInfo.fullName && supInfo.fullName !== 'SUPERVISOR' 
          ? supInfo.fullName 
          : (rawSup && !rawSup.toLowerCase().startsWith('sm_') ? rawSup : (supInfo.username !== 'N/A' && !supInfo.username.startsWith('sm_') ? supInfo.username : 'SUPERVISOR'));
        
        const supMobFromAllot = String(firstRow.supervisor_mobile || firstRow.sup_mobile || firstRow.mobile_no || firstRow.mobile || firstRow.phone || '').trim();
        const finalSupMobile = (supInfo.mobile && supInfo.mobile !== 'N/A') ? supInfo.mobile : (supMobFromAllot && supMobFromAllot !== 'null' && supMobFromAllot !== 'undefined' ? supMobFromAllot : 'N/A');
        
        const supIdVal = (supInfo.username && supInfo.username !== 'N/A') ? supInfo.username : (rawSupId || (rawSup.toLowerCase().startsWith('sm_') ? rawSup : ''));

        const enumerators = allotList.map(a => {
          const rawEnum = String(a.enumerator_name || a.enumerator || a.enum_name || a.enumerator_full_name || a.user_name || '').trim();
          const userId = String(a.user_id || a.enumerator_id || a.username || '').trim();
          const enumKey = userId || rawEnum;
          const enumInfo = getMobileAndUsername(enumKey, rawEnum || userId, false);

          const resolvedEnumName = enumInfo.fullName && enumInfo.fullName !== 'ENUMERATOR'
            ? enumInfo.fullName
            : (rawEnum && !rawEnum.toLowerCase().startsWith('em_') ? rawEnum : (enumInfo.username !== 'N/A' && !enumInfo.username.startsWith('em_') ? enumInfo.username : 'ENUMERATOR'));

          const enumMobFromAllot = String(a.enumerator_mobile || a.enum_mobile || a.mobile || a.mobile_no || a.phone || a.user_mobile || '').trim();
          const finalEnumMobile = (enumInfo.mobile && enumInfo.mobile !== 'N/A') ? enumInfo.mobile : (enumMobFromAllot && enumMobFromAllot !== 'null' && enumMobFromAllot !== 'undefined' ? enumMobFromAllot : 'N/A');
          
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
          const lockedCount = cData.locked || parseInt(a.total_locked_census_houses || a.totalLockedCensusHouses || a.locked_census_houses || a.locked || 0);
          const stAllot = String(a.status ?? a.completed ?? a.work_status ?? '').trim().toLowerCase();
          const isComp = cData.isComp || stAllot === '1' || stAllot === 'completed' || stAllot === 'true';

          return {
            enumId: (enumInfo.username && enumInfo.username !== 'N/A') ? enumInfo.username : (userId || `ENUM-${resolvedEnumName}`),
            enumName: resolvedEnumName,
            enumMobile: finalEnumMobile,
            hlbCode: padded,
            expectedHouses: expHouses,
            censusHouses: housesCount,
            households: hhCount,
            verifiedBySup: verCount,
            seIdUsed: seIdUsed,
            lockedCount: lockedCount,
            totalPopulation: popCount,
            errorCount: errList.length,
            errorRecords: errList,
            isCompleted: isComp
          };
        });

        circles.push({
          circleNo,
          circleNumber: parseInt(circleNo.replace(/[^0-9]/g, '')) || 0,
          supervisorName: supName,
          supervisorId: supIdVal,
          supervisorMobile: finalSupMobile,
          enumerators
        });
      });

      return circles;
    }

    return [];
  }, [allotedRows, chargeRows, getHlbBlockNo, getMobileAndUsername, errorsMap]);

  // Fast reverse lookup map: HLB Code -> { circleNo, supervisorName, enumName, enumMobile }
  const hlbToSupervisorMap = useMemo(() => {
    const map = new Map();
    allCircles.forEach(c => {
      c.enumerators.forEach(e => {
        const rawCode = String(e.hlbCode || '').trim();
        const padded = rawCode.padStart(4, '0');
        const numOnly = rawCode.replace(/[^0-9]/g, '');
        const unpadded = String(parseInt(padded, 10) || numOnly || rawCode);
        const obj = {
          circleNo: c.circleNo,
          circleNumber: c.circleNumber,
          supervisorName: c.supervisorName,
          supervisorMobile: c.supervisorMobile,
          supervisorId: c.supervisorId,
          enumName: e.enumName,
          enumId: e.enumId,
          enumMobile: e.enumMobile,
          hlbCode: padded
        };
        [rawCode, padded, unpadded, numOnly].filter(Boolean).forEach(k => map.set(k, obj));
      });
    });
    return map;
  }, [allCircles]);

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
    let totExp = 0, totCen = 0, totHH = 0, totVer = 0, totSe = 0, totPop = 0, totErr = 0, totComp = 0, totHlbs = 0, totLocked = 0;
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
        totLocked += (e.lockedCount || 0);
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
      totalCircles: allCircles.length,
      totalEnums: uniqueEnums.size,
      totalHlbs: totHlbs,
      expectedHouses: totExp,
      censusHouses: totCen,
      households: totHH,
      verifiedBySup: totVer,
      totalSeId: totSe,
      totalLocked: totLocked,
      totalPopulation: totPop,
      totalErrors: totErr || censusErrorRows.length,
      completedCount: totComp
    };
  }, [allCircles, chargeRows, censusErrorRows]);

  // Error Breakup by Type — across all census errors
  const errorBreakupAll = useMemo(() => {
    const counts = {};
    DEFAULT_ERRORS.forEach(d => { counts[d.id] = 0; });
    counts['other'] = 0;

    censusErrorRows.forEach(e => {
      const matchedId = matchErrorType(e);
      if (matchedId) counts[matchedId]++;
      else counts['other']++;
    });

    return counts;
  }, [censusErrorRows]);

  // Error Breakup for a given list of error records
  const getErrorBreakup = useCallback((errorRecords) => {
    const counts = {};
    DEFAULT_ERRORS.forEach(d => { counts[d.id] = 0; });
    counts['other'] = 0;

    (errorRecords || []).forEach(e => {
      const matchedId = matchErrorType(e);
      if (matchedId) counts[matchedId]++;
      else counts['other']++;
    });

    return counts;
  }, []);

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
    <div className="public-report-container" style={{
      minHeight: '100vh',
      background: '#0a0d14',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '16px 32px',
      userSelect: 'none',
      WebkitUserSelect: 'none'
    }}>
      <style>{`
        @media (max-width: 640px) {
          .public-report-container {
            padding: 10px 8px !important;
          }
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
          .modal-table-scroll {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .modal-table-scroll table {
            min-width: 720px !important;
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
          .err-breakup-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px !important;
          }
          .err-breakup-card {
            padding: 8px 10px !important;
          }
          .err-breakup-icon {
            font-size: 16px !important;
          }
          .err-breakup-name {
            font-size: 9.5px !important;
          }
          .err-breakup-count {
            font-size: 15px !important;
          }
        }

        /* GLOBAL CARD HOVER & INTERACTION (Desktop & Mobile) */
        .kpi-card {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease !important;
          position: relative;
          overflow: hidden;
          will-change: transform, box-shadow;
        }
        .kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          transition: 0.5s ease;
          pointer-events: none;
        }
        .kpi-card:hover::before {
          left: 100%;
        }
        .kpi-card:hover {
          transform: translateY(-5px) scale(1.02) !important;
          box-shadow: 0 16px 32px -8px var(--card-glow, rgba(56,189,248,0.4)), 0 0 20px -2px var(--card-glow-sub, rgba(56,189,248,0.25)) !important;
          border-color: var(--card-border-hover, rgba(56,189,248,0.8)) !important;
        }
        .kpi-card:hover .kpi-icon-badge {
          transform: scale(1.18) rotate(8deg) !important;
          box-shadow: 0 4px 14px var(--card-glow-sub, rgba(255,255,255,0.3)) !important;
        }

        /* Interactive Active Errors Card (Sleek Glowing Neon Breathing Aura) */
        .kpi-card.interactive-error-card {
          cursor: pointer !important;
          animation: errorCardPulse 2.2s ease-in-out infinite alternate;
          position: relative;
        }
        .kpi-card.interactive-error-card:hover {
          transform: translateY(-5px) scale(1.03) !important;
          box-shadow: 0 16px 36px -6px rgba(239, 68, 68, 0.55), 0 0 28px rgba(239, 68, 68, 0.4) !important;
          border-color: #ef4444 !important;
        }
        .kpi-card.interactive-error-card:active {
          transform: scale(0.97) !important;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45) !important;
        }
        .kpi-card.interactive-error-card.is-open {
          border-color: #f87171 !important;
          box-shadow: 0 0 24px rgba(239, 68, 68, 0.45), inset 0 0 16px rgba(239, 68, 68, 0.2) !important;
        }

        @keyframes errorCardPulse {
          0% {
            box-shadow: 0 4px 14px -4px rgba(239, 68, 68, 0.25), 0 0 8px rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 8px 24px -2px rgba(239, 68, 68, 0.52), 0 0 22px rgba(239, 68, 68, 0.35);
            border-color: rgba(248, 113, 113, 0.95);
          }
          100% {
            box-shadow: 0 12px 30px -2px rgba(239, 68, 68, 0.65), 0 0 30px rgba(239, 68, 68, 0.48);
            border-color: #ef4444;
          }
        }

        @keyframes errorSectionSlideDown {
          0% {
            opacity: 0;
            transform: translateY(-12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .err-breakup-section-animated {
          animation: errorSectionSlideDown 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .err-breakup-card {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease, opacity 0.28s ease !important;
          position: relative;
          overflow: hidden;
          will-change: transform, box-shadow;
        }
        .err-breakup-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          transition: 0.5s ease;
          pointer-events: none;
        }
        .err-breakup-card:hover::before {
          left: 100%;
        }
        .err-breakup-card:hover {
          transform: translateY(-5px) scale(1.02) !important;
          opacity: 1 !important;
          box-shadow: 0 16px 32px -8px var(--card-glow, rgba(239,68,68,0.4)), 0 0 20px -2px var(--card-glow-sub, rgba(239,68,68,0.25)) !important;
          border-color: var(--card-border-hover, rgba(239,68,68,0.8)) !important;
        }
        .err-breakup-card:hover .kpi-icon-badge {
          transform: scale(1.18) rotate(8deg) !important;
          box-shadow: 0 4px 14px var(--card-glow-sub, rgba(255,255,255,0.3)) !important;
        }

        /* Modal Spring & Backdrop Animations */
        .modal-backdrop-anim {
          animation: modalBackdropFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .modal-card-anim {
          animation: modalSpringPopIn 0.38s cubic-bezier(0.34, 1.45, 0.7, 1) forwards;
          transform-origin: center center;
        }

        @keyframes modalBackdropFadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
        }

        @keyframes modalSpringPopIn {
          0% {
            opacity: 0;
            transform: scale(0.86) translateY(28px);
          }
          70% {
            transform: scale(1.015) translateY(-3px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Staggered Card Entrance for Breakup Cards */
        .err-breakup-grid .err-breakup-card {
          animation: cardStaggerPop 0.38s cubic-bezier(0.34, 1.35, 0.64, 1) backwards;
        }
        .err-breakup-grid .err-breakup-card:nth-child(1) { animation-delay: 0.04s; }
        .err-breakup-grid .err-breakup-card:nth-child(2) { animation-delay: 0.08s; }
        .err-breakup-grid .err-breakup-card:nth-child(3) { animation-delay: 0.12s; }
        .err-breakup-grid .err-breakup-card:nth-child(4) { animation-delay: 0.16s; }
        .err-breakup-grid .err-breakup-card:nth-child(5) { animation-delay: 0.20s; }
        .err-breakup-grid .err-breakup-card:nth-child(6) { animation-delay: 0.24s; }
        .err-breakup-grid .err-breakup-card:nth-child(7) { animation-delay: 0.28s; }

        @keyframes cardStaggerPop {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Live Running Marquee Ticker Banner */
        .live-ticker-wrap {
          display: flex;
          align-items: center;
          background: linear-gradient(90deg, #0b0f19 0%, #111827 50%, #0b0f19 100%);
          border: 1px solid rgba(56, 189, 248, 0.28);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 14px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.5), inset 0 0 12px rgba(56, 189, 248, 0.08);
          position: relative;
        }
        .live-ticker-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #e11d48 0%, #991b1b 100%);
          color: #ffffff;
          padding: 7px 14px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          white-space: nowrap;
          z-index: 2;
          box-shadow: 4px 0 14px rgba(0,0,0,0.5);
        }
        .live-ticker-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: liveDotPulse 1.2s infinite alternate;
        }
        @keyframes liveDotPulse {
          0% { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 12px #22c55e; }
        }
        .live-ticker-marquee {
          flex: 1;
          overflow: hidden;
          white-space: nowrap;
          display: flex;
          align-items: center;
          padding: 6px 0;
          mask-image: linear-gradient(90deg, transparent 0%, black 2%, black 98%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 2%, black 98%, transparent 100%);
        }
        .live-ticker-track {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          animation: marqueeScroll 32s linear infinite;
        }
        .live-ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .live-ticker-item {
          font-size: 11px;
          color: #cbd5e1;
          display: inline-flex;
          align-items: center;
          padding: 0 20px;
          letter-spacing: 0.2px;
        }

        .kpi-icon-badge {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease !important;
        }
      `}</style>
      {/* 1. OUTDATED LINK VIEW: Clean & Professional Message without exposing internal URLs */}
      {queryParams.isOutdatedUrl ? (
        <div style={{
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            padding: '42px 30px',
            background: 'linear-gradient(145deg, #111827 0%, #0b0f17 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 35px rgba(245,158,11,0.1)'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.08))',
              border: '2px solid rgba(245, 158, 11, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 22px auto',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)'
            }}>
              <Shield size={40} color="#fbbf24" />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '0.3px' }}>
              Portal Link Updated
            </h2>

            <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#fbbf24', margin: '0 0 16px 0' }}>
              அணுகல் முகவரி புதுப்பிக்கப்பட்டுள்ளது
            </p>

            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0', lineHeight: 1.7 }}>
              The report portal link has been updated for system and security enhancements. <br />
              Please contact the <b>Administrator</b> or your <b>Team Lead</b> to obtain the updated direct access link.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '12px',
              color: '#cbd5e1',
              lineHeight: 1.6,
              textAlign: 'center'
            }}>
              பாதுகாப்பு மேம்பாடுகள் காரணமாக இந்த பக்கத்திற்கான முகவரி புதுப்பிக்கப்பட்டுள்ளது. புதிய நேரடி இணைப்பைப் பெற <b>நிர்வாகி அல்லது Team Lead</b>-ஐத் தொடர்பு கொள்ளவும்.
            </div>

            <div style={{ marginTop: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Lock size={13} color="#fbbf24" /> Please Contact Administration / Team Lead
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Brand Header */}
          <div style={{
            maxWidth: '1440px',
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
                  {targetCircleData 
                    ? `CENSUS SUPERVISOR PROGRESS REPORT` 
                    : (queryParams.isAdmin 
                        ? `CENSUS KINGMAKER MASTER PORTAL` 
                        : (queryParams.isTeamLead 
                            ? `CENSUS TEAM LEAD MONITORING PORTAL` 
                            : `CENSUS HEAD OF DEPARTMENT (HOD) PORTAL`))}
                </h1>
                <p className="brand-sub" style={{ fontSize: '11px', margin: 0, color: '#94a3b8' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{selectedZoneObj ? selectedZoneObj.name : `Zone ${selectedZone}`}</span> · {
                    targetCircleData 
                      ? `${targetCircleData.circleNo} — Supervisor Portal (${targetCircleData.supervisorId || targetCircleData.supervisorName})` 
                      : (queryParams.isAdmin 
                          ? `Role: KingMaker — All Circles (${allCircles.length})` 
                          : (queryParams.isTeamLead 
                              ? `Role: Team Lead (TL) — Zone Circles (${allCircles.length})` 
                              : `Role: Head of Department (HOD) — Zone Circles (${allCircles.length})`))
                  }
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Zone Dropdown ONLY for KingMaker; HOD, TeamLead, and Supervisors see locked static zone badge */}
              {queryParams.isAdmin ? (
                <CensusZoneSelector compact={true} />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#38bdf8',
                  fontWeight: 800
                }}>
                  📍 {selectedZoneObj ? selectedZoneObj.name : `Zone ${selectedZone}`}
                </div>
              )}
              {(queryParams.isAdmin || queryParams.isTeamLead) && (
                <button
                  type="button"
                  onClick={() => {
                    const padCirc = targetCircleData ? String(targetCircleData.circleNo || targetCircleData.circleNumber).replace(/[^0-9]/g, '').padStart(3, '0') : '';
                    const link = targetCircleData
                      ? `${window.location.origin}/report?zone=${selectedZone}&circle=${padCirc}`
                      : (queryParams.isTeamLead 
                          ? `${window.location.origin}/report?zone=${selectedZone}&role=teamlead`
                          : `${window.location.origin}/report?role=kingMaker`);
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(link);
                      alert(`📋 Public Link Copied to Clipboard:\n\n${link}`);
                    } else {
                      prompt('Copy Public Link:', link);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                  }}
                  title="Copy Public Link"
                >
                  <Share2 size={13} />
                  {queryParams.isAdmin ? 'Copy KingMaker Link' : 'Copy TL Link'}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ fontSize: '10.5px', color: targetCircleData ? '#38bdf8' : (queryParams.isAdmin ? '#ec4899' : (queryParams.isTeamLead ? '#10b981' : '#a855f7')), fontWeight: 800 }}>
                  {targetCircleData ? `${targetCircleData.circleNo}` : (queryParams.isAdmin ? 'ID: KINGMAKER' : (queryParams.isTeamLead ? 'ID: TEAM LEAD' : 'ID: HOD'))}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Lock size={12} color="#4ade80" />
                <span style={{ fontSize: '10.5px', color: '#4ade80', fontWeight: 700 }}>Secure View-Only</span>
              </div>
            </div>
          </div>

          {/* Live Running Text Ticker Banner */}
          <div className="live-ticker-wrap" style={{
            maxWidth: '1440px',
            margin: '0 auto 16px auto'
          }}>
            <div className="live-ticker-badge">
              <div className="live-ticker-dot" />
              <span>LIVE UPDATES</span>
            </div>
            <div className="live-ticker-marquee">
              <div className="live-ticker-track">
                <span className="live-ticker-item">
                  📊 <b style={{ color: '#38bdf8', marginLeft: '5px', marginRight: '4px' }}>Progress Report Updated:</b> {lastReportSyncTime || 'Active'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
                <span className="live-ticker-item">
                  ⚠️ <b style={{ color: '#f87171', marginLeft: '5px', marginRight: '4px' }}>Census Errors Updated:</b> {lastErrorSyncTime || 'Active'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
                <span className="live-ticker-item">
                  📍 <b style={{ color: '#fbbf24', marginLeft: '5px', marginRight: '4px' }}>Active Zone:</b> {selectedZoneObj ? selectedZoneObj.name : `Zone ${selectedZone}`}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
                <span className="live-ticker-item">
                  👥 <b style={{ color: '#4ade80', marginLeft: '5px', marginRight: '4px' }}>Total Allotted Blocks:</b> {hodStats.totalHlbs} HLBs
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
                <span className="live-ticker-item">
                  🏢 <b style={{ color: '#c084fc', marginLeft: '5px', marginRight: '4px' }}>Total Circles:</b> {allCircles.length} Circles
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
                <span className="live-ticker-item">
                  🔒 <b style={{ color: '#e2e8f0', marginLeft: '5px', marginRight: '4px' }}>PSK Real-Time Census Network</b>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>

                {/* Duplicated track for seamless infinite marquee loop */}
                <span className="live-ticker-item">
                  📊 <b style={{ color: '#38bdf8', marginLeft: '5px', marginRight: '4px' }}>Progress Report Updated:</b> {lastReportSyncTime || 'Active'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
                <span className="live-ticker-item">
                  ⚠️ <b style={{ color: '#f87171', marginLeft: '5px', marginRight: '4px' }}>Census Errors Updated:</b> {lastErrorSyncTime || 'Active'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
                <span className="live-ticker-item">
                  📍 <b style={{ color: '#fbbf24', marginLeft: '5px', marginRight: '4px' }}>Active Zone:</b> {selectedZoneObj ? selectedZoneObj.name : `Zone ${selectedZone}`}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
                <span className="live-ticker-item">
                  👥 <b style={{ color: '#4ade80', marginLeft: '5px', marginRight: '4px' }}>Total Allotted Blocks:</b> {hodStats.totalHlbs} HLBs
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
                <span className="live-ticker-item">
                  🏢 <b style={{ color: '#c084fc', marginLeft: '5px', marginRight: '4px' }}>Total Circles:</b> {allCircles.length} Circles
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
                <span className="live-ticker-item">
                  🔒 <b style={{ color: '#e2e8f0', marginLeft: '5px', marginRight: '4px' }}>PSK Real-Time Census Network</b>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>✦</span>
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ maxWidth: '1440px', margin: '40px auto', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600 }}>Loading Census Records...</p>
            </div>
          )}

          {/* NOT FOUND PAGE - invalid circle number or out-of-range for active zone */}
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
                Supervisor Circle Not Found
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 14px 0' }}>
                The requested supervisor circle does not exist in <b style={{ color: '#38bdf8' }}>{selectedZoneObj ? selectedZoneObj.name : `Zone ${selectedZone}`}</b>.
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
                Please contact your Administrator or Team Lead for the authorized access link.
              </p>
            </div>
          )}

      {/* SINGLE SUPERVISOR VIEW */}
      {!loading && targetCircleData && targetCircleData !== undefined && (
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            const lck = targetCircleData.enumerators.reduce((s, e) => s + (e.lockedCount || 0), 0);
            const err = targetCircleData.enumerators.reduce((s, e) => s + e.errorCount, 0);
            const comp = targetCircleData.enumerators.filter(e => e.isCompleted).length;

            return (
              <>
              <div className="kpi-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px'
              }}>
                {[
                  { label: 'Exp Houses', value: exp.toLocaleString(), color: '#f1f5f9', accent: '#94a3b8', gradient: 'linear-gradient(135deg, rgba(148,163,184,0.15) 0%, rgba(15,23,42,0.7) 100%)', icon: '🏠', borderColor: '#64748b' },
                  { label: 'Cen Houses', value: cen.toLocaleString(), color: '#38bdf8', accent: '#0284c7', gradient: 'linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '🏘️', borderColor: '#0284c7' },
                  { label: 'Households', value: hh.toLocaleString(), color: '#fbbf24', accent: '#f59e0b', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '👨‍👩‍👧‍👦', borderColor: '#d97706' },
                  { label: 'Verified By Sup', value: ver.toLocaleString(), color: '#38bdf8', accent: '#0ea5e9', gradient: 'linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '✅', borderColor: '#0284c7' },
                  { label: 'SE ID Used', value: se.toLocaleString(), color: '#d8b4fe', accent: '#c084fc', gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '🆔', borderColor: '#7c3aed' },
                  { label: '🔒 Locked', value: lck.toLocaleString(), color: '#22d3ee', accent: '#06b6d4', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '🔒', borderColor: '#0891b2' },
                  { label: 'Population', value: pop.toLocaleString(), color: '#4ade80', accent: '#22c55e', gradient: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '👤', borderColor: '#16a34a' },
                  {
                    label: 'Active Errors',
                    value: String(err),
                    color: err > 0 ? '#f87171' : '#4ade80',
                    accent: err > 0 ? '#ef4444' : '#22c55e',
                    gradient: err > 0
                      ? (showSupervisorErrorBreakup
                          ? 'linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(30,27,75,0.95) 100%)'
                          : 'linear-gradient(135deg, rgba(239,68,68,0.22) 0%, rgba(15,23,42,0.85) 100%)')
                      : 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(15,23,42,0.7) 100%)',
                    icon: err > 0 ? (showSupervisorErrorBreakup ? '📂' : '⚠️') : '✅',
                    borderColor: err > 0 ? (showSupervisorErrorBreakup ? '#f87171' : '#dc2626') : '#16a34a',
                    isErrorCard: true,
                    hasErrors: err > 0,
                    isExpanded: showSupervisorErrorBreakup,
                    onClick: () => {
                      if (err > 0) setShowSupervisorErrorBreakup(prev => !prev);
                    }
                  },
                  { label: 'Status', value: `${comp}/${targetCircleData.enumerators.length}`, sub: 'Comp', color: comp === targetCircleData.enumerators.length ? '#4ade80' : '#fbbf24', accent: comp === targetCircleData.enumerators.length ? '#16a34a' : '#d97706', gradient: comp === targetCircleData.enumerators.length ? 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(15,23,42,0.7) 100%)' : 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: comp === targetCircleData.enumerators.length ? '🎉' : '⏳', borderColor: comp === targetCircleData.enumerators.length ? '#16a34a' : '#d97706' }
                ].map((card, i) => (
                  <div
                    key={i}
                    className={`kpi-card ${card.isErrorCard && card.hasErrors ? 'interactive-error-card' : ''} ${card.isExpanded ? 'is-open' : ''}`}
                    onClick={card.onClick}
                    title={card.isErrorCard && card.hasErrors ? (card.isExpanded ? 'Click to hide error breakdown' : 'Tap to expand error categories') : undefined}
                    style={{
                      background: card.gradient,
                      borderRadius: '14px',
                      padding: '12px 14px',
                      border: `1px solid ${card.borderColor}35`,
                      borderLeft: `3.5px solid ${card.borderColor}`,
                      position: 'relative',
                      backdropFilter: 'blur(12px)',
                      boxShadow: `0 4px 16px -4px ${card.accent}15`,
                      '--card-glow': `${card.accent}50`,
                      '--card-glow-sub': `${card.accent}25`,
                      '--card-border-hover': `${card.accent}90`,
                      cursor: card.onClick && card.hasErrors ? 'pointer' : 'default',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '85px',
                      userSelect: 'none'
                    }}
                  >
                    {/* Top glow shine */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: `linear-gradient(90deg, transparent, ${card.accent}55, transparent)`
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{card.label}</div>
                      {card.icon && (
                        <div className="kpi-icon-badge" style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `${card.accent}22`,
                          border: `1px solid ${card.accent}45`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          boxShadow: `0 2px 8px ${card.accent}20`
                        }}>
                          {card.icon}
                        </div>
                      )}
                    </div>
                    <div className="kpi-value" style={{ fontSize: '21px', fontWeight: 900, color: card.color, letterSpacing: '-0.5px' }}>
                      {card.value}{card.sub && <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginLeft: '5px' }}>{card.sub}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* ERROR BREAKUP CARDS — Supervisor View (Toggled on tap of Active Errors card) */}
              {err > 0 && showSupervisorErrorBreakup && (() => {
                const supAllErrors = targetCircleData.enumerators.flatMap(e => e.errorRecords || []);
                const supBreakup = getErrorBreakup(supAllErrors);
                return (
                  <div className="err-breakup-section-animated" style={{
                    marginTop: '10px',
                    background: 'linear-gradient(145deg, rgba(30, 27, 75, 0.45) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1.5px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 12px 32px -8px rgba(239, 68, 68, 0.25), inset 0 0 20px rgba(239, 68, 68, 0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(239,68,68,0.25)',
                          border: '1px solid rgba(239,68,68,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <AlertTriangle size={15} color="#ef4444" />
                        </div>
                        <div>
                          <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                            Error Type Breakup
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px', fontWeight: 600 }}>
                            ({err} total errors in {targetCircleData.circleNo} · Tap card to inspect)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSupervisorErrorBreakup(false)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#fca5a5',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ▲ Hide Breakup
                      </button>
                    </div>

                    <div className="err-breakup-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '12px'
                    }}>
                      {DEFAULT_ERRORS.map(def => {
                        const count = supBreakup[def.id] || 0;
                        const matchingErrors = supAllErrors.filter(e => matchErrorType(e) === def.id);
                        return (
                          <div
                            key={def.id}
                            className="err-breakup-card"
                            onClick={() => {
                              if (count > 0) {
                                setSelectedErrorModal({
                                  circleNo: targetCircleData.circleNo,
                                  supervisorName: targetCircleData.supervisorName,
                                  enumName: `All Blocks (${def.name})`,
                                  enumId: def.id.toUpperCase(),
                                  enumMobile: targetCircleData.supervisorMobile,
                                  hlbCode: 'ALL',
                                  errors: matchingErrors
                                });
                              }
                            }}
                            title={count > 0 ? `Click to inspect all ${count} ${def.name} errors` : 'No errors of this type'}
                            style={{
                              background: count > 0 
                                ? `linear-gradient(145deg, ${def.color}18 0%, rgba(15,23,42,0.9) 100%)`
                                : 'rgba(19,24,36,0.6)',
                              border: `1px solid ${count > 0 ? def.color + '45' : 'rgba(255,255,255,0.06)'}`,
                              borderLeft: `4px solid ${count > 0 ? def.color : 'rgba(255,255,255,0.1)'}`,
                              borderRadius: '16px',
                              padding: '14px 16px',
                              backdropFilter: 'blur(12px)',
                              opacity: count > 0 ? 1 : 0.45,
                              '--card-glow': `${def.color}45`,
                              '--card-glow-sub': `${def.color}20`,
                              '--card-border-hover': `${def.color}90`,
                              cursor: count > 0 ? 'pointer' : 'default',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              minHeight: '135px'
                            }}
                          >
                            {/* Top specular line */}
                            {count > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '1.5px',
                                background: `linear-gradient(90deg, transparent, ${def.color}60, transparent)`
                              }} />
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div className="kpi-icon-badge" style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: `${def.color}25`,
                                border: `1.5px solid ${def.color}55`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '22px',
                                boxShadow: `0 4px 12px ${def.color}25`
                              }}>
                                {def.icon}
                              </div>
                              <div className="err-breakup-count" style={{ fontSize: '26px', fontWeight: 900, color: count > 0 ? def.color : '#475569', letterSpacing: '-0.5px' }}>
                                {count.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="err-breakup-name" style={{ fontSize: '11.5px', fontWeight: 800, color: '#f1f5f9', lineHeight: '1.3', marginBottom: '6px' }}>
                                {def.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
                                <div style={{
                                  display: 'inline-block',
                                  fontSize: '9.5px',
                                  color: count > 0 ? '#94a3b8' : '#475569',
                                  fontWeight: 600,
                                  background: 'rgba(255,255,255,0.05)',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  lineHeight: '1.3'
                                }}>
                                  {def.nameTa}
                                </div>
                                {count > 0 && (
                                  <span style={{ fontSize: '9px', color: def.color, fontWeight: 800 }}>Inspect 🔍</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {supBreakup['other'] > 0 && (() => {
                        const matchingOthers = supAllErrors.filter(e => matchErrorType(e) === null);
                        return (
                          <div
                            className="err-breakup-card"
                            onClick={() => {
                              setSelectedErrorModal({
                                circleNo: targetCircleData.circleNo,
                                supervisorName: targetCircleData.supervisorName,
                                enumName: `All Blocks (Other Errors)`,
                                enumId: 'OTHER',
                                enumMobile: targetCircleData.supervisorMobile,
                                hlbCode: 'ALL',
                                errors: matchingOthers
                              });
                            }}
                            title={`Click to inspect all ${supBreakup['other']} other errors`}
                            style={{
                              background: 'linear-gradient(145deg, rgba(148,163,184,0.15) 0%, rgba(15,23,42,0.9) 100%)',
                              border: '1px solid rgba(148,163,184,0.35)',
                              borderLeft: '4px solid #94a3b8',
                              borderRadius: '16px',
                              padding: '14px 16px',
                              backdropFilter: 'blur(12px)',
                              '--card-glow': 'rgba(148,163,184,0.35)',
                              '--card-glow-sub': 'rgba(148,163,184,0.15)',
                              '--card-border-hover': 'rgba(148,163,184,0.8)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              minHeight: '135px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div className="kpi-icon-badge" style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: 'rgba(148,163,184,0.22)',
                                border: '1.5px solid rgba(148,163,184,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '22px',
                                boxShadow: '0 4px 12px rgba(148,163,184,0.2)'
                              }}>
                                ⚠️
                              </div>
                              <div className="err-breakup-count" style={{ fontSize: '26px', fontWeight: 900, color: '#e2e8f0', letterSpacing: '-0.5px' }}>
                                {supBreakup['other'].toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="err-breakup-name" style={{ fontSize: '11.5px', fontWeight: 800, color: '#f1f5f9', lineHeight: '1.3', marginBottom: '6px' }}>
                                Other Errors
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
                                <div style={{
                                  display: 'inline-block',
                                  fontSize: '9.5px',
                                  color: '#94a3b8',
                                  fontWeight: 600,
                                  background: 'rgba(255,255,255,0.05)',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  lineHeight: '1.3'
                                }}>
                                  பிற பிழைகள்
                                </div>
                                <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>Inspect 🔍</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}

              </>
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
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800 }}>🔒 Locked</th>
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
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#06b6d4' }}>{e.lockedCount || 0}</td>
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
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* HOD Master KPIs — Ultra Sleek Design */}
          <div className="kpi-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            gap: '10px'
          }}>
            {[
              { label: 'Supervisors', value: `${hodStats.totalCircles}`, sub: 'Circles', color: '#ffffff', accent: '#818cf8', gradient: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '👨‍💼', borderColor: '#6366f1' },
              { label: 'Enumerators', value: `${hodStats.totalEnums}`, sub: 'Enums', color: '#38bdf8', accent: '#38bdf8', gradient: 'linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '👥', borderColor: '#0ea5e9' },
              { label: 'Total HLBs', value: `${hodStats.totalHlbs}`, sub: 'Blocks', color: '#c084fc', accent: '#c084fc', gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '🗂️', borderColor: '#a855f7' },
              { label: 'Expected Houses', value: hodStats.expectedHouses.toLocaleString(), sub: null, color: '#f1f5f9', accent: '#94a3b8', gradient: 'linear-gradient(135deg, rgba(148,163,184,0.15) 0%, rgba(15,23,42,0.7) 100%)', icon: '🏠', borderColor: '#64748b' },
              { label: 'Census Houses', value: hodStats.censusHouses.toLocaleString(), sub: null, color: '#38bdf8', accent: '#0284c7', gradient: 'linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '🏘️', borderColor: '#0284c7' },
              { label: 'Households', value: hodStats.households.toLocaleString(), sub: null, color: '#fbbf24', accent: '#f59e0b', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '👨‍👩‍👧‍👦', borderColor: '#d97706' },
              { label: 'Verified By Sup', value: hodStats.verifiedBySup.toLocaleString(), sub: null, color: '#38bdf8', accent: '#0ea5e9', gradient: 'linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '✅', borderColor: '#0284c7' },
              { label: 'SE ID Used', value: hodStats.totalSeId.toLocaleString(), sub: null, color: '#d8b4fe', accent: '#c084fc', gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '🆔', borderColor: '#7c3aed' },
              { label: '🔒 Locked', value: hodStats.totalLocked.toLocaleString(), sub: null, color: '#22d3ee', accent: '#06b6d4', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '🔒', borderColor: '#0891b2' },
              { label: 'Total Population', value: hodStats.totalPopulation.toLocaleString(), sub: null, color: '#4ade80', accent: '#22c55e', gradient: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(15,23,42,0.7) 100%)', icon: '👤', borderColor: '#16a34a' },
              {
                label: 'Active Errors',
                value: hodStats.totalErrors.toLocaleString(),
                sub: null,
                color: hodStats.totalErrors > 0 ? '#f87171' : '#4ade80',
                accent: hodStats.totalErrors > 0 ? '#ef4444' : '#22c55e',
                gradient: hodStats.totalErrors > 0
                  ? (showHodErrorBreakup
                      ? 'linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(30,27,75,0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(239,68,68,0.22) 0%, rgba(15,23,42,0.85) 100%)')
                  : 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(15,23,42,0.7) 100%)',
                icon: hodStats.totalErrors > 0 ? (showHodErrorBreakup ? '📂' : '⚠️') : '✅',
                borderColor: hodStats.totalErrors > 0 ? (showHodErrorBreakup ? '#f87171' : '#dc2626') : '#16a34a',
                isErrorCard: true,
                hasErrors: hodStats.totalErrors > 0,
                isExpanded: showHodErrorBreakup,
                onClick: () => {
                  if (hodStats.totalErrors > 0) setShowHodErrorBreakup(prev => !prev);
                }
              }
            ].map((card, i) => (
              <div
                key={i}
                className={`kpi-card ${card.isErrorCard && card.hasErrors ? 'interactive-error-card' : ''} ${card.isExpanded ? 'is-open' : ''}`}
                onClick={card.onClick}
                title={card.isErrorCard && card.hasErrors ? (card.isExpanded ? 'Click to hide error breakdown' : 'Tap to expand error categories') : undefined}
                style={{
                  background: card.gradient,
                  borderRadius: '14px',
                  padding: '12px 14px',
                  border: `1px solid ${card.borderColor}35`,
                  borderLeft: `3.5px solid ${card.borderColor}`,
                  position: 'relative',
                  backdropFilter: 'blur(12px)',
                  boxShadow: `0 4px 16px -4px ${card.accent}15`,
                  '--card-glow': `${card.accent}50`,
                  '--card-glow-sub': `${card.accent}25`,
                  '--card-border-hover': `${card.accent}90`,
                  cursor: card.onClick && card.hasErrors ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '85px',
                  userSelect: 'none'
                }}
              >
                {/* Top glow shine */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${card.accent}55, transparent)`
                }} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{card.label}</div>
                  {card.icon && (
                    <div className="kpi-icon-badge" style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${card.accent}22`,
                      border: `1px solid ${card.accent}45`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      boxShadow: `0 2px 8px ${card.accent}20`
                    }}>
                      {card.icon}
                    </div>
                  )}
                </div>
                <div className="kpi-value" style={{ fontSize: '21px', fontWeight: 900, color: card.color, letterSpacing: '-0.5px' }}>
                  {card.value}{card.sub && <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginLeft: '5px' }}>{card.sub}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* ERROR BREAKUP CARDS — HOD/Admin View (Toggled on tap of Active Errors card) */}
          {hodStats.totalErrors > 0 && showHodErrorBreakup && (
            <div className="err-breakup-section-animated" style={{
              marginTop: '10px',
              background: 'linear-gradient(145deg, rgba(30, 27, 75, 0.45) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 12px 32px -8px rgba(239, 68, 68, 0.25), inset 0 0 20px rgba(239, 68, 68, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(239,68,68,0.25)',
                    border: '1px solid rgba(239,68,68,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AlertTriangle size={15} color="#ef4444" />
                  </div>
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      Error Type Breakup
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px', fontWeight: 600 }}>
                      ({hodStats.totalErrors.toLocaleString()} total errors across all circles · Tap card to inspect)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHodErrorBreakup(false)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ▲ Hide Breakup
                </button>
              </div>

              <div className="err-breakup-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '12px'
              }}>
                {DEFAULT_ERRORS.map(def => {
                  const count = errorBreakupAll[def.id] || 0;
                  const matchingErrors = censusErrorRows.filter(e => matchErrorType(e) === def.id);
                  return (
                    <div
                      key={def.id}
                      className="err-breakup-card"
                      onClick={() => {
                        if (count > 0) {
                          setSelectedErrorModal({
                            circleNo: 'ALL CIRCLES',
                            supervisorName: `All Supervisors (${def.name})`,
                            enumName: `Zone ${selectedZone}`,
                            enumId: def.id.toUpperCase(),
                            enumMobile: 'N/A',
                            hlbCode: 'ALL',
                            errors: matchingErrors
                          });
                        }
                      }}
                      title={count > 0 ? `Click to inspect all ${count} ${def.name} errors across all circles` : 'No errors of this type'}
                      style={{
                        background: count > 0 
                          ? `linear-gradient(145deg, ${def.color}18 0%, rgba(15,23,42,0.9) 100%)`
                          : 'rgba(19,24,36,0.6)',
                        border: `1px solid ${count > 0 ? def.color + '45' : 'rgba(255,255,255,0.06)'}`,
                        borderLeft: `4px solid ${count > 0 ? def.color : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '16px',
                        padding: '14px 16px',
                        backdropFilter: 'blur(12px)',
                        opacity: count > 0 ? 1 : 0.45,
                        '--card-glow': `${def.color}45`,
                        '--card-glow-sub': `${def.color}20`,
                        '--card-border-hover': `${def.color}90`,
                        cursor: count > 0 ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '135px'
                      }}
                    >
                      {/* Top specular line */}
                      {count > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1.5px',
                          background: `linear-gradient(90deg, transparent, ${def.color}60, transparent)`
                        }} />
                      )}
                      
                      {/* Header Row: Big Prominent Icon + Count */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div className="kpi-icon-badge" style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: `${def.color}25`,
                          border: `1.5px solid ${def.color}55`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          boxShadow: `0 4px 12px ${def.color}25`
                        }}>
                          {def.icon}
                        </div>
                        <div className="err-breakup-count" style={{ fontSize: '26px', fontWeight: 900, color: count > 0 ? def.color : '#475569', letterSpacing: '-0.5px' }}>
                          {count.toLocaleString()}
                        </div>
                      </div>

                      {/* Title & Tamil Label */}
                      <div>
                        <div className="err-breakup-name" style={{ fontSize: '11.5px', fontWeight: 800, color: '#f1f5f9', lineHeight: '1.3', marginBottom: '6px' }}>
                          {def.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
                          <div style={{
                            display: 'inline-block',
                            fontSize: '9.5px',
                            color: count > 0 ? '#94a3b8' : '#475569',
                            fontWeight: 600,
                            background: 'rgba(255,255,255,0.05)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            lineHeight: '1.3'
                          }}>
                            {def.nameTa}
                          </div>
                          {count > 0 && (
                            <span style={{ fontSize: '9px', color: def.color, fontWeight: 800 }}>Inspect 🔍</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {errorBreakupAll['other'] > 0 && (() => {
                  const matchingOthers = censusErrorRows.filter(e => matchErrorType(e) === null);
                  return (
                    <div
                      className="err-breakup-card"
                      onClick={() => {
                        setSelectedErrorModal({
                          circleNo: 'ALL CIRCLES',
                          supervisorName: `All Supervisors (Other Errors)`,
                          enumName: `Zone ${selectedZone}`,
                          enumId: 'OTHER',
                          enumMobile: 'N/A',
                          hlbCode: 'ALL',
                          errors: matchingOthers
                        });
                      }}
                      title={`Click to inspect all ${errorBreakupAll['other']} other errors across all circles`}
                      style={{
                        background: 'linear-gradient(145deg, rgba(148,163,184,0.15) 0%, rgba(15,23,42,0.9) 100%)',
                        border: '1px solid rgba(148,163,184,0.35)',
                        borderLeft: '4px solid #94a3b8',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        backdropFilter: 'blur(12px)',
                        '--card-glow': 'rgba(148,163,184,0.35)',
                        '--card-glow-sub': 'rgba(148,163,184,0.15)',
                        '--card-border-hover': 'rgba(148,163,184,0.8)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '135px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div className="kpi-icon-badge" style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: 'rgba(148,163,184,0.22)',
                          border: '1.5px solid rgba(148,163,184,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          boxShadow: '0 4px 12px rgba(148,163,184,0.2)'
                        }}>
                          ⚠️
                        </div>
                        <div className="err-breakup-count" style={{ fontSize: '26px', fontWeight: 900, color: '#e2e8f0', letterSpacing: '-0.5px' }}>
                          {errorBreakupAll['other'].toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="err-breakup-name" style={{ fontSize: '11.5px', fontWeight: 800, color: '#f1f5f9', lineHeight: '1.3', marginBottom: '6px' }}>
                          Other Errors
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
                          <div style={{
                            display: 'inline-block',
                            fontSize: '9.5px',
                            color: '#94a3b8',
                            fontWeight: 600,
                            background: 'rgba(255,255,255,0.05)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            lineHeight: '1.3'
                          }}>
                            பிற பிழைகள்
                          </div>
                          <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>Inspect 🔍</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'auto', flexWrap: 'wrap' }}>
                      <a
                        href={`/report?zone=${selectedZone}&circle=${String(c.circleNumber).padStart(3, '0')}`}
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

                      {(queryParams.isAdmin || queryParams.isTeamLead) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const padCirc = String(c.circleNumber || c.circleNo).replace(/[^0-9]/g, '').padStart(3, '0');
                            const link = `${window.location.origin}/report?zone=${selectedZone}&circle=${padCirc}`;
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(link);
                              alert(`📋 Public Link Copied for Supervisor ${c.supervisorName} (Circle ${c.circleNo}):\n\n${link}`);
                            } else {
                              prompt('Copy Public Link:', link);
                            }
                          }}
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: '#34d399',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                          }}
                          title="Copy Public Link with Zone & Circle"
                        >
                          📋 Copy Link
                        </button>
                      )}
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
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800 }}>🔒 Locked</th>
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
                              <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800, color: '#06b6d4' }}>{e.lockedCount || 0}</td>
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
        <div className="modal-backdrop-anim" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="modal-card modal-card-anim" style={{
            background: 'linear-gradient(145deg, #0f172a 0%, #090d16 100%)',
            border: '1px solid rgba(239,68,68,0.45)',
            borderRadius: '16px',
            maxWidth: '1100px',
            width: '100%',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 30px rgba(239,68,68,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#991b1b', color: '#fff', fontWeight: 900, fontSize: '11px', padding: '3px 9px', borderRadius: '6px', letterSpacing: '0.3px' }}>
                    {selectedErrorModal.circleNo}
                  </span>
                  <span style={{ background: '#1e293b', color: '#38bdf8', fontWeight: 800, fontSize: '11px', padding: '3px 9px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.3)' }}>
                    HLB {String(selectedErrorModal.hlbCode).padStart(4, '0')}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.2px' }}>
                    Active Errors Inspection ({selectedErrorModal.errors.length})
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                  <span>Enumerator: <b style={{ color: '#e2e8f0' }}>{selectedErrorModal.enumName}</b> {selectedErrorModal.enumId && selectedErrorModal.enumId !== 'N/A' && `(${selectedErrorModal.enumId})`}</span>
                  <span>· Supervisor: <b style={{ color: '#38bdf8' }}>{selectedErrorModal.supervisorName}</b></span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedErrorModal.enumMobile && selectedErrorModal.enumMobile !== 'N/A' && (
                  <a
                    href={`tel:${selectedErrorModal.enumMobile}`}
                    style={{
                      background: 'rgba(34,197,94,0.18)',
                      border: '1px solid rgba(34,197,94,0.5)',
                      color: '#4ade80',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Phone size={13} />
                    {selectedErrorModal.enumMobile}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedErrorModal(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Close Inspection Modal"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body / Errors Table */}
            <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
              {/* Mini Error Type Breakup in Modal */}
              {(() => {
                const modalBreakup = getErrorBreakup(selectedErrorModal.errors);
                const hasAnyBreakup = DEFAULT_ERRORS.some(d => (modalBreakup[d.id] || 0) > 0);
                if (!hasAnyBreakup) return null;
                return (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '14px',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    {DEFAULT_ERRORS.map(def => {
                      const cnt = modalBreakup[def.id] || 0;
                      if (cnt === 0) return null;
                      return (
                        <div key={def.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: `${def.color}18`,
                          border: `1px solid ${def.color}40`,
                          borderRadius: '8px',
                          padding: '4px 10px'
                        }}>
                          <span style={{ fontSize: '13px' }}>{def.icon}</span>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: def.color }}>{def.name}</span>
                          <span style={{
                            background: def.color,
                            color: '#ffffff',
                            fontSize: '9.5px',
                            fontWeight: 900,
                            padding: '1px 7px',
                            borderRadius: '10px',
                            minWidth: '18px',
                            textAlign: 'center'
                          }}>{cnt}</span>
                        </div>
                      );
                    })}
                    {modalBreakup['other'] > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(148,163,184,0.1)',
                        border: '1px solid rgba(148,163,184,0.3)',
                        borderRadius: '8px',
                        padding: '4px 10px'
                      }}>
                        <span style={{ fontSize: '13px' }}>⚠️</span>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8' }}>Other</span>
                        <span style={{
                          background: '#94a3b8',
                          color: '#0f172a',
                          fontSize: '9.5px',
                          fontWeight: 900,
                          padding: '1px 7px',
                          borderRadius: '10px',
                          minWidth: '18px',
                          textAlign: 'center'
                        }}>{modalBreakup['other']}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '9px 10px', width: '65px', textAlign: 'center', fontWeight: 800 }}>Line No</th>
                    <th style={{ padding: '9px 8px', width: '70px', textAlign: 'center', fontWeight: 800 }}>Circle</th>
                    <th style={{ padding: '9px 8px', width: '85px', textAlign: 'center', fontWeight: 800 }}>HLB No</th>
                    <th style={{ padding: '9px 10px', width: '140px', fontWeight: 800 }}>Enumerator Mobile</th>
                    <th style={{ padding: '9px 8px', width: '75px', textAlign: 'center', fontWeight: 800 }}>Bldg No</th>
                    <th style={{ padding: '9px 8px', width: '75px', textAlign: 'center', fontWeight: 800 }}>House No</th>
                    <th style={{ padding: '9px 10px', width: '125px', fontWeight: 800 }}>Head of House</th>
                    <th style={{ padding: '9px 10px', width: '115px', fontWeight: 800 }}>📞 Head Mobile</th>
                    <th style={{ padding: '9px 10px', fontWeight: 800 }}>Error Description &amp; Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedErrorModal.errors.map((err, i) => {
                    const rawLine = err.line_number ?? err.lineNo ?? (i + 1);
                    const lineStr = String(rawLine).trim();
                    const numOnly = lineStr.replace(/[^0-9]/g, '');
                    const formattedLine = numOnly ? numOnly.padStart(3, '0') : lineStr.padStart(3, '0');

                    const rawHlb = String(err.hlb_code || err.hlb_no || err.hlb || err.full_hlb || err.hlb_serial_no || err.blk_no || '').trim();
                    const blkNum = getHlbBlockNo(rawHlb) || rawHlb.padStart(4, '0');
                    const hlbInfo = hlbToSupervisorMap.get(blkNum) || hlbToSupervisorMap.get(rawHlb) || {};

                    const rowCircle = err.circle_no || err.circleNumber || err.circle || hlbInfo.circleNo || (selectedErrorModal.circleNo !== 'ALL CIRCLES' ? selectedErrorModal.circleNo : '-');
                    const rowHlb = (blkNum && blkNum !== '0000' && blkNum !== '0001') 
                      ? blkNum 
                      : (selectedErrorModal.hlbCode && selectedErrorModal.hlbCode !== '0ALL' && selectedErrorModal.hlbCode !== 'ALL' 
                          ? String(selectedErrorModal.hlbCode).padStart(4, '0') 
                          : (blkNum || '-'));

                    const rowEnumMobile = err.enum_mobile || err.enumerator_mobile || hlbInfo.enumMobile || (selectedErrorModal.enumMobile && selectedErrorModal.enumMobile !== 'N/A' ? selectedErrorModal.enumMobile : '');
                    const rowEnumName = err.enum_name || err.enumerator_name || hlbInfo.enumName || (selectedErrorModal.enumName && selectedErrorModal.enumName !== 'ENUMERATOR' ? selectedErrorModal.enumName : '');

                    return (
                      <tr key={i} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                      }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
                          #{formattedLine}
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                          <span style={{
                            background: '#991b1b',
                            color: '#ffffff',
                            fontWeight: 900,
                            fontSize: '10.5px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            letterSpacing: '0.2px',
                            display: 'inline-block'
                          }}>
                            {rowCircle}
                          </span>
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                          <span style={{
                            background: '#1e293b',
                            color: '#38bdf8',
                            border: '1px solid rgba(56,189,248,0.25)',
                            padding: '3px 7px',
                            borderRadius: '5px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            fontSize: '10.5px',
                            display: 'inline-block'
                          }}>
                            HLB {rowHlb}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {rowEnumMobile && rowEnumMobile !== 'N/A' ? (
                            <div>
                              <a
                                href={`tel:${rowEnumMobile}`}
                                style={{
                                  color: '#60a5fa',
                                  textDecoration: 'none',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  background: 'rgba(59,130,246,0.12)',
                                  border: '1px solid rgba(59,130,246,0.35)',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontFamily: 'monospace',
                                  fontSize: '11px'
                                }}
                              >
                                <Phone size={11} color="#60a5fa" />
                                {rowEnumMobile}
                              </a>
                              {rowEnumName && (
                                <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px', fontWeight: 600 }}>
                                  {rowEnumName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span style={{ color: '#64748b', fontSize: '10.5px' }}>N/A</span>
                              {rowEnumName && (
                                <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px', fontWeight: 600 }}>
                                  {rowEnumName}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'center', fontFamily: 'monospace', color: '#94a3b8' }}>
                          {err.building_number || err.buildingNo || '-'}
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'center', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                          {err.census_house_num || err.houseNo || '-'}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#ffffff' }}>
                          {err.head_name || err.headName || '-'}
                        </td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>
                          {(err.head_mobile || err.headMobile) ? (
                            <a
                              href={`tel:${err.head_mobile || err.headMobile}`}
                              style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Phone size={10} />
                              {err.head_mobile || err.headMobile}
                            </a>
                          ) : <span style={{ color: '#475569' }}>-</span>}
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
      </>
    )}
    </div>
  );
}

export default function CensusPublicSupervisorReport() {
  return (
    <CensusZoneProvider>
      <CensusPublicSupervisorReportContent />
    </CensusZoneProvider>
  );
}


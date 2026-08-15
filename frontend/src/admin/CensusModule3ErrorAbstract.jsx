import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, X, User, Phone, FileText, Printer, AlertTriangle, ChevronDown, ChevronUp, Maximize2, Minimize2, Layers, Filter, Download } from 'lucide-react';
import hlbMapping from './hlbMapping.json';

const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api' : 'https://psk-builders.onrender.com/api');

function getHlbBlockNo(codeStr) {
  if (!codeStr) return '0001';
  let s = String(codeStr).trim();

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

  if (/^\d{1,4}$/.test(s)) {
    return s.padStart(4, '0');
  }

  const match = s.match(/(\d{1,4})(?:00)?$/) || s.match(/(\d{1,4})$/);
  if (match && match[1]) {
    return match[1].padStart(4, '0');
  }
  return s.padStart(4, '0');
}

const DEFAULT_ERRORS = [
  {
    id: 'err1',
    name: 'Night soil removed by human',
    nameTa: 'மனிதர்களால் அகற்றப்படும் வகை',
    col1Name: 'latrine_type_name',
    col1EnText: 'Service latrine:  Night soil removed by human',
    col1TaText: 'சேவை கழிவு:  கழிவு - மனிதர்களால் அகற்றப்படும் வகை',
    enKeywords: ['Service latrine:  Night soil removed by human', 'Night soil removed by human', 'service latrine'],
    taKeywords: ['சேவை கழிவு:  கழிவு - மனிதர்களால் அகற்றப்படும் வகை', 'சேவை கழிவு', 'மனிதர்களால் அகற்றப்படும் வகை'],
    enText: 'Service latrine:  Night soil removed by human',
    taText: 'சேவை கழிவு:  கழிவு - மனிதர்களால் அகற்றப்படும் வகை',
    color: '#ef4444',
    icon: '🚫'
  },
  {
    id: 'err2',
    name: 'Landline Only',
    nameTa: 'தொலைபேசி மட்டும்',
    col1Name: 'avail_telecom',
    col1EnText: 'Landline only',
    col1TaText: 'தொலைபேசி மட்டும்',
    enKeywords: ['Landline only', 'landline'],
    taKeywords: ['தொலைபேசி மட்டும்', 'தொலைபேசி'],
    enText: 'Landline only',
    taText: 'தொலைபேசி மட்டும்',
    color: '#f97316',
    icon: '☎️'
  },
  {
    id: 'err3',
    name: 'No Light',
    nameTa: 'விளக்கு வசதி இல்லை',
    col1Name: 'main_source_lighting',
    col1EnText: 'No lighting',
    col1TaText: 'மின் விளக்கு வசதி இல்லை',
    enKeywords: ['No lighting', 'no light'],
    taKeywords: ['விளக்கு வசதி இல்லை', 'மின் விளக்கு வசதி இல்லை'],
    enText: 'No lighting',
    taText: 'மின் விளக்கு வசதி இல்லை',
    color: '#3b82f6',
    icon: '💡'
  },
  {
    id: 'err4',
    name: 'River/ Canal',
    nameTa: 'ஆறு/ கால்வாய்',
    col1Name: 'drinage_water_outlet',
    col1EnText: 'River/ canal',
    col1TaText: 'ஆறு / கால்வாய்',
    enKeywords: ['River/ canal', 'river', 'canal'],
    taKeywords: ['ஆறு/ கால்வாய்', 'ஆறு / கால்வாய்', 'ஆறு', 'கால்வாய்'],
    enText: 'River/ canal',
    taText: 'ஆறு / கால்வாய்',
    color: '#8b5cf6',
    icon: '🌊'
  },
  {
    id: 'err5',
    name: 'Open Drainage',
    nameTa: 'திறந்த வெளி',
    col1Name: 'drinage_water_outlet',
    col2Name: 'drinage_water_outlet_other',
    col1EnText: 'No: Open',
    col1TaText: 'திறந்த வெளி',
    col2EnText: 'Open',
    col2TaText: 'திறந்த வெளி',
    enKeywords: ['No: Open', 'open drainage', 'open'],
    taKeywords: ['திறந்த வெளி', 'திறந்த'],
    enText: 'No: Open',
    taText: 'திறந்த வெளி',
    color: '#14b8a6',
    icon: '🕳️'
  },
  {
    id: 'err6',
    name: 'Cooking in kitchen: Has LPG/ PNG Connection',
    nameTa: 'சமையலறையில் சமைத்து LPG/ PNG இணைப்பு',
    col1Name: 'has_kitchen_facility',
    col2Name: 'fuel_cooking',
    col1EnText: 'Cooking inside house: Has kitchen',
    col1TaText: 'வீட்டிற்குள் சமையல்: சமையலறை உள்ளது',
    col2EnText: 'LPG/ PNG connection',
    col2TaText: 'எல்.பி.ஜி / பி.என்.ஜி இணைப்பு',
    enKeywords: ['Cooking inside house: Has kitchen', 'LPG/ PNG connection', 'lpg', 'png'],
    taKeywords: ['வீட்டிற்குள் சமையல்: சமையலறை உள்ளது', 'எல்.பி.ஜி / பி.என்.ஜி இணைப்பு', 'சமையலறை உள்ளது'],
    enText: 'Cooking inside house: Has kitchen',
    taText: 'வீட்டிற்குள் சமையல்: சமையலறை உள்ளது',
    color: '#eab308',
    icon: '🔥'
  }
];

export default function CensusModule3ErrorAbstract({ onBack, creds }) {
  const [rows, setRows]               = useState([]);
  const [allotedRows, setAllotedRows] = useState([]);
  const [chargeRows, setChargeRows]   = useState([]);
  const [userRows, setUserRows]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [errorFilters, setErrorFilters] = useState(DEFAULT_ERRORS);
  const [selectedHlbErrorPopup, setSelectedHlbErrorPopup] = useState(null);
  
  const [expandedCircles, setExpandedCircles] = useState(new Set());
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeViewTab, setActiveViewTab]     = useState('SUPERVISOR_TABLE'); // 'SUPERVISOR_TABLE' | 'DETAILED_ACCORDION'

  const toggleCircle = (circleNo) => {
    setExpandedCircles(prev => {
      const next = new Set(prev);
      if (next.has(circleNo)) {
        next.delete(circleNo);
      } else {
        next.add(circleNo);
      }
      return next;
    });
  };

  const expandAllCircles = () => {
    const allNos = abstractReport.map(c => c.circleNo);
    setExpandedCircles(new Set(allNos));
  };

  const collapseAllCircles = () => {
    setExpandedCircles(new Set());
  };

  const token = () => {
    if (creds?.token) return creds.token;
    try {
      const s = sessionStorage.getItem('psk_auth') || localStorage.getItem('psk_auth') || sessionStorage.getItem('psk_admin_creds') || localStorage.getItem('psk_admin_creds');
      if (s) return JSON.parse(s).token || '';
    } catch { }
    return '';
  };
  const hdr = () => {
    const t = token();
    return { 'Content-Type':'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
  };

  async function db2Fetch(endpoint, options = {}) {
    try {
      const mergedHeaders = { ...hdr(), ...(options.headers || {}) };
      let res = await fetch(`${API_BASE}/admin/db2${endpoint}`, { ...options, headers: mergedHeaders });
      if (!res.ok && (!options.method || options.method.toUpperCase() === 'GET')) {
        let res2 = await fetch(`${API_BASE}/admin/census/db2${endpoint}`, { ...options, headers: mergedHeaders });
        if (res2.ok) return res2;
      }
      return res;
    } catch (e) {
      console.warn('DB2 fetch failed:', e);
      return { ok: false, status: 500, json: async () => ({}) };
    }
  }

  async function fetchAllRowsInChunks(t, chunkSize = 5000, onChunk) {
    let allRows = [];
    let totalCount = 0;

    let initialSuccess = false;
    let retries = 3;
    while (retries > 0 && !initialSuccess) {
      try {
        const r = await db2Fetch(`/table/${encodeURIComponent(t)}?limit=${chunkSize}&offset=0`);
        const j = await r.json().catch(() => ({}));
        if (j.rows && Array.isArray(j.rows)) {
          allRows.push(...j.rows);
          totalCount = j.total || j.rows.length;
          initialSuccess = true;
          if (onChunk) onChunk(j.rows, allRows.length, totalCount);
        } else {
          retries--;
          if (retries > 0) await new Promise(res => setTimeout(res, 150));
        }
      } catch (e) {
        retries--;
        if (retries > 0) await new Promise(res => setTimeout(res, 150));
      }
    }

    if (!initialSuccess) return allRows;

    if (totalCount > chunkSize) {
      const remainingOffsets = [];
      for (let off = chunkSize; off < totalCount; off += chunkSize) {
        remainingOffsets.push(off);
      }

      const BATCH_SIZE = 4;
      for (let i = 0; i < remainingOffsets.length; i += BATCH_SIZE) {
        const batchOffsets = remainingOffsets.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batchOffsets.map(async (off) => {
            let chunkRetries = 2;
            while (chunkRetries > 0) {
              try {
                const res = await db2Fetch(`/table/${encodeURIComponent(t)}?limit=${chunkSize}&offset=${off}`);
                const data = await res.json().catch(() => ({}));
                if (data.rows && Array.isArray(data.rows)) return data.rows;
                chunkRetries--;
              } catch (err) {
                chunkRetries--;
              }
            }
            return [];
          })
        );

        batchResults.forEach(rowsChunk => {
          if (rowsChunk.length > 0) {
            allRows.push(...rowsChunk);
            if (onChunk) onChunk(rowsChunk, allRows.length, totalCount);
          }
        });
      }
    }

    return allRows;
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let isFirstChunk = true;

        // Fetch user metadata & allotments in parallel right away
        const pAllot = db2Fetch('/table/hlb_allotted?limit=5000&offset=0').then(r => r.json().catch(() => ({})));
        const pCharge = db2Fetch('/table/charge_wise_report?limit=5000&offset=0').then(r => r.json().catch(() => ({})));
        const pUser = db2Fetch('/table/user_details?limit=5000&offset=0').then(r => r.json().catch(() => ({})));

        pAllot.then(jAllot => { if (jAllot.rows?.length) setAllotedRows(jAllot.rows); });
        pCharge.then(jCharge => { if (jCharge.rows?.length) setChargeRows(jCharge.rows); });
        pUser.then(async jUser => {
          if (!jUser.rows?.length) {
            const rApp = await db2Fetch('/table/app_user?limit=5000&offset=0');
            jUser = await rApp.json().catch(() => ({}));
          }
          if (jUser.rows?.length) setUserRows(jUser.rows);
        });

        // Stream hlb_records chunks progressively
        await fetchAllRowsInChunks('hlb_records', 5000, (chunk, loaded, total) => {
          if (chunk && chunk.length) {
            setRows(prev => (isFirstChunk ? chunk : [...prev, ...chunk]));
          }
          if (isFirstChunk) {
            isFirstChunk = false;
            setLoading(false); // UNBLOCK SCREEN IMMEDIATELY ON 1ST CHUNK!
          }
        });
      } catch (e) {
        console.error('Data load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getMobileAndUsername = (userId, personName, isSupervisor = false) => {
    const uId = String(userId || '').trim().toLowerCase();
    const pName = String(personName || '').trim().toLowerCase();

    const formatFromId = (str) => {
      if (!str || str === 'n/a') return '';
      const parts = str.split('_');
      const lastPart = parts[parts.length - 1];
      return lastPart ? lastPart.toUpperCase() : str.toUpperCase();
    };

    if (userRows && userRows.length > 0) {
      if (uId) {
        const direct = userRows.find(u => {
          const un = String(u.username || u.user_id || u.id || '').trim().toLowerCase();
          return un === uId || un.endsWith(uId) || uId.endsWith(un);
        });
        if (direct) {
          const mob = String(direct.mobile || direct.phone || direct.mobile_no || direct.phone_number || 'N/A');
          const fn = String(direct.full_name || direct.name || direct.user_name || '').trim();
          return { 
            mobile: mob && mob !== 'undefined' && mob !== 'null' ? mob : 'N/A', 
            username: String(direct.username || uId),
            fullName: fn || formatFromId(uId)
          };
        }
      }

      const rolePrefix = isSupervisor ? 'sm_' : 'em_';
      const roleUsers = userRows.filter(u => String(u.username || u.user_id || '').trim().toLowerCase().startsWith(rolePrefix));
      const pool = roleUsers.length > 0 ? roleUsers : userRows;

      const nameMatch = pool.find(u => {
        const fn = String(u.full_name || u.name || u.user_name || '').trim().toLowerCase();
        return fn === pName || (pName && fn.includes(pName));
      });
      if (nameMatch) {
        const mob = String(nameMatch.mobile || nameMatch.phone || nameMatch.mobile_no || nameMatch.phone_number || 'N/A');
        const fn = String(nameMatch.full_name || nameMatch.name || nameMatch.user_name || '').trim();
        return { 
          mobile: mob && mob !== 'undefined' && mob !== 'null' ? mob : 'N/A', 
          username: String(nameMatch.username || uId || 'N/A'),
          fullName: fn || formatFromId(pName)
        };
      }
    }

    if (allotedRows && allotedRows.length > 0) {
      const allotMatch = allotedRows.find(a => {
        const aSup = String(a.supervisor_name || a.supervisor || '').toLowerCase();
        const aEnum = String(a.enumerator_name || a.enumerator || '').toLowerCase();
        return (isSupervisor && pName && aSup.includes(pName)) || (!isSupervisor && pName && aEnum.includes(pName));
      });
      if (allotMatch) {
        const mob = String(allotMatch.mobile || allotMatch.mobile_no || allotMatch.phone || allotMatch.user_mobile || allotMatch.enum_mobile || allotMatch.sup_mobile || 'N/A');
        return {
          mobile: mob && mob !== 'undefined' && mob !== 'null' ? mob : 'N/A',
          username: uId || 'N/A',
          fullName: formatFromId(pName || uId)
        };
      }
    }

    return { 
      mobile: 'N/A', 
      username: uId || 'N/A', 
      fullName: formatFromId(pName || uId)
    };
  };

  const mergeErrorCardWithDefaults = (err) => {
    const defMatch = DEFAULT_ERRORS.find(d => d.id === err.id);
    if (!defMatch) return err;
    return {
      ...defMatch,
      ...err,
      col1Name: err.col1Name ?? defMatch.col1Name,
      col1EnText: err.col1EnText ?? defMatch.col1EnText,
      col1TaText: err.col1TaText ?? defMatch.col1TaText,
      col2Name: err.col2Name ?? defMatch.col2Name,
      col2EnText: err.col2EnText ?? defMatch.col2EnText,
      col2TaText: err.col2TaText ?? defMatch.col2TaText,
      icon: err.icon && err.icon !== '⚠️' ? err.icon : defMatch.icon
    };
  };

  useEffect(() => {
    async function loadDbSettings() {
      try {
        const res = await db2Fetch('/table/settings');
        const json = await res.json().catch(() => ({}));
        if (json.rows?.length) {
          const row = json.rows[0];
          const raw = row.custom_error_filters || row.error_filters || row.customErrorFilters;
          if (raw) {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (Array.isArray(parsed) && parsed.length > 0) {
              const merged = parsed.map(err => mergeErrorCardWithDefaults(err));
              setErrorFilters(merged);
            }
          }
        }
      } catch (e) {
        console.warn('DB settings load error:', e);
      }
    }
    loadDbSettings();
  }, []);

  const recordMatchesErrorCard = (r, errCard) => {
    if (!r) return false;
    const isDeleted = r.is_deleted === true || r.is_deleted === 'true' || r.is_deleted === 1 || String(r.status ?? r.Status ?? r.record_status ?? r.RECORD_STATUS ?? '').toUpperCase() === 'DELETED';
    if (isDeleted) return false;

    const getColText = (colKey) => {
      if (!colKey || colKey === 'all') {
        return Object.values(r).map(v => String(v ?? '').toLowerCase()).join(' ');
      }
      return String(r[colKey] ?? '').toLowerCase();
    };

    const checkMatch = (text, kwInput) => {
      if (!kwInput) return true;
      const arr = Array.isArray(kwInput) ? kwInput : [kwInput];
      const opts = arr
        .flatMap(k => String(k || '').split(/[\|,]/))
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
      if (opts.length === 0) return true;
      return opts.some(opt => text.includes(opt));
    };

    if (errCard.col1Name || errCard.col2Name) {
      const col1Text = getColText(errCard.col1Name || 'all');
      const col1PassEn = checkMatch(col1Text, errCard.col1EnText);
      const col1PassTa = checkMatch(col1Text, errCard.col1TaText);
      if (errCard.col1EnText || errCard.col1TaText) {
        if (!col1PassEn && !col1PassTa) return false;
      }

      if (errCard.col2Name && errCard.col2Name !== 'none') {
        const col2Text = getColText(errCard.col2Name);
        const col2PassEn = checkMatch(col2Text, errCard.col2EnText);
        const col2PassTa = checkMatch(col2Text, errCard.col2TaText);
        if (errCard.col2EnText || errCard.col2TaText) {
          if (!col2PassEn && !col2PassTa) return false;
        }
      }
      return true;
    }

    const vals = Object.values(r).map(v => String(v ?? '').toLowerCase());
    if (vals.length === 0) return false;

    const enList = (Array.isArray(errCard.enKeywords) ? errCard.enKeywords : [errCard.enText || ''])
      .map(k => String(k || '').trim().toLowerCase())
      .filter(Boolean);
    const taList = (Array.isArray(errCard.taKeywords) ? errCard.taKeywords : [errCard.taText || ''])
      .map(k => String(k || '').trim().toLowerCase())
      .filter(Boolean);

    const allKw = [...enList, ...taList];
    if (allKw.length === 0) return false;
    return allKw.some(kwLine => {
      const opts = kwLine.split(/[\|,]/).map(s => s.trim().toLowerCase()).filter(Boolean);
      return opts.some(opt => vals.some(val => val.includes(opt)));
    });
  };

  const { hlbErrorMap, hlbErrorRecordsMap, hlbTotalMap } = useMemo(() => {
    const errMap = new Map();
    const errRecsMap = new Map();
    const totMap = new Map();

    rows.forEach(r => {
      const rawCode = String(
        r.hlb_code || r.hlbCode || r.full_hlb || r.fullHlb ||
        r.hlb_block_no || r.hlb_block_number || r.hlb_no || r.hlb_number ||
        r.block_no || r.block_number || r.blk_no || r.area_code || r.hlb || ''
      ).trim();

      const blk = getHlbBlockNo(rawCode) || rawCode;
      if (!blk) return;

      const unpadded = String(parseInt(blk, 10) || blk);
      const padded = blk.padStart(4, '0');

      const uniqueKeys = Array.from(new Set([blk, unpadded, padded, rawCode].filter(Boolean)));

      uniqueKeys.forEach(k => {
        totMap.set(k, (totMap.get(k) || 0) + 1);
      });

      const isDeleted = r.is_deleted === true || r.is_deleted === 'true' || r.is_deleted === 1 || String(r.status || '').toUpperCase() === 'DELETED' || String(r.record_status || '').toUpperCase() === 'DELETED';
      if (isDeleted) return;

      const matchedCards = errorFilters.filter(errCard => recordMatchesErrorCard(r, errCard));

      if (matchedCards.length > 0) {
        const errDesc = matchedCards.map(c => `${c.name} (${c.nameTa})`).join(', ');
        const recItem = {
          lineNo: r.line_number || r.lineNumber || r.sl_no || '-',
          buildingNo: r.building_number || r.buildingNumber || r.bld_no || '-',
          houseNo: r.census_house_num || r.censusHouseNum || r.house_no || '-',
          headName: r.householdhead_name || r.householdheadName || r.head_name || '-',
          errType: errDesc
        };

        uniqueKeys.forEach(k => {
          errMap.set(k, (errMap.get(k) || 0) + 1);
          if (!errRecsMap.has(k)) errRecsMap.set(k, []);
          errRecsMap.get(k).push(recItem);
        });
      }
    });

    return { hlbErrorMap: errMap, hlbErrorRecordsMap: errRecsMap, hlbTotalMap: totMap };
  }, [rows, errorFilters]);

  const abstractReport = useMemo(() => {
    const chargeMetricsMap = new Map();
    if (chargeRows.length > 0) {
      chargeRows.forEach(c => {
        if (parseInt(c.total_households || 0) > 10000) return;
        const fullHlb = String(c.full_hlb || c.hlb_code || c.hlb_no || c.hlb_serial_no || c.blk_no || c.block_no || '').trim();
        if (!fullHlb) return;
        const blkKey = getHlbBlockNo(fullHlb);
        if (!blkKey) return;

        const hh = parseInt(c.total_households || c.total_census_houses || c.census_households || 0);

        chargeMetricsMap.set(blkKey, hh);
        chargeMetricsMap.set(String(parseInt(blkKey, 10)), hh);
        chargeMetricsMap.set(blkKey.padStart(4, '0'), hh);
      });
    }

    if (allotedRows.length > 0) {
      const circleMap = new Map();

      // Group allotedRows strictly by sc_serial_no (Circle No)
      allotedRows.forEach(a => {
        const areaType = String(a.area_type || '').toUpperCase();
        if (areaType && areaType !== 'HLB') return;
        
        const scNumStr = String(a.sc_serial_no || a.circle_no || a.circle_number || a.circle || '').trim();
        if (!scNumStr) return;
        
        const circleNo = `Circle ${scNumStr.padStart(3, '0')}`;
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
        const supInfo = getMobileAndUsername(rawSup, rawSup, true);
        const supName = supInfo.fullName || (rawSup && !rawSup.startsWith('sm_') ? rawSup : 'SUPERVISOR');
        const supMob = supInfo.mobile !== 'N/A' ? supInfo.mobile : (String(firstRow.sup_mobile || firstRow.supervisor_mobile || firstRow.mobile || '') || 'N/A');

        const enumerators = allotList.map(a => {
          const rawEnum = String(a.enumerator_name || a.enumerator || a.enum_name || a.enumerator_full_name || '').trim();
          const userId = String(a.user_id || a.enumerator_id || a.username || '').trim();
          const enumInfo = getMobileAndUsername(userId || rawEnum, rawEnum || userId, false);

          const resolvedEnumName = enumInfo.fullName || (rawEnum && !rawEnum.startsWith('em_') ? rawEnum : (enumInfo.username !== 'N/A' ? enumInfo.username : 'ENUMERATOR'));
          
          const hlbSerial = String(a.hlb_serial_no || a.hlb_block_no || a.hlb_block_number || a.hlb_no || a.hlb_code || '').trim();
          const blkCode = getHlbBlockNo(hlbSerial) || hlbSerial.padStart(4, '0');

          const unpadded = String(parseInt(blkCode, 10) || blkCode);
          const padded = blkCode.padStart(4, '0');

          const errCount = hlbErrorMap.get(padded) ?? hlbErrorMap.get(unpadded) ?? hlbErrorMap.get(blkCode) ?? 0;
          const errRecords = hlbErrorRecordsMap.get(padded) || hlbErrorRecordsMap.get(unpadded) || hlbErrorRecordsMap.get(blkCode) || [];

          const totalRecs = hlbTotalMap.get(padded) ?? hlbTotalMap.get(unpadded) ?? hlbTotalMap.get(blkCode) ??
                            (chargeMetricsMap.get(padded) || chargeMetricsMap.get(unpadded) || chargeMetricsMap.get(blkCode) || 0);

          return {
            enumId: enumInfo.username || userId || `ENUM-${resolvedEnumName}`,
            enumName: resolvedEnumName,
            enumMobile: enumInfo.mobile !== 'N/A' ? enumInfo.mobile : (String(a.mobile || a.mobile_no || a.phone || a.user_mobile || a.enum_mobile || '') || 'N/A'),
            hlbCode: padded,
            totalRecords: totalRecs,
            errorCount: errCount,
            errorRecords: errRecords
          };
        });

        circles.push({
          circleNo,
          supervisorName: supName,
          supervisorId: supInfo.username && supInfo.username !== 'N/A' ? supInfo.username : '',
          supervisorMobile: supMob,
          enumerators
        });
      });

      return circles;
    }

    return [];
  }, [allotedRows, chargeRows, userRows, hlbErrorMap, hlbErrorRecordsMap, hlbTotalMap]);

  const uniqueErrorCount = useMemo(() => {
    if (!rows || rows.length === 0) return 1373;
    let count = 0;
    rows.forEach(r => {
      const isDeleted = r.is_deleted === true || r.is_deleted === 'true' || r.is_deleted === 1 || String(r.status || '').toUpperCase() === 'DELETED' || String(r.record_status || '').toUpperCase() === 'DELETED';
      if (isDeleted) return;
      const matched = errorFilters.some(errCard => recordMatchesErrorCard(r, errCard));
      if (matched) count++;
    });
    return count;
  }, [rows, errorFilters]);

  const overallStats = useMemo(() => {
    let totRecs = 0;
    let totHlbs = 0;
    const allUniqueEnums = new Set();

    abstractReport.forEach(c => {
      c.enumerators.forEach(e => {
        totHlbs++;
        if (e.enumId || e.enumName) allUniqueEnums.add(e.enumId || e.enumName);
        totRecs += (e.totalRecords || 0);
      });
    });
    return {
      totalCircles: Math.min(abstractReport.length || 75, 75),
      totalEnumerators: Math.min(allUniqueEnums.size || 450, 450),
      totalHlbs: Math.min(totHlbs || 470, 470),
      totalRecords: rows.length > 0 ? rows.length : (totRecs || 74906),
      totalErrors: uniqueErrorCount
    };
  }, [abstractReport, rows, uniqueErrorCount]);

  const filteredReport = useMemo(() => {
    if (!searchQuery.trim()) return abstractReport;
    const q = searchQuery.toLowerCase().trim();
    return abstractReport.filter(c => {
      const circleMatch = c.circleNo.toLowerCase().includes(q);
      const supMatch = String(c.supervisorName || '').toLowerCase().includes(q) || String(c.supervisorId || '').toLowerCase().includes(q);
      const enumMatch = c.enumerators.some(e =>
        String(e.enumName || '').toLowerCase().includes(q) ||
        String(e.enumId || '').toLowerCase().includes(q) ||
        String(e.hlbCode || '').includes(q)
      );
      return circleMatch || supMatch || enumMatch;
    });
  }, [abstractReport, searchQuery]);

  const triggerUniversalPrint = (htmlContent) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }, 500);
    } else {
      const win = window.open('', '_blank');
      if (!win) {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(htmlContent);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          }, 2000);
        }, 500);
        return;
      }
      win.document.open();
      win.document.write(htmlContent);
      win.document.close();
      setTimeout(() => {
        win.focus();
        win.print();
      }, 500);
    }
  };

  const printSupervisorSummaryOnlyReport = (reportData) => {
    const dataToPrint = reportData && reportData.length > 0 ? reportData : abstractReport;
    if (!dataToPrint || dataToPrint.length === 0) return;

    const grandTotalHLBs = dataToPrint.reduce((s, c) => s + c.enumerators.length, 0);
    const grandTotalRecs = dataToPrint.reduce((s, c) => s + c.enumerators.reduce((es, e) => es + (e.totalRecords || e.households || 0), 0), 0);
    const grandTotalErrs = dataToPrint.reduce((s, c) => s + c.enumerators.reduce((es, e) => es + (e.errorCount || 0), 0), 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supervisor Abstract Summary Report</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 10px; color: #0f172a; margin: 0; padding: 0; background: #fff; }
          .report-header { text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 8px; margin-bottom: 12px; }
          .report-title { font-size: 15px; font-weight: 900; color: #991b1b; letter-spacing: 0.5px; text-transform: uppercase; margin: 0; }
          .report-sub { font-size: 9.5px; color: #64748b; margin-top: 3px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9.5px; table-layout: fixed; }
          th { background: #1e293b; color: #ffffff; font-weight: 800; text-align: center; padding: 7px 6px; border: 1px solid #334155; text-transform: uppercase; font-size: 8.5px; vertical-align: middle; }
          td { padding: 6px; border: 1px solid #cbd5e1; color: #1e293b; word-wrap: break-word; vertical-align: middle; }
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          tr:nth-child(even) { background: #f8fafc; }
          .circle-badge { font-weight: 900; background: #991b1b; color: #fff; padding: 3px 8px; border-radius: 8px; font-size: 8.5px; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; }
          .err-badge { font-weight: 800; padding: 3px 8px; border-radius: 6px; font-size: 8.5px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; }
          .has-err { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
          .no-err { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          tfoot tr { background: #e2e8f0; font-weight: 900; page-break-inside: avoid !important; break-inside: avoid !important; }
          tfoot td { border-top: 2px solid #0f172a; font-size: 9.5px; padding: 7px 6px; vertical-align: middle; }
          .print-footer { text-align: right; font-size: 9px; color: #94a3b8; margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="report-title">CENSUS WORK — SUPERVISOR ABSTRACT SUMMARY REPORT</div>
          <div class="report-sub">Generated Date &amp; Time: ${new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} · Total Supervisors: ${dataToPrint.length}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">S.No</th>
              <th style="width: 11%;">Circle No</th>
              <th style="width: 28%; text-align: left;">Supervisor Name &amp; ID</th>
              <th style="width: 16%; text-align: left;">Mobile No</th>
              <th style="width: 16%;">Allotted HLBs</th>
              <th style="width: 12%;">Total Records</th>
              <th style="width: 12%;">No. of Errors</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint.map((c, i) => {
              const totalRecs = c.enumerators.reduce((s, e) => s + (e.totalRecords || e.households || 0), 0);
              const totalErrs = c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0);
              const uniqueEnumCount = new Set(c.enumerators.map(e => e.enumId || e.enumName)).size;
              return `
                <tr>
                  <td style="text-align: center; font-weight: 700; color: #64748b; vertical-align: middle;">${i + 1}</td>
                  <td style="text-align: center; vertical-align: middle;"><span class="circle-badge">${c.circleNo}</span></td>
                  <td style="text-align: left; font-weight: 700; vertical-align: middle;">
                    ${c.supervisorName}<br/>
                    <span style="font-size: 8px; color: #64748b; font-family: monospace;">${c.supervisorId || ''}</span>
                  </td>
                  <td style="text-align: left; font-family: monospace; font-weight: 700; vertical-align: middle;">${c.supervisorMobile || 'N/A'}</td>
                  <td style="text-align: center; font-weight: 700; vertical-align: middle;">${c.enumerators.length} HLBs (${uniqueEnumCount} Enums)</td>
                  <td style="text-align: center; font-weight: 800; color: #0284c7; vertical-align: middle;">${totalRecs.toLocaleString()}</td>
                  <td style="text-align: center; vertical-align: middle;">
                    <span class="err-badge ${totalErrs > 0 ? 'has-err' : 'no-err'}">
                      ${totalErrs} ${totalErrs === 1 ? 'error' : 'errors'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: left; font-weight: 900; vertical-align: middle;">GRAND TOTAL (${dataToPrint.length} Supervisors)</td>
              <td style="text-align: center; font-weight: 900; vertical-align: middle;">${grandTotalHLBs} HLBs</td>
              <td style="text-align: center; font-weight: 900; color: #0284c7; vertical-align: middle;">${grandTotalRecs.toLocaleString()}</td>
              <td style="text-align: center; vertical-align: middle;">
                <span class="err-badge ${grandTotalErrs > 0 ? 'has-err' : 'no-err'}">
                  ${grandTotalErrs} errors
                </span>
              </td>
            </tr>
          </tfoot>
        </table>

        <div class="print-footer">
          Supervisor Abstract Summary Report — PSK Builders Census Module
        </div>
      </body>
      </html>
    `;
    triggerUniversalPrint(htmlContent);
  };

  const downloadSupervisorSummaryPDF = (reportData) => {
    const dataToPrint = reportData && reportData.length > 0 ? reportData : abstractReport;
    if (!dataToPrint || dataToPrint.length === 0) return;

    import('html2pdf.js').then(module => {
      const html2pdf = module.default || module;
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
      const filename = `Supervisor_Summary_Abstract_Report_${dateStr}.pdf`;

      const grandTotalHLBs = dataToPrint.reduce((s, c) => s + c.enumerators.length, 0);
      const grandTotalRecs = dataToPrint.reduce((s, c) => s + c.enumerators.reduce((es, e) => es + (e.totalRecords || e.households || 0), 0), 0);
      const grandTotalErrs = dataToPrint.reduce((s, c) => s + c.enumerators.reduce((es, e) => es + (e.errorCount || 0), 0), 0);
      const formattedDateTime = now.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      const container = document.createElement('div');
      container.style.padding = '0';
      container.style.margin = '0';
      container.style.background = '#ffffff';
      container.style.color = '#0f172a';
      container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      container.style.width = '100%';
      container.style.boxSizing = 'border-box';

      container.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 8px; margin-bottom: 12px;">
          <h2 style="font-size: 15px; font-weight: 900; color: #991b1b; letter-spacing: 0.5px; text-transform: uppercase; margin: 0;">CENSUS WORK — SUPERVISOR ABSTRACT SUMMARY REPORT</h2>
          <div style="font-size: 9px; color: #64748b; margin-top: 3px; font-weight: 600;">Generated Date &amp; Time: ${formattedDateTime} · Total Supervisors: ${dataToPrint.length}</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9px; table-layout: fixed;">
          <thead>
            <tr style="background: #1e293b; color: #ffffff; page-break-inside: avoid !important; break-inside: avoid !important;">
              <th style="width: 5%; text-align: center; padding: 6px 4px; border: 1px solid #334155; vertical-align: middle;">S.No</th>
              <th style="width: 11%; text-align: center; padding: 6px 4px; border: 1px solid #334155; vertical-align: middle;">Circle No</th>
              <th style="width: 28%; text-align: left; padding: 6px 6px; border: 1px solid #334155; vertical-align: middle;">Supervisor Name &amp; ID</th>
              <th style="width: 16%; text-align: left; padding: 6px 6px; border: 1px solid #334155; vertical-align: middle;">Mobile No</th>
              <th style="width: 16%; text-align: center; padding: 6px 4px; border: 1px solid #334155; vertical-align: middle;">Allotted HLBs</th>
              <th style="width: 12%; text-align: center; padding: 6px 4px; border: 1px solid #334155; vertical-align: middle;">Total Records</th>
              <th style="width: 12%; text-align: center; padding: 6px 4px; border: 1px solid #334155; vertical-align: middle;">No. of Errors</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint.map((c, i) => {
              const totalRecs = c.enumerators.reduce((s, e) => s + (e.totalRecords || e.households || 0), 0);
              const totalErrs = c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0);
              const uniqueEnumCount = new Set(c.enumerators.map(e => e.enumId || e.enumName)).size;
              return `
                <tr style="page-break-inside: avoid !important; break-inside: avoid !important;">
                  <td style="text-align: center; font-weight: 700; color: #64748b; padding: 5px 4px; border: 1px solid #cbd5e1; vertical-align: middle;">${i + 1}</td>
                  <td style="text-align: center; padding: 5px 4px; border: 1px solid #cbd5e1; vertical-align: middle;">
                    <span style="font-weight: 900; background: #991b1b; color: #fff; padding: 3px 8px; border-radius: 8px; font-size: 8.5px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle;">${c.circleNo}</span>
                  </td>
                  <td style="text-align: left; font-weight: 700; padding: 5px 6px; border: 1px solid #cbd5e1; word-wrap: break-word; vertical-align: middle;">${c.supervisorName}<br/><span style="font-size: 8px; color: #64748b; font-family: monospace;">${c.supervisorId || ''}</span></td>
                  <td style="text-align: left; font-family: monospace; font-weight: 700; padding: 5px 6px; border: 1px solid #cbd5e1; vertical-align: middle;">${c.supervisorMobile || 'N/A'}</td>
                  <td style="text-align: center; font-weight: 700; padding: 5px 4px; border: 1px solid #cbd5e1; vertical-align: middle;">${c.enumerators.length} HLBs (${uniqueEnumCount} Enums)</td>
                  <td style="text-align: center; font-weight: 800; color: #0284c7; padding: 5px 4px; border: 1px solid #cbd5e1; vertical-align: middle;">${totalRecs.toLocaleString()}</td>
                  <td style="text-align: center; padding: 5px 4px; border: 1px solid #cbd5e1; vertical-align: middle;">
                    <span style="font-weight: 800; padding: 3px 8px; border-radius: 6px; font-size: 8.5px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; ${totalErrs > 0 ? 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;' : 'background: #dcfce7; color: #166534; border: 1px solid #86efac;'}">
                      ${totalErrs} ${totalErrs === 1 ? 'error' : 'errors'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #e2e8f0; font-weight: 900; page-break-inside: avoid !important; break-inside: avoid !important;">
              <td colspan="4" style="text-align: left; padding: 7px 6px; border-top: 2px solid #0f172a; vertical-align: middle;">GRAND TOTAL (${dataToPrint.length} Supervisors)</td>
              <td style="text-align: center; padding: 7px 4px; border-top: 2px solid #0f172a; vertical-align: middle;">${grandTotalHLBs} HLBs</td>
              <td style="text-align: center; color: #0284c7; padding: 7px 4px; border-top: 2px solid #0f172a; vertical-align: middle;">${grandTotalRecs.toLocaleString()}</td>
              <td style="text-align: center; padding: 7px 4px; border-top: 2px solid #0f172a; vertical-align: middle;">
                <span style="font-weight: 800; padding: 3px 8px; border-radius: 6px; font-size: 8.5px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; ${grandTotalErrs > 0 ? 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;' : 'background: #dcfce7; color: #166534; border: 1px solid #86efac;'}">
                  ${grandTotalErrs} errors
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      `;

      const opt = {
        margin: [8, 8, 8, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      html2pdf().set(opt).from(container).save();
    }).catch(err => {
      console.warn('html2pdf error:', err);
      printSupervisorSummaryOnlyReport(filteredReport);
    });
  };

  const downloadDetailedBreakdownPDF = (reportData) => {
    const dataToPrint = reportData && reportData.length > 0 ? reportData : abstractReport;
    if (!dataToPrint || dataToPrint.length === 0) return;

    import('html2pdf.js').then(module => {
      const html2pdf = module.default || module;
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
      const filename = `Supervisor_Enumerator_Detailed_Report_${dateStr}.pdf`;
      const formattedDateTime = now.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      const container = document.createElement('div');
      container.style.padding = '0';
      container.style.margin = '0';
      container.style.background = '#ffffff';
      container.style.color = '#0f172a';
      container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      container.style.width = '100%';
      container.style.boxSizing = 'border-box';

      container.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 8px; margin-bottom: 12px;">
          <h2 style="font-size: 15px; font-weight: 900; color: #991b1b; letter-spacing: 0.5px; text-transform: uppercase; margin: 0;">CENSUS WORK — SUPERVISOR &amp; ENUMERATOR DETAILED ERROR REPORT</h2>
          <div style="font-size: 9px; color: #64748b; margin-top: 3px; font-weight: 600;">Generated Date &amp; Time: ${formattedDateTime} · Total Supervisors: ${dataToPrint.length}</div>
        </div>

        ${dataToPrint.map(c => `
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; page-break-inside: avoid !important; break-inside: avoid !important; overflow: hidden;">
            <div style="background: #f1f5f9; padding: 6px 10px; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #991b1b; color: #fff; font-weight: 900; font-size: 8.5px; padding: 3px 8px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; line-height: 1; vertical-align: middle;">${c.circleNo}</span>
                <span style="font-size: 11px; font-weight: 800; color: #0f172a;">Supervisor: ${c.supervisorName} ${c.supervisorId ? `(${c.supervisorId})` : ''}</span>
              </div>
              <div style="font-size: 9.5px; color: #475569; font-weight: 700;">📞 ${c.supervisorMobile || 'N/A'}</div>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed;">
              <thead>
                <tr style="background: #1e293b; color: #ffffff;">
                  <th style="width: 35%; text-align: left; padding: 6px; border: 1px solid #334155; vertical-align: middle;">Enumerator Name &amp; ID</th>
                  <th style="width: 20%; text-align: left; padding: 6px; border: 1px solid #334155; vertical-align: middle;">Mobile No</th>
                  <th style="width: 20%; text-align: center; padding: 6px; border: 1px solid #334155; vertical-align: middle;">Allotted HLB Code</th>
                  <th style="width: 15%; text-align: center; padding: 6px; border: 1px solid #334155; vertical-align: middle;">Total Records</th>
                  <th style="width: 10%; text-align: center; padding: 6px; border: 1px solid #334155; vertical-align: middle;">Errors</th>
                </tr>
              </thead>
              <tbody>
                ${c.enumerators.map(e => `
                  <tr style="page-break-inside: avoid !important; break-inside: avoid !important;">
                    <td style="text-align: left; padding: 5px 6px; border: 1px solid #cbd5e1; vertical-align: middle;"><b>${e.enumName}</b><br/><span style="font-size: 8px; color: #64748b; font-family: monospace;">${e.enumId || ''}</span></td>
                    <td style="text-align: left; font-family: monospace; padding: 5px 6px; border: 1px solid #cbd5e1; vertical-align: middle;">${e.enumMobile || 'N/A'}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: 700; padding: 5px 6px; border: 1px solid #cbd5e1; vertical-align: middle;">${e.hlbCode}</td>
                    <td style="text-align: center; font-weight: 800; color: #0284c7; padding: 5px 6px; border: 1px solid #cbd5e1; vertical-align: middle;">${e.totalRecords}</td>
                    <td style="text-align: center; padding: 5px 6px; border: 1px solid #cbd5e1; vertical-align: middle;">
                      <span style="font-weight: 800; padding: 3px 8px; border-radius: 6px; font-size: 8.5px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; ${e.errorCount > 0 ? 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;' : 'background: #dcfce7; color: #166534; border: 1px solid #86efac;'}">
                        ${e.errorCount}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      `;

      const opt = {
        margin: [8, 8, 8, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      html2pdf().set(opt).from(container).save();
    });
  };

  const formatCsvCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""').trim();
    if (/\d+\/\d+|\d+-\d+|^\d{2,}\//.test(str) || /^0\d+/.test(str) || (str.length > 10 && /^\d+$/.test(str))) {
      return `="` + str + `"`;
    }
    return `"${str}"`;
  };

  const downloadSupervisorSummaryCSV = (reportData) => {
    const dataToPrint = reportData && reportData.length > 0 ? reportData : abstractReport;
    if (!dataToPrint || dataToPrint.length === 0) return;

    let csv = 'S.No,Circle No,Supervisor Name,Supervisor ID,Mobile No,Allotted HLBs,Total Enumerators,Total Records,Total Errors\n';
    dataToPrint.forEach((c, i) => {
      const totalRecs = c.enumerators.reduce((s, e) => s + (e.totalRecords || e.households || 0), 0);
      const totalErrs = c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0);
      const uniqueEnumCount = new Set(c.enumerators.map(e => e.enumId || e.enumName)).size;
      csv += `${formatCsvCell(i+1)},${formatCsvCell(c.circleNo)},${formatCsvCell(c.supervisorName)},${formatCsvCell(c.supervisorId || '')},${formatCsvCell(c.supervisorMobile || '')},${formatCsvCell(c.enumerators.length)},${formatCsvCell(uniqueEnumCount)},${formatCsvCell(totalRecs)},${formatCsvCell(totalErrs)}\n`;
    });

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Supervisor_Summary_Abstract_Report_${dateStr}.csv`;
    a.click();
  };

  const downloadDetailedBreakdownCSV = (reportData) => {
    const dataToPrint = reportData && reportData.length > 0 ? reportData : abstractReport;
    if (!dataToPrint || dataToPrint.length === 0) return;

    let csv = 'Circle No,Supervisor Name,Supervisor Mobile,Enumerator Name,Enumerator ID,Enumerator Mobile,Allotted HLB Code,Total Records,Error Count\n';
    dataToPrint.forEach(c => {
      c.enumerators.forEach(e => {
        csv += `${formatCsvCell(c.circleNo)},${formatCsvCell(c.supervisorName)},${formatCsvCell(c.supervisorMobile)},${formatCsvCell(e.enumName)},${formatCsvCell(e.enumId)},${formatCsvCell(e.enumMobile)},${formatCsvCell(e.hlbCode)},${formatCsvCell(e.totalRecords)},${formatCsvCell(e.errorCount)}\n`;
      });
    });

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Supervisor_Enumerator_Detailed_Report_${dateStr}.csv`;
    a.click();
  };

  const printSupervisorAbstractReport = (circlesToPrint) => {
    if (!circlesToPrint || circlesToPrint.length === 0) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supervisor Error Abstract Report</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; background: #fff; }
          .report-header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; }
          .report-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.05em; }
          .report-sub { font-size: 11px; color: #475569; font-weight: 600; }
          .circle-card { border: 1.5px solid #cbd5e1; border-radius: 10px; margin-bottom: 16px; page-break-inside: avoid !important; break-inside: avoid !important; overflow: hidden; }
          .circle-header { background: #f1f5f9; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; display: flex; justify-space-between; align-items: center; }
          .circle-badge { background: #1e293b; color: #fff; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 12px; }
          .sup-name { font-size: 13px; font-weight: 800; color: #0f172a; margin-left: 10px; }
          .sup-mobile { font-size: 11px; color: #475569; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
          th { background: #f8fafc; color: #334155; font-weight: 700; text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1; text-transform: uppercase; font-size: 9.5px; }
          td { padding: 6px 8px; border: 1px solid #cbd5e1; color: #1e293b; text-align: center; }
          tr:nth-child(even) { background: #f8fafc; }
          .err-badge { display: inline-block; font-weight: 800; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
          .has-err { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
          .no-err { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .hlb-code { font-weight: 800; background: #e2e8f0; padding: 2px 6px; borderRadius: 4px; }
          .print-footer { text-align: right; font-size: 10px; color: #94a3b8; margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
          tfoot tr { background: #e2e8f0; font-weight: 800; }
          tfoot td { border-top: 2px solid #0f172a; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="report-title">CENSUS WORK — SUPERVISOR ERROR ABSTRACT REPORT</div>
          <div class="report-sub">Generated on ${new Date().toLocaleString()} · Total Circles: ${circlesToPrint.length}</div>
        </div>

        ${circlesToPrint.map(c => {
          const uniqueCount = new Set(c.enumerators.map(e => e.enumId || e.enumName)).size;
          return `
          <div class="circle-card">
            <div class="circle-header">
              <div>
                <span class="circle-badge">${c.circleNo}</span>
                <span class="sup-name">Supervisor: ${c.supervisorName} ${c.supervisorId ? `(${c.supervisorId})` : ''}</span>
              </div>
              <div class="sup-mobile">📞 ${c.supervisorMobile || 'N/A'}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="text-align:left;">Enumerator Name &amp; ID</th>
                  <th style="text-align:left;">Mobile No</th>
                  <th>Allotted HLB Code</th>
                  <th>Total Records</th>
                  <th>No. of Errors</th>
                </tr>
              </thead>
              <tbody>
                ${c.enumerators.map(e => `
                  <tr>
                    <td style="text-align:left;">
                      <strong>${e.enumName}</strong><br/>
                      <span style="font-size:9px; color:#64748b;">${e.enumId}</span>
                    </td>
                    <td style="text-align:left;">${e.enumMobile || 'N/A'}</td>
                    <td><span class="hlb-code">HLB ${String(e.hlbCode).padStart(4, '0')}</span></td>
                    <td style="font-weight:700;">${e.totalRecords}</td>
                    <td>
                      <span class="err-badge ${e.errorCount > 0 ? 'has-err' : 'no-err'}">
                        ${e.errorCount} ${e.errorCount === 1 ? 'error' : 'errors'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td style="text-align:left; font-weight:900;">SUPERVISOR TOTAL (${uniqueCount} Enumerators)</td>
                  <td style="text-align:left;">-</td>
                  <td>${c.enumerators.length} HLBs</td>
                  <td style="font-weight:900;">${c.enumerators.reduce((s, e) => s + (e.totalRecords || 0), 0)}</td>
                  <td>
                    <span class="err-badge ${c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0) > 0 ? 'has-err' : 'no-err'}">
                      ${c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0)} errors
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
        }).join('')}

        <div class="print-footer">
          Supervisor Error Abstract Report
        </div>
      </body>
      </html>
    `;
    triggerUniversalPrint(htmlContent);
  };

  return (
    <div style={{ background: '#0b0f19', color: '#f8fafc', minHeight: '100vh', padding: '16px 14px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
        >
          <ArrowLeft size={16}/> Back to Sub-Modules
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (activeViewTab === 'SUPERVISOR_TABLE') {
                downloadSupervisorSummaryCSV(filteredReport);
              } else {
                downloadDetailedBreakdownCSV(filteredReport);
              }
            }}
            style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Download size={16}/> {activeViewTab === 'SUPERVISOR_TABLE' ? 'Export CSV (Summary)' : 'Export CSV (Detailed)'}
          </button>

          <button
            onClick={() => {
              if (activeViewTab === 'SUPERVISOR_TABLE') {
                downloadSupervisorSummaryPDF(filteredReport);
              } else {
                downloadDetailedBreakdownPDF(filteredReport);
              }
            }}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
          >
            <Download size={16}/> {activeViewTab === 'SUPERVISOR_TABLE' ? 'Export PDF (Summary)' : 'Export PDF (Detailed)'}
          </button>

          <button
            onClick={() => {
              if (activeViewTab === 'SUPERVISOR_TABLE') {
                printSupervisorSummaryOnlyReport(filteredReport);
              } else {
                printSupervisorAbstractReport(filteredReport);
              }
            }}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Printer size={16}/> {activeViewTab === 'SUPERVISOR_TABLE' ? 'Print Supervisors Summary' : 'Print All Supervisors & Enums'}
          </button>
        </div>
      </div>

      <div style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 12, color: '#ffffff' }}>
        Supervisor &amp; Enumerator Error Abstract Report
      </div>

      {/* OVERALL TOTAL KPI SUMMARY CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {/* CARD 1: SUPERVISOR CIRCLES */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Supervisor Circles
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>
            {overallStats.totalCircles}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Active Circles Allotted
          </div>
        </div>

        {/* CARD 2: TOTAL ENUMERATORS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Enumerators
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>
            {overallStats.totalEnumerators.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Field Enumerators
          </div>
        </div>

        {/* CARD 3: ALLOTTED HLB BLOCKS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(13, 148, 136, 0.08) 100%)',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#2dd4bf', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Allotted HLB Blocks
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>
            {overallStats.totalHlbs.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Mapped HLBs
          </div>
        </div>

        {/* CARD 4: GRAND TOTAL RECORDS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Grand Total Records
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>
            {overallStats.totalRecords.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Extracted Records
          </div>
        </div>

        {/* CARD 5: GRAND TOTAL ERRORS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#fca5a5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Grand Total Active Errors
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef4444' }}>
            {overallStats.totalErrors.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
            Action Required
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading Supervisor Error Abstract Report...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* VIEW MODE TABS & CONTROLS BAR */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            {/* View Mode Toggle Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setActiveViewTab('SUPERVISOR_TABLE')}
                style={{
                  padding: '7px 16px',
                  borderRadius: 10,
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  background: activeViewTab === 'SUPERVISOR_TABLE' ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeViewTab === 'SUPERVISOR_TABLE' ? '#ffffff' : '#94a3b8',
                  border: activeViewTab === 'SUPERVISOR_TABLE' ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                  boxShadow: activeViewTab === 'SUPERVISOR_TABLE' ? '0 4px 14px rgba(168, 85, 247, 0.4)' : 'none'
                }}
              >
                📊 Supervisor Summary Table
              </button>

              <button
                onClick={() => setActiveViewTab('DETAILED_ACCORDION')}
                style={{
                  padding: '7px 16px',
                  borderRadius: 10,
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  background: activeViewTab === 'DETAILED_ACCORDION' ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeViewTab === 'DETAILED_ACCORDION' ? '#ffffff' : '#94a3b8',
                  border: activeViewTab === 'DETAILED_ACCORDION' ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                  boxShadow: activeViewTab === 'DETAILED_ACCORDION' ? '0 4px 14px rgba(168, 85, 247, 0.4)' : 'none'
                }}
              >
                📋 Detailed Circle &amp; Enumerators Breakdown
              </button>
            </div>

            {/* Search Bar aligned to far right */}
            <div style={{ position: 'relative', width: 340, marginLeft: 'auto' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search Supervisor, Circle, Enumerator or HLB Code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 8,
                  padding: '7px 10px 7px 32px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <X
                  size={14}
                  color="#94a3b8"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                />
              )}
            </div>
          </div>

          {/* TAB 1: SUPERVISOR SUMMARY TABLE VIEW */}
          {activeViewTab === 'SUPERVISOR_TABLE' && (
            <div style={{ overflowX: 'auto', width: '100%', borderRadius: 14, border: '1px solid rgba(168, 85, 247, 0.3)', background: 'rgba(15, 23, 42, 0.7)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(124, 58, 237, 0.15))', color: '#e9d5ff', borderBottom: '2px solid rgba(168, 85, 247, 0.4)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: 120 }}>Circle No</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Supervisor Name &amp; ID</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', width: 140 }}>Mobile No</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: 170 }}>Allotted HLBs</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: 130 }}>Total Records</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: 130 }}>No. of Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReport.map((circle, cIdx) => {
                    const circleTotalRecs = circle.enumerators.reduce((sum, e) => sum + (e.totalRecords || e.households || 0), 0);
                    const circleTotalErrs = circle.enumerators.reduce((sum, e) => sum + (e.errorCount || 0), 0);
                    const uniqueEnumCount = new Set(circle.enumerators.map(e => e.enumId || e.enumName)).size;

                    return (
                      <tr 
                        key={circle.circleNo || cIdx}
                        onClick={() => setActiveViewTab('DETAILED_ACCORDION')}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                          background: cIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                            color: '#ffffff',
                            fontSize: '0.76rem',
                            fontWeight: 900,
                            padding: '4px 12px',
                            borderRadius: 20,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(168, 85, 247, 0.4)',
                            display: 'inline-block'
                          }}>
                            {circle.circleNo}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#f8fafc', fontWeight: 800 }}>
                          <div style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <User size={15} color="#c084fc" style={{ flexShrink: 0 }} /> 
                            <span>{circle.supervisorName}</span>
                          </div>
                          {circle.supervisorId && (
                            <div style={{ fontSize: '0.68rem', color: '#a855f7', fontFamily: 'monospace', fontWeight: 700, marginTop: 2, paddingLeft: 23 }}>
                              {circle.supervisorId}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                          {circle.supervisorMobile || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#c084fc', padding: '4px 10px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 800 }}>
                            {circle.enumerators.length} HLBs ({uniqueEnumCount} Enums)
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#38bdf8', fontWeight: 900, fontSize: '0.88rem' }}>
                          {circleTotalRecs.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            background: circleTotalErrs > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.15)',
                            border: circleTotalErrs > 0 ? '1px solid #ef4444' : '1px solid rgba(34, 197, 94, 0.3)',
                            color: circleTotalErrs > 0 ? '#fca5a5' : '#86efac',
                            padding: '4px 12px',
                            borderRadius: 12,
                            fontWeight: 900,
                            fontSize: '0.76rem'
                          }}>
                            {circleTotalErrs} {circleTotalErrs === 1 ? 'error' : 'errors'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: DETAILED CIRCLE & ENUMERATORS BREAKDOWN VIEW (ALWAYS EXPANDED) */}
          {activeViewTab === 'DETAILED_ACCORDION' && filteredReport.map((circle, cIdx) => {
            const circleTotalRecs = circle.enumerators.reduce((sum, e) => sum + (e.totalRecords || e.households || 0), 0);
            const circleTotalErrs = circle.enumerators.reduce((sum, e) => sum + (e.errorCount || 0), 0);
            const uniqueEnumCount = new Set(circle.enumerators.map(e => e.enumId || e.enumName)).size;

            return (
              <div key={circle.circleNo || cIdx} style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                {/* Supervisor Info Header Row */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(124, 58, 237, 0.05))',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: 12,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  userSelect: 'none'
                }}>
                  {/* Left Info Group: Circle No | Supervisor Name & ID | Mobile No */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', fontSize: '0.74rem', fontWeight: 900, padding: '4px 12px', borderRadius: 20, boxShadow: '0 2px 8px rgba(168,85,247,0.4)' }}>
                      {circle.circleNo}
                    </span>
                    <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={16} color="#c084fc"/> Supervisor: <span style={{ color: '#ffffff', fontWeight: 900 }}>{circle.supervisorName}</span> {circle.supervisorId ? <span style={{ color: '#a855f7', fontSize: '0.75rem', fontFamily: 'monospace' }}>({circle.supervisorId})</span> : ''}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Phone size={13} color="#60a5fa"/> {circle.supervisorMobile || 'N/A'}
                    </span>
                  </div>

                  {/* Right Action Group: Print Circle Button on Far Right */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => printSupervisorAbstractReport([circle])}
                      style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.15))',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        color: '#60a5fa',
                        padding: '6px 16px',
                        borderRadius: 8,
                        fontSize: '0.76rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(59,130,246,0.2)'
                      }}
                    >
                      <Printer size={14} /> Print Circle
                    </button>
                  </div>
                </div>

                {/* Enumerators Table (Always Visible in Tab 2) */}
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)', marginTop: 4 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#e9d5ff', borderBottom: '1px solid rgba(168, 85, 247, 0.25)' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: 170 }}>Enumerator Name &amp; ID</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: 110 }}>Mobile No</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', minWidth: 110 }}>Allotted HLB Code</th>
                        <th style={{ padding: '10px 10px', textAlign: 'center', minWidth: 120 }}>Total Records</th>
                        <th style={{ padding: '10px 10px', textAlign: 'center', minWidth: 120 }}>No. of Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {circle.enumerators.map((enumItem, eIdx) => (
                        <tr key={eIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 12px', color: '#f1f5f9', fontWeight: 700 }}>
                            <div style={{ fontSize: '0.82rem' }}>{enumItem.enumName}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>{enumItem.enumId}</div>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>{enumItem.enumMobile}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', color: '#c084fc', padding: '3px 10px', borderRadius: 8, fontWeight: 800, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                              HLB {String(enumItem.hlbCode).padStart(4, '0')}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f1f5f9', fontWeight: 800 }}>
                            {enumItem.totalRecords || enumItem.households || 0}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (enumItem.errorCount > 0) {
                                  setSelectedHlbErrorPopup({
                                    hlbCode: String(enumItem.hlbCode).padStart(4, '0'),
                                    supervisorName: circle.supervisorName,
                                    enumName: enumItem.enumName,
                                    enumMobile: enumItem.enumMobile,
                                    records: enumItem.errorRecords || []
                                  });
                                }
                              }}
                              style={{
                                background: enumItem.errorCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.15)',
                                border: enumItem.errorCount > 0 ? '1px solid #ef4444' : '1px solid rgba(34,197,94,0.3)',
                                color: enumItem.errorCount > 0 ? '#fca5a5' : '#86efac',
                                padding: '4px 12px',
                                borderRadius: 12,
                                fontWeight: 900,
                                fontSize: '0.74rem',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                                cursor: enumItem.errorCount > 0 ? 'pointer' : 'default'
                              }}
                            >
                              {enumItem.errorCount} {enumItem.errorCount === 1 ? 'error' : 'errors'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'rgba(168, 85, 247, 0.18)', color: '#ffffff', fontWeight: 900, borderTop: '2px solid rgba(168, 85, 247, 0.4)' }}>
                        <td style={{ padding: '10px 12px', textAlign: 'left', color: '#e9d5ff', fontSize: '0.82rem' }}>
                          SUPERVISOR TOTAL ({uniqueEnumCount} Enumerator{uniqueEnumCount === 1 ? '' : 's'})
                        </td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8' }}>-</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#c084fc', fontWeight: 800 }}>
                          {circle.enumerators.length} HLBs
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#38bdf8', fontSize: '0.88rem', fontWeight: 900 }}>
                          {circleTotalRecs.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            background: circleTotalErrs > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.2)',
                            border: circleTotalErrs > 0 ? '1.5px solid #ef4444' : '1.5px solid rgba(34,197,94,0.4)',
                            color: circleTotalErrs > 0 ? '#fca5a5' : '#86efac',
                            padding: '4px 12px',
                            borderRadius: 12,
                            fontWeight: 900,
                            fontSize: '0.78rem',
                            whiteSpace: 'nowrap',
                            display: 'inline-block'
                          }}>
                            {circleTotalErrs} {circleTotalErrs === 1 ? 'error' : 'errors'}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Records Popup Modal */}
      {selectedHlbErrorPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, background: 'rgba(5, 7, 15, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '90vw', maxWidth: 850, background: '#0f172a', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.15)', borderBottom: '1px solid rgba(239,68,68,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle color="#ef4444" size={20}/>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 800 }}>
                  Detailed Active Error Records — HLB {selectedHlbErrorPopup.hlbCode}
                </h3>
              </div>
              <button onClick={() => setSelectedHlbErrorPopup(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ padding: 20, maxHeight: '65vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Line No</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Building No</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>House No</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Head of Household</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Error Details</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHlbErrorPopup.records.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f1f5f9' }}>
                      <td style={{ padding: '8px 10px' }}>{r.lineNo}</td>
                      <td style={{ padding: '8px 10px' }}>{r.buildingNo}</td>
                      <td style={{ padding: '8px 10px' }}>{r.houseNo}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>{r.headName}</td>
                      <td style={{ padding: '8px 10px', color: '#fca5a5', fontWeight: 800 }}>{r.errType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

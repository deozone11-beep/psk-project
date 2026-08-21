import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ArrowLeft, Search, X, User, Phone, FileText, Printer, AlertTriangle, Download, Link as LinkIcon, Share2 } from 'lucide-react';
import hlbMapping from './hlbMapping.json';
import { CensusZoneProvider, useCensusZone } from './CensusZoneContext.jsx';
import CensusZoneSelector from './CensusZoneSelector.jsx';

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

function CensusModule4ProgressReportContent({ onBack, creds }) {
  const { selectedZone, selectedZoneObj } = useCensusZone();
  const [rows, setRows]               = useState([]);
  const [allotedRows, setAllotedRows] = useState([]);
  const [chargeRows, setChargeRows]   = useState([]);
  const [userRows, setUserRows]       = useState([]);
  const [hlbMappingRows, setHlbMappingRows] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [errorFilters, setErrorFilters] = useState(DEFAULT_ERRORS);
  const [selectedHlbErrorPopup, setSelectedHlbErrorPopup] = useState(null);
  const [activeViewTab, setActiveViewTab]     = useState('SUPERVISOR_TABLE'); // 'SUPERVISOR_TABLE' | 'DETAILED_ACCORDION'

  const dbHlbMap = useMemo(() => {
    const map = new Map();
    if (hlbMappingRows.length > 0) {
      hlbMappingRows.forEach(m => {
        const fullId = String(m.full_hlb_id || m.full_hlb || m.hlb_code || '').trim();
        const hNo = String(m.hlb_no || m.hlb_code || m.blk_no || '').trim();
        if (fullId && hNo) {
          map.set(fullId, hNo.padStart(4, '0'));
        }
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

    if (/^\d{1,4}$/.test(s)) {
      return s.padStart(4, '0');
    }

    const match = s.match(/(\d{1,4})(?:00)?$/) || s.match(/(\d{1,4})$/);
    if (match && match[1]) {
      return match[1].padStart(4, '0');
    }
    return s.padStart(4, '0');
  }, [dbHlbMap]);

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

  const fetchSeqRef = useRef(0);

  async function fetchAllRowsInChunks(t, chunkSize = 3000, onChunk, currentSeq) {
    let allRows = [];
    let totalCount = 0;

    let initialSuccess = false;
    let retries = 3;
    while (retries > 0 && !initialSuccess) {
      if (fetchSeqRef.current !== currentSeq) return [];
      try {
        const r = await db2Fetch(`/table/${encodeURIComponent(t)}?limit=${chunkSize}&offset=0&zone=${selectedZone}`);
        if (fetchSeqRef.current !== currentSeq) return [];
        const j = await r.json().catch(() => ({}));
        if (j.rows && Array.isArray(j.rows)) {
          allRows.push(...j.rows);
          totalCount = j.total || j.rows.length;
          if (j.limit && j.limit < chunkSize) chunkSize = j.limit;
          initialSuccess = true;
          if (onChunk && fetchSeqRef.current === currentSeq) onChunk(j.rows, allRows.length, totalCount);
        } else {
          retries--;
          if (retries > 0) await new Promise(res => setTimeout(res, 200));
        }
      } catch (e) {
        retries--;
        if (retries > 0) await new Promise(res => setTimeout(res, 200));
      }
    }

    if (!initialSuccess || fetchSeqRef.current !== currentSeq) return allRows;

    if (totalCount > chunkSize) {
      const remainingOffsets = [];
      for (let off = chunkSize; off < totalCount; off += chunkSize) {
        remainingOffsets.push(off);
      }

      const BATCH_SIZE = 2;
      for (let i = 0; i < remainingOffsets.length; i += BATCH_SIZE) {
        if (fetchSeqRef.current !== currentSeq) return [];
        const batchOffsets = remainingOffsets.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batchOffsets.map(async (off) => {
            let chunkRetries = 2;
            while (chunkRetries > 0) {
              if (fetchSeqRef.current !== currentSeq) return [];
              try {
                const res = await db2Fetch(`/table/${encodeURIComponent(t)}?limit=${chunkSize}&offset=${off}&zone=${selectedZone}`);
                if (fetchSeqRef.current !== currentSeq) return [];
                const data = await res.json().catch(() => ({}));
                if (data.rows && Array.isArray(data.rows)) return data.rows;
                chunkRetries--;
                await new Promise(res => setTimeout(res, 200));
              } catch (err) {
                chunkRetries--;
                await new Promise(res => setTimeout(res, 200));
              }
            }
            return [];
          })
        );

        if (fetchSeqRef.current !== currentSeq) return [];
        batchResults.forEach(rowsChunk => {
          if (rowsChunk.length > 0) {
            allRows.push(...rowsChunk);
            if (onChunk && fetchSeqRef.current === currentSeq) onChunk(rowsChunk, allRows.length, totalCount);
          }
        });
        await new Promise(res => setTimeout(res, 50));
      }
    }

    return allRows;
  }

  useEffect(() => {
    const currentSeq = ++fetchSeqRef.current;
    async function loadData() {
      setLoading(true);
      setRows([]);
      setChargeRows([]);
      setAllotedRows([]);
      setUserRows([]);
      setHlbMappingRows([]);
      try {
        const [rCharge, rAllot, rUser, rMap, rSettings] = await Promise.all([
          db2Fetch(`/table/charge_wise_report?limit=5000&offset=0&zone=${selectedZone}`),
          db2Fetch(`/table/hlb_allotted?limit=5000&offset=0&zone=${selectedZone}`),
          db2Fetch(`/table/user_details?limit=5000&offset=0&zone=${selectedZone}`),
          db2Fetch('/table/hlb_code_mapping?limit=1000&offset=0'),
          db2Fetch('/table/settings')
        ]);

        if (fetchSeqRef.current !== currentSeq) return;

        const jCharge = await rCharge.json().catch(() => ({}));
        setChargeRows(jCharge.rows || []);

        const jAllot = await rAllot.json().catch(() => ({}));
        if (jAllot.rows?.length) setAllotedRows(jAllot.rows);
        else if (jCharge.rows?.length) setAllotedRows(jCharge.rows);
        else setAllotedRows([]);

        let jUser = await rUser.json().catch(() => ({}));
        let uRows = jUser.rows || [];
        if (!uRows.length) {
          const rApp = await db2Fetch(`/table/app_user?limit=5000&offset=0&zone=${selectedZone}`);
          const jApp = await rApp.json().catch(() => ({}));
          uRows = jApp.rows || [];
        }
        if (fetchSeqRef.current !== currentSeq) return;
        setUserRows(uRows);

        const jMap = await rMap.json().catch(() => ({}));
        setHlbMappingRows(jMap.rows || []);

        const jSettings = await rSettings.json().catch(() => ({}));
        if (jSettings.rows?.length) {
          const row = jSettings.rows[0];
          const raw = row.custom_error_filters || row.error_filters || row.customErrorFilters;
          if (raw) {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (Array.isArray(parsed) && parsed.length > 0) {
              const merged = parsed.map(err => mergeErrorCardWithDefaults(err));
              setErrorFilters(merged);
            }
          }
        }

        let isFirstChunk = true;
        setRows([]);

        const targetTable = getZoneTable ? getZoneTable('hlb_records') : `hlb_records_zone_${selectedZone}`;
        await fetchAllRowsInChunks(targetTable, 3000, (chunk) => {
          if (fetchSeqRef.current !== currentSeq) return;
          if (chunk && chunk.length) {
            setRows(prev => (isFirstChunk ? chunk : [...prev, ...chunk]));
          }
          if (isFirstChunk) {
            isFirstChunk = false;
            setLoading(false);
          }
        }, currentSeq);
      } catch (e) {
        if (fetchSeqRef.current === currentSeq) {
          console.error('Data load error:', e);
          setLoading(false);
        }
      }
    }
    loadData();
  }, [selectedZone]);

  const recordMatchesErrorCard = (r, errCard) => {
    if (!r) return false;
    const isDeleted = r.is_deleted === true || r.is_deleted === 'true' || r.is_deleted === 1 ||
                      String(r.status ?? r.Status ?? r.record_status ?? r.RECORD_STATUS ?? r.delete_status ?? r.deleted ?? '').toLowerCase().trim().includes('delete');
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

  const getMobileAndUsername = (userId, personName, isSupervisor = false) => {
    const uId = String(userId || '').trim().toLowerCase();
    const pName = String(personName || '').trim().toLowerCase();

    const formatFromId = (str) => {
      if (!str || str === 'n/a') return '';
      const parts = str.split('_');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.length >= 2 && !/^\d+$/.test(lastPart)) {
        return lastPart.toUpperCase();
      }
      return str.toUpperCase();
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

  const { hlbErrorMap, hlbErrorRecordsMap } = useMemo(() => {
    const errMap = new Map();
    const errRecsMap = new Map();

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

      const isDeleted = r.is_deleted === true || r.is_deleted === 'true' || r.is_deleted === 1 ||
                        String(r.status ?? r.Status ?? r.record_status ?? r.RECORD_STATUS ?? r.delete_status ?? r.deleted ?? '').toLowerCase().trim().includes('delete');
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

        const uniqueKeys = Array.from(new Set([blk, unpadded, padded, rawCode].filter(Boolean)));

        uniqueKeys.forEach(k => {
          errMap.set(k, (errMap.get(k) || 0) + 1);
          if (!errRecsMap.has(k)) errRecsMap.set(k, []);
          errRecsMap.get(k).push(recItem);
        });
      }
    });

    return { hlbErrorMap: errMap, hlbErrorRecordsMap: errRecsMap };
  }, [rows, errorFilters, getHlbBlockNo, dbHlbMap]);

  const liveHlbMetricsMap = useMemo(() => {
    const map = new Map();

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

      const keys = Array.from(new Set([blk, unpadded, padded, rawCode]));

      const popVal = parseInt(r.count_of_persons ?? r.countOfPersons ?? r.tot_p ?? r.total_population ?? r.no_of_persons ?? r.persons ?? r.population ?? 0) || 0;

      const st = String(r.status || r.RECORD_STATUS || r.record_status || r.work_status || '').toLowerCase();
      const isVer = st.includes('comp') || st === '1' || st === 'true' || r.is_locked === 1 || r.is_locked === 'true' || r.verified_by_supervisor === true;

      const houseVal = r.census_house_num ?? r.censusHouseNum ?? r.building_number ?? r.buildingNumber;

      const seIdVal = String(r.self_enumeration_id ?? r.selfEnumerationId ?? r.se_id ?? r.self_enum_id ?? r.total_se_id_used ?? '').trim();
      const hasSeId = seIdVal && seIdVal !== 'null' && seIdVal !== 'undefined' && seIdVal !== 'N/A' && seIdVal !== '0' && seIdVal !== '-';

      keys.forEach(k => {
        if (!map.has(k)) {
          map.set(k, {
            totalRows: 0,
            housesSet: new Set(),
            verifiedCount: 0,
            totalPop: 0,
            seIdCount: 0
          });
        }
        const item = map.get(k);
        item.totalRows++;
        if (houseVal != null && houseVal !== '') item.housesSet.add(String(houseVal));
        if (isVer) item.verifiedCount++;
        item.totalPop += popVal;
        if (hasSeId) item.seIdCount++;
      });
    });

    return map;
  }, [rows, getHlbBlockNo, dbHlbMap]);

  const abstractReport = useMemo(() => {
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

      // Group allotedRows strictly by sc_serial_no (Circle No)
      allotedRows.forEach(a => {
        const areaType = String(a.area_type || '').toUpperCase();
        if (areaType && areaType !== 'HLB') return;
        if (parseInt(a.total_households || 0) > 10000) return;
        
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
          const rawEnum = String(a.enumerator_name || a.enumerator || a.enum_name || a.enumerator_full_name || a.user_name || '').trim();
          const userId = String(a.user_id || a.enumerator_id || a.username || '').trim();
          const enumInfo = getMobileAndUsername(userId || rawEnum, rawEnum || userId, false);

          const resolvedEnumName = enumInfo.fullName || (rawEnum && !rawEnum.startsWith('em_') ? rawEnum : (enumInfo.username !== 'N/A' ? enumInfo.username : 'ENUMERATOR'));
          
          const hlbSerial = String(a.hlb_serial_no || a.hlb_block_no || a.hlb_block_number || a.hlb_no || a.hlb_code || '').trim();
          const blkCode = getHlbBlockNo(hlbSerial) || hlbSerial.padStart(4, '0');

          const unpadded = String(parseInt(blkCode, 10) || blkCode);
          const padded = blkCode.padStart(4, '0');

          const errCount = hlbErrorMap.get(blkCode) || hlbErrorMap.get(unpadded) || hlbErrorMap.get(padded) || 0;
          const errRecords = hlbErrorRecordsMap.get(blkCode) || hlbErrorRecordsMap.get(unpadded) || hlbErrorRecordsMap.get(padded) || [];

          const liveData = liveHlbMetricsMap.get(padded) || liveHlbMetricsMap.get(unpadded) || liveHlbMetricsMap.get(blkCode);
          const cData = chargeMetricsMap.get(blkCode) || chargeMetricsMap.get(unpadded) || chargeMetricsMap.get(padded);

          let hhCount = 0;
          let housesCount = 0;
          let verCount = 0;
          let popCount = 0;
          let expHouses = 0;
          let isComp = false;
          let seIdUsed = 0;

          const stAllot = String(a.status ?? a.completed ?? a.work_status ?? '').trim().toLowerCase();

          if (liveData && liveData.totalRows > 0) {
            hhCount = liveData.totalRows;
            housesCount = liveData.housesSet.size > 0 ? liveData.housesSet.size : liveData.totalRows;
            verCount = liveData.verifiedCount;
            popCount = liveData.totalPop > 0 ? liveData.totalPop : hhCount * 4;
            expHouses = (cData && cData.exp > 0) ? cData.exp : (parseInt(a?.total_expected_census_houses || 0) || Math.max(housesCount, hhCount));
            seIdUsed = liveData.seIdCount;
            isComp = (cData && cData.isComp) || stAllot === '1' || stAllot === 'completed' || stAllot === 'true';
          } else if (cData && (cData.hh > 0 || cData.exp > 0)) {
            expHouses = cData.exp;
            housesCount = cData.houses;
            hhCount = cData.hh;
            verCount = cData.ver;
            popCount = cData.pop;
            isComp = cData.isComp || stAllot === '1' || stAllot === 'completed' || stAllot === 'true';
            seIdUsed = cData.seUsed || 0;
          } else if (a) {
            expHouses = parseInt(a.total_expected_census_houses || 0);
            housesCount = parseInt(a.total_census_houses || 0);
            hhCount = parseInt(a.total_households || 0);
            verCount = parseInt(a.total_household_verified_by_supervisor || 0);
            popCount = parseInt(a.total_population || 0);
            isComp = stAllot === '1' || stAllot === 'completed' || stAllot === 'true';
            seIdUsed = parseInt(a.total_se_id_used || a.total_se_used || a.se_id_used || 0);
          }

          return {
            enumId: enumInfo.username || userId || `ENUM-${resolvedEnumName}`,
            enumName: resolvedEnumName,
            enumMobile: enumInfo.mobile !== 'N/A' ? enumInfo.mobile : (String(a.mobile || a.mobile_no || a.phone || a.user_mobile || a.enum_mobile || '') || 'N/A'),
            hlbCode: padded,
            expectedHouses: expHouses,
            censusHouses: housesCount,
            households: hhCount,
            verifiedBySup: verCount,
            seIdUsed: seIdUsed,
            totalPopulation: popCount,
            errorCount: errCount,
            isCompleted: isComp,
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

      if (circles.length > 0) return circles;
    }

    return [];
  }, [rows, allotedRows, chargeRows, userRows, hlbErrorMap, hlbErrorRecordsMap, liveHlbMetricsMap, getHlbBlockNo, dbHlbMap]);

  const uniqueErrorCount = useMemo(() => {
    let count = 0;
    if (!rows || rows.length === 0) return 0;
    rows.forEach(r => {
      const isDeleted = r.is_deleted === true || r.is_deleted === 'true' || r.is_deleted === 1 || String(r.status || '').toUpperCase() === 'DELETED' || String(r.record_status || '').toUpperCase() === 'DELETED';
      if (isDeleted) return;
      const matched = errorFilters.some(errCard => recordMatchesErrorCard(r, errCard));
      if (matched) count++;
    });
    return count;
  }, [rows, errorFilters]);

  const overallStats = useMemo(() => {
    let expHouses = 0;
    let cenHouses = 0;
    let hhCount = 0;
    let verCount = 0;
    let popCount = 0;
    let errCount = 0;
    let compCount = 0;
    let totHlbs = 0;
    let seIdCount = 0;
    const allUniqueEnums = new Set();

    abstractReport.forEach(c => {
      c.enumerators.forEach(e => {
        totHlbs++;
        if (e.enumId || e.enumName) allUniqueEnums.add(e.enumId || e.enumName);
        errCount += (e.errorCount || 0);
        if (e.isCompleted) compCount++;
        seIdCount += (e.seIdUsed || 0);
      });
    });

    // Calculate total errors from hlbErrorMap if errCount is 0
    if (errCount === 0 && hlbErrorMap.size > 0) {
      hlbErrorMap.forEach(cnt => { errCount += cnt; });
    }

    // 1. Check if charge_wise_report has a summary row where area_name == 'Total'
    const totalRow = chargeRows.find(c => {
      const name = String(c.area_name || c.area_code || '').trim().toLowerCase();
      return name === 'total' || String(c.id) === '472';
    });

    if (totalRow) {
      expHouses = parseInt(totalRow.total_expected_census_houses || totalRow.expected_census_houses || totalRow.expected_houses || 0);
      cenHouses = parseInt(totalRow.total_census_houses || totalRow.census_houses || totalRow.total_houses || 0);
      hhCount = parseInt(totalRow.total_households || totalRow.total_census_households || totalRow.census_households || 0);
      verCount = parseInt(totalRow.total_household_verified_by_supervisor || totalRow.verified_by_supervisor || totalRow.verified_households || 0);
      popCount = parseInt(totalRow.total_population || totalRow.population || totalRow.tot_population || 0);
      const totalRowSe = parseInt(totalRow.total_se_id_used || totalRow.total_se_used || totalRow.se_id_used || 0);
      if (totalRowSe > 0) seIdCount = totalRowSe;
    } else if (chargeRows.length > 0) {
      // 2. Sum up rows from charge_wise_report table directly
      let cExp = 0, cCen = 0, cHH = 0, cVer = 0, cPop = 0, cSe = 0;
      chargeRows.forEach(c => {
        const areaName = String(c.area_name || '').toLowerCase();
        if (areaName === 'total') return;
        cExp += parseInt(c.total_expected_census_houses || c.expected_census_houses || c.expected_houses || 0) || 0;
        cCen += parseInt(c.total_census_houses || c.census_houses || c.total_houses || 0) || 0;
        cHH  += parseInt(c.total_households || c.total_census_households || c.census_households || 0) || 0;
        cVer += parseInt(c.total_household_verified_by_supervisor || c.verified_by_supervisor || c.verified_households || 0) || 0;
        cPop += parseInt(c.total_population || c.population || c.tot_population || 0) || 0;
        cSe  += parseInt(c.total_se_id_used || c.total_se_used || c.se_id_used || 0) || 0;
      });
      if (cExp > 0 || cCen > 0) {
        expHouses = cExp;
        cenHouses = cCen;
        hhCount = cHH;
        verCount = cVer;
        popCount = cPop;
        if (cSe > 0) seIdCount = cSe;
      }
    }

    // 3. Fallback to abstractReport calculation if charge_wise_report table is empty
    if (expHouses === 0 && cenHouses === 0 && hhCount === 0) {
      abstractReport.forEach(c => {
        c.enumerators.forEach(e => {
          expHouses += (e.expectedHouses || 0);
          cenHouses += (e.censusHouses || 0);
          hhCount += (e.households || 0);
          verCount += (e.verifiedBySup || 0);
          popCount += (e.totalPopulation || 0);
        });
      });
    }

    return {
      totalCircles: abstractReport.length,
      totalEnumerators: allUniqueEnums.size,
      totalHlbs: totHlbs,
      expectedHouses: expHouses,
      censusHouses: cenHouses,
      households: hhCount,
      verifiedBySup: verCount,
      totalSeIdUsed: seIdCount,
      totalPopulation: popCount,
      errorCount: rows.length > 0 ? uniqueErrorCount : 0,
      completedCount: compCount
    };
  }, [abstractReport, chargeRows, hlbErrorMap, uniqueErrorCount, rows]);

  const formatCsvCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""').trim();
    if (/\d+\/\d+|\d+-\d+|^\d{2,}\//.test(str) || /^0\d+/.test(str) || (str.length > 10 && /^\d+$/.test(str))) {
      return `="` + str + `"`;
    }
    return `"${str}"`;
  };

  const downloadSupervisorSummaryCSV = () => {
    let csv = 'S.No,Circle No,Supervisor Name,Supervisor ID,Supervisor Mobile,Allotted HLBs,Expected Houses,Census Houses,Census Households,Verified By Supervisor,SE ID Used,Total Population,Error Count,Status\n';
    abstractReport.forEach((c, i) => {
      const totExp = c.enumerators.reduce((s, e) => s + (e.expectedHouses || 0), 0);
      const totCen = c.enumerators.reduce((s, e) => s + (e.censusHouses || 0), 0);
      const totHH  = c.enumerators.reduce((s, e) => s + (e.households || 0), 0);
      const totVer = c.enumerators.reduce((s, e) => s + (e.verifiedBySup || 0), 0);
      const totSe  = c.enumerators.reduce((s, e) => s + (e.seIdUsed || 0), 0);
      const totPop = c.enumerators.reduce((s, e) => s + (e.totalPopulation || 0), 0);
      const totErr = c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0);
      const compCount = c.enumerators.filter(e => e.isCompleted).length;
      const isComp = compCount === c.enumerators.length && c.enumerators.length > 0;
      csv += `${formatCsvCell(i + 1)},${formatCsvCell(c.circleNo)},${formatCsvCell(c.supervisorName)},${formatCsvCell(c.supervisorId || '')},${formatCsvCell(c.supervisorMobile || '')},${formatCsvCell(c.enumerators.length)},${formatCsvCell(totExp)},${formatCsvCell(totCen)},${formatCsvCell(totHH)},${formatCsvCell(totVer)},${formatCsvCell(totSe)},${formatCsvCell(totPop)},${formatCsvCell(totErr)},${formatCsvCell(isComp ? 'Completed' : 'In Progress')}\n`;
    });

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Census_Supervisor_Summary_Progress_Report_${dateStr}.csv`;
    a.click();
  };

  const downloadDetailedBreakdownCSV = () => {
    let csv = 'Circle No,Supervisor Name,Supervisor Mobile,Enumerator Name,Enumerator ID,Enumerator Mobile,HLB Code,Expected Houses,Census Houses,Census Households,Verified By Supervisor,SE ID Used,Total Population,Error Count,Status\n';
    abstractReport.forEach(c => {
      c.enumerators.forEach(e => {
        csv += `${formatCsvCell(c.circleNo)},${formatCsvCell(c.supervisorName)},${formatCsvCell(c.supervisorMobile || '')},${formatCsvCell(e.enumName)},${formatCsvCell(e.enumId || '')},${formatCsvCell(e.enumMobile || '')},${formatCsvCell(`HLB ${String(e.hlbCode).padStart(4, '0')}`)},${formatCsvCell(e.expectedHouses || 0)},${formatCsvCell(e.censusHouses || 0)},${formatCsvCell(e.households || 0)},${formatCsvCell(e.verifiedBySup || 0)},${formatCsvCell(e.seIdUsed || 0)},${formatCsvCell(e.totalPopulation || 0)},${formatCsvCell(e.errorCount || 0)},${formatCsvCell(e.isCompleted ? 'Completed' : 'In Progress')}\n`;
      });
    });

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Census_Supervisor_Enumerator_Detailed_Progress_Report_${dateStr}.csv`;
    a.click();
  };

  const triggerUniversalPrint = (htmlContent) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1024px';
    iframe.style.height = '1400px';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Print error:', err);
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 600);
  };

  const printSupervisorSummaryOnlyReport = (dataToPrint) => {
    if (!dataToPrint || dataToPrint.length === 0) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supervisor Progress Summary Report</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; background: #fff; font-size: 9.5px; }
          .report-header { text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 8px; margin-bottom: 12px; }
          .report-title { font-size: 15px; font-weight: 900; color: #991b1b; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.05em; }
          .report-sub { font-size: 9px; color: #475569; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; table-layout: fixed; }
          th { background: #1e293b; color: #ffffff; font-weight: 800; text-align: center; padding: 6px 4px; border: 1px solid #334155; text-transform: uppercase; font-size: 8.5px; vertical-align: middle; }
          td { padding: 5px 4px; border: 1px solid #cbd5e1; color: #1e293b; text-align: center; vertical-align: middle; word-wrap: break-word; }
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          tr:nth-child(even) { background: #f8fafc; }
          .circle-badge { font-weight: 900; background: #991b1b; color: #fff; padding: 3px 8px; border-radius: 8px; font-size: 8.5px; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; }
          .err-badge { font-weight: 800; padding: 3px 8px; border-radius: 6px; font-size: 8.5px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; }
          .has-err { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
          .no-err { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .status-badge { font-weight: 800; padding: 2px 6px; border-radius: 6px; font-size: 8.5px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; }
          .in-prog { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
          .comp { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          tfoot tr { background: #e2e8f0; font-weight: 900; page-break-inside: avoid !important; break-inside: avoid !important; }
          tfoot td { border-top: 2px solid #0f172a; font-size: 9.5px; padding: 6px 4px; vertical-align: middle; }
          .print-footer { text-align: right; font-size: 9px; color: #94a3b8; margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="report-title">CENSUS WORK — SUPERVISOR SUMMARY PROGRESS REPORT</div>
          <div class="report-sub">Generated Date &amp; Time: ${new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} · Total Supervisors: ${dataToPrint.length}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%;">S.No</th>
              <th style="width: 10%;">Circle No</th>
              <th style="width: 22%; text-align: left;">Supervisor Name &amp; ID</th>
              <th style="width: 14%; text-align: left;">Mobile No</th>
              <th style="width: 10%;">Allotted HLBs</th>
              <th style="width: 8%;">Exp Houses</th>
              <th style="width: 8%;">Cen Houses</th>
              <th style="width: 8%;">Households</th>
              <th style="width: 8%;">Verified By Sup</th>
              <th style="width: 8%;">SE ID Used</th>
              <th style="width: 8%;">Population</th>
              <th style="width: 8%;">No. of Errors</th>
              <th style="width: 8%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint.map((c, i) => {
              const totExp = c.enumerators.reduce((s, e) => s + (e.expectedHouses || 0), 0);
              const totCen = c.enumerators.reduce((s, e) => s + (e.censusHouses || 0), 0);
              const totHH  = c.enumerators.reduce((s, e) => s + (e.households || 0), 0);
              const totVer = c.enumerators.reduce((s, e) => s + (e.verifiedBySup || 0), 0);
              const totSe  = c.enumerators.reduce((s, e) => s + (e.seIdUsed || 0), 0);
              const totPop = c.enumerators.reduce((s, e) => s + (e.totalPopulation || 0), 0);
              const totErr = c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0);
              const compCount = c.enumerators.filter(e => e.isCompleted).length;
              const isComp = compCount === c.enumerators.length && c.enumerators.length > 0;
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td><span class="circle-badge">${c.circleNo}</span></td>
                  <td style="text-align: left; font-weight: 700;">
                    ${c.supervisorName}<br/>
                    <span style="font-size: 8px; color: #64748b; font-family: monospace;">${c.supervisorId || ''}</span>
                  </td>
                  <td style="text-align: left; font-family: monospace; font-weight: 700;">${c.supervisorMobile || 'N/A'}</td>
                  <td style="font-weight: 700;">${c.enumerators.length} HLBs</td>
                  <td style="font-weight: 700;">${totExp.toLocaleString()}</td>
                  <td style="font-weight: 700;">${totCen.toLocaleString()}</td>
                  <td style="font-weight: 800;">${totHH.toLocaleString()}</td>
                  <td style="font-weight: 800; color: #0284c7;">${totVer.toLocaleString()}</td>
                  <td style="font-weight: 800; color: #7c3aed;">${totSe.toLocaleString()}</td>
                  <td style="font-weight: 800; color: #15803d;">${totPop.toLocaleString()}</td>
                  <td>
                    <span class="err-badge ${totErr > 0 ? 'has-err' : 'no-err'}">
                      ${totErr} ${totErr === 1 ? 'error' : 'errors'}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge ${isComp ? 'comp' : 'in-prog'}">
                      ${isComp ? 'Completed' : `${compCount}/${c.enumerators.length} Comp`}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
            <tr style="background: #e2e8f0; font-weight: 900; page-break-inside: avoid !important; break-inside: avoid !important;">
              <td colspan="4" style="text-align: left; font-weight: 900;">SUPERVISOR GRAND TOTAL (${dataToPrint.length} Circles)</td>
              <td style="font-weight: 900;">${overallStats.totalHlbs} HLBs</td>
              <td style="font-weight: 900;">${overallStats.expectedHouses.toLocaleString()}</td>
              <td style="font-weight: 900;">${overallStats.censusHouses.toLocaleString()}</td>
              <td style="font-weight: 900;">${overallStats.households.toLocaleString()}</td>
              <td style="font-weight: 900; color: #0284c7;">${overallStats.verifiedBySup.toLocaleString()}</td>
              <td style="font-weight: 900; color: #7c3aed;">${overallStats.totalSeIdUsed.toLocaleString()}</td>
              <td style="font-weight: 900; color: #15803d;">${overallStats.totalPopulation.toLocaleString()}</td>
              <td style="font-weight: 900;">
                <span class="err-badge ${overallStats.errorCount > 0 ? 'has-err' : 'no-err'}">
                  ${overallStats.errorCount} errors
                </span>
              </td>
              <td style="font-weight: 900;">${overallStats.completedCount}/${overallStats.totalHlbs} Comp</td>
            </tr>
          </tbody>
        </table>

        <div class="print-footer">
          Supervisor Summary Progress Report — PSK Builders Census Module
        </div>
      </body>
      </html>
    `;
    triggerUniversalPrint(htmlContent);
  };

  const printSupervisorAbstractReport = (circlesToPrint) => {
    if (!circlesToPrint || circlesToPrint.length === 0) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Census Progress Report (Supervisor & Enumerator Detailed)</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; background: #fff; font-size: 9.5px; }
          .report-header { text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 8px; margin-bottom: 12px; }
          .report-title { font-size: 15px; font-weight: 900; color: #991b1b; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.05em; }
          .report-sub { font-size: 9px; color: #475569; font-weight: 600; }
          .circle-card { border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; page-break-inside: avoid !important; break-inside: avoid !important; }
          .circle-header { background: #f1f5f9; padding: 6px 10px; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
          .circle-badge { background: #991b1b; color: #fff; font-weight: 900; font-size: 8.5px; padding: 3px 8px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; }
          .sup-name { font-size: 11px; font-weight: 800; color: #0f172a; margin-left: 8px; }
          .sup-mobile { font-size: 9.5px; color: #475569; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed; }
          th { background: #1e293b; color: #ffffff; font-weight: 800; text-align: center; padding: 6px 4px; border: 1px solid #334155; text-transform: uppercase; font-size: 8.5px; vertical-align: middle; }
          td { padding: 5px 4px; border: 1px solid #cbd5e1; color: #1e293b; text-align: center; vertical-align: middle; word-wrap: break-word; }
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          tr:nth-child(even) { background: #f8fafc; }
          .err-badge { display: inline-flex; align-items: center; justify-content: center; font-weight: 800; padding: 3px 8px; border-radius: 6px; font-size: 8.5px; line-height: 1; vertical-align: middle; }
          .has-err { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
          .no-err { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .status-badge { display: inline-flex; align-items: center; justify-content: center; font-weight: 800; padding: 2px 6px; border-radius: 6px; font-size: 8.5px; line-height: 1; vertical-align: middle; }
          .in-prog { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
          .comp { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .hlb-code { font-weight: 800; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
          .print-footer { text-align: right; font-size: 9px; color: #94a3b8; margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 5px; }
          .total-row { background: #e2e8f0; font-weight: 900; page-break-inside: avoid !important; break-inside: avoid !important; }
          .total-row td { border-top: 2px solid #0f172a; font-size: 9.5px; vertical-align: middle; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="report-title">CENSUS WORK — SUPERVISOR &amp; ENUMERATOR DETAILED PROGRESS REPORT</div>
          <div class="report-sub">Generated Date &amp; Time: ${new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} · Total Circles: ${circlesToPrint.length}</div>
        </div>

        ${circlesToPrint.map(c => {
          const uniqueCount = new Set(c.enumerators.map(e => e.enumId || e.enumName)).size;
          return `
          <div class="circle-card">
            <div class="circle-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="circle-badge">${c.circleNo}</span>
                <span class="sup-name">Supervisor: ${c.supervisorName} ${c.supervisorId ? `(${c.supervisorId})` : ''}</span>
              </div>
              <div class="sup-mobile">📞 ${c.supervisorMobile || 'N/A'}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 20%; text-align:left;">Enumerator Name &amp; ID</th>
                  <th style="width: 12%; text-align:left;">Mobile No</th>
                  <th style="width: 10%;">HLB Code</th>
                  <th style="width: 8%;">Exp Houses</th>
                  <th style="width: 8%;">Cen Houses</th>
                  <th style="width: 8%;">Households</th>
                  <th style="width: 9%;">Verified By Sup</th>
                  <th style="width: 8%;">SE ID Used</th>
                  <th style="width: 9%;">Population</th>
                  <th style="width: 8%;">Errors</th>
                  <th style="width: 8%;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${c.enumerators.map(e => `
                  <tr>
                    <td style="text-align:left;">
                      <strong>${e.enumName}</strong><br/>
                      <span style="font-size:8px; color:#64748b; font-family:monospace;">${e.enumId}</span>
                    </td>
                    <td style="text-align:left; font-family:monospace;">${e.enumMobile || 'N/A'}</td>
                    <td><span class="hlb-code">HLB ${String(e.hlbCode).padStart(4, '0')}</span></td>
                    <td style="font-weight:700;">${e.expectedHouses}</td>
                    <td style="font-weight:700;">${e.censusHouses}</td>
                    <td style="font-weight:800;">${e.households}</td>
                    <td style="font-weight:800; color:#0284c7;">${e.verifiedBySup}</td>
                    <td style="font-weight:800; color:#7c3aed;">${e.seIdUsed || 0}</td>
                    <td style="font-weight:800; color:#15803d;">${e.totalPopulation}</td>
                    <td>
                      <span class="err-badge ${e.errorCount > 0 ? 'has-err' : 'no-err'}">
                        ${e.errorCount} ${e.errorCount === 1 ? 'error' : 'errors'}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge ${e.isCompleted ? 'comp' : 'in-prog'}">
                        ${e.isCompleted ? 'Completed' : 'In progress'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td style="text-align:left; font-weight:900;">SUPERVISOR TOTAL (${uniqueCount} Enums)</td>
                  <td style="text-align:left;">-</td>
                  <td>${c.enumerators.length} HLBs</td>
                  <td style="font-weight:800;">${c.enumerators.reduce((s, e) => s + (e.expectedHouses || 0), 0)}</td>
                  <td style="font-weight:800;">${c.enumerators.reduce((s, e) => s + (e.censusHouses || 0), 0)}</td>
                  <td style="font-weight:900;">${c.enumerators.reduce((s, e) => s + (e.households || 0), 0)}</td>
                  <td style="font-weight:900; color:#0284c7;">${c.enumerators.reduce((s, e) => s + (e.verifiedBySup || 0), 0)}</td>
                  <td style="font-weight:900; color:#7c3aed;">${c.enumerators.reduce((s, e) => s + (e.seIdUsed || 0), 0)}</td>
                  <td style="font-weight:900; color:#15803d;">${c.enumerators.reduce((s, e) => s + (e.totalPopulation || 0), 0)}</td>
                  <td>
                    <span class="err-badge ${c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0) > 0 ? 'has-err' : 'no-err'}">
                      ${c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0)} errors
                    </span>
                  </td>
                  <td>
                    <span class="status-badge ${c.enumerators.filter(e => e.isCompleted).length === c.enumerators.length ? 'comp' : 'in-prog'}">
                      ${c.enumerators.filter(e => e.isCompleted).length}/${c.enumerators.length} Comp
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
        }).join('')}

        <div class="print-footer">
          Supervisor &amp; Enumerator Detailed Progress Report — PSK Builders Census Module
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
      const filename = `Census_Supervisor_Summary_Progress_Report_${dateStr}.pdf`;

      const formattedDateTime = now.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      const ROWS_PER_PAGE = 16;
      const totalPages = Math.ceil(dataToPrint.length / ROWS_PER_PAGE);

      let pagesHtml = '';
      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const chunk = dataToPrint.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);
        pagesHtml += `
          <div style="width: 1122px; padding: 20px 24px 20px 24px; box-sizing: border-box; background: #ffffff; page-break-after: ${pageIdx < totalPages - 1 ? 'always' : 'auto'}; position: relative; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
            <div style="text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 6px; margin-bottom: 12px; padding-top: 4px;">
              <h2 style="font-size: 14px; font-weight: 900; color: #991b1b; letter-spacing: 0.5px; text-transform: uppercase; margin: 0;">CENSUS WORK — SUPERVISOR SUMMARY PROGRESS REPORT</h2>
              <table style="width: 100%; font-size: 8.5px; color: #64748b; margin-top: 2px; font-weight: 600; border: none; border-collapse: collapse;">
                <tr>
                  <td style="text-align: left; border: none; padding: 0;">Generated Date &amp; Time: ${formattedDateTime}</td>
                  <td style="text-align: center; border: none; padding: 0; font-weight: 800; color: #991b1b;">Page ${pageIdx + 1} of ${totalPages}</td>
                  <td style="text-align: right; border: none; padding: 0;">Total Supervisors: ${dataToPrint.length}</td>
                </tr>
              </table>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5px; table-layout: fixed;">
              <thead>
                <tr style="background: #1e293b; color: #ffffff;">
                  <th style="width: 4%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">S.No</th>
                  <th style="width: 8%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">Circle No</th>
                  <th style="width: 20%; text-align: left; padding: 5px 5px; border: 1px solid #334155; vertical-align: middle;">Supervisor Name &amp; ID</th>
                  <th style="width: 13%; text-align: left; padding: 5px 5px; border: 1px solid #334155; vertical-align: middle;">Mobile No</th>
                  <th style="width: 9%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">Allotted HLBs</th>
                  <th style="width: 6.5%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">Exp Houses</th>
                  <th style="width: 6.5%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">Cen Houses</th>
                  <th style="width: 6.5%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">Households</th>
                  <th style="width: 7%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">Verified By Sup</th>
                  <th style="width: 6.5%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">SE ID Used</th>
                  <th style="width: 6.5%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">Population</th>
                  <th style="width: 6.5%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">Errors</th>
                  <th style="width: 7%; text-align: center; padding: 5px 3px; border: 1px solid #334155; vertical-align: middle;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${chunk.map((c, i) => {
                  const globalIdx = pageIdx * ROWS_PER_PAGE + i + 1;
                  const totExp = c.enumerators.reduce((s, e) => s + (e.expectedHouses || 0), 0);
                  const totCen = c.enumerators.reduce((s, e) => s + (e.censusHouses || 0), 0);
                  const totHH  = c.enumerators.reduce((s, e) => s + (e.households || 0), 0);
                  const totVer = c.enumerators.reduce((s, e) => s + (e.verifiedBySup || 0), 0);
                  const totSe  = c.enumerators.reduce((s, e) => s + (e.seIdUsed || 0), 0);
                  const totPop = c.enumerators.reduce((s, e) => s + (e.totalPopulation || 0), 0);
                  const totErr = c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0);
                  const compCount = c.enumerators.filter(e => e.isCompleted).length;
                  const isComp = compCount === c.enumerators.length && c.enumerators.length > 0;
                  return `
                    <tr>
                      <td style="text-align: center; font-weight: 700; color: #64748b; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">${globalIdx}</td>
                      <td style="text-align: center; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">
                        <span style="font-weight: 900; background: #991b1b; color: #fff; padding: 2px 6px; border-radius: 8px; font-size: 8px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle;">${c.circleNo}</span>
                      </td>
                      <td style="text-align: left; font-weight: 700; padding: 4px 5px; border: 1px solid #cbd5e1; word-wrap: break-word; vertical-align: middle;">${c.supervisorName}<br/><span style="font-size: 7.5px; color: #64748b; font-family: monospace;">${c.supervisorId || ''}</span></td>
                      <td style="text-align: left; font-family: monospace; font-weight: 700; padding: 4px 5px; border: 1px solid #cbd5e1; vertical-align: middle;">${c.supervisorMobile || 'N/A'}</td>
                      <td style="text-align: center; font-weight: 700; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">${c.enumerators.length} HLBs</td>
                      <td style="text-align: center; font-weight: 700; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">${totExp.toLocaleString()}</td>
                      <td style="text-align: center; font-weight: 700; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">${totCen.toLocaleString()}</td>
                      <td style="text-align: center; font-weight: 800; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">${totHH.toLocaleString()}</td>
                      <td style="text-align: center; font-weight: 800; color: #0284c7; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">${totVer.toLocaleString()}</td>
                      <td style="text-align: center; font-weight: 800; color: #7c3aed; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">${totSe.toLocaleString()}</td>
                      <td style="text-align: center; font-weight: 800; color: #15803d; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">${totPop.toLocaleString()}</td>
                      <td style="text-align: center; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">
                        <span style="font-weight: 800; padding: 2px 6px; border-radius: 6px; font-size: 8px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; ${totErr > 0 ? 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;' : 'background: #dcfce7; color: #166534; border: 1px solid #86efac;'}">
                          ${totErr} ${totErr === 1 ? 'error' : 'errors'}
                        </span>
                      </td>
                      <td style="text-align: center; padding: 4px 3px; border: 1px solid #cbd5e1; vertical-align: middle;">
                        <span style="font-weight: 800; padding: 2px 5px; border-radius: 6px; font-size: 7.5px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; ${isComp ? 'background: #dcfce7; color: #166534; border: 1px solid #86efac;' : 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;'}">
                          ${isComp ? 'Completed' : `${compCount}/${c.enumerators.length} Comp`}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
                ${pageIdx === totalPages - 1 ? `
                  <tr style="background: #e2e8f0; font-weight: 900;">
                    <td colspan="4" style="text-align: left; padding: 6px 5px; border-top: 2px solid #0f172a; vertical-align: middle;">SUPERVISOR GRAND TOTAL (${dataToPrint.length} Circles)</td>
                    <td style="text-align: center; padding: 6px 3px; border-top: 2px solid #0f172a; vertical-align: middle;">${overallStats.totalHlbs} HLBs</td>
                    <td style="text-align: center; padding: 6px 3px; border-top: 2px solid #0f172a; vertical-align: middle;">${overallStats.expectedHouses.toLocaleString()}</td>
                    <td style="text-align: center; padding: 6px 3px; border-top: 2px solid #0f172a; vertical-align: middle;">${overallStats.censusHouses.toLocaleString()}</td>
                    <td style="text-align: center; padding: 6px 3px; border-top: 2px solid #0f172a; vertical-align: middle;">${overallStats.households.toLocaleString()}</td>
                    <td style="text-align: center; color: #0284c7; padding: 6px 3px; border-top: 2px solid #0f172a; vertical-align: middle;">${overallStats.verifiedBySup.toLocaleString()}</td>
                    <td style="text-align: center; color: #7c3aed; padding: 6px 3px; border-top: 2px solid #0f172a; vertical-align: middle;">${overallStats.totalSeIdUsed.toLocaleString()}</td>
                    <td style="text-align: center; color: #15803d; padding: 6px 3px; border-top: 2px solid #0f172a; vertical-align: middle;">${overallStats.totalPopulation.toLocaleString()}</td>
                    <td style="text-align: center; padding: 6px 3px; border-top: 2px solid #0f172a; vertical-align: middle;">
                      <span style="font-weight: 800; padding: 2px 6px; border-radius: 6px; font-size: 8px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; vertical-align: middle; ${overallStats.errorCount > 0 ? 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;' : 'background: #dcfce7; color: #166534; border: 1px solid #86efac;'}">
                        ${overallStats.errorCount} errors
                      </span>
                    </td>
                    <td style="text-align: center; padding: 6px 3px; border-top: 2px solid #0f172a; vertical-align: middle;">${overallStats.completedCount}/${overallStats.totalHlbs} Comp</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        `;
      }

      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 1122 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['css'] }
      };

      html2pdf().set(opt).from(pagesHtml).save().catch(err => {
        console.error('html2pdf save error:', err);
      });
    }).catch(err => {
      console.error('html2pdf import error:', err);
    });
  };

  const downloadDetailedBreakdownPDF = (reportData) => {
    const dataToPrint = reportData && reportData.length > 0 ? reportData : abstractReport;
    if (!dataToPrint || dataToPrint.length === 0) return;

    Promise.all([import('jspdf'), import('html2canvas')]).then(async ([jspdfModule, html2canvasModule]) => {
      const { jsPDF } = jspdfModule;
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
      const filename = `Census_Supervisor_Detailed_Progress_Report_Zone_${selectedZone}_${dateStr}.pdf`;
      const formattedDateTime = now.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      // Dynamic height packing for A4 Landscape (Packs 3-5 cards per page up to 660px with 0 wasted empty space)
      const pages = [];
      let currentPageCards = [];
      let currentHeight = 45;

      dataToPrint.forEach(c => {
        const cardHeight = 55 + (c.enumerators.length * 20);
        if (currentPageCards.length > 0 && (currentHeight + cardHeight > 660)) {
          pages.push(currentPageCards);
          currentPageCards = [c];
          currentHeight = 45 + cardHeight;
        } else {
          currentPageCards.push(c);
          currentHeight += cardHeight;
        }
      });
      if (currentPageCards.length > 0) {
        pages.push(currentPageCards);
      }

      const totalPages = pages.length;
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = 297;
      const pdfHeight = 210;

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const pageCards = pages[pageIdx];
        const pageContainer = document.createElement('div');
        pageContainer.style.position = 'fixed';
        pageContainer.style.left = '-9999px';
        pageContainer.style.top = '0px';
        pageContainer.style.width = '1122px';
        pageContainer.style.minHeight = '794px';
        pageContainer.style.maxHeight = '794px';
        pageContainer.style.padding = '16px 20px';
        pageContainer.style.boxSizing = 'border-box';
        pageContainer.style.background = '#ffffff';
        pageContainer.style.color = '#0f172a';
        pageContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

        pageContainer.innerHTML = `
          <div style="text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 4px; margin-bottom: 8px;">
            <h2 style="font-size: 13px; font-weight: 900; color: #991b1b; letter-spacing: 0.5px; text-transform: uppercase; margin: 0;">GREATER CHENNAI CORPORATION · ${selectedZoneObj ? selectedZoneObj.name.toUpperCase() : `ZONE ${selectedZone}`} · PROGRESS REPORT</h2>
            <table style="width: 100%; font-size: 8px; color: #64748b; margin-top: 2px; font-weight: 600; border: none; border-collapse: collapse;">
              <tr>
                <td style="text-align: left; border: none; padding: 0;">Generated Date &amp; Time: ${formattedDateTime}</td>
                <td style="text-align: center; border: none; padding: 0; font-weight: 800; color: #991b1b;">Page ${pageIdx + 1} of ${totalPages}</td>
                <td style="text-align: right; border: none; padding: 0;">Total Supervisors: ${dataToPrint.length}</td>
              </tr>
            </table>
          </div>

          ${pageCards.map(c => {
            const uniqueCount = new Set(c.enumerators.map(e => e.enumId || e.enumName)).size;
            const totExp = c.enumerators.reduce((s, e) => s + (e.expectedHouses || 0), 0);
            const totCen = c.enumerators.reduce((s, e) => s + (e.censusHouses || 0), 0);
            const totHH  = c.enumerators.reduce((s, e) => s + (e.households || 0), 0);
            const totVer = c.enumerators.reduce((s, e) => s + (e.verifiedBySup || 0), 0);
            const totSe  = c.enumerators.reduce((s, e) => s + (e.seIdUsed || 0), 0);
            const totPop = c.enumerators.reduce((s, e) => s + (e.totalPopulation || 0), 0);
            const totErr = c.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0);
            const compCount = c.enumerators.filter(e => e.isCompleted).length;
            const isComp = compCount === c.enumerators.length && c.enumerators.length > 0;
            return `
              <div style="border: 1px solid #cbd5e1; border-radius: 5px; margin-bottom: 8px; overflow: hidden; background: #ffffff;">
                <table style="width: 100%; border-collapse: collapse; background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                  <tr>
                    <td style="padding: 3px 6px; text-align: left; vertical-align: middle; border: none;">
                      <span style="background: #991b1b; color: #fff; font-weight: 900; font-size: 7.5px; padding: 2px 6px; border-radius: 6px; display: inline-block; vertical-align: middle; margin-right: 6px;">${c.circleNo}</span>
                      <span style="font-size: 9.5px; font-weight: 800; color: #0f172a; vertical-align: middle;">Supervisor: ${c.supervisorName} ${c.supervisorId ? `(${c.supervisorId})` : ''}</span>
                    </td>
                    <td style="padding: 3px 6px; text-align: right; font-size: 8px; color: #475569; font-weight: 700; vertical-align: middle; border: none;">
                      📞 ${c.supervisorMobile || 'N/A'}
                    </td>
                  </tr>
                </table>
                <table style="width: 100%; border-collapse: collapse; font-size: 8px; table-layout: fixed;">
                  <thead>
                    <tr style="background: #1e293b; color: #ffffff;">
                      <th style="width: 20%; text-align: left; padding: 3px 4px; border: 1px solid #334155;">Enumerator Name &amp; ID</th>
                      <th style="width: 12%; text-align: left; padding: 3px 4px; border: 1px solid #334155;">Mobile No</th>
                      <th style="width: 10%; text-align: center; padding: 3px 2px; border: 1px solid #334155;">HLB Code</th>
                      <th style="width: 8%; text-align: center; padding: 3px 2px; border: 1px solid #334155;">Exp Houses</th>
                      <th style="width: 8%; text-align: center; padding: 3px 2px; border: 1px solid #334155;">Cen Houses</th>
                      <th style="width: 8%; text-align: center; padding: 3px 2px; border: 1px solid #334155;">Households</th>
                      <th style="width: 9%; text-align: center; padding: 3px 2px; border: 1px solid #334155;">Verified By Sup</th>
                      <th style="width: 8%; text-align: center; padding: 3px 2px; border: 1px solid #334155;">SE ID Used</th>
                      <th style="width: 9%; text-align: center; padding: 3px 2px; border: 1px solid #334155;">Population</th>
                      <th style="width: 8%; text-align: center; padding: 3px 2px; border: 1px solid #334155;">Errors</th>
                      <th style="width: 8%; text-align: center; padding: 3px 2px; border: 1px solid #334155;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.enumerators.map(e => `
                      <tr>
                        <td style="text-align: left; padding: 2px 4px; border: 1px solid #cbd5e1; vertical-align: middle;"><b>${e.enumName}</b><br/><span style="font-size: 7px; color: #64748b; font-family: monospace;">${e.enumId || ''}</span></td>
                        <td style="text-align: left; font-family: monospace; padding: 2px 4px; border: 1px solid #cbd5e1; vertical-align: middle;">${e.enumMobile || 'N/A'}</td>
                        <td style="text-align: center; font-family: monospace; font-weight: 700; padding: 2px; border: 1px solid #cbd5e1; vertical-align: middle;">HLB ${String(e.hlbCode).padStart(4, '0')}</td>
                        <td style="text-align: center; font-weight: 700; padding: 2px; border: 1px solid #cbd5e1; vertical-align: middle;">${e.expectedHouses}</td>
                        <td style="text-align: center; font-weight: 700; padding: 2px; border: 1px solid #cbd5e1; vertical-align: middle;">${e.censusHouses}</td>
                        <td style="text-align: center; font-weight: 800; padding: 2px; border: 1px solid #cbd5e1; vertical-align: middle;">${e.households}</td>
                        <td style="text-align: center; font-weight: 800; color: #0284c7; padding: 2px; border: 1px solid #cbd5e1; vertical-align: middle;">${e.verifiedBySup}</td>
                        <td style="text-align: center; font-weight: 800; color: #7c3aed; padding: 2px; border: 1px solid #cbd5e1; vertical-align: middle;">${e.seIdUsed || 0}</td>
                        <td style="text-align: center; font-weight: 800; color: #15803d; padding: 2px; border: 1px solid #cbd5e1; vertical-align: middle;">${e.totalPopulation}</td>
                        <td style="text-align: center; padding: 2px; border: 1px solid #cbd5e1; vertical-align: middle;">
                          <span style="font-weight: 800; padding: 1px 4px; border-radius: 3px; font-size: 7px; display: inline-block; ${e.errorCount > 0 ? 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;' : 'background: #dcfce7; color: #166534; border: 1px solid #86efac;'}">
                            ${e.errorCount}
                          </span>
                        </td>
                        <td style="text-align: center; padding: 2px; border: 1px solid #cbd5e1; vertical-align: middle;">
                          <span style="font-weight: 800; padding: 1px 4px; border-radius: 3px; font-size: 7px; display: inline-block; ${e.isCompleted ? 'background: #dcfce7; color: #166534; border: 1px solid #86efac;' : 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;'}">
                            ${e.isCompleted ? 'Completed' : 'In prog'}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                    <tr style="background: #f1f5f9; font-weight: 900;">
                      <td style="text-align: left; padding: 3px 4px; border: 1px solid #cbd5e1;">SUPERVISOR TOTAL (${uniqueCount} Enums)</td>
                      <td style="text-align: left; padding: 3px 4px; border: 1px solid #cbd5e1;">-</td>
                      <td style="text-align: center; padding: 3px 2px; border: 1px solid #cbd5e1;">${c.enumerators.length} HLBs</td>
                      <td style="text-align: center; padding: 3px 2px; border: 1px solid #cbd5e1;">${totExp.toLocaleString()}</td>
                      <td style="text-align: center; padding: 3px 2px; border: 1px solid #cbd5e1;">${totCen.toLocaleString()}</td>
                      <td style="text-align: center; padding: 3px 2px; border: 1px solid #cbd5e1;">${totHH.toLocaleString()}</td>
                      <td style="text-align: center; color: #0284c7; padding: 3px 2px; border: 1px solid #cbd5e1;">${totVer.toLocaleString()}</td>
                      <td style="text-align: center; color: #7c3aed; padding: 3px 2px; border: 1px solid #cbd5e1;">${totSe.toLocaleString()}</td>
                      <td style="text-align: center; color: #15803d; padding: 3px 2px; border: 1px solid #cbd5e1;">${totPop.toLocaleString()}</td>
                      <td style="text-align: center; padding: 3px 2px; border: 1px solid #cbd5e1;">
                        <span style="font-weight: 800; padding: 1px 4px; border-radius: 3px; font-size: 7px; display: inline-block; ${totErr > 0 ? 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;' : 'background: #dcfce7; color: #166534; border: 1px solid #86efac;'}">
                          ${totErr} errors
                        </span>
                      </td>
                      <td style="text-align: center; padding: 3px 2px; border: 1px solid #cbd5e1;">
                        <span style="font-weight: 800; padding: 1px 4px; border-radius: 3px; font-size: 7px; display: inline-block; ${isComp ? 'background: #dcfce7; color: #166534; border: 1px solid #86efac;' : 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;'}">
                          ${compCount}/${c.enumerators.length} Comp
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `;
          }).join('')}
        `;

        document.body.appendChild(pageContainer);
        const canvas = await html2canvas(pageContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 1122,
          height: 794,
          windowWidth: 1122
        });
        document.body.removeChild(pageContainer);

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        if (pageIdx > 0) {
          pdf.addPage('a4', 'landscape');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(filename);
    }).catch(err => {
      console.error('PDF export error:', err);
    });
  };

  return (
    <div style={{ background: '#0b0f19', color: '#f8fafc', minHeight: '100vh', padding: '16px 14px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
          >
            <ArrowLeft size={16}/> Back to Dashboard
          </button>
          <CensusZoneSelector compact={true} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (activeViewTab === 'SUPERVISOR_TABLE') {
                downloadSupervisorSummaryCSV();
              } else {
                downloadDetailedBreakdownCSV();
              }
            }}
            style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)' }}
          >
            <Download size={16}/> {activeViewTab === 'SUPERVISOR_TABLE' ? 'Export CSV (Summary)' : 'Export CSV (Detailed)'}
          </button>
          <button
            onClick={() => {
              if (activeViewTab === 'SUPERVISOR_TABLE') {
                downloadSupervisorSummaryPDF(abstractReport);
              } else {
                downloadDetailedBreakdownPDF(abstractReport);
              }
            }}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
          >
            <Download size={16}/> {activeViewTab === 'SUPERVISOR_TABLE' ? 'Export PDF (Summary)' : 'Export PDF (Detailed)'}
          </button>
          <button
            onClick={() => {
              if (activeViewTab === 'SUPERVISOR_TABLE') {
                printSupervisorSummaryOnlyReport(abstractReport);
              } else {
                printSupervisorAbstractReport(abstractReport);
              }
            }}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Printer size={16}/> {activeViewTab === 'SUPERVISOR_TABLE' ? 'Print Supervisors Summary' : 'Print All Supervisors'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
          Census Progress Report (Supervisor Base Report)
        </div>
        <div style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: 3 }}>
          Greater Chennai Corporation · <span style={{ color: '#38bdf8', fontWeight: 700 }}>{selectedZoneObj ? selectedZoneObj.name : `Zone ${selectedZone}`}</span> (Wards: {selectedZoneObj?.wards || 'All'})
        </div>
      </div>

      {/* OVERALL TOTAL SUMMARY CARDS GRID */}
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
          padding: '14px 18px',
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
          padding: '14px 18px',
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
            Allotted HLBs: {overallStats.totalHlbs}
          </div>
        </div>

        {/* CARD 3: EXPECTED HOUSES */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(100, 116, 139, 0.08) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Expected Houses
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>
            {overallStats.expectedHouses.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Target Expected
          </div>
        </div>

        {/* CARD 4: CENSUS HOUSES */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(13, 148, 136, 0.08) 100%)',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#2dd4bf', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Census Houses
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>
            {overallStats.censusHouses.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Actual Listed
          </div>
        </div>

        {/* CARD 5: CENSUS HOUSEHOLDS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Census Households
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>
            {overallStats.households.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Total Households
          </div>
        </div>

        {/* CARD 6: VERIFIED BY SUPERVISOR */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(2, 132, 199, 0.1) 100%)',
          border: '1px solid rgba(14, 165, 233, 0.4)',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Verified By Supervisor
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8' }}>
            {overallStats.verifiedBySup.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7dd3fc' }}>
            Supervisor Verified
          </div>
        </div>

        {/* CARD 7: TOTAL SE ID USED */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(124, 58, 237, 0.1) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total SE ID Used
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#c084fc' }}>
            {(overallStats.totalSeIdUsed || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#e9d5ff' }}>
            Self Enum. Mapped
          </div>
        </div>

        {/* CARD 7: TOTAL POPULATION */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(22, 163, 74, 0.1) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Population
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4ade80' }}>
            {overallStats.totalPopulation.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#86efac' }}>
            Total Persons Mapped
          </div>
        </div>

        {/* CARD 8: TOTAL ERRORS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#fca5a5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Active Errors
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef4444' }}>
            {overallStats.errorCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
            Action Required
          </div>
        </div>
      </div>

      {/* VIEW MODE TABS BAR */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        borderRadius: 14,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setActiveViewTab('SUPERVISOR_TABLE')}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: '0.82rem',
              background: activeViewTab === 'SUPERVISOR_TABLE' ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255, 255, 255, 0.05)',
              color: activeViewTab === 'SUPERVISOR_TABLE' ? '#ffffff' : '#94a3b8',
              border: activeViewTab === 'SUPERVISOR_TABLE' ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: activeViewTab === 'SUPERVISOR_TABLE' ? '0 4px 14px rgba(168, 85, 247, 0.4)' : 'none'
            }}
          >
            📊 Supervisor Summary Table
          </button>

          <button
            onClick={() => setActiveViewTab('DETAILED_ACCORDION')}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: '0.82rem',
              background: activeViewTab === 'DETAILED_ACCORDION' ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255, 255, 255, 0.05)',
              color: activeViewTab === 'DETAILED_ACCORDION' ? '#ffffff' : '#94a3b8',
              border: activeViewTab === 'DETAILED_ACCORDION' ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: activeViewTab === 'DETAILED_ACCORDION' ? '0 4px 14px rgba(168, 85, 247, 0.4)' : 'none'
            }}
          >
            📋 Enumerator Wise Details
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading Census Progress Report...</div>
      ) : activeViewTab === 'SUPERVISOR_TABLE' ? (
        /* TAB 1: SUPERVISOR SUMMARY TABLE */
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: 'rgba(168, 85, 247, 0.14)', color: '#e9d5ff', borderBottom: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <th style={{ padding: '12px 10px', textAlign: 'center', width: 45 }}>S.No</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', minWidth: 90 }}>Circle No</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', minWidth: 180 }}>Supervisor Name &amp; ID</th>
                <th style={{ padding: '12px 12px', textAlign: 'left', minWidth: 110 }}>Mobile No</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', minWidth: 110 }}>Allotted HLBs</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', minWidth: 120 }}>Expected Houses</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', minWidth: 110 }}>Census Houses</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', minWidth: 110 }}>Households</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', minWidth: 120 }}>Verified By Sup</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', minWidth: 110 }}>Total SE ID Used</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', minWidth: 110 }}>Total Population</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', minWidth: 110 }}>No. of Errors</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', minWidth: 100 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {abstractReport.map((circle, idx) => {
                const totExp = circle.enumerators.reduce((s, e) => s + (e.expectedHouses || 0), 0);
                const totCen = circle.enumerators.reduce((s, e) => s + (e.censusHouses || 0), 0);
                const totHH  = circle.enumerators.reduce((s, e) => s + (e.households || 0), 0);
                const totVer = circle.enumerators.reduce((s, e) => s + (e.verifiedBySup || 0), 0);
                const totSe  = circle.enumerators.reduce((s, e) => s + (e.seIdUsed || 0), 0);
                const totPop = circle.enumerators.reduce((s, e) => s + (e.totalPopulation || 0), 0);
                const totErr = circle.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0);
                const compCount = circle.enumerators.filter(e => e.isCompleted).length;
                const isFullyCompleted = compCount === circle.enumerators.length && circle.enumerators.length > 0;

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)' }}>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                      <span style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', fontSize: '0.7rem', fontWeight: 900, padding: '3px 10px', borderRadius: 20 }}>
                        {circle.circleNo}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#f8fafc', fontWeight: 800 }}>
                      <div>{circle.supervisorName}</div>
                      {circle.supervisorId && <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>{circle.supervisorId}</div>}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                      {circle.supervisorMobile || 'N/A'}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#c084fc', fontWeight: 800 }}>
                      {circle.enumerators.length} HLBs
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                      {totExp.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#cbd5e1', fontWeight: 700 }}>
                      {totCen.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#f8fafc', fontWeight: 800 }}>
                      {totHH.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#38bdf8', fontWeight: 800 }}>
                      {totVer.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#c084fc', fontWeight: 800 }}>
                      {totSe.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#4ade80', fontWeight: 800 }}>
                      {totPop.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        background: totErr > 0 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(34, 197, 94, 0.18)',
                        color: totErr > 0 ? '#ef4444' : '#22c55e',
                        border: totErr > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)'
                      }}>
                        {totErr} {totErr === 1 ? 'error' : 'errors'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        background: isFullyCompleted ? 'rgba(34, 197, 94, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                        color: isFullyCompleted ? '#22c55e' : '#f59e0b',
                        border: isFullyCompleted ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                      }}>
                        {isFullyCompleted ? 'Completed' : `${compCount}/${circle.enumerators.length} Comp`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(168, 85, 247, 0.16)', borderTop: '2px solid #a855f7', fontWeight: 900, color: '#ffffff' }}>
                <td colSpan="4" style={{ padding: '14px 14px', textAlign: 'left', fontSize: '0.85rem' }}>
                  SUPERVISOR GRAND TOTAL ({abstractReport.length} Circles)
                </td>
                <td style={{ padding: '14px 10px', textAlign: 'center', color: '#c084fc' }}>{overallStats.totalHlbs} HLBs</td>
                <td style={{ padding: '14px 10px', textAlign: 'center', color: '#94a3b8' }}>{overallStats.expectedHouses.toLocaleString()}</td>
                <td style={{ padding: '14px 10px', textAlign: 'center', color: '#cbd5e1' }}>{overallStats.censusHouses.toLocaleString()}</td>
                <td style={{ padding: '14px 10px', textAlign: 'center', color: '#ffffff' }}>{overallStats.households.toLocaleString()}</td>
                <td style={{ padding: '14px 10px', textAlign: 'center', color: '#38bdf8' }}>{overallStats.verifiedBySup.toLocaleString()}</td>
                <td style={{ padding: '14px 10px', textAlign: 'center', color: '#c084fc' }}>{overallStats.totalSeIdUsed.toLocaleString()}</td>
                <td style={{ padding: '14px 10px', textAlign: 'center', color: '#4ade80' }}>{overallStats.totalPopulation.toLocaleString()}</td>
                <td style={{ padding: '14px 10px', textAlign: 'center', color: '#ef4444' }}>{overallStats.errorCount.toLocaleString()} errors</td>
                <td style={{ padding: '14px 10px', textAlign: 'center', color: '#f59e0b' }}>{overallStats.completedCount} / {overallStats.totalHlbs} Comp</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* TAB 2: DETAILED ENUMERATOR ACCORDION VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {abstractReport.map((circle, cIdx) => (
            <div key={cIdx} style={{ background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', fontSize: '0.72rem', fontWeight: 900, padding: '3px 10px', borderRadius: 20 }}>
                    {circle.circleNo}
                  </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={14} color="#c084fc"/> Supervisor: {circle.supervisorName} {circle.supervisorId ? `(${circle.supervisorId})` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace' }}>
                    <Phone size={12} color="#60a5fa"/> {circle.supervisorMobile}
                  </span>
                  <button
                    onClick={() => printSupervisorAbstractReport([circle])}
                    style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa', padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Print Circle
                  </button>
                  <button
                    onClick={() => {
                      const padCirc = String(circle.circleNo || circle.circleNumber).replace(/[^0-9]/g, '').padStart(3, '0');
                      const link = `${window.location.origin}/report?zone=${selectedZone}&circle=${padCirc}`;
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(link);
                        alert(`📋 Public Link Copied for Supervisor ${circle.supervisorName} (Circle ${circle.circleNo}):\n\n${link}`);
                      } else {
                        prompt('Copy Public Link:', link);
                      }
                    }}
                    style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                    title="Copy Public Link with Zone & Circle"
                  >
                    📋 Copy Link
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#e9d5ff', borderBottom: '1px solid rgba(168, 85, 247, 0.25)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: 170 }}>Enumerator Name &amp; ID</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: 110 }}>Mobile No</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', minWidth: 110 }}>Allotted HLB Code</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center', minWidth: 135, lineHeight: 1.3 }}>Total Number of Expected Census Houses</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center', minWidth: 135, lineHeight: 1.3 }}>Total Number of Census Houses</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center', minWidth: 135, lineHeight: 1.3 }}>Total Number of Census Households</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center', minWidth: 135, lineHeight: 1.3 }}>Households Verified By Supervisor</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center', minWidth: 130, lineHeight: 1.3 }}>Total SE ID Used</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center', minWidth: 95 }}>Total Population</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center', minWidth: 120 }}>No. of Errors</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center', minWidth: 110 }}>Status</th>
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
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                          {enumItem.expectedHouses.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#cbd5e1', fontWeight: 700 }}>
                          {enumItem.censusHouses.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f1f5f9', fontWeight: 800 }}>
                          {enumItem.households.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#38bdf8', fontWeight: 800 }}>
                          {enumItem.verifiedBySup.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#c084fc', fontWeight: 800 }}>
                          {(enumItem.seIdUsed || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#a7f3d0', fontWeight: 800 }}>
                          {enumItem.totalPopulation.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span 
                            onClick={() => {
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
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            background: enumItem.isCompleted ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                            color: enumItem.isCompleted ? '#4ade80' : '#fbbf24',
                            border: enumItem.isCompleted ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(245,158,11,0.4)',
                            padding: '4px 12px',
                            borderRadius: 12,
                            fontSize: '0.74rem',
                            fontWeight: 900,
                            whiteSpace: 'nowrap',
                            display: 'inline-block'
                          }}>
                            {enumItem.isCompleted ? 'Completed' : 'In progress'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const uniqueEnumCount = new Set(circle.enumerators.map(e => e.enumId || e.enumName)).size;
                      const sumExp = circle.enumerators.reduce((s, e) => s + (e.expectedHouses || 0), 0);
                      const sumCen = circle.enumerators.reduce((s, e) => s + (e.censusHouses || 0), 0);
                      const sumHH  = circle.enumerators.reduce((s, e) => s + (e.households || 0), 0);
                      const sumVer = circle.enumerators.reduce((s, e) => s + (e.verifiedBySup || 0), 0);
                      const sumSe  = circle.enumerators.reduce((s, e) => s + (e.seIdUsed || 0), 0);
                      const sumPop = circle.enumerators.reduce((s, e) => s + (e.totalPopulation || 0), 0);
                      const sumErr = circle.enumerators.reduce((s, e) => s + (e.errorCount || 0), 0);
                      const sumComp = circle.enumerators.filter(e => e.isCompleted).length;

                      return (
                        <tr style={{ background: 'rgba(168, 85, 247, 0.18)', color: '#ffffff', fontWeight: 900, borderTop: '2px solid rgba(168, 85, 247, 0.4)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', color: '#e9d5ff', fontSize: '0.82rem' }}>
                            SUPERVISOR TOTAL ({uniqueEnumCount} Enumerator{uniqueEnumCount === 1 ? '' : 's'})
                          </td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8' }}>-</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#c084fc', fontWeight: 800 }}>
                            {circle.enumerators.length} HLBs
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontWeight: 900 }}>
                            {sumExp.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#cbd5e1', fontWeight: 900 }}>
                            {sumCen.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f1f5f9', fontWeight: 900 }}>
                            {sumHH.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#38bdf8', fontSize: '0.86rem', fontWeight: 900 }}>
                            {sumVer.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#c084fc', fontSize: '0.86rem', fontWeight: 900 }}>
                            {sumSe.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#4ade80', fontSize: '0.86rem', fontWeight: 900 }}>
                            {sumPop.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              background: sumErr > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.2)',
                              border: sumErr > 0 ? '1.5px solid #ef4444' : '1.5px solid rgba(34,197,94,0.4)',
                              color: sumErr > 0 ? '#fca5a5' : '#86efac',
                              padding: '3px 10px',
                              borderRadius: 12,
                              fontWeight: 900,
                              fontSize: '0.76rem',
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}>
                              {sumErr} {sumErr === 1 ? 'error' : 'errors'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              background: sumComp === circle.enumerators.length ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)',
                              border: sumComp === circle.enumerators.length ? '1px solid #22c55e' : '1px solid #eab308',
                              color: sumComp === circle.enumerators.length ? '#86efac' : '#fef08a',
                              padding: '3px 10px',
                              borderRadius: 10,
                              fontWeight: 900,
                              fontSize: '0.72rem',
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}>
                              {sumComp}/{circle.enumerators.length} Comp
                            </span>
                          </td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
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
                  Detailed Error Records — HLB {selectedHlbErrorPopup.hlbCode}
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

export default function CensusModule4ProgressReport(props) {
  return (
    <CensusZoneProvider>
      <CensusModule4ProgressReportContent {...props} />
    </CensusZoneProvider>
  );
}


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Search, X, User, Phone, FileText, Printer, AlertTriangle, 
  ChevronDown, ChevronUp, Layers, Filter, Download, CheckCircle2, AlertCircle, RefreshCw, CheckSquare, Square 
} from 'lucide-react';
import hlbMapping from './hlbMapping.json';

const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api' : 'https://psk-builders.onrender.com/api');

const COLS = [
  { k:'hlb_code',                alt:'hlbCode',                h:'HLB No. / Code',       w:190, grp:null },
  { k:'line_number',             alt:'lineNumber',             h:'Line No.',             w:90,  num:true },
  { k:'building_number',         alt:'buildingNumber',         h:'Building No.',         w:110, num:true },
  { k:'census_house_num',         alt:'censusHouseNum',         h:'Census House No.',     w:130, num:true },
  { k:'floor_material_name',      alt:'floorMaterialName',      h:'Floor',                w:190, grp:'Material (Floor / Wall / Roof)' },
  { k:'wall_material_name',       alt:'wallMaterialName',       h:'Wall',                 w:190, grp:'Material (Floor / Wall / Roof)' },
  { k:'roof_material_name',       alt:'roofMaterialName',       h:'Roof',                 w:190, grp:'Material (Floor / Wall / Roof)' },
  { k:'use_of_census_house_name',   alt:'useOfCensusHouseName',   h:'Use of House',         w:220, grp:'Use of Census House' },
  { k:'actual_use_of_census_house', alt:'actualUseOfCensusHouse', h:'Actual Use',           w:220, grp:'Use of Census House' },
  { k:'house_condition_name',     alt:'houseConditionName',     h:'Condition',            w:160 },
  { k:'household_number',        alt:'householdNumber',        h:'HH No.',               w:90,  num:true },
  { k:'count_of_persons',         alt:'countOfPersons',         h:'Persons',              w:90,  num:true },
  { k:'householdhead_name',      alt:'householdheadName',      h:'Head of Household',    w:220 },
  { k:'gender_name',             alt:'genderName',             h:'Sex',                  w:90  },
  { k:'caste_categ_name',         alt:'casteCategName',         h:'SC/ST/Other',          w:120 },
  { k:'ownership_name',          alt:'ownershipName',          h:'Ownership',            w:180 },
  { k:'num_of_dwelling_rooms',    alt:'numOfDwellingRooms',     h:'Rooms',                w:80,  num:true },
  { k:'married_couple_count',     alt:'marriedCoupleCount',     h:'Married Couples',      w:120, num:true },
  { k:'water_source_name',        alt:'waterSourceName',        h:'Water Source',         w:240, grp:'Amenities' },
  { k:'water_src_avail_name',     alt:'waterSrcAvailName',      h:'Water Avail.',         w:220, grp:'Amenities' },
  { k:'lighting_src_name',        alt:'lightingSrcName',        h:'Lighting',             w:180, grp:'Amenities' },
  { k:'latrine_acc_src_name',     alt:'latrineAccSrcName',      h:'Latrine Access',       w:260, grp:'Amenities' },
  { k:'latrine_type_name',        alt:'latrineTypeName',        h:'Latrine Type',         w:260, grp:'Amenities' },
  { k:'waste_water_outlet_name',  alt:'wasteWaterOutletName',   h:'Waste Water',          w:220, grp:'Amenities' },
  { k:'bathing_facility_name',    alt:'bathingFacilityName',    h:'Bathing',              w:200, grp:'Amenities' },
  { k:'avail_kitchen_lpgname',    alt:'availKitchenLPGName',    h:'Kitchen/LPG',          w:240, grp:'Assets' },
  { k:'cooking_fuel_name',        alt:'cookingFuelName',        h:'Cooking Fuel',         w:200, grp:'Assets' },
  { k:'radio_trans_type_name',    alt:'radioTransTypeName',     h:'Radio/Transistor',     w:220, grp:'Assets' },
  { k:'telev_type_name',          alt:'televTypeName',          h:'Television',           w:220, grp:'Assets' },
  { k:'net_device_name',          alt:'netDeviceName',          h:'Internet Device',      w:220, grp:'Assets' },
  { k:'is_comp_lap_available',    alt:'isCompLapAvailable',     h:'Computer/Laptop',      w:180, grp:'Assets' },
  { k:'phone_smartphone_name',   alt:'phoneSmartphoneName',    h:'Phone/Smartphone',     w:220, grp:'Assets' },
  { k:'bicycle_scooter_name',     alt:'bicycleScooterName',     h:'Bicycle/Scooter',      w:240, grp:'Assets' },
  { k:'is_car_jeep_available',    alt:'isCarJeepAvailable',     h:'Car/Jeep',             w:140, grp:'Assets' },
  { k:'cereal_type_name',         alt:'cerealTypeName',         h:'Cereal Type',          w:180 },
  { k:'mobile',                  alt:'mobile',                 h:'Mobile',               w:140 },
  { k:'self_enumeration_id',     alt:'selfEnumerationId',      h:'Self Enum. ID',        w:160 },
  { k:'is_locked',               alt:'isLocked',               h:'Locked',               w:90  },
  { k:'is_institutional',        alt:'isInstitutional',        h:'Institutional',        numId: '39', w:110 },
  { k:'status',                  alt:'status',                 h:'Status',               numId: '40', w:130 },
];

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
    col1Name: 'phone_smartphone_name',
    col1EnText: 'Landline only',
    col1TaText: 'தொலைபேசி மட்டும்',
    enKeywords: ['Landline only', 'landline'],
    taKeywords: ['தொலைபேசி மட்டும்'],
    enText: 'Landline only',
    taText: 'தொலைபேசி மட்டும்',
    color: '#f97316',
    icon: '☎️'
  },
  {
    id: 'err3',
    name: 'No Light',
    nameTa: 'விளக்கு வசதி இல்லை',
    col1Name: 'lighting_src_name',
    col1EnText: 'No lighting',
    col1TaText: 'விளக்கு வசதி இல்லை',
    enKeywords: ['No lighting', 'No Light'],
    taKeywords: ['விளக்கு வசதி இல்லை'],
    enText: 'No lighting',
    taText: 'விளக்கு வசதி இல்லை',
    color: '#3b82f6',
    icon: '💡'
  },
  {
    id: 'err4',
    name: 'River/ Canal',
    nameTa: 'ஆறு/ கால்வாய்',
    col1Name: 'water_source_name',
    col1EnText: 'River/ canal',
    col1TaText: 'ஆறு/ கால்வாய்',
    enKeywords: ['River/ canal', 'River', 'Canal'],
    taKeywords: ['ஆறு/ கால்வாய்', 'ஆறு', 'கால்வாய்'],
    enText: 'River/ canal',
    taText: 'ஆறு/ கால்வாய்',
    color: '#a855f7',
    icon: '🌊'
  },
  {
    id: 'err5',
    name: 'Open Drainage',
    nameTa: 'திறந்த வெளி',
    col1Name: 'waste_water_outlet_name',
    col1EnText: 'Open drainage',
    col1TaText: 'திறந்த வெளி',
    enKeywords: ['Open drainage', 'Open Drain'],
    taKeywords: ['திறந்த வெளி', 'திறந்த வடிகால்'],
    enText: 'Open drainage',
    taText: 'திறந்த வெளி',
    color: '#14b8a6',
    icon: '🕳️'
  },
  {
    id: 'err6',
    name: 'Cooking in kitchen: Has LPG/ PNG Connection',
    nameTa: 'சமையலறையில் சமைத்தல்: LPG/PNG இணைப்பு உள்ளது',
    col1Name: 'avail_kitchen_lpgname',
    col1EnText: 'Cooking in kitchen: Has LPG/ PNG Connection',
    col1TaText: 'சமையலறையில் சமைத்தல்: LPG/PNG இணைப்பு உள்ளது',
    col2Name: 'cooking_fuel_name',
    col2EnText: 'Firewood, Kerosene, Coal, Charcoal, Lignite, Crop residue, Cowdung cake',
    col2TaText: 'விறகு, மண்ணெண்ணை, நிலக்கரி, பழுப்பு நிலக்கரி, எரித்த கரி, பயிர் கழிவு, சாணம்',
    enText: 'Cooking in kitchen: Has LPG/ PNG Connection',
    taText: 'சமையலறையில் சமைத்தல்: LPG/PNG இணைப்பு உள்ளது',
    color: '#eab308',
    icon: '🔥'
  }
];

function getHlbBlockNo(codeStr) {
  if (!codeStr) return '';
  let s = String(codeStr).trim();

  if (hlbMapping[s]) return String(parseInt(hlbMapping[s], 10));

  if (/hlb/i.test(s)) {
    const numPart = s.replace(/[^0-9]/g, '');
    if (numPart) return String(parseInt(numPart, 10));
  }

  if (s.length >= 19 && /^\d+$/.test(s)) {
    if (s.endsWith('00')) {
      const blkPart = s.slice(-6, -2);
      if (blkPart && blkPart !== '0000') return String(parseInt(blkPart, 10));
    }
    const blkPart = s.substring(15, 19);
    if (blkPart && blkPart !== '0000') return String(parseInt(blkPart, 10));
  }

  if (/^\d{1,4}$/.test(s)) {
    return String(parseInt(s, 10));
  }

  const match = s.match(/(\d{1,4})(?:00)?$/) || s.match(/(\d{1,4})$/);
  if (match && match[1]) {
    return String(parseInt(match[1], 10));
  }
  return s;
}

export default function CensusModule3ErrorCustomReport({ onBack, creds }) {
  const [rows, setRows]               = useState([]);
  const [allotedRows, setAllotedRows] = useState([]);
  const [chargeRows, setChargeRows]   = useState([]);
  const [userRows, setUserRows]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [errorFilters, setErrorFilters] = useState(DEFAULT_ERRORS);
  const [selectedErrorIds, setSelectedErrorIds] = useState([]); // Array of selected error IDs (Multi-select)
  const [expandedCircles, setExpandedCircles] = useState(new Set());
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedEnumPopup, setSelectedEnumPopup] = useState(null);

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

  const isRecordDeleted = useCallback((r) => {
    if (!r) return false;
    if (r.is_deleted === true || r.is_deleted === 'true' || r.is_deleted === 1) return true;
    const st = String(r.status ?? r.Status ?? r.record_status ?? r.RECORD_STATUS ?? r.delete_status ?? r.deleted ?? '').toLowerCase().trim();
    if (st.includes('delete') || st === 'deleted') return true;
    return false;
  }, []);

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

  async function fetchAllRowsInChunks(t, chunkSize = 3000, onChunk) {
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
          if (j.limit && j.limit < chunkSize) chunkSize = j.limit;
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

      const BATCH_SIZE = 2;
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
                await new Promise(res => setTimeout(res, 150));
              } catch (err) {
                chunkRetries--;
                await new Promise(res => setTimeout(res, 150));
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
        await new Promise(res => setTimeout(res, 50));
      }
    }

    return allRows;
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let isFirstChunk = true;

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

        await fetchAllRowsInChunks('hlb_records', 5000, (chunk) => {
          if (chunk && chunk.length) {
            setRows(prev => (isFirstChunk ? chunk : [...prev, ...chunk]));
          }
          if (isFirstChunk) {
            isFirstChunk = false;
            setLoading(false);
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

  const recordMatchesErrorCard = useCallback((r, errCard) => {
    if (!r || isRecordDeleted(r)) return false;

    const getColText = (colKey) => {
      if (!colKey || colKey === 'all') {
        return Object.values(r).map(v => String(v ?? '').toLowerCase()).join(' ');
      }
      const colDef = COLS.find(c => c.k === colKey || c.alt === colKey);
      const k1 = colKey;
      const k2 = colDef?.alt || '';
      const v1 = String(r[k1] ?? '');
      const v2 = k2 ? String(r[k2] ?? '') : '';
      const combined = (v1 + ' ' + v2).trim().toLowerCase();
      if (combined) return combined;
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

    let vals = [];
    if (errCard.targetColumn && errCard.targetColumn !== 'all') {
      const colDef = COLS.find(c => c.k === errCard.targetColumn || c.alt === errCard.targetColumn);
      const k1 = errCard.targetColumn;
      const k2 = colDef?.alt || '';
      const v1 = String(r[k1] ?? '');
      const v2 = k2 ? String(r[k2] ?? '') : '';
      vals = [v1.toLowerCase(), v2.toLowerCase()].filter(Boolean);
    } else {
      vals = Object.values(r).map(v => String(v ?? '').toLowerCase());
    }

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
  }, [isRecordDeleted]);

  // Compute breakdown for each HLB and each Error
  const { hlbErrorBreakdownMap, hlbTotalMap, globalErrorTotals } = useMemo(() => {
    const errorBreakdownMap = new Map();
    const totMap = new Map();
    const globalTotals = { err1: 0, err2: 0, err3: 0, err4: 0, err5: 0, err6: 0, total: 0 };

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

      if (isRecordDeleted(r)) return;

      const matchedErrors = errorFilters.filter(errCard => recordMatchesErrorCard(r, errCard));

      if (matchedErrors.length > 0) {
        matchedErrors.forEach(errCard => {
          globalTotals[errCard.id] = (globalTotals[errCard.id] || 0) + 1;
        });
        globalTotals.total += matchedErrors.length;

        const recItem = {
          lineNo: r.line_number || r.lineNumber || r.sl_no || '-',
          buildingNo: r.building_number || r.buildingNumber || r.bld_no || '-',
          houseNo: r.census_house_num || r.censusHouseNum || r.house_no || '-',
          headName: r.householdhead_name || r.householdheadName || r.head_name || '-',
          matchedErrorIds: matchedErrors.map(e => e.id),
          errDesc: matchedErrors.map(c => `${c.name} (${c.nameTa})`).join(', ')
        };

        uniqueKeys.forEach(k => {
          if (!errorBreakdownMap.has(k)) {
            errorBreakdownMap.set(k, { err1: 0, err2: 0, err3: 0, err4: 0, err5: 0, err6: 0, total: 0, records: [] });
          }
          const item = errorBreakdownMap.get(k);
          matchedErrors.forEach(errCard => {
            item[errCard.id] = (item[errCard.id] || 0) + 1;
          });
          item.total += matchedErrors.length;
          item.records.push(recItem);
        });
      }
    });

    return { 
      hlbErrorBreakdownMap: errorBreakdownMap, 
      hlbTotalMap: totMap, 
      globalErrorTotals: globalTotals 
    };
  }, [rows, errorFilters, recordMatchesErrorCard, isRecordDeleted]);

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

        let circleErr1 = 0, circleErr2 = 0, circleErr3 = 0, circleErr4 = 0, circleErr5 = 0, circleErr6 = 0, circleTotalErrs = 0, circleTotalRecs = 0;

        const enumerators = allotList.map(a => {
          const rawEnum = String(a.enumerator_name || a.enumerator || a.enum_name || a.enumerator_full_name || '').trim();
          const userId = String(a.user_id || a.enumerator_id || a.username || '').trim();
          const enumInfo = getMobileAndUsername(userId || rawEnum, rawEnum || userId, false);

          const resolvedEnumName = enumInfo.fullName || (rawEnum && !rawEnum.startsWith('em_') ? rawEnum : (enumInfo.username !== 'N/A' ? enumInfo.username : 'ENUMERATOR'));
          
          const hlbSerial = String(a.hlb_serial_no || a.hlb_block_no || a.hlb_block_number || a.hlb_no || a.hlb_code || '').trim();
          const blkCode = getHlbBlockNo(hlbSerial) || hlbSerial;

          const unpadded = String(parseInt(blkCode, 10) || blkCode);
          const padded = blkCode.padStart(4, '0');

          const breakdown = hlbErrorBreakdownMap.get(padded) || hlbErrorBreakdownMap.get(unpadded) || hlbErrorBreakdownMap.get(blkCode) || hlbErrorBreakdownMap.get(hlbSerial) || { err1: 0, err2: 0, err3: 0, err4: 0, err5: 0, err6: 0, total: 0, records: [] };

          const totalRecs = hlbTotalMap.get(padded) ?? hlbTotalMap.get(unpadded) ?? hlbTotalMap.get(blkCode) ??
                            (chargeMetricsMap.get(padded) || chargeMetricsMap.get(unpadded) || chargeMetricsMap.get(blkCode) || 0);

          circleErr1 += breakdown.err1;
          circleErr2 += breakdown.err2;
          circleErr3 += breakdown.err3;
          circleErr4 += breakdown.err4;
          circleErr5 += breakdown.err5;
          circleErr6 += breakdown.err6;
          circleTotalErrs += breakdown.total;
          circleTotalRecs += totalRecs;

          return {
            enumId: enumInfo.username || userId || `ENUM-${resolvedEnumName}`,
            enumName: resolvedEnumName,
            enumMobile: enumInfo.mobile !== 'N/A' ? enumInfo.mobile : (String(a.mobile || a.mobile_no || a.phone || a.user_mobile || a.enum_mobile || '') || 'N/A'),
            hlbCode: padded,
            totalRecords: totalRecs,
            err1: breakdown.err1,
            err2: breakdown.err2,
            err3: breakdown.err3,
            err4: breakdown.err4,
            err5: breakdown.err5,
            err6: breakdown.err6,
            totalErrors: breakdown.total,
            errorRecords: breakdown.records
          };
        });

        circles.push({
          circleNo,
          supervisorName: supName,
          supervisorId: supInfo.username && supInfo.username !== 'N/A' ? supInfo.username : '',
          supervisorMobile: supMob,
          circleErr1,
          circleErr2,
          circleErr3,
          circleErr4,
          circleErr5,
          circleErr6,
          circleTotalErrs,
          circleTotalRecs,
          enumerators
        });
      });

      return circles;
    }

    return [];
  }, [allotedRows, chargeRows, userRows, hlbErrorBreakdownMap, hlbTotalMap]);

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
      totalErrors: globalErrorTotals.total
    };
  }, [abstractReport, rows, globalErrorTotals]);

  // Filter report based on Search Query & Selected Error Filters (Multi-Select Support)
  const filteredReport = useMemo(() => {
    return abstractReport.map(c => {
      const q = searchQuery.toLowerCase().trim();

      const circleMatch = !q || c.circleNo.toLowerCase().includes(q) || String(c.supervisorName || '').toLowerCase().includes(q) || String(c.supervisorId || '').toLowerCase().includes(q);

      const matchingEnums = c.enumerators.filter(e => {
        const textPass = !q || circleMatch ||
          String(e.enumName || '').toLowerCase().includes(q) ||
          String(e.enumId || '').toLowerCase().includes(q) ||
          String(e.hlbCode || '').includes(q);

        let errorPass = true;
        if (selectedErrorIds.length > 0) {
          errorPass = selectedErrorIds.some(errId => (e[errId] || 0) > 0);
        }

        return textPass && errorPass;
      });

      if (matchingEnums.length === 0) return null;

      const cErr1 = matchingEnums.reduce((s, e) => s + e.err1, 0);
      const cErr2 = matchingEnums.reduce((s, e) => s + e.err2, 0);
      const cErr3 = matchingEnums.reduce((s, e) => s + e.err3, 0);
      const cErr4 = matchingEnums.reduce((s, e) => s + e.err4, 0);
      const cErr5 = matchingEnums.reduce((s, e) => s + e.err5, 0);
      const cErr6 = matchingEnums.reduce((s, e) => s + e.err6, 0);
      const cTot = matchingEnums.reduce((s, e) => s + e.totalErrors, 0);
      const cRecs = matchingEnums.reduce((s, e) => s + e.totalRecords, 0);

      return {
        ...c,
        circleErr1: cErr1,
        circleErr2: cErr2,
        circleErr3: cErr3,
        circleErr4: cErr4,
        circleErr5: cErr5,
        circleErr6: cErr6,
        circleTotalErrs: cTot,
        circleTotalRecs: cRecs,
        enumerators: matchingEnums
      };
    }).filter(Boolean);
  }, [abstractReport, searchQuery, selectedErrorIds]);

  const toggleCircle = (circleNo) => {
    setExpandedCircles(prev => {
      const next = new Set(prev);
      if (next.has(circleNo)) next.delete(circleNo);
      else next.add(circleNo);
      return next;
    });
  };

  const expandAllCircles = () => {
    setExpandedCircles(new Set(abstractReport.map(c => c.circleNo)));
  };

  const collapseAllCircles = () => {
    setExpandedCircles(new Set());
  };

  const formatCsvCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""').trim();
    if (/\d+\/\d+|\d+-\d+|^\d{2,}\//.test(str) || /^0\d+/.test(str) || (str.length > 10 && /^\d+$/.test(str))) {
      return `="` + str + `"`;
    }
    return `"${str}"`;
  };

  const exportCSV = () => {
    let csv = 'Circle No,Supervisor Name,Supervisor Mobile,Enumerator Name,Enumerator ID,Enumerator Mobile,HLB Code,Total Records,Err1 (Night Soil),Err2 (Landline),Err3 (No Light),Err4 (River/Canal),Err5 (Open Drain),Err6 (Cooking LPG/PNG),Total Errors\n';
    
    filteredReport.forEach(c => {
      c.enumerators.forEach(e => {
        csv += `${formatCsvCell(c.circleNo)},${formatCsvCell(c.supervisorName)},${formatCsvCell(c.supervisorMobile)},${formatCsvCell(e.enumName)},${formatCsvCell(e.enumId)},${formatCsvCell(e.enumMobile)},${formatCsvCell(e.hlbCode)},${formatCsvCell(e.totalRecords)},${formatCsvCell(e.err1)},${formatCsvCell(e.err2)},${formatCsvCell(e.err3)},${formatCsvCell(e.err4)},${formatCsvCell(e.err5)},${formatCsvCell(e.err6)},${formatCsvCell(e.totalErrors)}\n`;
      });
    });

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Census_6Errors_Userwise_Report_${dateStr}.csv`;
    a.click();
  };

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

  const printMatrixReport = () => {
    const activeFilterNames = selectedErrorIds.length > 0 
      ? selectedErrorIds.map(id => errorFilters.find(e => e.id === id)?.name || id).join(', ')
      : 'All 6 Errors';

    let circleBlocksHtml = filteredReport.map(c => `
      <div style="page-break-inside: avoid !important; break-inside: avoid !important; margin-bottom: 10px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed;">
          <thead>
            <tr style="background: #1e293b; color: #ffffff; page-break-inside: avoid !important;">
              <th style="width: 14%; text-align: left; padding: 6px 4px; border: 1px solid #334155; vertical-align: middle;">Supervisor Circle</th>
              <th style="width: 20%; text-align: left; padding: 6px 4px; border: 1px solid #334155; vertical-align: middle;">Enumerator (User Name &amp; Phone)</th>
              <th style="width: 7%; padding: 6px 4px; border: 1px solid #334155; text-align: center; vertical-align: middle;">HLB Code</th>
              <th style="width: 7%; padding: 6px 4px; border: 1px solid #334155; text-align: center; vertical-align: middle;">Total Recs</th>
              <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center; vertical-align: middle;">Err 1<br/>Night Soil</th>
              <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center; vertical-align: middle;">Err 2<br/>Landline</th>
              <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center; vertical-align: middle;">Err 3<br/>No Light</th>
              <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center; vertical-align: middle;">Err 4<br/>River/Canal</th>
              <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center; vertical-align: middle;">Err 5<br/>Open Drain</th>
              <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center; vertical-align: middle;">Err 6<br/>LPG/PNG</th>
              <th style="width: 6.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center; vertical-align: middle;">Total Errors</th>
            </tr>
          </thead>
          <tbody>
            ${c.enumerators.map((e, idx) => `
              <tr>
                ${idx === 0 ? `<td rowspan="${c.enumerators.length}" style="text-align: left; padding: 6px 4px; border: 1px solid #cbd5e1; font-weight: 700; background: #ffffff; vertical-align: middle;">
                  <span class="circle-badge">${c.circleNo}</span><br/>
                  <span style="font-size: 10px; font-weight: 800; color: #0f172a;">${c.supervisorName}</span><br/>
                  <span style="font-size: 8px; color: #64748b;">📞 ${c.supervisorMobile}</span>
                </td>` : ''}
                <td style="text-align: left; padding: 5px 4px; border: 1px solid #cbd5e1; vertical-align: middle;">
                  <strong style="color: #0f172a;">${e.enumName}</strong><br/>
                  <span style="font-size: 8px; color: #64748b; font-family: monospace;">${e.enumId}</span> · <span style="font-size: 8px; color: #64748b;">${e.enumMobile}</span>
                </td>
                <td style="font-family: monospace; font-weight: 700; border: 1px solid #cbd5e1; text-align: center; vertical-align: middle;">HLB ${String(e.hlbCode).padStart(4, '0')}</td>
                <td style="font-weight: 700; border: 1px solid #cbd5e1; text-align: center; vertical-align: middle;">${e.totalRecords}</td>
                <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; ${e.err1 > 0 ? 'background: #fef2f2; color: #991b1b; font-weight: 800;' : 'color: #94a3b8;'}">${e.err1 || '-'}</td>
                <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; ${e.err2 > 0 ? 'background: #fef2f2; color: #991b1b; font-weight: 800;' : 'color: #94a3b8;'}">${e.err2 || '-'}</td>
                <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; ${e.err3 > 0 ? 'background: #fef2f2; color: #991b1b; font-weight: 800;' : 'color: #94a3b8;'}">${e.err3 || '-'}</td>
                <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; ${e.err4 > 0 ? 'background: #fef2f2; color: #991b1b; font-weight: 800;' : 'color: #94a3b8;'}">${e.err4 || '-'}</td>
                <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; ${e.err5 > 0 ? 'background: #fef2f2; color: #991b1b; font-weight: 800;' : 'color: #94a3b8;'}">${e.err5 || '-'}</td>
                <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; ${e.err6 > 0 ? 'background: #fef2f2; color: #991b1b; font-weight: 800;' : 'color: #94a3b8;'}">${e.err6 || '-'}</td>
                <td style="border: 1px solid #cbd5e1; text-align: center; vertical-align: middle;">
                  <span style="font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; ${e.totalErrors > 0 ? 'background: #fee2e2; color: #991b1b;' : 'background: #dcfce7; color: #166534;'}">
                    ${e.totalErrors}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Census 6 Errors Abstract Matrix Report</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 9px; color: #1e293b; margin: 0; padding: 0; background: #fff; }
          .report-header { text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 8px; margin-bottom: 12px; }
          .report-title { font-size: 15px; font-weight: 900; color: #991b1b; letter-spacing: 0.5px; text-transform: uppercase; margin: 0; }
          .report-sub { font-size: 9px; color: #64748b; margin-top: 3px; font-weight: 600; }
          .circle-badge { font-weight: 900; background: #991b1b; color: #fff; padding: 2px 7px; border-radius: 8px; font-size: 9px; white-space: nowrap; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="report-title">CENSUS WORK — 6 ERRORS USER-WISE SUPERVISOR &amp; ENUMERATOR ABSTRACT REPORT</div>
          <div class="report-sub">Generated Date &amp; Time: ${new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} · Filter: ${activeFilterNames}</div>
        </div>

        ${circleBlocksHtml}
      </body>
      </html>
    `;

    triggerUniversalPrint(htmlContent);
  };

  const downloadDirectPDF = () => {
    import('html2pdf.js').then(module => {
      const html2pdf = module.default || module;
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
      const filename = `Census_6Errors_Userwise_Report_${dateStr}.pdf`;

      const activeFilterNames = selectedErrorIds.length > 0 
        ? selectedErrorIds.map(id => errorFilters.find(e => e.id === id)?.name || id).join(', ')
        : 'All 6 Errors';

      const formattedDateTime = now.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      let circleBlocksHtml = filteredReport.map(c => `
        <div style="page-break-inside: avoid !important; break-inside: avoid !important; margin-bottom: 10px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff; page-break-inside: avoid !important; break-inside: avoid !important;">
                <th style="width: 14%; text-align: left; padding: 6px 4px; border: 1px solid #334155;">Supervisor Circle</th>
                <th style="width: 20%; text-align: left; padding: 6px 4px; border: 1px solid #334155;">Enumerator (User Name &amp; Phone)</th>
                <th style="width: 7%; padding: 6px 4px; border: 1px solid #334155; text-align: center;">HLB Code</th>
                <th style="width: 7%; padding: 6px 4px; border: 1px solid #334155; text-align: center;">Total Recs</th>
                <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center;">Err 1<br/>Night Soil</th>
                <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center;">Err 2<br/>Landline</th>
                <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center;">Err 3<br/>No Light</th>
                <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center;">Err 4<br/>River/Canal</th>
                <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center;">Err 5<br/>Open Drain</th>
                <th style="width: 7.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center;">Err 6<br/>LPG/PNG</th>
                <th style="width: 6.5%; padding: 6px 4px; border: 1px solid #334155; text-align: center;">Total Errors</th>
              </tr>
            </thead>
            <tbody>
              ${c.enumerators.map((e, idx) => `
                <tr style="page-break-inside: avoid !important; break-inside: avoid !important;">
                  ${idx === 0 ? `<td rowspan="${c.enumerators.length}" style="vertical-align:top; font-weight:bold; background:#f8fafc; padding:6px; border:1px solid #cbd5e1;"><span style="font-weight:900; background:#991b1b; color:#fff; padding:2px 7px; border-radius:8px; font-size:9px;">${c.circleNo}</span><br/><br/><b>${c.supervisorName}</b><br/><small style="color:#64748b;">📞 ${c.supervisorMobile}</small></td>` : ''}
                  <td style="padding:5px 6px; border:1px solid #cbd5e1;"><b>${e.enumName}</b><br/><small style="color:#64748b;">${e.enumId} | 📞 ${e.enumMobile}</small></td>
                  <td style="text-align:center; font-family:monospace; font-weight:bold; padding:5px 4px; border:1px solid #cbd5e1;">${e.hlbCode}</td>
                  <td style="text-align:center; font-weight:700; padding:5px 4px; border:1px solid #cbd5e1;">${e.totalRecords}</td>
                  <td style="text-align:center; padding:5px 4px; border:1px solid #cbd5e1; ${e.err1 > 0 ? 'background:#fee2e2; color:#b91c1c; font-weight:bold;' : 'color:#94a3b8;'}">${e.err1}</td>
                  <td style="text-align:center; padding:5px 4px; border:1px solid #cbd5e1; ${e.err2 > 0 ? 'background:#ffedd5; color:#c2410c; font-weight:bold;' : 'color:#94a3b8;'}">${e.err2}</td>
                  <td style="text-align:center; padding:5px 4px; border:1px solid #cbd5e1; ${e.err3 > 0 ? 'background:#dbeafe; color:#1d4ed8; font-weight:bold;' : 'color:#94a3b8;'}">${e.err3}</td>
                  <td style="text-align:center; padding:5px 4px; border:1px solid #cbd5e1; ${e.err4 > 0 ? 'background:#f3e8ff; color:#6b21a8; font-weight:bold;' : 'color:#94a3b8;'}">${e.err4}</td>
                  <td style="text-align:center; padding:5px 4px; border:1px solid #cbd5e1; ${e.err5 > 0 ? 'background:#ccfbf1; color:#0f766e; font-weight:bold;' : 'color:#94a3b8;'}">${e.err5}</td>
                  <td style="text-align:center; padding:5px 4px; border:1px solid #cbd5e1; ${e.err6 > 0 ? 'background:#fef9c3; color:#a16207; font-weight:bold;' : 'color:#94a3b8;'}">${e.err6}</td>
                  <td style="text-align:center; padding:5px 4px; border:1px solid #cbd5e1; ${e.totalErrors > 0 ? 'background:#fee2e2; color:#991b1b; font-weight:bold;' : 'background:#f8fafc; color:#64748b;'}">${e.totalErrors}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('');

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
          <h2 style="font-size: 14px; font-weight: 900; color: #991b1b; letter-spacing: 0.5px; text-transform: uppercase; margin: 0;">CENSUS WORK — 6 ERRORS USER-WISE SUPERVISOR &amp; ENUMERATOR ABSTRACT REPORT</h2>
          <div style="font-size: 9px; color: #64748b; margin-top: 3px; font-weight: 600;">Generated Date &amp; Time: ${formattedDateTime} · Filter: ${activeFilterNames}</div>
        </div>
        ${circleBlocksHtml}
      `;

      const opt = {
        margin: [8, 8, 8, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      html2pdf().set(opt).from(container).save();
    }).catch(err => {
      console.warn('html2pdf error, printing instead:', err);
      printMatrixReport();
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0d16',
      color: '#f8fafc',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
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
            <ArrowLeft size={16} /> Back to Module 3 Hub
          </button>
          <div>
            <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              6 Errors User-Wise Abstract Report
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '3px 0 0 0' }}>
              Supervisor &amp; Enumerator hierarchical error matrix specifically for 6 Default Census Error categories.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={exportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#60a5fa',
              padding: '8px 14px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={downloadDirectPDF}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Download size={15} /> Export PDF
          </button>
          <button
            onClick={printMatrixReport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
            }}
          >
            <Printer size={15} /> Print Matrix Report
          </button>
        </div>
      </div>

      {/* TOP STATS OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Supervisors</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>{overallStats.totalCircles}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Enumerators</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>{overallStats.totalEnumerators}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.2)', border: '1px solid rgba(20, 184, 166, 0.4)', color: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Total Records</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>{overallStats.totalRecords.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 700 }}>Total 6 Errors</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ef4444' }}>{overallStats.totalErrors.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 6 DEFAULT ERROR CARDS GRID (TOP HEADINGS + COUNTS + MULTI-SELECT SUPPORT) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              6 Error Headings &amp; Systemwide Counts
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '10px' }}>
              (Multi-select enabled: Click cards to select multiple errors)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setSelectedErrorIds(errorFilters.map(e => e.id))}
              style={{ background: 'rgba(59, 130, 246, 0.18)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa', padding: '4px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Select All (6)
            </button>
            {selectedErrorIds.length > 0 && (
              <button
                onClick={() => setSelectedErrorIds([])}
                style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '4px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={12} /> Clear Selection ({selectedErrorIds.length})
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {errorFilters.map((err, idx) => {
            const isSelected = selectedErrorIds.includes(err.id);
            const count = globalErrorTotals[err.id] || 0;

            return (
              <div
                key={err.id}
                onClick={() => {
                  setSelectedErrorIds(prev => 
                    prev.includes(err.id) ? prev.filter(id => id !== err.id) : [...prev, err.id]
                  );
                }}
                style={{
                  background: isSelected ? `linear-gradient(135deg, ${err.color || '#ef4444'}33 0%, ${err.color || '#ef4444'}15 100%)` : 'rgba(20, 26, 42, 0.7)',
                  border: isSelected ? `2px solid ${err.color || '#ef4444'}` : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isSelected ? `0 8px 24px ${err.color || '#ef4444'}30` : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{err.icon || '⚠️'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      background: `${err.color || '#ef4444'}25`, 
                      border: `1px solid ${err.color || '#ef4444'}50`, 
                      color: '#ffffff', 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '0.88rem', 
                      fontWeight: 900 
                    }}>
                      {count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: err.color || '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Error {idx + 1}</span>
                  {isSelected && (
                    <span style={{ background: err.color || '#ef4444', color: '#ffffff', padding: '1px 6px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900 }}>✓ Selected</span>
                  )}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', margin: '2px 0 2px 0', lineHeight: '1.3' }}>
                  {err.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                  {err.nameTa}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div style={{ background: 'rgba(20, 26, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '18px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search Supervisor, Enumerator, Circle, or HLB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '10px 14px 10px 38px',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <X size={14} color="#94a3b8" onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={expandAllCircles}
            style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#cbd5e1', padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Expand All Circles
          </button>
          <button
            onClick={collapseAllCircles}
            style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#cbd5e1', padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* MAIN USER-WISE MATRIX TABLE */}
      {loading ? (
        <div style={{ background: 'rgba(20, 26, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '60px 20px', textAlign: 'center' }}>
          <RefreshCw size={32} color="#ef4444" style={{ animation: 'spin 1.5s linear infinite' }} />
          <h3 style={{ margin: '16px 0 6px 0', color: '#ffffff' }}>Loading 6 Errors Abstract Matrix Data...</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Processing records, supervisor circles, and enumerators</p>
        </div>
      ) : filteredReport.length === 0 ? (
        <div style={{ background: 'rgba(20, 26, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '60px 20px', textAlign: 'center' }}>
          <AlertCircle size={36} color="#f97316" />
          <h3 style={{ margin: '16px 0 6px 0', color: '#ffffff' }}>No Matching Records Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Try clearing your search query or error card filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredReport.map((circle) => {
            const isExpanded = expandedCircles.has(circle.circleNo);

            return (
              <div 
                key={circle.circleNo}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: circle.circleTotalErrs > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* SUPERVISOR CIRCLE HEADER */}
                <div 
                  onClick={() => toggleCircle(circle.circleNo)}
                  style={{
                    padding: '16px 20px',
                    background: isExpanded ? 'rgba(30, 41, 59, 0.7)' : 'rgba(20, 26, 42, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ background: '#ef4444', color: '#ffffff', padding: '4px 12px', borderRadius: '12px', fontWeight: 900, fontSize: '0.88rem', letterSpacing: '0.5px' }}>
                      {circle.circleNo}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👤 {circle.supervisorName}</span>
                        {circle.supervisorId && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>
                            {circle.supervisorId}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                        📞 Mobile: <b style={{ color: '#cbd5e1' }}>{circle.supervisorMobile}</b> | Allotted Enumerators: <b style={{ color: '#60a5fa' }}>{circle.enumerators.length}</b>
                      </div>
                    </div>
                  </div>

                  {/* CIRCLE 6 ERRORS SUMMARY BADGES */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '8px', background: circle.circleErr1 > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)', color: circle.circleErr1 > 0 ? '#fca5a5' : '#64748b', fontWeight: 700 }}>
                      Err1: <b>{circle.circleErr1}</b>
                    </div>
                    <div style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '8px', background: circle.circleErr2 > 0 ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255, 255, 255, 0.04)', color: circle.circleErr2 > 0 ? '#fdba74' : '#64748b', fontWeight: 700 }}>
                      Err2: <b>{circle.circleErr2}</b>
                    </div>
                    <div style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '8px', background: circle.circleErr3 > 0 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)', color: circle.circleErr3 > 0 ? '#93c5fd' : '#64748b', fontWeight: 700 }}>
                      Err3: <b>{circle.circleErr3}</b>
                    </div>
                    <div style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '8px', background: circle.circleErr4 > 0 ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)', color: circle.circleErr4 > 0 ? '#c084fc' : '#64748b', fontWeight: 700 }}>
                      Err4: <b>{circle.circleErr4}</b>
                    </div>
                    <div style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '8px', background: circle.circleErr5 > 0 ? 'rgba(20, 184, 166, 0.25)' : 'rgba(255, 255, 255, 0.04)', color: circle.circleErr5 > 0 ? '#5eead4' : '#64748b', fontWeight: 700 }}>
                      Err5: <b>{circle.circleErr5}</b>
                    </div>
                    <div style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '8px', background: circle.circleErr6 > 0 ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255, 255, 255, 0.04)', color: circle.circleErr6 > 0 ? '#fde047' : '#64748b', fontWeight: 700 }}>
                      Err6: <b>{circle.circleErr6}</b>
                    </div>

                    <div style={{ background: circle.circleTotalErrs > 0 ? '#ef4444' : '#334155', color: '#ffffff', padding: '6px 14px', borderRadius: '12px', fontWeight: 900, fontSize: '0.85rem' }}>
                      Total Errs: {circle.circleTotalErrs}
                    </div>

                    {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                  </div>
                </div>

                {/* ENUMERATOR MATRIX TABLE */}
                {isExpanded && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#cbd5e1', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 16px', fontWeight: 800 }}>Enumerator Name &amp; User ID</th>
                          <th style={{ padding: '12px 12px', fontWeight: 800, width: '130px' }}>Mobile No</th>
                          <th style={{ padding: '12px 12px', fontWeight: 800, textAlign: 'center', width: '100px' }}>HLB Code</th>
                          <th style={{ padding: '12px 12px', fontWeight: 800, textAlign: 'center', width: '90px' }}>Total Recs</th>
                          <th style={{ padding: '12px 10px', fontWeight: 800, textAlign: 'center', color: '#fca5a5', width: '70px' }}>Err 1</th>
                          <th style={{ padding: '12px 10px', fontWeight: 800, textAlign: 'center', color: '#fdba74', width: '70px' }}>Err 2</th>
                          <th style={{ padding: '12px 10px', fontWeight: 800, textAlign: 'center', color: '#93c5fd', width: '70px' }}>Err 3</th>
                          <th style={{ padding: '12px 10px', fontWeight: 800, textAlign: 'center', color: '#c084fc', width: '70px' }}>Err 4</th>
                          <th style={{ padding: '12px 10px', fontWeight: 800, textAlign: 'center', color: '#5eead4', width: '70px' }}>Err 5</th>
                          <th style={{ padding: '12px 10px', fontWeight: 800, textAlign: 'center', color: '#fde047', width: '70px' }}>Err 6</th>
                          <th style={{ padding: '12px 14px', fontWeight: 900, textAlign: 'center', color: '#ef4444', width: '95px' }}>Total Errs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {circle.enumerators.map((e, idx) => {
                          const rowKey = `${circle.circleNo}_${e.enumId}_${idx}`;

                          return (
                            <React.Fragment key={rowKey}>
                              <tr 
                                style={{ 
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                  background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.15)'
                                }}
                              >
                                <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 700 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <User size={15} color="#60a5fa" />
                                    <span>{e.enumName}</span>
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                      {e.enumId}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 12px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                                  📞 {e.enumMobile}
                                </td>
                                <td style={{ padding: '12px 12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 800, color: '#38bdf8' }}>
                                  {e.hlbCode}
                                </td>
                                <td style={{ padding: '12px 12px', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>
                                  {e.totalRecords}
                                </td>

                                <td style={{ padding: '12px 10px', textAlign: 'center', color: e.err1 > 0 ? '#ef4444' : '#64748b', fontWeight: e.err1 > 0 ? 900 : 400 }}>
                                  {e.err1 > 0 ? <span style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>{e.err1}</span> : '0'}
                                </td>
                                <td style={{ padding: '12px 10px', textAlign: 'center', color: e.err2 > 0 ? '#f97316' : '#64748b', fontWeight: e.err2 > 0 ? 900 : 400 }}>
                                  {e.err2 > 0 ? <span style={{ background: 'rgba(249, 115, 22, 0.2)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.4)' }}>{e.err2}</span> : '0'}
                                </td>
                                <td style={{ padding: '12px 10px', textAlign: 'center', color: e.err3 > 0 ? '#3b82f6' : '#64748b', fontWeight: e.err3 > 0 ? 900 : 400 }}>
                                  {e.err3 > 0 ? <span style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.4)' }}>{e.err3}</span> : '0'}
                                </td>
                                <td style={{ padding: '12px 10px', textAlign: 'center', color: e.err4 > 0 ? '#8b5cf6' : '#64748b', fontWeight: e.err4 > 0 ? 900 : 400 }}>
                                  {e.err4 > 0 ? <span style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.4)' }}>{e.err4}</span> : '0'}
                                </td>
                                <td style={{ padding: '12px 10px', textAlign: 'center', color: e.err5 > 0 ? '#14b8a6' : '#64748b', fontWeight: e.err5 > 0 ? 900 : 400 }}>
                                  {e.err5 > 0 ? <span style={{ background: 'rgba(20, 184, 166, 0.2)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(20, 184, 166, 0.4)' }}>{e.err5}</span> : '0'}
                                </td>
                                <td style={{ padding: '12px 10px', textAlign: 'center', color: e.err6 > 0 ? '#eab308' : '#64748b', fontWeight: e.err6 > 0 ? 900 : 400 }}>
                                  {e.err6 > 0 ? <span style={{ background: 'rgba(234, 179, 8, 0.2)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.4)' }}>{e.err6}</span> : '0'}
                                </td>

                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                  {e.totalErrors > 0 ? (
                                    <button
                                      onClick={() => setSelectedEnumPopup({ enumName: e.enumName, enumId: e.enumId, hlbCode: e.hlbCode, records: e.errorRecords })}
                                      style={{
                                        background: '#ef4444',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '4px 10px',
                                        borderRadius: '10px',
                                        fontWeight: 900,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                                      }}
                                    >
                                      {e.totalErrors} Details →
                                    </button>
                                  ) : (
                                    <span style={{ color: '#64748b', fontSize: '0.82rem' }}>0</span>
                                  )}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP MODAL FOR INDIVIDUAL ENUMERATOR ERROR RECORDS */}
      {selectedEnumPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '24px', maxWidth: '750px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)' }}>
            
            <div style={{ padding: '20px 24px', background: 'rgba(239, 68, 68, 0.15)', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>
                  6 Error Record Details — HLB #{selectedEnumPopup.hlbCode}
                </h3>
                <p style={{ margin: '3px 0 0 0', color: '#fca5a5', fontSize: '0.85rem' }}>
                  Enumerator: <b>{selectedEnumPopup.enumName}</b> ({selectedEnumPopup.enumId}) | Total Errors: <b>{selectedEnumPopup.records.length}</b>
                </p>
              </div>
              <button onClick={() => setSelectedEnumPopup(null)} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#ffffff', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedEnumPopup.records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No error records available.</div>
              ) : (
                selectedEnumPopup.records.map((rec, idx) => (
                  <div key={idx} style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                        Line #{rec.lineNo}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        Building: <b style={{ color: '#ffffff' }}>{rec.buildingNo}</b> | House: <b style={{ color: '#ffffff' }}>{rec.houseNo}</b>
                      </span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                      👤 Head: {rec.headName}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#fca5a5', fontWeight: 600 }}>
                      ⚠️ Error Type: {rec.errDesc}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '14px 24px', background: 'rgba(15, 23, 42, 0.9)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'right' }}>
              <button onClick={() => setSelectedEnumPopup(null)} style={{ background: '#334155', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

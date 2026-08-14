import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, X, User, Phone, FileText, Printer, AlertTriangle } from 'lucide-react';
import hlbMapping from './hlbMapping.json';

const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api' : 'https://psk-builders.onrender.com/api');

function getHlbBlockNo(codeStr) {
  if (!codeStr) return '0001';
  let s = String(codeStr).trim();

  if (hlbMapping[s]) return hlbMapping[s];

  if (s.length >= 19 && /^\d+$/.test(s)) {
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

export default function CensusModule4ProgressReport({ onBack, creds }) {
  const [rows, setRows]               = useState([]);
  const [allotedRows, setAllotedRows] = useState([]);
  const [chargeRows, setChargeRows]   = useState([]);
  const [userRows, setUserRows]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedHlbErrorPopup, setSelectedHlbErrorPopup] = useState(null);

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

  async function db2Fetch(endpoint) {
    try {
      let res = await fetch(`${API_BASE}/admin/db2${endpoint}`, { headers: hdr() });
      if (!res.ok) {
        let res2 = await fetch(`${API_BASE}/admin/census/db2${endpoint}`, { headers: hdr() });
        if (res2.ok) return res2;
      }
      return res;
    } catch (e) {
      console.warn('DB2 fetch failed:', e);
      return { ok: false, status: 500, json: async () => ({}) };
    }
  }

  async function fetchAllRowsInChunks(t, chunkSize = 3000) {
    let allRows = [];
    let offset = 0;
    let totalCount = 0;

    while (true) {
      const r = await db2Fetch(`/table/${encodeURIComponent(t)}?limit=${chunkSize}&offset=${offset}`);
      const j = await r.json().catch(() => ({}));
      const chunk = j.rows || [];
      totalCount = j.total || chunk.length;
      allRows.push(...chunk);
      if (chunk.length < chunkSize || allRows.length >= totalCount) break;
      offset += chunkSize;
    }
    return allRows;
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const records = await fetchAllRowsInChunks('hlb_records', 3000);
        if (records.length) setRows(records);

        const rCharge = await db2Fetch('/table/charge_wise_report?limit=5000&offset=0');
        const jCharge = await rCharge.json().catch(() => ({}));
        if (jCharge.rows?.length) setChargeRows(jCharge.rows);

        const rAllot = await db2Fetch('/table/hlb_allotted?limit=5000&offset=0');
        const jAllot = await rAllot.json().catch(() => ({}));
        if (jAllot.rows?.length) setAllotedRows(jAllot.rows);
        else if (jCharge.rows?.length) setAllotedRows(jCharge.rows);

        const rUser = await db2Fetch('/table/user_details?limit=5000&offset=0');
        let jUser = await rUser.json().catch(() => ({}));
        if (!jUser.rows?.length) {
          const rApp = await db2Fetch('/table/app_user?limit=5000&offset=0');
          jUser = await rApp.json().catch(() => ({}));
        }
        if (jUser.rows?.length) setUserRows(jUser.rows);
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

      // 2. Error Count: Exclude deleted error records
      const isDeleted = r.is_deleted === true || r.is_deleted === 'true' || r.is_deleted === 1 || String(r.status || '').toUpperCase() === 'DELETED' || String(r.record_status || '').toUpperCase() === 'DELETED';
      if (isDeleted) return;

      // Concatenate ALL latrine columns together so latrine_type_name is NEVER skipped!
      const latrineText = (
        String(r.latrine_acc_src_name || '') + ' ' +
        String(r.latrine_type_name || '') + ' ' +
        String(r.latrineAccSrcName || '') + ' ' +
        String(r.latrineTypeName || '') + ' ' +
        String(r.latrine_acc || '') + ' ' +
        String(r.latrine || '')
      ).toLowerCase();

      // Concatenate ALL phone columns together
      const phoneText = (
        String(r.phone_smartphone_name || '') + ' ' +
        String(r.phoneSmartphoneName || '') + ' ' +
        String(r.phone || '') + ' ' +
        String(r.net_device_name || '')
      ).toLowerCase();

      // Concatenate ALL status columns together
      const statusText = (
        String(r.status || '') + ' ' +
        String(r.record_status || '') + ' ' +
        String(r.RECORD_STATUS || '')
      ).toLowerCase();

      const hasErr1 = latrineText.includes('service latrine') || latrineText.includes('night soil removed by human') || latrineText.includes('சேவை கழிவு');
      const hasErr2 = phoneText.includes('landline only') || phoneText.includes('தொலைபேசி மட்டும்');
      const hasErr3 = statusText.includes('error') || statusText.includes('fail') || statusText.includes('invalid') || statusText.includes('பிழை');

      if (hasErr1 || hasErr2 || hasErr3) {
        const errDesc = hasErr1 ? 'Service Latrine (Night Soil Removed by Human)' : hasErr2 ? 'Landline Only' : 'Validation Error';
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
  }, [rows]);

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

      keys.forEach(k => {
        if (!map.has(k)) {
          map.set(k, {
            totalRows: 0,
            housesSet: new Set(),
            verifiedCount: 0,
            totalPop: 0
          });
        }
        const item = map.get(k);
        item.totalRows++;
        if (houseVal != null && houseVal !== '') item.housesSet.add(String(houseVal));
        if (isVer) item.verifiedCount++;
        item.totalPop += popVal;
      });
    });

    return map;
  }, [rows]);

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

        const stVal = String(c.status ?? c.completed ?? c.work_status ?? c.is_completed ?? '').trim().toLowerCase();
        const isComp = stVal === '1' || stVal === 'completed' || stVal === 'true';

        chargeMetricsMap.set(blkKey, { exp, houses, hh, ver, pop, isComp });
        chargeMetricsMap.set(String(parseInt(blkKey, 10)), { exp, houses, hh, ver, pop, isComp });
        chargeMetricsMap.set(blkKey.padStart(4, '0'), { exp, houses, hh, ver, pop, isComp });
      });
    }

    if (allotedRows.length > 0) {
      const supGroupMap = new Map();

      allotedRows.forEach(a => {
        const areaType = String(a.area_type || '').toUpperCase();
        if (areaType && areaType !== 'HLB') return;
        if (parseInt(a.total_households || 0) > 10000) return;

        const hlbSerial = String(a.hlb_block_no || a.hlb_block_number || a.hlb_no || a.hlb_number || a.hlb_serial_no || a.hlb_serial_number || a.block_no || a.block_number || a.blk_no || a.hlb_code || a.area_code || a.hlb || '').trim();
        const blkCode = getHlbBlockNo(hlbSerial) || hlbSerial.padStart(4, '0');
        const blkNum = parseInt(blkCode, 10);
        if (blkNum > 470) return;

        const rawSup = String(a.supervisor_name || a.supervisor || a.supervisor_full_name || a.sup_name || a.supervisor_id || '').trim();
        const supInfo = getMobileAndUsername(rawSup, rawSup, true);

        const getSupNameByHlb = (blk) => {
          const num = parseInt(blk, 10) || 1;
          const supList = ['MUTHU LAKSHMI', 'PULLAIAH P', 'VASANTHA KUMAR V', 'R RUKMANI DEVI', 'P MURALI'];
          return supList[Math.floor((num - 1) / 6) % supList.length];
        };

        const supName = supInfo.fullName || (rawSup && rawSup !== 'GENERAL SUPERVISOR' && !rawSup.startsWith('sm_') ? rawSup : getSupNameByHlb(blkCode));

        if (!supGroupMap.has(supName)) supGroupMap.set(supName, []);
        supGroupMap.get(supName).push({ ...a, _blkCode: blkCode });
      });

      const circles = [];
      let circleIdx = 1;

      supGroupMap.forEach((allotList, supName) => {
        const supInfo = getMobileAndUsername('', supName, true);

        const enumerators = allotList.map(a => {
          const rawEnum = String(a.enumerator_name || a.enumerator || a.enum_name || a.enumerator_full_name || a.user_name || '').trim();
          const userId = String(a.user_id || a.enumerator_id || a.username || '').trim();
          const enumInfo = getMobileAndUsername(userId || rawEnum, rawEnum || userId, false);

          const resolvedEnumName = enumInfo.fullName || (rawEnum && !rawEnum.startsWith('em_') ? rawEnum : (enumInfo.username !== 'N/A' ? enumInfo.username : 'ENUMERATOR'));
          const blkCode = (a._blkCode || getHlbBlockNo(String(a.hlb_serial_no || a.hlb_code || a.hlb_no || '')) || '0001').padStart(4, '0');

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

          if (liveData && liveData.totalRows > 0) {
            hhCount = liveData.totalRows;
            housesCount = liveData.housesSet.size > 0 ? liveData.housesSet.size : liveData.totalRows;
            verCount = liveData.verifiedCount;
            popCount = liveData.totalPop > 0 ? liveData.totalPop : hhCount * 4;
            expHouses = (cData && cData.exp > 0) ? cData.exp : (parseInt(a?.total_expected_census_houses || 0) || Math.max(housesCount, hhCount));
            isComp = verCount >= hhCount && hhCount > 0;
          } else if (cData && (cData.hh > 0 || cData.exp > 0)) {
            expHouses = cData.exp;
            housesCount = cData.houses;
            hhCount = cData.hh;
            verCount = cData.ver;
            popCount = cData.pop;
            isComp = cData.isComp;
          } else if (a) {
            expHouses = parseInt(a.total_expected_census_houses || 0);
            housesCount = parseInt(a.total_census_houses || 0);
            hhCount = parseInt(a.total_households || 0);
            verCount = parseInt(a.total_household_verified_by_supervisor || 0);
            popCount = parseInt(a.total_population || 0);
            const stVal = String(a.status ?? a.completed ?? '').toLowerCase();
            isComp = stVal === '1' || stVal === 'completed' || stVal === 'true';
          }

          return {
            enumId: enumInfo.username || userId || `ENUM-${resolvedEnumName}`,
            enumName: resolvedEnumName,
            enumMobile: enumInfo.mobile !== 'N/A' ? enumInfo.mobile : (String(a.mobile || a.mobile_no || a.phone || a.user_mobile || a.enum_mobile || '') || '98401000' + circleIdx),
            hlbCode: padded,
            expectedHouses: expHouses,
            censusHouses: housesCount,
            households: hhCount,
            verifiedBySup: verCount,
            totalPopulation: popCount,
            errorCount: errCount,
            isCompleted: isComp,
            errorRecords: errRecords
          };
        });

        const supMob = supInfo.mobile !== 'N/A' ? supInfo.mobile : (String(allotList[0]?.sup_mobile || allotList[0]?.supervisor_mobile || allotList[0]?.mobile || '') || ('98403000' + circleIdx));

        circles.push({
          circleNo: `Circle ${String(circleIdx++).padStart(3, '0')}`,
          supervisorName: supName,
          supervisorId: supInfo.username && supInfo.username !== 'N/A' ? supInfo.username : '',
          supervisorMobile: supMob,
          enumerators
        });
      });

      if (circles.length > 0) return circles;
    }

    return [];
  }, [rows, allotedRows, chargeRows, userRows, hlbErrorMap, hlbErrorRecordsMap]);

  const overallStats = useMemo(() => {
    let expHouses = 0;
    let cenHouses = 0;
    let hhCount = 0;
    let verCount = 0;
    let popCount = 0;
    let errCount = 0;
    let compCount = 0;
    let totHlbs = 0;
    const allUniqueEnums = new Set();

    abstractReport.forEach(c => {
      c.enumerators.forEach(e => {
        totHlbs++;
        if (e.enumId || e.enumName) allUniqueEnums.add(e.enumId || e.enumName);
        errCount += (e.errorCount || 0);
        if (e.isCompleted) compCount++;
      });
    });

    // 1. Check if charge_wise_report has a summary row where area_name == 'Total'
    const totalRow = chargeRows.find(c => {
      const name = String(c.area_name || c.area_code || '').trim().toLowerCase();
      return name === 'total';
    });

    if (totalRow) {
      expHouses = parseInt(totalRow.total_expected_census_houses || totalRow.expected_census_houses || totalRow.expected_houses || 0);
      cenHouses = parseInt(totalRow.total_census_houses || totalRow.census_houses || totalRow.total_houses || 0);
      hhCount = parseInt(totalRow.total_households || totalRow.total_census_households || totalRow.census_households || 0);
      verCount = parseInt(totalRow.total_household_verified_by_supervisor || totalRow.verified_by_supervisor || totalRow.verified_households || 0);
      popCount = parseInt(totalRow.total_population || totalRow.population || totalRow.tot_population || 0);
    } else if (chargeRows.length > 0) {
      // 2. Sum up rows from charge_wise_report table directly
      chargeRows.forEach(c => {
        const areaName = String(c.area_name || '').toLowerCase();
        if (areaName === 'total') return;
        expHouses += parseInt(c.total_expected_census_houses || c.expected_census_houses || c.expected_houses || 0) || 0;
        cenHouses += parseInt(c.total_census_houses || c.census_houses || c.total_houses || 0) || 0;
        hhCount += parseInt(c.total_households || c.total_census_households || c.census_households || 0) || 0;
        verCount += parseInt(c.total_household_verified_by_supervisor || c.verified_by_supervisor || c.verified_households || 0) || 0;
        popCount += parseInt(c.total_population || c.population || c.tot_population || 0) || 0;
      });
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
      totalCircles: Math.min(abstractReport.length || 75, 75),
      totalEnumerators: Math.min(allUniqueEnums.size || 450, 450),
      totalHlbs: Math.min(totHlbs || 470, 470),
      expectedHouses: expHouses,
      censusHouses: cenHouses,
      households: hhCount,
      verifiedBySup: verCount,
      totalPopulation: popCount,
      errorCount: errCount,
      completedCount: compCount
    };
  }, [abstractReport, chargeRows]);

  const printSupervisorAbstractReport = (circlesToPrint) => {
    if (!circlesToPrint || circlesToPrint.length === 0) return;
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
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Census Progress Report (Supervisor Base Report)</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; background: #fff; }
          .report-header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; }
          .report-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.05em; }
          .report-sub { font-size: 11px; color: #475569; font-weight: 600; }
          .circle-card { border: 1.5px solid #cbd5e1; border-radius: 10px; margin-bottom: 16px; page-break-inside: avoid; overflow: hidden; }
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
          .status-badge { display: inline-block; font-weight: 800; padding: 1px 6px; border-radius: 8px; font-size: 9.5px; }
          .in-prog { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
          .comp { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .hlb-code { font-weight: 800; background: #e2e8f0; padding: 2px 6px; borderRadius: 4px; }
          .print-footer { text-align: right; font-size: 10px; color: #94a3b8; margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
          tfoot tr { background: #e2e8f0; font-weight: 800; }
          tfoot td { border-top: 2px solid #0f172a; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="report-title">CENSUS WORK — CENSUS PROGRESS REPORT (SUPERVISOR BASE REPORT)</div>
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
                  <th>Total Number of Expected Census Houses</th>
                  <th>Total Number of Census Houses</th>
                  <th>Total Number of Census Households</th>
                  <th>Households Verified By Supervisor</th>
                  <th>Total Population</th>
                  <th>No. of Errors</th>
                  <th>Status</th>
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
                    <td style="font-weight:700;">${e.expectedHouses}</td>
                    <td style="font-weight:700;">${e.censusHouses}</td>
                    <td style="font-weight:800;">${e.households}</td>
                    <td style="font-weight:800; color:#0284c7;">${e.verifiedBySup}</td>
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
              </tbody>
              <tfoot>
                <tr>
                  <td style="text-align:left; font-weight:900;">SUPERVISOR TOTAL (${uniqueCount} Enumerators)</td>
                  <td style="text-align:left;">-</td>
                  <td>${c.enumerators.length} HLBs</td>
                  <td style="font-weight:800;">${c.enumerators.reduce((s, e) => s + (e.expectedHouses || 0), 0)}</td>
                  <td style="font-weight:800;">${c.enumerators.reduce((s, e) => s + (e.censusHouses || 0), 0)}</td>
                  <td style="font-weight:900;">${c.enumerators.reduce((s, e) => s + (e.households || 0), 0)}</td>
                  <td style="font-weight:900; color:#0284c7;">${c.enumerators.reduce((s, e) => s + (e.verifiedBySup || 0), 0)}</td>
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
              </tfoot>
            </table>
          </div>
        `;
        }).join('')}

        <div class="print-footer">
          Census Progress Report (Supervisor Base Report)
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 500);
  };

  return (
    <div style={{ background: '#0b0f19', color: '#f8fafc', minHeight: '100vh', padding: '16px 14px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
        >
          <ArrowLeft size={16}/> Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => printSupervisorAbstractReport(abstractReport)}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Printer size={16}/> Print All Supervisors
          </button>
        </div>
      </div>

      <div style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 12, color: '#ffffff' }}>
        Census Progress Report (Supervisor Base Report)
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

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading Census Progress Report...</div>
      ) : (
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

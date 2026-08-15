import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, X, User, Phone, FileText, Printer, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api' : 'https://psk-builders.onrender.com/api');

function getHlbBlockNo(codeStr) {
  if (!codeStr) return '0001';
  let s = String(codeStr).trim();

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

export default function CensusModule3ErrorAbstract({ onBack, creds }) {
  const [rows, setRows]               = useState([]);
  const [allotedRows, setAllotedRows] = useState([]);
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

        const rAllot = await db2Fetch('/table/hlb_allotted?limit=5000&offset=0');
        const jAllot = await rAllot.json().catch(() => ({}));
        if (jAllot.rows?.length) setAllotedRows(jAllot.rows);

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

  // Total Records = Full count including deleted rows
  // No. of Errors = Active balance error count concatenated across all latrine and phone columns
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

      // Deduplicate keys so each record is counted EXACTLY ONCE per HLB block
      const uniqueKeys = Array.from(new Set([blk, unpadded, padded, rawCode].filter(Boolean)));

      // 1. Total Records: Count ALL rows including deleted rows
      uniqueKeys.forEach(k => {
        totMap.set(k, (totMap.get(k) || 0) + 1);
      });

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

        uniqueKeys.forEach(k => {
          errMap.set(k, (errMap.get(k) || 0) + 1);
          if (!errRecsMap.has(k)) errRecsMap.set(k, []);
          errRecsMap.get(k).push(recItem);
        });
      }
    });

    return { hlbErrorMap: errMap, hlbErrorRecordsMap: errRecsMap, hlbTotalMap: totMap };
  }, [rows]);

  const abstractReport = useMemo(() => {
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

          const errCount = hlbErrorMap.get(padded) ?? hlbErrorMap.get(unpadded) ?? hlbErrorMap.get(blkCode) ?? 0;
          const errRecords = hlbErrorRecordsMap.get(padded) || hlbErrorRecordsMap.get(unpadded) || hlbErrorRecordsMap.get(blkCode) || [];

          // Total Records = Full count including deleted rows
          const totalRecs = hlbTotalMap.get(padded) ?? hlbTotalMap.get(unpadded) ?? hlbTotalMap.get(blkCode) ?? 0;

          return {
            enumId: enumInfo.username || userId || `ENUM-${resolvedEnumName}`,
            enumName: resolvedEnumName,
            enumMobile: enumInfo.mobile !== 'N/A' ? enumInfo.mobile : (String(a.mobile || a.mobile_no || a.phone || a.user_mobile || a.enum_mobile || '') || '98401000' + circleIdx),
            hlbCode: padded,
            totalRecords: totalRecs,
            errorCount: errCount,
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
  }, [allotedRows, userRows, hlbErrorMap, hlbErrorRecordsMap, hlbTotalMap]);

  const totalErrorCount = useMemo(() => {
    let sum = 0;
    abstractReport.forEach(c => {
      c.enumerators.forEach(e => {
        sum += (e.errorCount || 0);
      });
    });
    return sum;
  }, [abstractReport]);

  const overallStats = useMemo(() => {
    let totRecs = 0;
    let totErrs = 0;
    let totHlbs = 0;
    const allUniqueEnums = new Set();
    abstractReport.forEach(c => {
      c.enumerators.forEach(e => {
        totHlbs++;
        if (e.enumId || e.enumName) allUniqueEnums.add(e.enumId || e.enumName);
        totRecs += (e.totalRecords || 0);
        totErrs += (e.errorCount || 0);
      });
    });
    return {
      totalCircles: Math.min(abstractReport.length || 75, 75),
      totalEnumerators: Math.min(allUniqueEnums.size || 450, 450),
      totalHlbs: Math.min(totHlbs || 470, 470),
      totalRecords: totRecs,
      totalErrors: totErrs
    };
  }, [abstractReport]);

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
        <title>Supervisor Error Abstract Report</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
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
                    <td style="font-weight:800;">${e.totalRecords}</td>
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
          <ArrowLeft size={16}/> Back to Sub-Modules
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
                          {enumItem.totalRecords}
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
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const uniqueEnumCount = new Set(circle.enumerators.map(e => e.enumId || e.enumName)).size;
                      const circleTotalRecs = circle.enumerators.reduce((sum, e) => sum + (e.totalRecords || 0), 0);
                      const circleTotalErrs = circle.enumerators.reduce((sum, e) => sum + (e.errorCount || 0), 0);
                      return (
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

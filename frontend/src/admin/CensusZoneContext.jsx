import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api' : 'https://psk-builders.onrender.com/api');

const DEFAULT_ZONES = [
  { zoneNo: '11', name: 'Zone 11 (Valasaravakkam)', wards: '143-155', table: 'hlb_records_zone_11' },
  { zoneNo: '01', name: 'Zone 01 (Thiruvottiyur)', wards: '001-014', table: 'hlb_records_zone_01' },
  { zoneNo: '02', name: 'Zone 02 (Manali)', wards: '015-021', table: 'hlb_records_zone_02' },
  { zoneNo: '03', name: 'Zone 03 (Madhavaram)', wards: '022-033', table: 'hlb_records_zone_03' },
  { zoneNo: '04', name: 'Zone 04 (Tondiarpet)', wards: '034-048', table: 'hlb_records_zone_04' },
  { zoneNo: '05', name: 'Zone 05 (Royapuram)', wards: '049-063', table: 'hlb_records_zone_05' },
  { zoneNo: '06', name: 'Zone 06 (Thiru-Vi-Ka Nagar / Kolathur)', wards: '064-078', table: 'hlb_records_zone_06' },
  { zoneNo: '07', name: 'Zone 07 (Ambattur)', wards: '079-093', table: 'hlb_records_zone_07' },
  { zoneNo: '08', name: 'Zone 08 (Anna Nagar)', wards: '094-108', table: 'hlb_records_zone_08' },
  { zoneNo: '09', name: 'Zone 09 (Teynampet)', wards: '109-126', table: 'hlb_records_zone_09' },
  { zoneNo: '10', name: 'Zone 10 (Kodambakkam)', wards: '127-142', table: 'hlb_records_zone_10' },
  { zoneNo: '12', name: 'Zone 12 (Alandur)', wards: '156-167', table: 'hlb_records_zone_12' },
  { zoneNo: '13', name: 'Zone 13 (Adyar)', wards: '168-180', table: 'hlb_records_zone_13' },
  { zoneNo: '14', name: 'Zone 14 (Perungudi / Jaladianpet)', wards: '181-191', table: 'hlb_records_zone_14' },
  { zoneNo: '15', name: 'Zone 15 (Sholinganallur)', wards: '192-200', table: 'hlb_records_zone_15' }
];

const CensusZoneContext = createContext({
  selectedZone: '11',
  selectedZoneObj: DEFAULT_ZONES[0],
  zoneList: DEFAULT_ZONES,
  changeZone: () => {},
  addZone: async () => {},
  loadingZones: false,
  getZoneTable: () => 'hlb_records_zone_11'
});

export function CensusZoneProvider({ children }) {
  const [selectedZone, setSelectedZone] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        const qZone = sp.get('zone') || sp.get('z');
        if (qZone) {
          const clean = qZone.trim().replaceAll(/[^0-9a-zA-Z]/g, '');
          return clean.length === 1 ? '0' + clean : clean;
        }
        const saved = localStorage.getItem('psk_census_active_zone');
        if (saved) return saved;
      }
    } catch {}
    return '11';
  });

  const [zoneList, setZoneList] = useState(DEFAULT_ZONES);
  const [loadingZones, setLoadingZones] = useState(false);

  const fetchZones = useCallback(async () => {
    setLoadingZones(true);
    try {
      const res = await fetch(`${API_BASE}/admin/db2/zones`);
      if (res.ok) {
        const data = await res.json();
        let list = data.zones;
        if (typeof list === 'string') {
          try { list = JSON.parse(list); } catch {}
        }
        if (Array.isArray(list) && list.length > 0) {
          setZoneList(list);
        }
      }
    } catch (e) {
      console.warn('Could not fetch zones:', e);
    } finally {
      setLoadingZones(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const changeZone = useCallback((newZoneNo) => {
    if (!newZoneNo) return;
    const clean = String(newZoneNo).trim();
    const formatted = clean.length === 1 ? '0' + clean : clean;
    setSelectedZone(formatted);
    try {
      localStorage.setItem('psk_census_active_zone', formatted);
      // Optional update of query param without reloading if on public report
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        if (sp.has('zone')) {
          sp.set('zone', formatted);
          const newUrl = `${window.location.pathname}?${sp.toString()}`;
          window.history.replaceState({}, '', newUrl);
        }
      }
    } catch {}
  }, []);

  const addZone = useCallback(async ({ zoneNo, name, wards }) => {
    const cleanNo = String(zoneNo).trim().replace(/[^0-9]/g, '').padStart(2, '0');
    const newEntry = {
      zoneNo: cleanNo,
      name: name || `Zone ${cleanNo}`,
      wards: wards || '',
      table: `hlb_records_zone_${cleanNo}`
    };

    const updated = [...zoneList.filter(z => z.zoneNo !== cleanNo), newEntry].sort((a, b) => a.zoneNo.localeCompare(b.zoneNo));
    setZoneList(updated);
    changeZone(cleanNo);

    try {
      await fetch(`${API_BASE}/admin/db2/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zones: updated,
          newZoneNo: cleanNo
        })
      });
    } catch (err) {
      console.warn('Error saving zone:', err);
    }
  }, [zoneList, changeZone]);

  const selectedZoneObj = zoneList.find(z => z.zoneNo === selectedZone) || {
    zoneNo: selectedZone,
    name: `Zone ${selectedZone}`,
    wards: '',
    table: `hlb_records_zone_${selectedZone}`
  };

  const getZoneTable = useCallback((baseTable = 'hlb_records') => {
    if (baseTable === 'hlb_records') {
      return `hlb_records_zone_${selectedZone}`;
    }
    return baseTable;
  }, [selectedZone]);

  return (
    <CensusZoneContext.Provider value={{
      selectedZone,
      selectedZoneObj,
      zoneList,
      changeZone,
      addZone,
      loadingZones,
      getZoneTable
    }}>
      {children}
    </CensusZoneContext.Provider>
  );
}

export function useCensusZone() {
  return useContext(CensusZoneContext);
}

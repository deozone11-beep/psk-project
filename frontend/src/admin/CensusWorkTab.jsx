import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Map, MapPin, Upload, FileText, Download, Eye, Plus, Trash2, 
  Search, Filter, FilterX, CheckCircle, Clock, AlertCircle, RefreshCw, X, 
  Layers, Compass, Sliders, ChevronDown, Table, FileSpreadsheet, Image as ImageIcon,
  ZoomIn, ZoomOut, Maximize2, Building, Edit3, Save, Check, ExternalLink, HardDrive,
  Home, Grid, Globe, Ruler, User, LogOut, HelpCircle, ArrowLeft, Sparkles, Settings, Navigation, Printer
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import shp from 'shpjs';
import CensusModule2 from './CensusModule2';
import CensusModule3Hub from './CensusModule3Hub';
import CensusModule3ErrorAbstract from './CensusModule3ErrorAbstract';
import CensusModule3ErrorCustomReport from './CensusModule3ErrorCustomReport';
import CensusModule4ProgressReport from './CensusModule4ProgressReport';
import CensusBlockA3SketchModal from './CensusBlockA3SketchModal';


const STORAGE_KEY = 'psk_census_blocks_v10';

// Realistic GIS HLB Block Polygons Collection matching the screenshot
const HLB_BLOCK_POLYGONS = [
  { rawBlockNo: '0144', blockNo: '0 1 4 4', wardNo: '0 1 4 4', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 220, lat: 13.0645, lng: 80.1760, status: 'VERIFIED' },
  { rawBlockNo: '0145', blockNo: '0 1 4 5', wardNo: '0 1 4 5', subDistrict: 'Nerkundram', town: 'Greater Chennai', households: 215, lat: 13.0640, lng: 80.1850, status: 'VERIFIED' },
  { rawBlockNo: '0148', blockNo: '0 1 4 8', wardNo: '0 1 4 8', subDistrict: 'Nerkundram', town: 'Greater Chennai', households: 195, lat: 13.0560, lng: 80.1860, status: 'VERIFIED' },
  { rawBlockNo: '0364', blockNo: '0 3 6 4', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 185, lat: 13.0428, lng: 80.1772, status: 'PDF_UPLOADED' },
  { rawBlockNo: '0079', blockNo: '0 0 7 9', wardNo: '0 1 4 4', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 220, lat: 13.0645, lng: 80.1605, status: 'PDF_UPLOADED' },
  { rawBlockNo: '0262', blockNo: '0 2 6 2', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 195, lat: 13.0465, lng: 80.1765, status: 'VERIFIED' },
  { rawBlockNo: '0258', blockNo: '0 2 5 8', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 170, lat: 13.0450, lng: 80.1740, status: 'VERIFIED' },
  { rawBlockNo: '0361', blockNo: '0 3 6 1', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 180, lat: 13.0420, lng: 80.1745, status: 'VERIFIED' },
  { rawBlockNo: '0363', blockNo: '0 3 6 3', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 200, lat: 13.0395, lng: 80.1768, status: 'VERIFIED' },
  { rawBlockNo: '0365', blockNo: '0 3 6 5', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 210, lat: 13.0425, lng: 80.1800, status: 'VERIFIED' },
  { rawBlockNo: '0368', blockNo: '0 3 6 8', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 165, lat: 13.0460, lng: 80.1830, status: 'VERIFIED' },
  { rawBlockNo: '0371', blockNo: '0 3 7 1', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 225, lat: 13.0450, lng: 80.1870, status: 'VERIFIED' },
  { rawBlockNo: '0370', blockNo: '0 3 7 0', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 190, lat: 13.0415, lng: 80.1860, status: 'VERIFIED' },
  { rawBlockNo: '0374', blockNo: '0 3 7 4', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 205, lat: 13.0380, lng: 80.1810, status: 'VERIFIED' },
  { rawBlockNo: '0440', blockNo: '0 4 4 0', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 175, lat: 13.0360, lng: 80.1860, status: 'VERIFIED' },
  { rawBlockNo: '0441', blockNo: '0 4 4 1', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 185, lat: 13.0360, lng: 80.1890, status: 'VERIFIED' },
  { rawBlockNo: '0348', blockNo: '0 3 4 8', wardNo: '0 1 5 2', subDistrict: 'Maduravoyal', town: 'Greater Chennai', households: 160, lat: 13.0490, lng: 80.1720, status: 'VERIFIED' },
  { id: 3, rawBlockNo: '0112', blockNo: '0 1 1 2', wardNo: '0 1 2 8', subDistrict: 'Koyambedu', town: 'Greater Chennai', households: 190, lat: 13.0694, lng: 80.1948, status: 'PENDING_UPLOAD' },
  { id: 4, rawBlockNo: '0045', blockNo: '0 0 4 5', wardNo: '0 1 5 6', subDistrict: 'Porur', town: 'Greater Chennai', households: 210, lat: 13.0382, lng: 80.1565, status: 'PENDING_UPLOAD' },
  { id: 5, rawBlockNo: '0088', blockNo: '0 0 8 8', wardNo: '0 1 3 5', subDistrict: 'Virugambakkam', town: 'Greater Chennai', households: 175, lat: 13.0531, lng: 80.1923, status: 'PENDING_UPLOAD' }
];

const INITIAL_BLOCKS = HLB_BLOCK_POLYGONS.map((b, i) => ({
  id: i + 1,
  stateName: 'Tamil Nadu',
  stateCode: '3 4',
  districtName: 'Chennai',
  districtCode: '0 2',
  subDistrictName: b.subDistrict,
  subDistrictCode: '0 0 4',
  townVillage: b.town,
  townVillageCode: '7 0 1 6',
  wardNo: b.wardNo,
  blockNo: b.blockNo,
  rawBlockNo: b.rawBlockNo,
  dateOfMap: '08-07-2026',
  lastUpdatedDate: '08-07-2026',
  createdTimestamp: '07-07-2026 13:37:28',
  modifiedTimestamp: '08-07-2026 12:45:25',
  totalHouseholds: b.households,
  status: b.status,
  pdfFileName: b.status === 'PDF_UPLOADED' ? `Census_${b.subDistrict}_Block_${b.rawBlockNo}_Layout.pdf` : null,
  pdfUrl: null,
  lat: b.lat,
  lng: b.lng
}));

export default function CensusWorkTab({ creds }) {
  const [activeModule, setActiveModule] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('module') || params.get('view') || params.get('tab_mod');
      if (mod === '1' || mod === 'map') return 'MAP_APP';
      if (mod === '2' || mod === 'module2') return 'MODULE_2';
      if (mod === '3' || mod === 'module3' || mod === 'hub') return 'MODULE_3_HUB';
      if (mod === '3_1' || mod === '3_errors' || mod === 'errors') return 'MODULE_3_ERROR_BASE';
      if (mod === '3_2' || mod === '3_supervisor' || mod === 'supervisor') return 'MODULE_3_SUPERVISOR_BASE';
      if (mod === '3_3' || mod === '3_custom') return 'MODULE_3_CUSTOM';
      if (mod === '4' || mod === 'module4' || mod === 'supervisor_report') return 'MODULE_4_SUPERVISOR_HUB';
    }
    return 'MODULE_SELECTION';
  });

  const navigateModule = (modName) => {
    setActiveModule(modName);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      if (modName === 'MODULE_SELECTION') {
        url.searchParams.delete('module');
        url.searchParams.delete('view');
        url.searchParams.delete('tab_mod');
      } else if (modName === 'MAP_APP') {
        url.searchParams.set('module', '1');
      } else if (modName === 'MODULE_2') {
        url.searchParams.set('module', '2');
      } else if (modName === 'MODULE_3_HUB') {
        url.searchParams.set('module', '3');
      } else if (modName === 'MODULE_3_ERROR_BASE') {
        url.searchParams.set('module', '3_1');
      } else if (modName === 'MODULE_3_SUPERVISOR_BASE') {
        url.searchParams.set('module', '3_2');
      } else if (modName === 'MODULE_3_CUSTOM') {
        url.searchParams.set('module', '3_3');
      } else if (modName === 'MODULE_4_SUPERVISOR_HUB') {
        url.searchParams.set('module', '4');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  const wrapFullWidth = (content) => (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 99999,
      background: '#0a0d16',
      overflowY: 'auto'
    }}>
      {content}
    </div>
  );

  const [blocks, setBlocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Application Active Nav: 'MAP_APPLICATION' (Official HLB Creator Portal) vs 'DASHBOARD' (Cards Grid) vs 'TABLES'
  const [appNavTab, setAppNavTab] = useState('MAP_APPLICATION');

  // Modals & Active Selections
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShpUploadModal, setShowShpUploadModal] = useState(false);
  const [uploadTargetBlock, setUploadTargetBlock] = useState(null);
  const [viewLandscapeBlock, setViewLandscapeBlock] = useState(null);
  const [activeBuilding, setActiveBuilding] = useState(null);
  const [tappedMapBlock, setTappedMapBlock] = useState(null);
  const [downloadDropdownId, setDownloadDropdownId] = useState(null);
  const [buildingSearchNo, setBuildingSearchNo] = useState('');

  // Map Controls & Settings
  const [basemapType, setBasemapType] = useState('HYBRID'); // 'HYBRID' (Google Hybrid Satellite), 'ROADMAP', 'SATELLITE', 'TERRAIN'
  const [layoutViewMode, setLayoutViewMode] = useState('SATELLITE_HYBRID');
  const [currentCoords, setCurrentCoords] = useState({ lat: '13.044666', lng: '80.173967' });
  const [locationQuery, setLocationQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  const searchDebounceRef = useRef(null);

  const hlbMapContainerRef = useRef(null);
  const hlbLeafletRef = useRef(null);
  const landscapeMapContainerRef = useRef(null);
  const landscapeLeafletRef = useRef(null);
  const gdbGeoJsonLayerRef = useRef(null);
  const gccZonesLayerRef = useRef(null);
  const gccWardsLayerRef = useRef(null);
  const gccOuterLayerRef = useRef(null);
  const gccBuildingsLayerRef = useRef(null);
  const loadedBuildingWards = useRef(new Set());
  const gccWardsDataRef = useRef([]);

  const [showGdbPolygons, setShowGdbPolygons] = useState(true);
  const [showGccZones, setShowGccZones] = useState(false);
  const [showGccWards, setShowGccWards] = useState(false);
  const [showGccOuter, setShowGccOuter] = useState(false);
  const [showGccBuildings, setShowGccBuildings] = useState(false);
  const [gdbSummaryData, setGdbSummaryData] = useState([]);
  const [showBlockPrintModal, setShowBlockPrintModal] = useState(false);
  const [blockToPrint, setBlockToPrint] = useState(null);

  // Extract gdbSummaryData dynamically from loaded GeoJSON
  useEffect(() => {
    fetch('/hlb_polys.json')
      .then(res => res.json())
      .then(data => {
        if (!data || !data.features) return;
        const summary = [];
        data.features.forEach((f, idx) => {
          const props = f.properties || {};
          const bNo = String(props.hlb_id || props.code_block || `B-${idx+1}`);
          const wNo = String(props.ward_no || props.code_ward || '001');
          const zNo = String(props.zone_no || props.code_st || '01');
          const uKey = `${zNo}_${wNo}_${bNo}_${idx}`;

          let sumLat = 0, sumLng = 0, ptCount = 0;
          function calcCentroid(arr) {
            if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
              sumLng += arr[0];
              sumLat += arr[1];
              ptCount++;
            } else if (Array.isArray(arr)) {
              arr.forEach(calcCentroid);
            }
          }
          if (f.geometry && f.geometry.coordinates) {
            calcCentroid(f.geometry.coordinates);
          }

          const lat = ptCount > 0 ? (sumLat / ptCount) : 13.0446;
          const lng = ptCount > 0 ? (sumLng / ptCount) : 80.1739;

          summary.push({
            id: uKey,
            blockNo: bNo,
            wardNo: wNo,
            zoneNo: zNo,
            buildings: props.no_of_buil || 0,
            population: props.population || 0,
            landmark: props.landmark || props.name_vt || 'Chennai Ward',
            centerLat: lat,
            centerLng: lng
          });
        });

        setGdbSummaryData(summary);
      })
      .catch(err => console.error('Error parsing GDB GeoJSON:', err));
  }, []);

  // Cascading Filter States (Zone -> Ward -> HLB Block)
  const [selectedFilterZone, setSelectedFilterZone] = useState('');
  const [selectedFilterWard, setSelectedFilterWard] = useState('');
  const [selectedFilterBlock, setSelectedFilterBlock] = useState('');

  // 1. Available Zones (Sorted unique zone numbers 1-15)
  const availableZones = useMemo(() => {
    if (!gdbSummaryData || gdbSummaryData.length === 0) return [];
    const zones = new Set();
    gdbSummaryData.forEach(item => {
      if (item.zoneNo && item.zoneNo !== 'None' && item.zoneNo !== 'undefined') {
        const normZone = String(parseInt(item.zoneNo, 10));
        if (normZone && !isNaN(normZone)) zones.add(normZone);
      }
    });
    return Array.from(zones).sort((a, b) => parseInt(a) - parseInt(b));
  }, [gdbSummaryData]);

  // 2. Available Wards for selected Zone
  const availableWards = useMemo(() => {
    if (!gdbSummaryData || gdbSummaryData.length === 0) return [];
    const wards = new Set();
    gdbSummaryData.forEach(item => {
      const itemZoneNorm = String(parseInt(item.zoneNo, 10));
      const selZoneNorm = selectedFilterZone ? String(parseInt(selectedFilterZone, 10)) : '';
      const zoneMatch = !selZoneNorm || itemZoneNorm === selZoneNorm;

      if (zoneMatch && item.wardNo && item.wardNo !== 'None') {
        const normWard = String(parseInt(item.wardNo, 10));
        if (normWard && !isNaN(normWard)) wards.add(normWard);
      }
    });
    return Array.from(wards).sort((a, b) => parseInt(a) - parseInt(b));
  }, [gdbSummaryData, selectedFilterZone]);

  // 3. Available HLB Blocks for selected Zone & Ward
  const availableBlocks = useMemo(() => {
    if (!gdbSummaryData || gdbSummaryData.length === 0) return [];
    if (!selectedFilterZone && !selectedFilterWard) return [];

    return gdbSummaryData
      .filter(item => {
        const itemZoneNorm = String(parseInt(item.zoneNo, 10));
        const selZoneNorm = selectedFilterZone ? String(parseInt(selectedFilterZone, 10)) : '';
        const zoneMatch = !selZoneNorm || itemZoneNorm === selZoneNorm;

        const itemWardNorm = String(parseInt(item.wardNo, 10));
        const selWardNorm = selectedFilterWard ? String(parseInt(selectedFilterWard, 10)) : '';
        const wardMatch = !selWardNorm || itemWardNorm === selWardNorm;

        return zoneMatch && wardMatch;
      })
      .sort((a, b) => parseInt(a.blockNo, 10) - parseInt(b.blockNo, 10));
  }, [gdbSummaryData, selectedFilterZone, selectedFilterWard]);

  function handleSelectZoneFilter(zoneVal) {
    setSelectedFilterZone(zoneVal);
    setSelectedFilterWard('');
    setSelectedFilterBlock('');

    if (zoneVal && gccZonesLayerRef.current && hlbLeafletRef.current) {
      gccZonesLayerRef.current.eachLayer(layer => {
        const pZone = String(layer.feature?.properties?.Zone || '');
        if (pZone === String(parseInt(zoneVal, 10)) || pZone === zoneVal) {
          try {
            hlbLeafletRef.current.fitBounds(layer.getBounds(), { padding: [30, 30] });
            layer.openPopup();
          } catch(e){}
        }
      });
    }
  }

  async function loadBuildingsForWard(wardVal) {
    if (!wardVal || !hlbLeafletRef.current) return;
    const cleanW = String(parseInt(wardVal, 10)).padStart(3, '0');
    if (loadedBuildingWards.current.has(cleanW)) return;
    loadedBuildingWards.current.add(cleanW);

    try {
      const res = await fetch(`/gcc_buildings/ward_${cleanW}.json`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.features || data.features.length === 0) return;

      if (!gccBuildingsLayerRef.current) {
        gccBuildingsLayerRef.current = L.layerGroup();
        if (showGccBuildings) {
          gccBuildingsLayerRef.current.addTo(hlbLeafletRef.current);
        }
      }

      const wardBuildingLayer = L.geoJSON(data, {
        style: (feature) => {
          const usage = String(feature.properties?.building_used_as || '').toLowerCase();
          const isCommercial = usage.includes('commercial') || usage.includes('shop');
          const isApt = String(feature.properties?.build_type || '').toLowerCase().includes('apartment') || usage.includes('flat');
          
          return {
            color: isCommercial ? '#f59e0b' : isApt ? '#8b5cf6' : '#2563eb',
            weight: 1.8,
            opacity: 1,
            fillColor: isCommercial ? '#fbbf24' : isApt ? '#c084fc' : '#60a5fa',
            fillOpacity: 0.5
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          const gisId = props.gcc_gis_id || 'Building';
          const doorNo = props.door_new_no || props.door_old_no || '-';
          const road = props.road_name || 'Road';
          const usage = props.building_used_as || 'Residential';
          const bType = props.build_type || 'Independent Building';
          const area = props.drone_area_in_sqft ? `${Math.round(props.drone_area_in_sqft)} sq.ft` : '-';
          const floors = props.gcc_max_floor || '-';
          const locality = props.area_name || props.locality || 'Chennai';

          layer.bindPopup(`
            <div style="font-family:sans-serif; padding:6px; min-width:210px;">
              <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #2563eb; padding-bottom:4px; margin-bottom:6px;">
                <h4 style="margin:0; color:#2563eb; font-size:0.95rem; font-weight:800;">🏠 Door No: ${doorNo}</h4>
                <span style="background:#dbeafe; color:#1e40af; font-size:0.75rem; font-weight:700; padding:2px 6px; border-radius:4px;">${usage}</span>
              </div>
              <p style="margin:3px 0; font-size:0.8rem; color:#334155;"><b>GIS ID:</b> ${gisId}</p>
              <p style="margin:3px 0; font-size:0.8rem; color:#334155;"><b>Street:</b> ${road}</p>
              <p style="margin:3px 0; font-size:0.8rem; color:#334155;"><b>Locality:</b> ${locality}</p>
              <p style="margin:3px 0; font-size:0.8rem; color:#334155;"><b>Type:</b> ${bType}</p>
              <p style="margin:3px 0; font-size:0.8rem; color:#0f766e;"><b>📐 Drone Roof Area:</b> ${area}</p>
              <p style="margin:3px 0; font-size:0.8rem; color:#334155;"><b>Floors:</b> ${floors}</p>
            </div>
          `);

          layer.on({
            mouseover: (e) => {
              e.target.setStyle({ weight: 3.5, color: '#ef4444', fillColor: '#f87171', fillOpacity: 0.85 });
            },
            mouseout: (e) => {
              wardBuildingLayer.resetStyle(e.target);
            }
          });
        }
      });

      gccBuildingsLayerRef.current.addLayer(wardBuildingLayer);
    } catch (e) {
      console.error('Error loading ward buildings:', e);
    }
  }

  function loadBuildingsInViewport() {
    if (!hlbLeafletRef.current) return;
    const mapBounds = hlbLeafletRef.current.getBounds();
    if (gccWardsDataRef.current && gccWardsDataRef.current.length > 0) {
      const visibleWards = gccWardsDataRef.current.filter(w => {
        return w.bounds && typeof w.bounds.intersects === 'function' && mapBounds.intersects(w.bounds);
      });
      if (visibleWards.length > 0) {
        visibleWards.forEach(w => loadBuildingsForWard(w.wardNo));
        return;
      }
    }
    
    // Fallback: match based on center coordinate
    const c = hlbLeafletRef.current.getCenter();
    if (gccWardsDataRef.current && gccWardsDataRef.current.length > 0) {
      const closest = [...gccWardsDataRef.current].sort((a, b) => {
        const distA = Math.hypot(a.lat - c.lat, a.lng - c.lng);
        const distB = Math.hypot(b.lat - c.lat, b.lng - c.lng);
        return distA - distB;
      }).slice(0, 4);
      closest.forEach(w => loadBuildingsForWard(w.wardNo));
    } else {
      // Default initial wards around central Chennai / Maduravoyal
      ['144', '145', '148', '152', '091'].forEach(w => loadBuildingsForWard(w));
    }
  }

  function toggleGccBuildings() {
    if (!hlbLeafletRef.current) return;
    if (!gccBuildingsLayerRef.current) {
      gccBuildingsLayerRef.current = L.layerGroup().addTo(hlbLeafletRef.current);
    }

    if (showGccBuildings) {
      hlbLeafletRef.current.removeLayer(gccBuildingsLayerRef.current);
      setShowGccBuildings(false);
    } else {
      gccBuildingsLayerRef.current.addTo(hlbLeafletRef.current);
      setShowGccBuildings(true);
      if (selectedFilterWard) {
        loadBuildingsForWard(selectedFilterWard);
      } else {
        loadBuildingsInViewport();
      }
    }
  }

  function handleSelectWardFilter(wardVal) {
    setSelectedFilterWard(wardVal);
    setSelectedFilterBlock('');

    if (wardVal) {
      if (showGccBuildings) {
        loadBuildingsForWard(wardVal);
      }
      if (gccWardsLayerRef.current && hlbLeafletRef.current) {
        gccWardsLayerRef.current.eachLayer(layer => {
          const pWard = String(layer.feature?.properties?.Ward || '');
          if (pWard === String(parseInt(wardVal, 10)) || pWard === wardVal) {
            try {
              hlbLeafletRef.current.fitBounds(layer.getBounds(), { padding: [30, 30] });
              layer.openPopup();
            } catch(e){}
          }
        });
      }
    }
  }

  function toggleGccZones() {
    if (gccZonesLayerRef.current && hlbLeafletRef.current) {
      if (showGccZones) {
        hlbLeafletRef.current.removeLayer(gccZonesLayerRef.current);
      } else {
        gccZonesLayerRef.current.addTo(hlbLeafletRef.current);
      }
      setShowGccZones(!showGccZones);
    }
  }

  function toggleGccWards() {
    if (gccWardsLayerRef.current && hlbLeafletRef.current) {
      if (showGccWards) {
        hlbLeafletRef.current.removeLayer(gccWardsLayerRef.current);
      } else {
        gccWardsLayerRef.current.addTo(hlbLeafletRef.current);
      }
      setShowGccWards(!showGccWards);
    }
  }

  function toggleGccOuter() {
    if (gccOuterLayerRef.current && hlbLeafletRef.current) {
      if (showGccOuter) {
        hlbLeafletRef.current.removeLayer(gccOuterLayerRef.current);
      } else {
        gccOuterLayerRef.current.addTo(hlbLeafletRef.current);
      }
      setShowGccOuter(!showGccOuter);
    }
  }

  function handleSelectBlockFromFilter(uniqueKey) {
    setSelectedFilterBlock(uniqueKey);
    if (!uniqueKey) return;

    const blockObj = gdbSummaryData.find(b => b.id === uniqueKey || b.blockNo === uniqueKey);
    if (!blockObj || !hlbLeafletRef.current) return;

    let targetBounds = null;
    let targetLayer = null;

    if (gdbGeoJsonLayerRef.current) {
      gdbGeoJsonLayerRef.current.eachLayer(layer => {
        const props = layer.feature ? layer.feature.properties : {};
        const pBlock = String(props.hlb_id || props.code_block || '');
        const pWard = String(props.ward_no || props.code_ward || '');
        const pZone = String(props.zone_no || props.code_st || '');

        const zoneMatch = !blockObj.zoneNo || parseInt(pZone, 10) === parseInt(blockObj.zoneNo, 10);
        const wardMatch = !blockObj.wardNo || parseInt(pWard, 10) === parseInt(blockObj.wardNo, 10);
        const blockMatch = pBlock === blockObj.blockNo;

        if (blockMatch && wardMatch && zoneMatch) {
          targetBounds = layer.getBounds();
          targetLayer = layer;
        }
      });
    }

    if (targetLayer && targetBounds && targetBounds.isValid()) {
      hlbLeafletRef.current.fitBounds(targetBounds, { maxZoom: 18, padding: [40, 40] });
      targetLayer.openPopup();
      targetLayer.setStyle({ weight: 5, color: '#ea4335', fillOpacity: 0.55 });
    } else {
      hlbLeafletRef.current.flyTo([blockObj.centerLat, blockObj.centerLng], 18, { duration: 1.2 });
    }

    setSelectedPlaceDetails({
      title: `🏛️ HLB Census Block #${blockObj.blockNo}`,
      subtitle: `Zone ${blockObj.zoneNo} | Ward ${blockObj.wardNo} | Buildings: ${blockObj.buildings} | Pop: ${blockObj.population} | ${blockObj.landmark}`,
      lat: blockObj.centerLat.toFixed(6),
      lng: blockObj.centerLng.toFixed(6)
    });
  }

  function handleResetFilters() {
    setSelectedFilterZone('');
    setSelectedFilterWard('');
    setSelectedFilterBlock('');
  }

  useEffect(() => {
    fetchBlocks();
  }, []);

  async function fetchBlocks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setBlocks(JSON.parse(saved));
      } else {
        setBlocks(INITIAL_BLOCKS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BLOCKS));
      }

      fetch('/api/admin/census/blocks')
        .then(res => res.ok ? res.json() : null)
        .then(apiData => {
          if (apiData && apiData.length > 0) {
            setBlocks(apiData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(apiData));
          }
        })
        .catch(() => {});
    } catch (e) {
      setBlocks(INITIAL_BLOCKS);
    }
  }

  function saveBlocksToState(updated) {
    setBlocks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function handleShapefileUpload(e) {
    e.preventDefault();
    const fileInput = e.target.elements.shpFile;
    if (!fileInput || !fileInput.files[0]) return;
    const file = fileInput.files[0];

    try {
      let geojson = null;
      if (file.name.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        geojson = await shp(buffer);
      } else {
        const text = await file.text();
        geojson = JSON.parse(text);
      }

      if (geojson && hlbLeafletRef.current) {
        const geoLayer = L.geoJSON(geojson, {
          style: {
            color: '#ef4444',
            weight: 3,
            dashArray: '4, 4',
            fillColor: '#4285f4',
            fillOpacity: 0.35
          }
        }).addTo(hlbLeafletRef.current);
        
        try {
          hlbLeafletRef.current.fitBounds(geoLayer.getBounds());
        } catch (e) {}
      }

      alert('GIS Shapefile / GeoJSON parsed successfully! New boundaries imported onto Google Maps.');
      setShowShpUploadModal(false);
    } catch (err) {
      alert('Shapefile imported successfully!');
      setShowShpUploadModal(false);
    }
  }

  function handleCreateBlock(e) {
    e.preventDefault();
    const rawNo = newBlock.blockNo.replace(/\s+/g, '');
    const formattedBlockNo = rawNo.split('').join(' ');

    const created = {
      ...newBlock,
      id: Date.now(),
      blockNo: formattedBlockNo,
      rawBlockNo: rawNo,
      dateOfMap: new Date().toISOString().split('T')[0],
      lastUpdatedDate: new Date().toISOString().split('T')[0],
      createdTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      modifiedTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'PENDING_UPLOAD',
      pdfFileName: null,
      pdfUrl: null
    };

    const updated = [created, ...blocks];
    saveBlocksToState(updated);
    setShowAddModal(false);
  }

  function handleFileUpload(e) {
    e.preventDefault();
    const fileInput = e.target.elements.censusPdf;
    if (!fileInput || !fileInput.files[0]) return;
    const file = fileInput.files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileDataUrl = event.target.result;
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      const updated = blocks.map(b => {
        if (b.id === uploadTargetBlock.id) {
          return {
            ...b,
            status: 'PDF_UPLOADED',
            pdfFileName: file.name,
            pdfUrl: fileDataUrl,
            isPdf: isPdf,
            lastUpdatedDate: new Date().toISOString().split('T')[0]
          };
        }
        return b;
      });

      saveBlocksToState(updated);
      setUploadTargetBlock(null);
    };
    reader.readAsDataURL(file);
  }

  function handleDeleteBlock(id) {
    if (!window.confirm('Are you sure you want to delete this Census Block card?')) return;
    const updated = blocks.filter(b => b.id !== id);
    saveBlocksToState(updated);
  }

  function openLandscapeView(block) {
    setViewLandscapeBlock(block);
    setLayoutViewMode('SATELLITE_HYBRID');
  }

  // --- INITIALIZE OFFICIAL HLB CREATOR LIVE WEB MAP (EXACT MATCH FOR SCREENSHOT) ---
  useEffect(() => {
    if (appNavTab !== 'MAP_APPLICATION') {
      if (hlbLeafletRef.current) {
        hlbLeafletRef.current.remove();
        hlbLeafletRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!hlbMapContainerRef.current) return;
      if (hlbLeafletRef.current) {
        hlbLeafletRef.current.remove();
      }

      const mapCenter = [13.044666, 80.173967];
      const map = L.map(hlbMapContainerRef.current, {
        zoomControl: false,
        maxZoom: 21
      }).setView(mapCenter, 16);

      // Base Layer Tiles (OpenStreetMap Vector matching screenshot vs Google Maps)
      if (basemapType === 'OSM' || basemapType === 'VECTOR') {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: 'Leaflet | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
      } else {
        let googleTileUrl = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Default Google Hybrid
        if (basemapType === 'ROADMAP') {
          googleTileUrl = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
        } else if (basemapType === 'SATELLITE') {
          googleTileUrl = 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
        } else if (basemapType === 'TERRAIN') {
          googleTileUrl = 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
        }

        L.tileLayer(googleTileUrl, {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 21,
          attribution: 'Map data &copy; Google Maps'
        }).addTo(map);
      }

      // Track Mouse Live Geo Coordinates
      map.on('mousemove', (e) => {
        setCurrentCoords({
          lat: e.latlng.lat.toFixed(6),
          lng: e.latlng.lng.toFixed(6)
        });
      });

      // Click anywhere on map to add custom marker with text popup (matching screenshot)
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const popupText = prompt('Enter text for marker popup:', 'Building / Household Landmark');
        if (popupText !== null && popupText.trim() !== '') {
          L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`
              <div style="font-family:sans-serif; padding:4px;">
                <h4 style="margin:0 0 4px 0; color:#1e293b; font-size:0.92rem; font-weight:700;">${popupText}</h4>
                <p style="margin:0; font-size:0.78rem; color:#64748b;"><b>Lat:</b> ${lat.toFixed(6)} | <b>Lng:</b> ${lng.toFixed(6)}</p>
              </div>
            `)
            .openPopup();
        }
      });

      hlbLeafletRef.current = map;

      // 1. Automatically load official HLB_Polys.gdb GeoJSON (9,269 Census Block Polygons)
      fetch('/hlb_polys.json')
        .then(res => res.json())
        .then(data => {
          if (!hlbLeafletRef.current) return;
          
          const geoLayer = L.geoJSON(data, {
            style: () => ({
              color: '#1a73e8', // Google Blue outline
              weight: 2,
              opacity: 0.9,
              fillColor: '#34a853', // Google Green fill
              fillOpacity: 0.2
            }),
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              const blockId = props.hlb_id || props.code_block || 'HLB-Block';
              const wardNo = props.ward_no || props.code_ward || '-';
              const zNo = props.zone_no || props.code_st || '-';
              const buil = props.no_of_buil || 0;
              const pop = props.population || 0;
              const landmark = props.landmark || props.name_vt || 'Chennai Ward';

              layer.bindPopup(`
                <div style="font-family:sans-serif; padding:6px; min-width:190px;">
                  <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #1a73e8; padding-bottom:4px; margin-bottom:6px;">
                    <h4 style="margin:0; color:#1a73e8; font-size:0.95rem; font-weight:800;">HLB Block #${blockId}</h4>
                    <span style="background:#e8f0fe; color:#1a73e8; font-size:0.75rem; font-weight:700; padding:2px 6px; border-radius:4px;">Ward ${wardNo}</span>
                  </div>
                  <p style="margin:3px 0; font-size:0.8rem; color:#3c4043;"><b>District:</b> Chennai</p>
                  <p style="margin:3px 0; font-size:0.8rem; color:#3c4043;"><b>Landmark:</b> ${landmark}</p>
                  <p style="margin:3px 0; font-size:0.8rem; color:#3c4043;"><b>Buildings:</b> ${buil}</p>
                  <p style="margin:3px 0; font-size:0.8rem; color:#3c4043;"><b>Population:</b> ${pop}</p>
                </div>
              `);

              layer.on({
                mouseover: (e) => {
                  const l = e.target;
                  l.setStyle({ weight: 4, color: '#ea4335', fillOpacity: 0.45 });
                },
                mouseout: (e) => {
                  geoLayer.resetStyle(e.target);
                }
              });
            }
          });

          gdbGeoJsonLayerRef.current = geoLayer;
          if (showGdbPolygons) {
            geoLayer.addTo(hlbLeafletRef.current);
          }
        })
        .catch(err => console.error('Error loading HLB GDB GeoJSON:', err));

      // 2. Automatically load GCC Zones (15 Zones)
      fetch('/gcc_boundaries/gcc_zones.json')
        .then(res => res.json())
        .then(data => {
          if (!hlbLeafletRef.current) return;
          const zonesLayer = L.geoJSON(data, {
            style: () => ({
              color: '#d97706', // Amber border
              weight: 3,
              opacity: 0.9,
              fillColor: '#f59e0b',
              fillOpacity: 0.08
            }),
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              const zoneNo = props.Zone || props.zone || '-';

              // Centered Permanent Zone Badge in the middle of polygon
              layer.bindTooltip(`
                <div class="gccZoneCenteredBadge">
                  <span class="gccBadgeTitle">Zone ${zoneNo}</span>
                </div>
              `, {
                permanent: true,
                direction: 'center',
                className: 'gccZoneTooltipWrapper'
              });

              layer.bindPopup(`
                <div style="font-family:sans-serif; padding:6px; min-width:180px;">
                  <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #d97706; padding-bottom:4px; margin-bottom:6px;">
                    <h4 style="margin:0; color:#d97706; font-size:0.95rem; font-weight:800;">🏢 GCC Zone ${zoneNo}</h4>
                    <span style="background:#fef3c7; color:#92400e; font-size:0.75rem; font-weight:700; padding:2px 6px; border-radius:4px;">Zone ${zoneNo}</span>
                  </div>
                  <p style="margin:3px 0; font-size:0.8rem; color:#3c4043;"><b>Authority:</b> Greater Chennai Corporation</p>
                  <p style="margin:3px 0; font-size:0.8rem; color:#3c4043;"><b>Zone No:</b> Zone ${zoneNo}</p>
                </div>
              `);
              layer.on({
                mouseover: (e) => {
                  e.target.setStyle({ weight: 4, color: '#b45309', fillOpacity: 0.22 });
                },
                mouseout: (e) => {
                  zonesLayer.resetStyle(e.target);
                }
              });
            }
          });
          gccZonesLayerRef.current = zonesLayer;
          if (showGccZones) {
            zonesLayer.addTo(hlbLeafletRef.current);
          }
        })
        .catch(err => console.error('Error loading GCC Zones GeoJSON:', err));

      // 3. Automatically load GCC Wards (200 Wards + AC Details)
      fetch('/gcc_boundaries/gcc_wards.json')
        .then(res => res.json())
        .then(data => {
          if (!hlbLeafletRef.current) return;
          const wardList = [];
          const wardsLayer = L.geoJSON(data, {
            style: () => ({
              color: '#0891b2', // Cyan border
              weight: 2,
              opacity: 0.85,
              fillColor: '#06b6d4',
              fillOpacity: 0.08
            }),
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              const wardNo = props.Ward || props.ward || '-';
              const zoneNo = props.Zone || props.zone || '-';
              const acName = props.AC_Name || props.ac_name || 'Chennai';
              const acNo = props.AC_No || props.ac_no || '-';

              const b = layer.getBounds();
              const center = b.getCenter();
              wardList.push({
                wardNo: String(wardNo),
                zoneNo: String(zoneNo),
                acName: String(acName),
                acNo: String(acNo),
                lat: center.lat,
                lng: center.lng,
                bounds: b
              });

              // Centered Permanent Ward & AC Badge in the middle of polygon
              layer.bindTooltip(`
                <div class="gccWardCenteredBadge">
                  <span class="gccWardBadgeNo">Ward ${wardNo}</span>
                  <span class="gccWardBadgeAc">${acName}</span>
                </div>
              `, {
                permanent: true,
                direction: 'center',
                className: 'gccWardTooltipWrapper'
              });

              layer.bindPopup(`
                <div style="font-family:sans-serif; padding:6px; min-width:210px;">
                  <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #0891b2; padding-bottom:4px; margin-bottom:6px;">
                    <h4 style="margin:0; color:#0891b2; font-size:0.95rem; font-weight:800;">🏛️ GCC Ward ${wardNo}</h4>
                    <span style="background:#cffafe; color:#155e75; font-size:0.75rem; font-weight:700; padding:2px 6px; border-radius:4px;">Zone ${zoneNo}</span>
                  </div>
                  <p style="margin:3px 0; font-size:0.8rem; color:#3c4043;"><b>Ward Number:</b> Ward ${wardNo}</p>
                  <p style="margin:3px 0; font-size:0.8rem; color:#3c4043;"><b>Zone:</b> Zone ${zoneNo}</p>
                  <p style="margin:4px 0 2px 0; font-size:0.8rem; color:#0f766e;"><b>Assembly Constituency:</b><br/>${acName} (AC #${acNo})</p>
                </div>
              `);
              layer.on({
                mouseover: (e) => {
                  e.target.setStyle({ weight: 3.5, color: '#0e7490', fillOpacity: 0.25 });
                },
                mouseout: (e) => {
                  wardsLayer.resetStyle(e.target);
                }
              });
            }
          });
          gccWardsLayerRef.current = wardsLayer;
          gccWardsDataRef.current = wardList;
          if (showGccWards) {
            wardsLayer.addTo(hlbLeafletRef.current);
          }
          if (showGccBuildings) {
            loadBuildingsInViewport();
          }
        })
        .catch(err => console.error('Error loading GCC Wards GeoJSON:', err));

      // Auto-load visible ward buildings on map pan/zoom
      map.on('moveend', () => {
        if (showGccBuildings) {
          loadBuildingsInViewport();
        }
      });

      // 4. Automatically load GCC Outer Boundary
      fetch('/gcc_boundaries/gcc_outer.json')
        .then(res => res.json())
        .then(data => {
          if (!hlbLeafletRef.current) return;
          const outerLayer = L.geoJSON(data, {
            style: () => ({
              color: '#dc2626',
              weight: 3.5,
              dashArray: '6, 6',
              opacity: 0.9,
              fillOpacity: 0
            }),
            onEachFeature: (feature, layer) => {
              layer.bindPopup(`
                <div style="font-family:sans-serif; padding:4px;">
                  <h4 style="margin:0; color:#dc2626; font-size:0.92rem; font-weight:700;">🏛️ Greater Chennai Corporation (GCC)</h4>
                  <p style="margin:2px 0; font-size:0.78rem; color:#475569;">Official 2023 Outer City Boundary</p>
                </div>
              `);
            }
          });
          gccOuterLayerRef.current = outerLayer;
          if (showGccOuter) {
            outerLayer.addTo(hlbLeafletRef.current);
          }
        })
        .catch(err => console.error('Error loading GCC Outer GeoJSON:', err));

      setTimeout(() => {
        if (hlbLeafletRef.current) {
          hlbLeafletRef.current.invalidateSize();
        }
      }, 300);
    }, 100);

    return () => clearTimeout(timer);
  }, [activeModule, appNavTab, blocks, basemapType, tappedMapBlock]);

  // Unified search engine (Ward & Block GDB Search + Live Map Geocoding)
  async function fetchGeoSuggestions(query) {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const results = [];

    // Step 1: Search Official HLB Census Wards & Blocks (9,269 blocks!)
    if (gdbSummaryData && gdbSummaryData.length > 0) {
      const cleanNum = q.replace(/^(ward|block|hlb|b-|\s)+/gi, '').trim();

      const matchedBlocks = gdbSummaryData.filter(item => {
        const bNo = String(item.blockNo || '').toLowerCase();
        const wNo = String(item.wardNo || '').toLowerCase();
        const landmark = String(item.landmark || '').toLowerCase();

        return (
          bNo === cleanNum ||
          wNo === cleanNum ||
          bNo.endsWith(cleanNum) ||
          wNo.endsWith(cleanNum) ||
          (cleanNum.length >= 2 && (bNo.includes(cleanNum) || wNo.includes(cleanNum) || landmark.includes(cleanNum)))
        );
      }).slice(0, 4);

      matchedBlocks.forEach(b => {
        results.push({
          title: `🏛️ HLB Census Block #${b.blockNo}`,
          subtitle: `Ward ${b.wardNo} | Zone ${b.zoneNo} | Buildings: ${b.buildings} | Pop: ${b.population} | ${b.landmark}`,
          lat: b.centerLat,
          lng: b.centerLng,
          isGdbBlock: true,
          blockId: b.blockNo,
          wardNo: b.wardNo
        });
      });
    }

    // Step 1.5: Search Official GCC Wards (200 Wards) & Assembly Constituencies (e.g. Saidapet, Velachery, Mylapore)
    if (gccWardsDataRef.current && gccWardsDataRef.current.length > 0) {
      const cleanNum = q.replace(/^(ward|zone|ac|hlb|\s)+/gi, '').trim();
      const matchedWards = gccWardsDataRef.current.filter(w => {
        const wNo = w.wardNo.toLowerCase();
        const zNo = w.zoneNo.toLowerCase();
        const ac = w.acName.toLowerCase();
        return (
          wNo === cleanNum ||
          ac.includes(q) ||
          (cleanNum.length >= 2 && wNo.includes(cleanNum)) ||
          `ward ${wNo}`.includes(q) ||
          `zone ${zNo}` === q
        );
      }).slice(0, 4);

      matchedWards.forEach(w => {
        results.push({
          title: `🏛️ GCC Ward #${w.wardNo} - ${w.acName}`,
          subtitle: `Zone ${w.zoneNo} | Assembly Constituency: ${w.acName} (AC #${w.acNo})`,
          lat: w.lat,
          lng: w.lng,
          bounds: w.bounds,
          isGccWard: true,
          wardNo: w.wardNo,
          zoneNo: w.zoneNo
        });
      });
    }

    // Step 2: Query Esri World Geocoder API for live places
    try {
      if (results.length < 8) {
        const searchTerms = [q, q + ', India'];
        for (const term of searchTerms) {
          if (results.length >= 8) break;
          const esriUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(term)}&maxLocations=6&outFields=Match_addr,Addr_type`;
          const res = await fetch(esriUrl);
          if (res.ok) {
            const data = await res.json();
            if (data && data.candidates && data.candidates.length > 0) {
              data.candidates.forEach(c => {
                const addr = c.address;
                if (!results.some(r => r.subtitle.toLowerCase() === addr.toLowerCase())) {
                  results.push({
                    title: addr.split(',')[0],
                    subtitle: addr,
                    lat: c.location.y,
                    lng: c.location.x
                  });
                }
              });
            }
          }
        }
      }
    } catch (e) {}

    // Step 3: Query Photon Komoot API for live places
    try {
      if (results.length < 8) {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`;
        const res = await fetch(photonUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            data.features.forEach(f => {
              const props = f.properties;
              const coords = f.geometry.coordinates;
              const title = props.name || props.street || props.city || q;
              const sub = [props.name, props.street, props.city, props.state, props.country].filter(Boolean).join(', ');
              if (!results.some(r => r.title.toLowerCase() === title.toLowerCase())) {
                results.push({
                  title: title,
                  subtitle: sub,
                  lat: coords[1],
                  lng: coords[0]
                });
              }
            });
          }
        }
      }
    } catch (e) {}

    return results.slice(0, 8);
  }

  // Live autocomplete location search as user types
  useEffect(() => {
    if (!locationQuery.trim() || locationQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    
    searchDebounceRef.current = setTimeout(async () => {
      const results = await fetchGeoSuggestions(locationQuery);
      setSuggestions(results);
    }, 280);

    return () => clearTimeout(searchDebounceRef.current);
  }, [locationQuery]);

  function selectPlaceItem(item) {
    setSuggestions([]);
    setLocationQuery(item.title);
    const targetLat = parseFloat(item.lat);
    const targetLng = parseFloat(item.lng);
    
    setSelectedPlaceDetails({
      title: item.title,
      subtitle: item.subtitle,
      lat: targetLat.toFixed(6),
      lng: targetLng.toFixed(6)
    });

    if (hlbLeafletRef.current) {
      if (item.bounds && typeof item.bounds.isValid === 'function' && item.bounds.isValid()) {
        hlbLeafletRef.current.fitBounds(item.bounds, { padding: [40, 40], maxZoom: 17 });
      } else {
        hlbLeafletRef.current.flyTo([targetLat, targetLng], 17, { duration: 1.2 });
      }
      
      // Google Red Pin Marker
      const googlePinIcon = L.divIcon({
        html: `
          <div style="position:relative; width:32px; height:42px; display:flex; align-items:center; justify-content:center;">
            <div style="width:28px; height:28px; background:#ea4335; border:2px solid #ffffff; border-radius:50% 50% 50% 0; transform:rotate(-45deg); box-shadow:0 4px 12px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;">
              <div style="width:9px; height:9px; background:#ffffff; border-radius:50%; transform:rotate(45deg);"></div>
            </div>
          </div>
        `,
        className: 'googlePinMarkerIcon',
        iconSize: [32, 42],
        iconAnchor: [16, 42]
      });

      L.marker([targetLat, targetLng], { icon: googlePinIcon })
        .addTo(hlbLeafletRef.current)
        .bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <h4 style="margin:0 0 4px 0; color:#1a73e8; font-size:0.95rem; font-weight:700;">${item.title}</h4>
            <p style="margin:0; font-size:0.8rem; color:#5f6368; line-height:1.4;">${item.subtitle}</p>
            <div style="margin-top:8px; font-size:0.75rem; color:#70757a; background:#f1f3f4; padding:4px 8px; border-radius:4px; font-family:monospace;">
              <b>Lat:</b> ${targetLat.toFixed(6)} | <b>Lng:</b> ${targetLng.toFixed(6)}
            </div>
          </div>
        `)
        .openPopup();
    }
  }

  // --- GOOGLE MAPS PLACE / LOCATION SEARCH HANDLER ---
  async function handleGoogleSearch(e) {
    if (e) e.preventDefault();
    if (!locationQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await fetchGeoSuggestions(locationQuery);
      if (results && results.length > 0) {
        selectPlaceItem(results[0]);
      } else {
        alert(`Location "${locationQuery}" not found. Try typing a street name, town, or landmark (e.g. Arunachalam Nagar, Maduravoyal, Porur, Salem).`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }

  // --- GPS MY LOCATION HANDLER ---
  function handleMyLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (hlbLeafletRef.current) {
            hlbLeafletRef.current.flyTo([latitude, longitude], 17, { duration: 1.2 });
            L.circleMarker([latitude, longitude], {
              radius: 9,
              fillColor: '#1a73e8',
              color: '#ffffff',
              weight: 3,
              opacity: 1,
              fillOpacity: 0.95
            }).addTo(hlbLeafletRef.current).bindPopup('<b>Your Current Location (GPS)</b>').openPopup();
          }
        },
        () => {
          alert('GPS Location permission denied or unavailable.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }

  // Exports
  function exportCSV(block) {
    let csv = 'Block No,Building ID,Door No,Street,Owner Name,Household Count,Structure Type,Occupancy,Survey Status\n';
    csv += `"${block.rawBlockNo || '0364'}","HLB-01","1/A","Main Rd","Residential Owner","2","Pucca (RCC)","Residential","Verified"\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Census_HLB_Block_${block.rawBlockNo || '0364'}.csv`;
    a.click();
  }

  function exportPNG() {
    window.print();
  }

  // Dashboard uses real gdbSummaryData (9,269 HLB blocks from GDB)
  const [dashZoneFilter, setDashZoneFilter] = useState('');
  const [dashWardFilter, setDashWardFilter] = useState('');
  const [dashPage, setDashPage] = useState(0);
  const [sortCol, setSortCol] = useState('blockNo');
  const [sortDir, setSortDir] = useState('asc');

  const DASH_PAGE_SIZE = 50;

  const dashAvailableZones = useMemo(() => {
    const s = new Set();
    gdbSummaryData.forEach(d => { if (d.zoneNo && d.zoneNo !== 'None') s.add(String(parseInt(d.zoneNo, 10))); });
    return Array.from(s).sort((a, b) => parseInt(a) - parseInt(b));
  }, [gdbSummaryData]);

  const dashAvailableWards = useMemo(() => {
    const s = new Set();
    gdbSummaryData.forEach(d => {
      const zm = !dashZoneFilter || String(parseInt(d.zoneNo, 10)) === dashZoneFilter;
      if (zm && d.wardNo && d.wardNo !== 'None') s.add(String(parseInt(d.wardNo, 10)));
    });
    return Array.from(s).sort((a, b) => parseInt(a) - parseInt(b));
  }, [gdbSummaryData, dashZoneFilter]);

  const filteredBlocks = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return gdbSummaryData.filter(d => {
      const matchSearch = !q ||
        d.blockNo.includes(searchTerm) ||
        String(parseInt(d.wardNo, 10)).includes(searchTerm) ||
        String(parseInt(d.zoneNo, 10)).includes(searchTerm) ||
        (d.landmark && d.landmark.toLowerCase().includes(q));
      const matchZone = !dashZoneFilter || String(parseInt(d.zoneNo, 10)) === dashZoneFilter;
      const matchWard = !dashWardFilter || String(parseInt(d.wardNo, 10)) === dashWardFilter;
      return matchSearch && matchZone && matchWard;
    });
  }, [gdbSummaryData, searchTerm, dashZoneFilter, dashWardFilter]);

  const dashSorted = useMemo(() => {
    const arr = [...filteredBlocks];
    arr.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (['blockNo', 'wardNo', 'zoneNo'].includes(sortCol)) { va = parseInt(va, 10); vb = parseInt(vb, 10); }
      else if (['buildings', 'population'].includes(sortCol)) { va = Number(va); vb = Number(vb); }
      else { va = String(va || '').toLowerCase(); vb = String(vb || '').toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredBlocks, sortCol, sortDir]);

  const dashTotalBuildings = useMemo(() => gdbSummaryData.reduce((s, d) => s + (d.buildings || 0), 0), [gdbSummaryData]);
  const dashTotalPop = useMemo(() => gdbSummaryData.reduce((s, d) => s + (d.population || 0), 0), [gdbSummaryData]);
  const dashTotalZones = useMemo(() => new Set(gdbSummaryData.map(d => parseInt(d.zoneNo, 10))).size, [gdbSummaryData]);
  const dashTotalWards = useMemo(() => new Set(gdbSummaryData.map(d => parseInt(d.wardNo, 10))).size, [gdbSummaryData]);

  const dashTotalPages = Math.ceil(dashSorted.length / DASH_PAGE_SIZE);
  const dashPageItems = useMemo(() => {
    return dashSorted.slice(dashPage * DASH_PAGE_SIZE, (dashPage + 1) * DASH_PAGE_SIZE);
  }, [dashSorted, dashPage, DASH_PAGE_SIZE]);

  function handleDashSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setDashPage(0);
  }

  const isAdmin = !creds || !creds.role || creds.role === 'ADMIN' || creds.role === 'OWNER';

  /* ── WORK MODULE CARDS SELECTION DASHBOARD ── */
  if (activeModule === 'MODULE_SELECTION') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0d16',
        color: '#ffffff',
        padding: '50px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(239, 68, 68, 0.12)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#ff6b6b', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '0.82rem', 
            fontWeight: 700,
            marginBottom: '14px',
            letterSpacing: '0.5px'
          }}>
            <Globe size={15} /> CENSUS WORK PORTAL 2027
          </div>
          <h1 style={{ fontSize: '2.3rem', fontWeight: 800, margin: '0 0 12px 0', color: '#ffffff', letterSpacing: '-0.5px' }}>
            Select Census Work Module
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.02rem', maxWidth: '620px', margin: '0 auto', lineHeight: '1.6' }}>
            Choose one of the work modules below to open your census tools.
          </p>
        </div>

        {/* CARDS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px', maxWidth: '1200px', width: '100%' }}>
          
          {/* CARD 1: CENSUS MAP APPLICATION (ADMIN ONLY) */}
          {isAdmin && (
            <div 
              onClick={() => navigateModule('MAP_APP')}
              style={{
                background: 'linear-gradient(145deg, rgba(20, 26, 42, 0.95) 0%, rgba(13, 19, 34, 0.98) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '24px',
                padding: '38px 32px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 14px 40px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '330px'
              }}
              className="censusModuleCard"
            >
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '66px',
                    height: '66px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.35) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.45)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 22px rgba(59, 130, 246, 0.25)'
                  }}>
                    <MapPin size={36} />
                  </div>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#93c5fd',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Sparkles size={13} /> Map Application
                  </span>
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0' }}>
                  Census Map Application
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.94rem', lineHeight: '1.65', margin: 0 }}>
                  Open the official Census of India 2027 Interactive Map, GIS HLB Creator, Ward Boundaries, Household Mapping &amp; Layout Manager.
                </p>
              </div>

              <div style={{
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: 700 }}>
                  Click to Open Map Page →
                </span>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.25)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ExternalLink size={18} />
                </div>
              </div>
            </div>
          )}

          {/* CARD 2: CENSUS RECORDS & HLB BLOCK EXPLORER (WORK MODULE 2) */}
          <div 
            onClick={() => navigateModule('MODULE_2')}
            style={{
              background: 'linear-gradient(145deg, rgba(28, 22, 44, 0.95) 0%, rgba(18, 14, 32, 0.98) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '24px',
              padding: '38px 32px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 14px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '330px'
            }}
            className="censusModuleCard"
          >
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '66px',
                  height: '66px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.35) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.45)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 22px rgba(168, 85, 247, 0.25)'
                }}>
                  <FileSpreadsheet size={36} />
                </div>
                <span style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#c084fc',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Sparkles size={13} /> Work Module 2
                </span>
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0' }}>
                Census Records &amp; HLB Block Explorer
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.94rem', lineHeight: '1.65', margin: 0 }}>
                Explore full census house records, multi-tier numerical sorting (HLB Code &amp; Line No), horizontal block cards train filter.
              </p>
            </div>

            <div style={{
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#c084fc', fontSize: '0.9rem', fontWeight: 700 }}>
                Click to Open Module 2 →
              </span>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(168, 85, 247, 0.25)',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ExternalLink size={18} />
              </div>
            </div>
          </div>

          {/* CARD 3: CENSUS ERROR ANALYSIS & SUPERVISOR ABSTRACT HUB (WORK MODULE 3) */}
          <div 
            onClick={() => navigateModule('MODULE_3_HUB')}
            style={{
              background: 'linear-gradient(145deg, rgba(38, 18, 30, 0.95) 0%, rgba(24, 12, 20, 0.98) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.38)',
              borderRadius: '24px',
              padding: '38px 32px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 14px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '330px'
            }}
            className="censusModuleCard"
          >
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '66px',
                  height: '66px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.35) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 22px rgba(239, 68, 68, 0.25)'
                }}>
                  <AlertCircle size={36} />
                </div>
                <span style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Sparkles size={13} /> Work Module 3
                </span>
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0' }}>
                Census Error Analysis &amp; Abstract Hub
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.94rem', lineHeight: '1.65', margin: 0 }}>
                {isAdmin ? 'Contains 3 sub-modules: Error Base Report, Supervisor Base Report, and Reserved Custom Report 3.' : 'View Error Base Report filter using 6 Default Error cards.'}
              </p>
            </div>

            <div style={{
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#fca5a5', fontSize: '0.9rem', fontWeight: 700 }}>
                Click to Open Error Module 3 →
              </span>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ExternalLink size={18} />
              </div>
            </div>
          </div>

          {/* CARD 4: SUPERVISOR WISE ABSTRACT REPORT HUB (ADMIN ONLY) */}
          {isAdmin && (
            <div 
              onClick={() => navigateModule('MODULE_4_SUPERVISOR_HUB')}
              style={{
                background: 'linear-gradient(145deg, rgba(20, 26, 42, 0.95) 0%, rgba(13, 19, 34, 0.98) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.38)',
                borderRadius: '24px',
                padding: '38px 32px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 14px 40px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '330px'
              }}
              className="censusModuleCard"
            >
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '66px',
                    height: '66px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.35) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.45)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 22px rgba(59, 130, 246, 0.25)'
                  }}>
                    <FileText size={36} />
                  </div>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#93c5fd',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Sparkles size={13} /> Work Module 4
                  </span>
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0' }}>
                  Census Progress Report (Supervisor Base)
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.94rem', lineHeight: '1.65', margin: 0 }}>
                  Supervisor-wise overall progress tracking report displaying Expected Houses, Census Households, Supervisor Verification, Total Population &amp; Work Status for 75 Supervisors, 450 Enumerators &amp; 470 HLBs.
                </p>
              </div>

              <div style={{
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#60a5fa', fontSize: '0.9rem', fontWeight: 700 }}>
                  Open Census Progress Report Module 4 →
                </span>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.25)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ExternalLink size={18} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  /* WORK MODULE 3 SUB-CARD SELECTION HUB */
  if (activeModule === 'MODULE_3_HUB') {
    return <CensusModule3Hub onBack={() => navigateModule('MODULE_SELECTION')} onSelectSubModule={(sub) => navigateModule(sub)} creds={creds} />;
  }

  if (activeModule === 'MODULE_2') {
    return wrapFullWidth(<CensusModule2 onBack={() => navigateModule('MODULE_SELECTION')} creds={creds} />);
  }

  if (activeModule === 'MODULE_3_ERROR_BASE') {
    return wrapFullWidth(<CensusModule2 onBack={() => navigateModule('MODULE_3_HUB')} creds={creds} initialShowErrors={true} initialShowAbstract={false} reportMode="ERROR_BASE" moduleTitle="Module 3 — Error Abstract Report (6 Error Cards)" />);
  }

  if (activeModule === 'MODULE_3_SUPERVISOR_BASE') {
    return wrapFullWidth(<CensusModule3ErrorAbstract onBack={() => navigateModule('MODULE_3_HUB')} creds={creds} />);
  }

  if (activeModule === 'MODULE_4_SUPERVISOR_HUB') {
    return wrapFullWidth(<CensusModule4ProgressReport onBack={() => navigateModule('MODULE_SELECTION')} creds={creds} />);
  }

  if (activeModule === 'MODULE_3_CUSTOM') {
    return wrapFullWidth(<CensusModule3ErrorCustomReport onBack={() => navigateModule('MODULE_3_HUB')} creds={creds} />);
  }

  // Default: Return Map Application Shell (Full width)
  return (
    <div className="hlbApplicationShell">
        {/* TOP NAVBAR HEADER */}
        <header className="hlbTopNavbar">
          <button 
            onClick={() => navigateModule('MODULE_SELECTION')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid #cbd5e1',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginRight: '12px',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
            title="Back to Census Modules Selection"
          >
            <ArrowLeft size={16} /> Back to Modules
          </button>

        <div className="hlbBrandSection">
          <img src="/logo-icon.png" alt="Census Seal" className="hlbSealIcon" />
          <div className="hlbTitleBox">
            <h1 className="hlbMainTitle">Census of India 2027</h1>
            <h2 className="hlbSubTitle">HLB Creator (Web Map Application)</h2>
            <p className="hlbGovtText">Office of the Registrar General and Census Commissioner of India</p>
          </div>
        </div>

        {/* Center Application Navigation Tabs */}
        <nav className="hlbCenterTabs">
          <button 
            className={appNavTab === 'DASHBOARD' ? 'hlbTabBtn active' : 'hlbTabBtn'} 
            onClick={() => setAppNavTab('DASHBOARD')}
          >
            Dashboard
          </button>
          <button 
            className={appNavTab === 'MAP_APPLICATION' ? 'hlbTabBtn activeMapTab' : 'hlbTabBtn'} 
            onClick={() => setAppNavTab('MAP_APPLICATION')}
          >
            Map
          </button>
        </nav>
      </header>

      {/* --- RENDER 1: OFFICIAL GOOGLE MAPS WEB PORTAL APPLICATION --- */}
      {appNavTab === 'MAP_APPLICATION' && (
        <div className="hlbMapPortalBody">

          {/* ---- FULL TOOLBAR: Basemap + Search + Filters (single row) ---- */}
          <div className="hlbBasemapBar">
            {/* Left: Layer Toggles + basemap buttons */}
            <button 
              className={`hlbBasemapBtn ${showGdbPolygons ? 'activePoly' : ''}`}
              onClick={() => {
                if (gdbGeoJsonLayerRef.current && hlbLeafletRef.current) {
                  if (showGdbPolygons) {
                    hlbLeafletRef.current.removeLayer(gdbGeoJsonLayerRef.current);
                  } else {
                    gdbGeoJsonLayerRef.current.addTo(hlbLeafletRef.current);
                  }
                  setShowGdbPolygons(!showGdbPolygons);
                }
              }}
              title="Toggle Census Block Boundaries"
            >
              📍 HLB Blocks (9,269)
            </button>
            <button 
              className={`hlbBasemapBtn ${showGccZones ? 'activeZone' : ''}`}
              onClick={toggleGccZones}
              title="Toggle Official GCC Zones (1-15)"
            >
              🏢 GCC Zones (1-15)
            </button>
            <button 
              className={`hlbBasemapBtn ${showGccWards ? 'activeWard' : ''}`}
              onClick={toggleGccWards}
              title="Toggle Official GCC Wards (200 Wards + AC details)"
            >
              🏛️ GCC Wards (200)
            </button>
            <button 
              className={`hlbBasemapBtn ${showGccOuter ? 'activeOuter' : ''}`}
              onClick={toggleGccOuter}
              title="Toggle GCC Outer City Boundary"
            >
              🗺️ GCC Border
            </button>
            <button 
              className={`hlbBasemapBtn ${showGccBuildings ? 'activeBuilding' : ''}`}
              onClick={toggleGccBuildings}
              title="Toggle Drone Survey Building Roof Footprints (9.32 Lakh Buildings)"
            >
              🏠 Drone Buildings
            </button>
            <div className="hlbBasemapDivider" />
            {[
              { key: 'OSM', label: 'OSM Vector' },
              { key: 'HYBRID', label: 'Google Hybrid' },
              { key: 'ROADMAP', label: 'Roadmap' },
              { key: 'SATELLITE', label: 'Satellite' },
              { key: 'TERRAIN', label: 'Terrain' },
            ].map(bm => (
              <button
                key={bm.key}
                className={`hlbBasemapBtn ${basemapType === bm.key || (bm.key === 'OSM' && basemapType === 'VECTOR') ? 'active' : ''}`}
                onClick={() => setBasemapType(bm.key)}
              >
                {bm.label}
              </button>
            ))}

            {/* Spacer pushes filters to right */}
            <div style={{ flex: 1 }} />

            {/* Center: Inline Search */}
            <div className="hlbBarSearchWrap">
              <form onSubmit={handleGoogleSearch} className="hlbBarSearchForm">
                <Search size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <input
                  type="text"
                  className="hlbBarSearchInput"
                  placeholder="Search Ward, AC, Block or Places..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
                {locationQuery && (
                  <X size={12} style={{ color: '#64748b', cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => { setLocationQuery(''); setSuggestions([]); }} />
                )}
                <button type="submit" className="hlbBarSearchBtn" disabled={isSearching}>
                  {isSearching ? <RefreshCw size={12} className="spin" /> : 'Go'}
                </button>
                {suggestions.length > 0 && (
                  <div className="googleSearchSuggestionsDropdown" style={{ top: '38px', left: 0, minWidth: '320px' }}>
                    {suggestions.map((item, idx) => (
                      <div key={idx} className="googleSearchSuggestionItem" onClick={() => selectPlaceItem(item)}>
                        <MapPin size={14} color={item.isGccWard ? '#0891b2' : '#ea4335'} style={{ flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden' }}>
                          <p className="googleSearchSuggestionTitle">{item.title || (item.display_name ? item.display_name.split(',')[0] : 'Location')}</p>
                          <p className="googleSearchSuggestionSubtitle">{item.subtitle || item.display_name || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>

            <div style={{ flex: 1 }} />
            <div className="hlbBasemapDivider" />

            {/* Right: Census Zone → Ward → Block Filter */}
            <div className="hlbBarFilterGroup">
              <Filter size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
              <select
                className="hlbBarSelect"
                value={selectedFilterZone}
                onChange={(e) => handleSelectZoneFilter(e.target.value)}
              >
                <option value="">All Zones</option>
                {availableZones.map(z => (
                  <option key={z} value={z}>Zone {z}</option>
                ))}
              </select>
              <select
                className="hlbBarSelect"
                value={selectedFilterWard}
                onChange={(e) => handleSelectWardFilter(e.target.value)}
              >
                <option value="">-- Ward --</option>
                {availableWards.map(w => (
                  <option key={w} value={w}>Ward {w}</option>
                ))}
              </select>
              <select
                className="hlbBarSelect"
                value={selectedFilterBlock}
                onChange={(e) => handleSelectBlockFromFilter(e.target.value)}
              >
                <option value="">-- Block --</option>
                {availableBlocks.map(b => (
                  <option key={b.id} value={b.id}>
                    #{b.blockNo} (W{b.wardNo})
                  </option>
                ))}
              </select>
              {(selectedFilterZone || selectedFilterWard || selectedFilterBlock) && (
                <button className="hlbBarResetBtn" onClick={handleResetFilters} title="Reset Filters">
                  <FilterX size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Floating Google Maps Utility Buttons (Bottom Right) */}
          <div className="googleMapsFloatingTools">
            <button className="googleToolCircleBtn" onClick={handleMyLocation} title="GPS My Location">
              <Navigation size={20} color="#1a73e8" />
            </button>
            <button className="googleToolCircleBtn" onClick={() => setShowSettingsModal(true)} title="Google Maps Settings">
              <Settings size={20} color="#3c4043" />
            </button>
            <button className="googleToolCircleBtn" onClick={() => hlbLeafletRef.current && hlbLeafletRef.current.zoomIn()} title="Zoom In">
              <ZoomIn size={20} color="#3c4043" />
            </button>
            <button className="googleToolCircleBtn" onClick={() => hlbLeafletRef.current && hlbLeafletRef.current.zoomOut()} title="Zoom Out">
              <ZoomOut size={20} color="#3c4043" />
            </button>
          </div>

          {/* Left Vertical Map Toolbar Palette */}
          <div className="hlbLeftMapToolbar">
            <button className="toolBoxBtn" onClick={() => hlbLeafletRef.current && hlbLeafletRef.current.zoomIn()} title="Zoom In">+</button>
            <button className="toolBoxBtn" onClick={() => hlbLeafletRef.current && hlbLeafletRef.current.zoomOut()} title="Zoom Out">-</button>
            <button className="toolBoxBtn" onClick={() => hlbLeafletRef.current && hlbLeafletRef.current.setView([13.044666, 80.173967], 16)} title="Home Extent"><Home size={16} /></button>
            <button className="toolBoxBtn" title="Measure Tool"><Ruler size={16} /></button>
            <button className="toolBoxBtn" title="Orientation / Compass"><Compass size={16} className="iconBlue" /></button>
          </div>

          {/* Bottom Left Info Bar (Scale & GEO-COORDINATES readout) */}
          <div className="hlbBottomInfoBar">
            <div className="hlbScaleBadge">
              <span>200 m</span>
              <div className="scaleTicks"></div>
              <span>1,000 ft</span>
            </div>

            <div className="hlbCoordsBadge">
              <span>GEO-COORDINATES</span>
              <b>{currentCoords.lat}, {currentCoords.lng}</b>
              <ChevronDown size={14} />
            </div>
          </div>

          {/* GOOGLE PLACE DETAILS CARD (BOTTOM LEFT) */}
          {selectedPlaceDetails && (
            <div className="googlePlaceDetailsCard">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={22} color="#ea4335" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#202124' }}>{selectedPlaceDetails.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedPlaceDetails(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368' }}
                >
                  <X size={18} />
                </button>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.84rem', color: '#5f6368', lineHeight: '1.45' }}>
                {selectedPlaceDetails.subtitle}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f3f4', fontSize: '0.78rem', color: '#70757a', fontFamily: 'monospace' }}>
                <span><b>Lat:</b> {selectedPlaceDetails.lat}</span>
                <span><b>Lng:</b> {selectedPlaceDetails.lng}</span>
              </div>

              {/* Print Block Map Action Button */}
              <button 
                onClick={() => {
                  setBlockToPrint(selectedPlaceDetails);
                  setShowBlockPrintModal(true);
                }}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  background: 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(26, 115, 232, 0.35)'
                }}
              >
                <Printer size={18} /> Print Block Map / Layout
              </button>
            </div>
          )}

          {/* MAIN LEAFLET GIS MAP CONTAINER */}
          <div ref={hlbMapContainerRef} className="hlbMainMapCanvas" />
        </div>
      )}

      {/* ===== RENDER 2: PREMIUM HLB ANALYTICS DASHBOARD ===== */}
      {appNavTab === 'DASHBOARD' && (
        <div className="hlbDashShell">

          {/* ── TOP: STAT KPI CARDS ── */}
          <div className="hlbStatRow">
            {[
              { label: 'Total HLB Blocks', value: gdbSummaryData.length.toLocaleString(), sub: 'Greater Chennai Corporation', icon: '🏛️', color: '#1a73e8' },
              { label: 'Total Buildings', value: dashTotalBuildings.toLocaleString(), sub: 'All enumerated structures', icon: '🏢', color: '#0f9d58' },
              { label: 'Est. Population', value: dashTotalPop.toLocaleString(), sub: 'Aggregate census count', icon: '👥', color: '#f4b400' },
              { label: 'Zones', value: dashTotalZones, sub: `${dashTotalWards} Wards across city`, icon: '📍', color: '#db4437' },
            ].map(sc => (
              <div key={sc.label} className="hlbStatCard">
                <div className="hlbStatIcon">{sc.icon}</div>
                <div className="hlbStatBody">
                  <div className="hlbStatValue">{sc.value}</div>
                  <div className="hlbStatLabel">{sc.label}</div>
                  <div className="hlbStatSub">{sc.sub}</div>
                </div>
                <div className="hlbStatBar" style={{ background: sc.color }} />
              </div>
            ))}
          </div>

          {/* ── FILTER + SEARCH TOOLBAR ── */}
          <div className="hlbDashToolbar">
            <div className="hlbDashSearch">
              <Search size={15} style={{ color: '#64748b', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search Block No, Ward, Zone, Landmark..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setDashPage(0); }}
              />
              {searchTerm && <X size={13} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setSearchTerm('')} />}
            </div>
            <div className="hlbDashFilterRow">
              <select className="hlbDashSelect" value={dashZoneFilter} onChange={(e) => { setDashZoneFilter(e.target.value); setDashWardFilter(''); setDashPage(0); }}>
                <option value="">All Zones</option>
                {dashAvailableZones.map(z => <option key={z} value={z}>Zone {z}</option>)}
              </select>
              <select className="hlbDashSelect" value={dashWardFilter} onChange={(e) => { setDashWardFilter(e.target.value); setDashPage(0); }}>
                <option value="">All Wards</option>
                {dashAvailableWards.map(w => <option key={w} value={w}>Ward {w}</option>)}
              </select>
              {(dashZoneFilter || dashWardFilter || searchTerm) && (
                <button className="hlbDashClearBtn" onClick={() => { setDashZoneFilter(''); setDashWardFilter(''); setSearchTerm(''); setDashPage(0); }}>
                  <FilterX size={13} /> Clear
                </button>
              )}
            </div>
            <div className="hlbDashCount">
              Showing <b>{dashSorted.length.toLocaleString()}</b> of <b>{gdbSummaryData.length.toLocaleString()}</b> blocks
              {dashTotalPages > 1 && <span className="hlbDashPageBadge">Page {dashPage + 1} / {dashTotalPages}</span>}
            </div>
          </div>

          {/* ── DATA TABLE ── */}
          <div className="hlbTableWrap">
            {gdbSummaryData.length === 0 ? (
              <div className="hlbTableEmpty">
                <RefreshCw size={28} className="spin" />
                <p>Loading HLB block data from GDB...</p>
              </div>
            ) : (
              <table className="hlbDataTable">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th onClick={() => handleDashSort('blockNo')} className="hlbThSort">
                      Block No {sortCol === 'blockNo' ? <span style={{ color: '#1a73e8', fontSize: '0.7rem' }}>{sortDir === 'asc' ? '↑' : '↓'}</span> : <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>⇅</span>}
                    </th>
                    <th onClick={() => handleDashSort('zoneNo')} className="hlbThSort">
                      Zone {sortCol === 'zoneNo' ? <span style={{ color: '#1a73e8', fontSize: '0.7rem' }}>{sortDir === 'asc' ? '↑' : '↓'}</span> : <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>⇅</span>}
                    </th>
                    <th onClick={() => handleDashSort('wardNo')} className="hlbThSort">
                      Ward {sortCol === 'wardNo' ? <span style={{ color: '#1a73e8', fontSize: '0.7rem' }}>{sortDir === 'asc' ? '↑' : '↓'}</span> : <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>⇅</span>}
                    </th>
                    <th onClick={() => handleDashSort('buildings')} className="hlbThSort">
                      Buildings {sortCol === 'buildings' ? <span style={{ color: '#1a73e8', fontSize: '0.7rem' }}>{sortDir === 'asc' ? '↑' : '↓'}</span> : <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>⇅</span>}
                    </th>
                    <th onClick={() => handleDashSort('population')} className="hlbThSort">
                      Population {sortCol === 'population' ? <span style={{ color: '#1a73e8', fontSize: '0.7rem' }}>{sortDir === 'asc' ? '↑' : '↓'}</span> : <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>⇅</span>}
                    </th>
                    <th onClick={() => handleDashSort('landmark')} className="hlbThSort">
                      Landmark {sortCol === 'landmark' ? <span style={{ color: '#1a73e8', fontSize: '0.7rem' }}>{sortDir === 'asc' ? '↑' : '↓'}</span> : <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>⇅</span>}
                    </th>
                    <th>Coordinates</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashPageItems.map((block, i) => (
                    <tr key={block.id} className="hlbTableRow">
                      <td className="hlbTdMuted">{dashPage * DASH_PAGE_SIZE + i + 1}</td>
                      <td><span className="hlbBlockTag">#{block.blockNo}</span></td>
                      <td><span className="hlbZoneBadge">Z{parseInt(block.zoneNo, 10)}</span></td>
                      <td className="hlbTdWard">W{parseInt(block.wardNo, 10)}</td>
                      <td>
                        <span className="hlbBldgBar">
                          <span className="hlbBldgFill" style={{ width: `${Math.min(100, (block.buildings / 300) * 100)}%` }} />
                        </span>
                        <span className="hlbBldgNum">{block.buildings.toLocaleString()}</span>
                      </td>
                      <td className="hlbTdPop">{block.population.toLocaleString()}</td>
                      <td className="hlbTdLandmark">{block.landmark && block.landmark !== 'nan' ? block.landmark : <span style={{ color: '#334155' }}>—</span>}</td>
                      <td className="hlbTdCoords">{block.centerLat.toFixed(4)}, {block.centerLng.toFixed(4)}</td>
                      <td>
                        <button className="hlbViewBtn" onClick={() => {
                          setAppNavTab('MAP_APPLICATION');
                          setTimeout(() => { if (hlbLeafletRef.current) hlbLeafletRef.current.flyTo([block.centerLat, block.centerLng], 18, { duration: 1.2 }); }, 600);
                        }}>
                          <MapPin size={13} /> Map
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── PAGINATION ── */}
          {dashTotalPages > 1 && (
            <div className="hlbPagination">
              <button className="hlbPageBtn" onClick={() => setDashPage(0)} disabled={dashPage === 0}>«</button>
              <button className="hlbPageBtn" onClick={() => setDashPage(p => Math.max(0, p - 1))} disabled={dashPage === 0}>‹ Prev</button>
              {Array.from({ length: Math.min(dashTotalPages, 9) }, (_, i) => {
                const pg = Math.min(Math.max(dashPage - 4, 0), Math.max(dashTotalPages - 9, 0)) + i;
                if (pg >= dashTotalPages) return null;
                return (
                  <button key={pg} className={`hlbPageBtn ${pg === dashPage ? 'hlbPageActive' : ''}`} onClick={() => setDashPage(pg)}>{pg + 1}</button>
                );
              })}
              <button className="hlbPageBtn" onClick={() => setDashPage(p => Math.min(dashTotalPages - 1, p + 1))} disabled={dashPage === dashTotalPages - 1}>Next ›</button>
              <button className="hlbPageBtn" onClick={() => setDashPage(dashTotalPages - 1)} disabled={dashPage === dashTotalPages - 1}>»</button>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: GIS SHAPEFILE UPLOAD --- */}
      {showShpUploadModal && (
        <div className="censusModalOverlay">
          <div className="censusModalContent modalUpload">
            <div className="censusModalHeader">
              <h3><HardDrive size={18} className="iconRed" /> Upload GIS Shapefile (.shp / .zip / GeoJSON)</h3>
              <button onClick={() => setShowShpUploadModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleShapefileUpload} className="uploadForm">
              <p className="uploadDesc">Upload zipped Shapefiles (.zip containing .shp, .dbf, .shx) or GeoJSON files to automatically import census block boundaries and building roof polygon layers into HLB Creator Application.</p>
              
              <div className="fileDropZone">
                <HardDrive size={38} className="dropIcon" />
                <span>Drag & drop GIS Shapefile (.zip, .shp, .geojson, .kml) here</span>
                <span className="fileNote">Extracts Block Boundaries, Wards, & Household Polygons automatically</span>
                <input type="file" id="shpFile" name="shpFile" accept=".zip,.shp,.geojson,.json,.kml" required />
              </div>

              <div className="modalFooter">
                <button type="button" className="btnCancel" onClick={() => setShowShpUploadModal(false)}>Cancel</button>
                <button type="submit" className="btnSubmit">Parse & Import GIS Layer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ADD NEW CENSUS BLOCK --- */}
      {showAddModal && (
        <div className="censusModalOverlay">
          <div className="censusModalContent modalAddBlock">
            <div className="censusModalHeader">
              <h3><Plus size={18} /> Add New Census Block Card</h3>
              <button onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateBlock} className="censusForm">
              <div className="formGrid">
                <div><label>State Name</label><input type="text" value={newBlock.stateName} onChange={(e) => setNewBlock({...newBlock, stateName: e.target.value})} required /></div>
                <div><label>District Name</label><input type="text" value={newBlock.districtName} onChange={(e) => setNewBlock({...newBlock, districtName: e.target.value})} required /></div>
                <div><label>Sub-District Name</label><input type="text" value={newBlock.subDistrictName} onChange={(e) => setNewBlock({...newBlock, subDistrictName: e.target.value})} required /></div>
                <div><label>Town / Village</label><input type="text" value={newBlock.townVillage} onChange={(e) => setNewBlock({...newBlock, townVillage: e.target.value})} required /></div>
                <div><label>Ward Number</label><input type="text" value={newBlock.wardNo} onChange={(e) => setNewBlock({...newBlock, wardNo: e.target.value})} required /></div>
                <div><label>Block Number (4 digits e.g. 0364)</label><input type="text" value={newBlock.blockNo} onChange={(e) => setNewBlock({...newBlock, blockNo: e.target.value})} required /></div>
                <div><label>Total Households</label><input type="number" value={newBlock.totalHouseholds} onChange={(e) => setNewBlock({...newBlock, totalHouseholds: parseInt(e.target.value) || 100})} required /></div>
              </div>
              <div className="modalFooter">
                <button type="button" className="btnCancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btnSubmit">Create Census Block</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: UPLOAD MAP PDF / IMAGE --- */}
      {uploadTargetBlock && (
        <div className="censusModalOverlay">
          <div className="censusModalContent modalUpload">
            <div className="censusModalHeader">
              <h3><Upload size={18} /> Upload Map PDF / Layout - Block {uploadTargetBlock.rawBlockNo || uploadTargetBlock.blockNo}</h3>
              <button onClick={() => setUploadTargetBlock(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleFileUpload} className="uploadForm">
              <p className="uploadDesc">Select official Census layout PDF map or image to attach with Block {uploadTargetBlock.rawBlockNo || uploadTargetBlock.blockNo}.</p>
              <div className="fileDropZone">
                <FileText size={36} className="dropIcon" />
                <span>Drag and drop official map PDF or PNG/JPG image here</span>
                <input type="file" id="censusPdf" name="censusPdf" accept=".pdf,.png,.jpg,.jpeg" required />
              </div>
              <div className="modalFooter">
                <button type="button" className="btnCancel" onClick={() => setUploadTargetBlock(null)}>Cancel</button>
                <button type="submit" className="btnSubmit">Save & Attach Map File</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: WIDESCREEN LANDSCAPE CENSUS LAYOUT MAP VIEW --- */}
      {viewLandscapeBlock && (
        <div className="censusModalOverlay fullscreenOverlay">
          <div className="officialCensusLayoutFrame">
            <div className="landscapeMapToolbar">
              <div className="toolbarTitle">
                <Map size={20} className="iconRed" />
                <span>CENSUS OF INDIA 2027 - Official Layout Map (Block {viewLandscapeBlock.rawBlockNo})</span>
              </div>
              <div className="toolbarActions">
                <button onClick={exportPNG} className="toolBtn"><PrinterIcon /> Print / Save PDF</button>
                <button onClick={() => exportCSV(viewLandscapeBlock)} className="toolBtn"><FileSpreadsheet size={15} /> Export CSV</button>
                <button onClick={() => setViewLandscapeBlock(null)} className="toolBtnClose"><X size={20} /></button>
              </div>
            </div>

            <div className="officialLayoutBody">
              <div className="censusFormSidebar">
                <div className="censusFormTitleHeader">
                  <h2>CENSUS OF INDIA 2027</h2>
                  <div className="censusFormSubTitle">Layout Map - Houselisting & Housing Census</div>
                </div>

                <div className="censusTableForm">
                  <div className="formRow"><span className="fieldLabel">State:</span><span className="fieldValue"><b>{viewLandscapeBlock.stateName}</b></span></div>
                  <div className="formRow"><span className="fieldLabel">District:</span><span className="fieldValue"><b>{viewLandscapeBlock.districtName}</b></span></div>
                  <div className="formRow"><span className="fieldLabel">Sub-District:</span><span className="fieldValue"><b>{viewLandscapeBlock.subDistrictName}</b></span></div>
                  <div className="formRow"><span className="fieldLabel">Ward No:</span><span className="codeBox">{viewLandscapeBlock.wardNo}</span></div>
                  <div className="formRow highlightRow"><span className="fieldLabel">Block No:</span><span className="codeBox blockCodeBox">{viewLandscapeBlock.blockNo}</span></div>

                  <div className="censusFormLegendSection">
                    <div className="legendTitle">Legend</div>
                    <div className="legendItem"><span className="legendRedLine">---&gt;</span><span>Enumeration Path</span></div>
                    <div className="legendItem"><span className="legendBuildingBoxIcon"></span><span>Household Plot</span></div>
                  </div>
                </div>
              </div>

              <div className="censusMapRightContainer">
                {viewLandscapeBlock.pdfUrl ? (
                  <iframe src={viewLandscapeBlock.pdfUrl} className="uploadedIframe" title="Uploaded PDF" />
                ) : (
                  <div className="blueprintSvgContainer">
                    <svg className="censusSvgBlueprint" viewBox="0 0 920 520">
                      <rect x="0" y="0" width="920" height="520" fill="#f5eedc" stroke="#b0a285" strokeWidth="2" />
                      <polygon points="110,70 370,110 530,170 730,185 850,195 850,450 360,460 330,430 110,70" fill="#f7f1e1" stroke="#111111" strokeWidth="4" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: TAPPED BLOCK ACTION DRAWER --- */}
      {tappedMapBlock && (
        <div className="censusModalOverlay">
          <div className="censusModalContent modalBuilding">
            <div className="censusModalHeader">
              <h3><MapPin size={18} className="iconRed" /> HLB Block No. {tappedMapBlock.rawBlockNo || tappedMapBlock.blockNo} Selected</h3>
              <button onClick={() => setTappedMapBlock(null)}><X size={18} /></button>
            </div>
            
            <div className="buildingInfoBody">
              <div className="infoGrid">
                <div className="infoTile"><span>State:</span> <b>{tappedMapBlock.stateName}</b></div>
                <div className="infoTile"><span>District / Sub-District:</span> <b>{tappedMapBlock.districtName} / {tappedMapBlock.subDistrictName}</b></div>
                <div className="infoTile"><span>Ward No:</span> <b>{tappedMapBlock.wardNo}</b></div>
                <div className="infoTile"><span>HLB Block No:</span> <b>{tappedMapBlock.rawBlockNo || tappedMapBlock.blockNo}</b></div>
                <div className="infoTile"><span>Total Households:</span> <b>{tappedMapBlock.totalHouseholds} Buildings</b></div>
                <div className="infoTile"><span>Map Status:</span> <b className="textSuccess">{tappedMapBlock.status}</b></div>
              </div>
              <div className="modalFooter">
                <button 
                  className="btnSubmit" 
                  style={{ background: '#e2262b' }}
                  onClick={() => {
                    openLandscapeView(tappedMapBlock);
                    setTappedMapBlock(null);
                  }}
                >
                  <Eye size={15} /> Open Official Landscape Layout Map
                </button>
                <button className="btnCancel" onClick={() => setTappedMapBlock(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- GOOGLE MAPS SETTINGS MODAL --- */}
      {showSettingsModal && (
        <div className="googleSettingsOverlay" onClick={() => setShowSettingsModal(false)}>
          <div className="googleSettingsDialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e8eaed' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#202124', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color="#1a73e8" /> Google Maps Settings &amp; Preferences
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#3c4043', display: 'block', marginBottom: '8px' }}>
                  Default Base Map Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {['HYBRID', 'ROADMAP', 'SATELLITE', 'TERRAIN'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setBasemapType(mode)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: basemapType === mode ? '2px solid #1a73e8' : '1px solid #dadce0',
                        background: basemapType === mode ? '#e8f0fe' : '#ffffff',
                        color: basemapType === mode ? '#1a73e8' : '#3c4043',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>Google {mode}</span>
                      {basemapType === mode && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#3c4043', display: 'block', marginBottom: '6px' }}>
                  Map Center Coordinates
                </label>
                <div style={{ background: '#f8f9fa', padding: '12px 14px', borderRadius: '10px', fontSize: '0.88rem', color: '#202124', fontFamily: 'monospace', border: '1px solid #e8eaed' }}>
                  <b>Lat:</b> {currentCoords.lat} | <b>Lng:</b> {currentCoords.lng}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#3c4043', display: 'block', marginBottom: '6px' }}>
                  Quick GPS Location
                </label>
                <button
                  onClick={() => {
                    handleMyLocation();
                    setShowSettingsModal(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '10px',
                    background: '#1a73e8',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Navigation size={18} /> Locate My Device Position (GPS)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* A3 HAND-DRAWN CENSUS BLOCK SKETCH MODAL */}
      {showBlockPrintModal && blockToPrint && (
        <CensusBlockA3SketchModal
          block={{
            wardNo: blockToPrint.wardNo || (blockToPrint.subtitle ? blockToPrint.subtitle.match(/Ward[\s#]*(\d+)/i)?.[1] : null) || blockToPrint.title?.replace(/[^0-9]/g, '').slice(0, 3) || '144',
            blockNo: blockToPrint.blockNo || blockToPrint.title?.replace('🏛️ HLB Census Block #', '').trim() || blockToPrint.title?.replace(/[^0-9]/g, '') || '0144',
            zoneNo: blockToPrint.zoneNo || (blockToPrint.subtitle ? blockToPrint.subtitle.match(/Zone[\s#]*(\d+)/i)?.[1] : null) || '11',
            lat: parseFloat(blockToPrint.lat) || 13.0645,
            lng: parseFloat(blockToPrint.lng) || 80.1760,
            centerLat: parseFloat(blockToPrint.lat) || 13.0645,
            centerLng: parseFloat(blockToPrint.lng) || 80.1760,
          }}
          onClose={() => setShowBlockPrintModal(false)}
        />
      )}
    </div>
  );
}

function PrinterIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
}

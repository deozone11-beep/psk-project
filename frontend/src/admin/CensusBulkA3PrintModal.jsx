import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Printer, Download, X, Layers, Compass, ZoomIn, ZoomOut, 
  RotateCcw, Eye, FileText, CheckCircle2, Building, MapPin, 
  Sparkles, PenTool, Hash, FileDown, CheckSquare, Square, 
  Filter, Search, RefreshCw, AlertCircle, Play, Pause, ArrowRight
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CensusBlockA3SingleSheet from './CensusBlockA3SingleSheet';

export default function CensusBulkA3PrintModal({ 
  initialWard = '144', 
  initialZone = '11', 
  availableBlocksList = [], 
  onClose 
}) {
  const [selectedWard, setSelectedWard] = useState(initialWard || '144');
  const [selectedZone, setSelectedZone] = useState(initialZone || '11');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sketchStyle, setSketchStyle] = useState('PENCIL'); // 'PENCIL' | 'BLUEPRINT' | 'CADASTRAL'
  const [language, setLanguage] = useState('TAMIL'); // 'TAMIL' | 'ENGLISH'
  const [paperSize, setPaperSize] = useState('A3'); // 'A3' | 'A4'
  const [showDoorNumbers, setShowDoorNumbers] = useState(true);
  const [showStreetNames, setShowStreetNames] = useState(true);
  const [showHatching, setShowHatching] = useState(true);

  const [enumeratorName, setEnumeratorName] = useState('R. Sundaram (Enumerator #0482)');
  const [supervisorName, setSupervisorName] = useState('K. Murugan (Supervisor #0112)');
  const [notes, setNotes] = useState('All buildings numbered sequentially following clockwise route from North-West corner.');

  // Data cache
  const [hlbFeatures, setHlbFeatures] = useState([]);
  const [wardBuildings, setWardBuildings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selected Block IDs for Bulk Print
  const [selectedBlockKeys, setSelectedBlockKeys] = useState(new Set());

  // Generation / Progress State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [currentGeneratingBlock, setCurrentGeneratingBlock] = useState(null);
  const abortControllerRef = useRef(false);

  // Single Block Preview State
  const [previewBlock, setPreviewBlock] = useState(null);

  // Load GeoJSON Block Features and Ward Buildings once
  useEffect(() => {
    let isMounted = true;
    setLoadingData(true);

    async function loadResources() {
      try {
        // 1. Load HLB Polys
        let allPolys = [];
        if (window.__hlbPolysCache) {
          allPolys = window.__hlbPolysCache;
        } else {
          const pRes = await fetch('/hlb_polys.json');
          if (pRes.ok) {
            const pData = await pRes.json();
            allPolys = pData.features || [];
            window.__hlbPolysCache = allPolys;
          }
        }

        // 2. Load Ward Buildings for the selected ward
        const cleanWard = String(parseInt(selectedWard, 10) || 1).padStart(3, '0');
        let bldgs = [];
        if (window.__wardBuildingsCache && window.__wardBuildingsCache[cleanWard]) {
          bldgs = window.__wardBuildingsCache[cleanWard];
        } else {
          const bRes = await fetch(`/gcc_buildings/ward_${cleanWard}.json`);
          if (bRes.ok) {
            const bData = await bRes.json();
            bldgs = bData.features || [];
            if (window.__wardBuildingsCache) {
              window.__wardBuildingsCache[cleanWard] = bldgs;
            }
          }
        }

        if (isMounted) {
          setHlbFeatures(allPolys);
          setWardBuildings(bldgs);
          setLoadingData(false);
        }
      } catch (e) {
        console.error('Error pre-loading resources for bulk print:', e);
        if (isMounted) setLoadingData(false);
      }
    }

    loadResources();
    return () => { isMounted = false; };
  }, [selectedWard]);

  // Extract all available blocks filtered by Ward/Zone/Search
  const filteredBlocks = useMemo(() => {
    let list = [];
    if (hlbFeatures.length > 0) {
      const cleanW = String(parseInt(selectedWard, 10) || 144).padStart(3, '0');
      const rawW = String(parseInt(selectedWard, 10) || 144);
      
      hlbFeatures.forEach((f, idx) => {
        const p = f.properties || {};
        const bId = String(p.hlb_id || p.code_block || `B-${idx+1}`);
        const wId = String(p.ward_no || p.code_ward || '');
        const zId = String(p.zone_no || p.code_st || '11');

        if (wId === cleanW || wId === rawW || wId.includes(rawW) || !selectedWard) {
          let sumLat = 0, sumLng = 0, ptCount = 0;
          function calcCentroid(arr) {
            if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number') {
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

          const lat = ptCount > 0 ? (sumLat / ptCount) : 13.0645;
          const lng = ptCount > 0 ? (sumLng / ptCount) : 80.1760;

          list.push({
            id: `${wId}_${bId}_${idx}`,
            blockNo: bId,
            wardNo: wId || cleanW,
            zoneNo: zId || '11',
            buildings: p.no_of_buil || p.drone_buildings || 0,
            households: p.households || p.no_of_buil || 180,
            landmark: p.landmark || p.name_vt || `Ward ${wId} Block ${bId}`,
            lat,
            lng,
            centerLat: lat,
            centerLng: lng,
            geometry: f.geometry,
            properties: p
          });
        }
      });
    }

    // Fallback if hlbFeatures not yet loaded or empty
    if (list.length === 0 && availableBlocksList.length > 0) {
      list = availableBlocksList.filter(b => {
        const bw = String(b.wardNo || '').replace(/\D/g, '');
        const sw = String(selectedWard || '').replace(/\D/g, '');
        return !sw || bw === sw || bw.includes(sw);
      });
    }

    // Apply Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(b => 
        String(b.blockNo).toLowerCase().includes(q) || 
        String(b.wardNo).toLowerCase().includes(q) || 
        String(b.landmark || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [hlbFeatures, availableBlocksList, selectedWard, searchQuery]);

  // Default: Select all blocks in the current filtered view when loaded
  useEffect(() => {
    if (filteredBlocks.length > 0 && selectedBlockKeys.size === 0) {
      const allKeys = new Set(filteredBlocks.map(b => b.id));
      setSelectedBlockKeys(allKeys);
    }
  }, [filteredBlocks]);

  const toggleSelectBlock = (id) => {
    setSelectedBlockKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allKeys = new Set(filteredBlocks.map(b => b.id));
    setSelectedBlockKeys(allKeys);
  };

  const handleDeselectAll = () => {
    setSelectedBlockKeys(new Set());
  };

  const selectedBlocksList = useMemo(() => {
    return filteredBlocks.filter(b => selectedBlockKeys.has(b.id));
  }, [filteredBlocks, selectedBlockKeys]);

  // ==========================================
  // BATCH COMBINED MULTI-PAGE PDF GENERATOR
  // ==========================================
  const printContainerRef = useRef(null);

  const handleGenerateBulkPdf = async () => {
    if (selectedBlocksList.length === 0) {
      alert('Please select at least one block to generate PDF.');
      return;
    }

    setIsGenerating(true);
    abortControllerRef.current = false;
    setGenerationProgress(0);

    const isA4 = paperSize === 'A4';
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: isA4 ? 'a4' : 'a3',
      compress: true
    });

    const pageWidth = isA4 ? 297 : 420;
    const pageHeight = isA4 ? 210 : 297;

    try {
      let pagesAdded = 0;
      for (let i = 0; i < selectedBlocksList.length; i++) {
        if (abortControllerRef.current) {
          setGenerationStatus('Batch generation cancelled by user.');
          break;
        }

        const blk = selectedBlocksList[i];
        setCurrentGeneratingBlock(blk);
        setGenerationStatus(`Rendering Map ${i + 1} of ${selectedBlocksList.length}: Ward ${blk.wardNo} Block #${blk.blockNo}...`);
        setGenerationProgress(Math.round(((i + 0.2) / selectedBlocksList.length) * 100));

        const targetWrapper = document.getElementById(`bulk-print-sheet-${blk.id}`);
        if (targetWrapper) {
          // Scroll into view to ensure SVG and images are active in DOM
          targetWrapper.scrollIntoView({ behavior: 'auto', block: 'nearest' });

          const sheetElem = targetWrapper.querySelector('.a3OfficialSheet') || targetWrapper;

          // Wait until sheet finished internal loading (up to 1.8 seconds max)
          let waitAttempts = 0;
          while (waitAttempts < 6 && sheetElem.getAttribute('data-loaded') !== 'true') {
            await new Promise(r => setTimeout(r, 300));
            waitAttempts++;
          }
          await new Promise(r => setTimeout(r, 200));

          try {
            const canvas = await html2canvas(sheetElem, {
              scale: 1.2,
              useCORS: true,
              allowTaint: true,
              imageTimeout: 10000,
              backgroundColor: '#ffffff',
              logging: false,
              ignoreElements: (element) => element.classList && element.classList.contains('no-print')
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.88);
            if (pagesAdded > 0) {
              pdf.addPage(isA4 ? 'a4' : 'a3', 'landscape');
            }
            pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
            pagesAdded++;
          } catch (renderErr) {
            console.warn(`Error rendering block #${blk.blockNo}:`, renderErr);
          }
        }

        setGenerationProgress(Math.round(((i + 1) / selectedBlocksList.length) * 100));
      }

      if (!abortControllerRef.current && pagesAdded > 0) {
        setGenerationStatus('Finalizing Multi-page A3 PDF Download...');
        const cleanW = String(parseInt(selectedWard, 10) || 144).padStart(3, '0');
        pdf.save(`Census_2027_Ward_${cleanW}_Bulk_A3_Maps_${pagesAdded}_Blocks.pdf`);
        setGenerationStatus('Download Complete! 🎉');
        setTimeout(() => {
          setIsGenerating(false);
          setCurrentGeneratingBlock(null);
        }, 1200);
      } else if (!abortControllerRef.current && pagesAdded === 0) {
        setGenerationStatus('Could not render any selected sheets.');
        setTimeout(() => setIsGenerating(false), 2000);
      }
    } catch (err) {
      console.error('Bulk PDF error:', err);
      setGenerationStatus('Error occurred during PDF generation.');
      setTimeout(() => setIsGenerating(false), 2000);
    }
  };

  // Direct Browser Native Bulk Print
  const handleBrowserBulkPrint = () => {
    if (selectedBlocksList.length === 0) {
      alert('Please select at least one block to print.');
      return;
    }
    const origTitle = document.title;
    document.title = `Census_2027_Ward_${selectedWard}_Bulk_A3_Maps`;
    window.print();
    setTimeout(() => { document.title = origTitle; }, 2000);
  };

  return (
    <div className="a3SketchModalOverlay">
      {/* TOP FLOATING HEADER & CONTROLS */}
      <div className="a3SketchControlBar no-print" style={{ maxWidth: '1600px' }}>
        <div className="a3ControlLeft">
          <div className="a3TitleBadge" style={{ background: 'rgba(37, 99, 235, 0.25)', border: '1px solid rgba(59, 130, 246, 0.5)' }}>
            <Printer size={20} color="#60a5fa" />
            <span className="a3MainTitle" style={{ fontSize: '0.98rem' }}>
              Official A3 Bulk Map Print &amp; PDF Export (மொத்தமாக A3 வரைபடம்)
            </span>
            <span className="a3SubBadge" style={{ background: '#2563eb', padding: '3px 9px' }}>
              Ward {selectedWard} • {selectedBlocksList.length} Selected
            </span>
          </div>

          {/* Ward Selector */}
          <div className="a3StyleGroup">
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', padding: '0 4px', fontWeight: 700 }}>Ward:</span>
            {['144', '145', '148', '152', '072', '085'].map(w => (
              <button
                key={w}
                className={`a3StyleBtn ${selectedWard === w ? 'active' : ''}`}
                onClick={() => setSelectedWard(w)}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="a3StyleGroup">
            <button
              className={`a3StyleBtn ${language === 'TAMIL' ? 'active' : ''}`}
              onClick={() => setLanguage('TAMIL')}
            >
              🇮🇳 தமிழ் (Tamil)
            </button>
            <button
              className={`a3StyleBtn ${language === 'ENGLISH' ? 'active' : ''}`}
              onClick={() => setLanguage('ENGLISH')}
            >
              🇬🇧 English
            </button>
          </div>

          {/* Style Selector */}
          <div className="a3StyleGroup">
            {[
              { key: 'PENCIL', label: '✏️ Pencil Sketch' },
              { key: 'BLUEPRINT', label: '📐 Blueprint' },
              { key: 'CADASTRAL', label: '🎨 Cadastral GIS' }
            ].map(s => (
              <button
                key={s.key}
                className={`a3StyleBtn ${sketchStyle === s.key ? 'active' : ''}`}
                onClick={() => setSketchStyle(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Paper Size Setting */}
          <div className="a3StyleGroup">
            <select
              className="a3StyleBtn"
              style={{ cursor: 'pointer', padding: '4px 8px' }}
              value={paperSize}
              onChange={e => setPaperSize(e.target.value)}
              title="Select Print Paper Size"
            >
              <option value="A3">📄 A3 Landscape (Official 420×297mm)</option>
              <option value="A4">📄 A4 Landscape (297×210mm)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="a3ControlRight">
          <button 
            className="a3ActionBtn btnPrint" 
            onClick={handleBrowserBulkPrint}
            disabled={isGenerating || selectedBlocksList.length === 0}
            style={{ padding: '8px 16px', fontWeight: 800 }}
          >
            <Printer size={16} /> Bulk Print Queue ({selectedBlocksList.length})
          </button>

          <button 
            className="a3ActionBtn btnPdf" 
            onClick={handleGenerateBulkPdf}
            disabled={isGenerating || selectedBlocksList.length === 0}
            style={{ 
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              padding: '8px 18px',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            <FileDown size={16} /> Export Combined Multi-Page PDF
          </button>

          <button className="a3CloseBtn" onClick={onClose} title="Close Bulk Print Modal">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* GENERATION PROGRESS MODAL OVERLAY */}
      {isGenerating && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '20px',
            padding: '36px 44px',
            maxWidth: '520px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.2)',
              border: '2px solid #3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <RefreshCw size={28} color="#60a5fa" className="spinning" />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              Generating Multi-Page A3 PDF
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '20px' }}>
              {generationStatus || 'Processing layout maps...'}
            </p>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{
                height: '100%',
                width: `${generationProgress}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                borderRadius: '6px',
                transition: 'width 0.3s ease'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, marginBottom: '24px' }}>
              <span>{generationProgress}% Complete</span>
              <span>{selectedBlocksList.length} Total Pages</span>
            </div>

            <button
              onClick={() => { abortControllerRef.current = true; }}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                padding: '8px 20px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel Batch Process
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER: LEFT BLOCK SELECTION PANEL + RIGHT PREVIEW & MULTI-PAGE PRINT STACK */}
      <div style={{
        display: 'flex',
        gap: '16px',
        width: '100%',
        maxWidth: '1600px',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden'
      }}>
        {/* LEFT COLUMN: BLOCK SELECTION & OPTIONS (no-print) */}
        <div className="no-print" style={{
          width: '380px',
          flexShrink: 0,
          background: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}>
          {/* Search and Select All controls */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} color="#60a5fa" /> Select Blocks to Print
              </span>
              <span style={{
                background: '#2563eb',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.74rem',
                fontWeight: 800
              }}>
                {selectedBlocksList.length} / {filteredBlocks.length}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 10px',
              gap: '8px'
            }}>
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search Block # or Landmark..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <X size={14} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={handleSelectAll}
                style={{
                  flex: 1,
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#93c5fd',
                  padding: '6px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <CheckSquare size={13} /> Select All
              </button>
              <button
                onClick={handleDeselectAll}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  padding: '6px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Square size={13} /> Deselect All
              </button>
            </div>
          </div>

          {/* Scrollable Blocks List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '4px'
          }}>
            {loadingData ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                <Sparkles size={24} className="spinning" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: '0.82rem' }}>Loading Ward {selectedWard} Blocks...</p>
              </div>
            ) : filteredBlocks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                <AlertCircle size={24} style={{ margin: '0 auto 10px', color: '#f59e0b' }} />
                <p style={{ fontSize: '0.82rem' }}>No blocks found for Ward {selectedWard}.</p>
              </div>
            ) : (
              filteredBlocks.map(b => {
                const isSelected = selectedBlockKeys.has(b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => toggleSelectBlock(b.id)}
                    style={{
                      background: isSelected ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Controlled by container click
                        style={{ accentColor: '#2563eb', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>
                            HLB #{b.blockNo}
                          </span>
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                            fontSize: '0.68rem',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            Ward {b.wardNo}
                          </span>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.74rem', margin: '2px 0 0 0' }}>
                          {b.landmark || `Ward ${b.wardNo} Block ${b.blockNo}`} • {b.households} Houses
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewBlock(b);
                      }}
                      title="Preview this Block"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#60a5fa',
                        padding: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Signatures & Customization info */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                  Enumerator:
                </span>
                <input
                  type="text"
                  value={enumeratorName}
                  onChange={e => setEnumeratorName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    color: '#ffffff',
                    fontSize: '0.74rem'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                  Supervisor:
                </span>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={e => setSupervisorName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    color: '#ffffff',
                    fontSize: '0.74rem'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SCROLLABLE A3 SHEETS CONTAINER */}
        <div 
          ref={printContainerRef}
          className="a3CanvasScroll bulkPrintScrollContainer"
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#090d16',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {selectedBlocksList.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '120px', color: '#94a3b8' }}>
              <Printer size={48} style={{ margin: '0 auto 16px', color: '#3b82f6', opacity: 0.7 }} />
              <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '8px' }}>No Blocks Selected</h3>
              <p style={{ fontSize: '0.88rem' }}>Please select one or more blocks from the left panel to preview and bulk print.</p>
            </div>
          ) : (
            selectedBlocksList.map((blk, idx) => (
              <div 
                key={blk.id} 
                id={`bulk-print-sheet-${blk.id}`}
                style={{ 
                  marginBottom: '28px',
                  boxShadow: '0 12px 35px rgba(0,0,0,0.5)'
                }}
              >
                {/* Visual Sheet Banner (no-print) */}
                <div className="no-print" style={{
                  background: '#1e293b',
                  color: '#93c5fd',
                  padding: '6px 14px',
                  borderRadius: '10px 10px 0 0',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderBottom: 'none'
                }}>
                  <span>Page {idx + 1} of {selectedBlocksList.length} • Ward {blk.wardNo} HLB #{blk.blockNo}</span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>{paperSize} Landscape Official Layout</span>
                </div>

                <CensusBlockA3SingleSheet
                  block={blk}
                  language={language}
                  sketchStyle={sketchStyle}
                  paperSize={paperSize}
                  showDoorNumbers={showDoorNumbers}
                  showStreetNames={showStreetNames}
                  showHatching={showHatching}
                  enumeratorName={enumeratorName}
                  supervisorName={supervisorName}
                  notes={notes}
                  cachedHlbPolys={hlbFeatures}
                  cachedWardBuildings={wardBuildings}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

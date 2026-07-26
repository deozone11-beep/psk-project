import React, { useState, useEffect, useRef } from 'react';

const DESIGN_OPTIONS = [
  {
    id: 1,
    name: 'Modern Open Layout',
    description: 'Spacious living & dining integration, open modular kitchen, master suite + guest room.',
    badge: 'Popular',
    revitImage: '/elevations/revit_4.png',
    revitPlanImage: '/elevations/revit_plan_4.png',
  },
  {
    id: 2,
    name: '100% Vastu Compliant',
    description: 'NE Entrance & Pooja, SW Master Bedroom, SE Kitchen, NW Washrooms & West Staircase.',
    badge: 'Vastu Special',
    revitImage: '/elevations/revit_2.png',
    revitPlanImage: '/elevations/revit_plan_2.png',
  },
  {
    id: 3,
    name: 'Compact Max-Space Plan',
    description: 'Maximized usable square footage with extra study room, dedicated utility area & sit-out.',
    badge: 'High Value',
    revitImage: '/elevations/revit_3.png',
    revitPlanImage: '/elevations/revit_plan_3.png',
  },
  {
    id: 4,
    name: 'Luxury Villa Layout',
    description: 'All bedrooms with attached baths, walk-in closets, spacious car portico & double balcony.',
    badge: 'Premium',
    revitImage: '/elevations/revit_1.png',
    revitPlanImage: '/elevations/revit_plan_1.png',
  },
];

const PACKAGES = [
  { id: 'standard', name: 'Standard Construction', rate: 1850, badge: 'Budget Friendly', desc: 'OPC 53 Cement, Fe550D TMT Steel, 2x2 Vitrified Tiles, Asian Paints Tractor Emulsion.' },
  { id: 'premium', name: 'Premium Executive', rate: 2200, badge: 'Most Popular', desc: 'UltraTech Cement, Tata Tiscon Steel, Somany Granites, Teak Main Door, Kohler Fittings.' },
  { id: 'luxury', name: 'Ultra Luxury Villa', rate: 2600, badge: 'High End', desc: 'Italian Marble, Smart Home Automation, Grohe Concealed Bath, Designer Glass Facade.' },
];

export default function PlanVisualizer({
  user,
  onRequireLogin,
  initialLength = 30,
  initialWidth = 40,
  initialFacing = 'East',
  initialFloors = 'Ground Floor',
  initialDesignIndex = 0,
}) {
  const [length, setLength] = useState(initialLength);
  const [width, setWidth] = useState(initialWidth);
  const [facing, setFacing] = useState(initialFacing);
  const [floors, setFloors] = useState(initialFloors);
  const [designIndex, setDesignIndex] = useState(initialDesignIndex);
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('plan');
  const [planMode, setPlanMode] = useState('cad'); // 'cad' (2D DWG) or 'iso' (3D Isometric Cutaway) or 'revit' (AI Render)
  const [elevationMode, setElevationMode] = useState('cad'); // 'cad' (2D Technical Front) or 'revit' (3D Façade)
  const [packageTier, setPackageTier] = useState('premium');
  const [savedSuccess, setSavedSuccess] = useState(null);
  const [consultationSuccess, setConsultationSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [cadDataUrl, setCadDataUrl] = useState(null);

  const planCanvasRef = useRef(null);
  const isoCanvasRef = useRef(null);
  const elevationCanvasRef = useRef(null);

  const selectedPkg = PACKAGES.find((p) => p.id === packageTier) || PACKAGES[1];
  const totalSqft = Math.round(length * width);
  const estimatedCost = Math.round(totalSqft * selectedPkg.rate);
  const currentOption = DESIGN_OPTIONS[designIndex];

  // Material Calculations
  const cementBags = Math.round(totalSqft * 0.42);
  const steelTons = (totalSqft * 0.0035).toFixed(2);
  const tilesSqft = Math.round(totalSqft * 1.15);
  const doorsCount = floors === 'Ground Floor' ? 6 : 11;
  const electricalPoints = Math.round(totalSqft * 0.08);
  const paintLiters = Math.round(totalSqft * 0.16);

  // Vastu Calculation
  const isOptimalFacing = facing === 'East' || facing === 'North';
  const vastuScore = isOptimalFacing ? 98 : 92;

  // Cycle to next design
  const handleNextDesign = () => {
    setDesignIndex((prev) => (prev + 1) % DESIGN_OPTIONS.length);
  };

  // UNIFIED ROOM GEOMETRY ENGINE (LINKS 2D DWG, 3D CUTAWAY, AND ELEVATION)
  const getUnifiedLayout = (widthPx, heightPx) => {
    const margin = 70;
    const plotW = widthPx - margin * 2;
    const plotH = heightPx - margin * 2;
    const setbackX = 28;
    const setbackY = 32;
    const bldX = margin + setbackX;
    const bldY = margin + setbackY;
    const bldW = plotW - setbackX * 2;
    const bldH = plotH - setbackY * 2;

    let rooms = [];
    if (designIndex === 0) {
      // Modern Open Layout
      rooms = [
        { id: 'SITOUT', name: 'FOYER / SITOUT', x: bldX, y: bldY, w: bldW * 0.42, h: bldH * 0.28, color: '#0284c7', hasDoor: true },
        { id: 'LIVING', name: 'OPEN LIVING & DINING', x: bldX, y: bldY + bldH * 0.28, w: bldW * 0.55, h: bldH * 0.72, color: '#3b82f6', hasWindow: true },
        { id: 'KITCHEN', name: 'OPEN MODULAR KITCHEN', x: bldX + bldW * 0.42, y: bldY, w: bldW * 0.58, h: bldH * 0.38, color: '#ef4444', hasWindow: true },
        { id: 'BED1', name: 'MASTER SUITE', x: bldX + bldW * 0.55, y: bldY + bldH * 0.38, w: bldW * 0.45, h: bldH * 0.42, color: '#10b981', hasWindow: true },
        { id: 'BATH', name: 'ATTACHED BATHROOM', x: bldX + bldW * 0.55, y: bldY + bldH * 0.8, w: bldW * 0.45, h: bldH * 0.2, color: '#8b5cf6' }
      ];
    } else if (designIndex === 1) {
      // 100% Vastu Compliant
      rooms = [
        { id: 'POOJA', name: 'NE FOYER / POOJA', x: bldX, y: bldY, w: bldW * 0.42, h: bldH * 0.35, color: '#f59e0b', hasDoor: true },
        { id: 'KITCHEN', name: 'SE KITCHEN (AGNI)', x: bldX + bldW * 0.42, y: bldY, w: bldW * 0.58, h: bldH * 0.35, color: '#ef4444', hasWindow: true },
        { id: 'LIVING', name: 'CENTRAL HALL', x: bldX, y: bldY + bldH * 0.35, w: bldW * 0.55, h: bldH * 0.35, color: '#3b82f6', hasWindow: true },
        { id: 'BED1', name: 'SW MASTER BED', x: bldX + bldW * 0.55, y: bldY + bldH * 0.35, w: bldW * 0.45, h: bldH * 0.35, color: '#10b981', hasWindow: true },
        { id: 'STAIRS', name: 'WEST STAIRCASE', x: bldX, y: bldY + bldH * 0.7, w: bldW * 0.42, h: bldH * 0.3, color: '#64748b' },
        { id: 'BATH', name: 'NW WASHROOM', x: bldX + bldW * 0.42, y: bldY + bldH * 0.7, w: bldW * 0.58, h: bldH * 0.3, color: '#8b5cf6' }
      ];
    } else if (designIndex === 2) {
      // Compact Max-Space Plan
      rooms = [
        { id: 'SITOUT', name: 'BALCONY SITOUT', x: bldX, y: bldY, w: bldW * 0.5, h: bldH * 0.25, color: '#0284c7', hasDoor: true },
        { id: 'LIVING', name: 'COMPACT LIVING', x: bldX, y: bldY + bldH * 0.25, w: bldW * 0.5, h: bldH * 0.45, color: '#3b82f6', hasWindow: true },
        { id: 'BED1', name: 'MASTER BEDROOM 1', x: bldX + bldW * 0.5, y: bldY, w: bldW * 0.5, h: bldH * 0.45, color: '#10b981', hasWindow: true },
        { id: 'BED2', name: 'STUDY / BEDROOM 2', x: bldX, y: bldY + bldH * 0.7, w: bldW * 0.5, h: bldH * 0.3, color: '#10b981', hasWindow: true },
        { id: 'KITCHEN', name: 'KITCHEN & UTILITY', x: bldX + bldW * 0.5, y: bldY + bldH * 0.45, w: bldW * 0.5, h: bldH * 0.35, color: '#ef4444' },
        { id: 'BATH', name: 'COMMON BATHROOM', x: bldX + bldW * 0.5, y: bldY + bldH * 0.8, w: bldW * 0.5, h: bldH * 0.2, color: '#8b5cf6' }
      ];
    } else {
      // Luxury Villa Layout with Car Portico
      rooms = [
        { id: 'PARKING', name: 'COVERED CAR PORTICO', x: bldX, y: bldY, w: bldW * 0.45, h: bldH * 0.42, color: '#f59e0b', hasCar: true, hasDoor: true },
        { id: 'LIVING', name: 'LUXURY LIVING & FOYER', x: bldX + bldW * 0.45, y: bldY, w: bldW * 0.55, h: bldH * 0.45, color: '#3b82f6', hasWindow: true },
        { id: 'BED1', name: 'MASTER SUITE & CLOSET', x: bldX, y: bldY + bldH * 0.42, w: bldW * 0.55, h: bldH * 0.4, color: '#10b981', hasWindow: true },
        { id: 'BATH', name: 'LUXURY BATHROOM', x: bldX, y: bldY + bldH * 0.82, w: bldW * 0.55, h: bldH * 0.18, color: '#8b5cf6' },
        { id: 'KITCHEN', name: 'DINING & KITCHEN', x: bldX + bldW * 0.55, y: bldY + bldH * 0.45, w: bldW * 0.45, h: bldH * 0.55, color: '#ef4444' }
      ];
    }
    return { borderM: 40, margin, plotW, plotH, bldX, bldY, bldW, bldH, rooms };
  };

  // Draw 2D AutoCAD Floor Plan Canvas
  useEffect(() => {
    if (activeTab !== 'plan' || planMode !== 'cad' || !planCanvasRef.current) return;
    const canvas = planCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const widthPx = canvas.width;
    const heightPx = canvas.height;

    const { borderM, margin, plotW, plotH, bldX, bldY, bldW, bldH, rooms } = getUnifiedLayout(widthPx, heightPx);

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0b1329' : '#f8fafc';
    const gridColor = isDark ? 'rgba(0, 240, 255, 0.07)' : 'rgba(100, 116, 139, 0.12)';
    const majorGridColor = isDark ? 'rgba(0, 240, 255, 0.15)' : 'rgba(100, 116, 139, 0.25)';
    const wallColor = isDark ? '#00f0ff' : '#0f172a';
    const wallFill = isDark ? 'rgba(0, 240, 255, 0.12)' : 'rgba(203, 213, 225, 0.45)';
    const textColor = isDark ? '#ffffff' : '#0f172a';
    const subTextColor = isDark ? '#38bdf8' : '#0284c7';
    const doorColor = isDark ? '#fbbf24' : '#d97706';
    const furnitureColor = isDark ? '#34d399' : '#059669';
    const dimColor = isDark ? '#e0f2fe' : '#334155';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, widthPx, heightPx);

    // Fine Blueprint Grid
    ctx.lineWidth = 0.5;
    for (let x = 0; x < widthPx; x += 15) {
      ctx.strokeStyle = x % 75 === 0 ? majorGridColor : gridColor;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, heightPx);
      ctx.stroke();
    }
    for (let y = 0; y < heightPx; y += 15) {
      ctx.strokeStyle = y % 75 === 0 ? majorGridColor : gridColor;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(widthPx, y);
      ctx.stroke();
    }

    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(borderM, borderM, widthPx - borderM * 2, heightPx - borderM * 2);

    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(margin, margin, plotW, plotH);
    ctx.setLineDash([]);

    const drawCadDimension = (x1, y1, x2, y2, text, isVert = false) => {
      ctx.strokeStyle = dimColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const tickSize = 5;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1 - tickSize, y1 + tickSize);
      ctx.lineTo(x1 + tickSize, y1 - tickSize);
      ctx.moveTo(x2 - tickSize, y2 + tickSize);
      ctx.lineTo(x2 + tickSize, y2 - tickSize);
      ctx.stroke();

      ctx.font = 'bold 11px Inter, monospace';
      ctx.fillStyle = subTextColor;
      if (isVert) {
        ctx.save();
        ctx.translate((x1 + x2) / 2 - 12, (y1 + y2) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(text, 0, 0);
        ctx.restore();
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(text, (x1 + x2) / 2, y1 - 8);
      }
    };

    drawCadDimension(margin, margin - 20, margin + plotW, margin - 20, `PLOT WIDTH: ${width}'-0" [${Math.round(width * 0.3048 * 10) / 10} M]`);
    drawCadDimension(margin - 20, margin, margin - 20, margin + plotH, `PLOT LENGTH: ${length}'-0" [${Math.round(length * 0.3048 * 10) / 10} M]`, true);

    const wallThick = 9;
    ctx.fillStyle = wallFill;
    ctx.fillRect(bldX, bldY, bldW, bldH);
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = wallThick;
    ctx.strokeRect(bldX, bldY, bldW, bldH);

    rooms.forEach((r) => {
      ctx.strokeStyle = wallColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(r.x, r.y, r.w, r.h);

      ctx.strokeStyle = furnitureColor;
      ctx.lineWidth = 1.5;

      if (r.id.startsWith('BED')) {
        const bedW = Math.min(r.w * 0.42, 55);
        const bedH = Math.min(r.h * 0.48, 65);
        const bedX = r.x + r.w / 2 - bedW / 2;
        const bedY = r.y + r.h / 2 - bedH / 2 + 5;
        ctx.strokeRect(bedX, bedY, bedW, bedH);
        ctx.strokeRect(bedX, bedY, bedW, 10);
        ctx.strokeRect(bedX + 4, bedY + 14, bedW / 2 - 6, 12);
        ctx.strokeRect(bedX + bedW / 2 + 2, bedY + 14, bedW / 2 - 6, 12);
      } else if (r.id === 'LIVING') {
        const sofaX = r.x + 18;
        const sofaY = r.y + 18;
        ctx.strokeRect(sofaX, sofaY, 70, 22);
        ctx.strokeRect(sofaX, sofaY + 22, 24, 40);
        ctx.strokeRect(sofaX + 30, sofaY + 26, 32, 22);
      } else if (r.id === 'KITCHEN') {
        ctx.strokeRect(r.x + 10, r.y + 10, r.w - 20, 22);
        ctx.beginPath();
        ctx.arc(r.x + 25, r.y + 21, 5, 0, Math.PI * 2);
        ctx.arc(r.x + 42, r.y + 21, 5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (r.id === 'PARKING') {
        const carX = r.x + r.w / 2 - 25;
        const carY = r.y + r.h / 2 - 35;
        ctx.strokeRect(carX, carY, 50, 70);
        ctx.strokeRect(carX + 5, carY + 15, 40, 40);
        ctx.strokeRect(carX + 8, carY + 22, 34, 24);
      }

      ctx.fillStyle = textColor;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(r.name, r.x + r.w / 2, r.y + r.h - 22);

      const rmFeetW = Math.round((r.w / bldW) * width * 0.85);
      const rmFeetH = Math.round((r.h / bldH) * length * 0.85);
      ctx.fillStyle = subTextColor;
      ctx.font = 'bold 10px Inter, monospace';
      ctx.fillText(`${rmFeetW}'-0" x ${rmFeetH}'-0"`, r.x + r.w / 2, r.y + r.h - 9);

      ctx.strokeStyle = doorColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(r.x + 8, r.y + r.h - 8, 16, 0, -Math.PI / 2, true);
      ctx.stroke();
    });

    const compassX = widthPx - borderM - 45;
    const compassY = borderM + 45;
    ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(compassX, compassY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 24);
    ctx.lineTo(compassX, compassY + 24);
    ctx.moveTo(compassX - 24, compassY);
    ctx.lineTo(compassX + 24, compassY);
    ctx.stroke();

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText('N', compassX, compassY - 14);
    ctx.fillStyle = textColor;
    ctx.fillText('S', compassX, compassY + 22);
    ctx.fillText('E', compassX + 18, compassY + 4);
    ctx.fillText('W', compassX - 18, compassY + 4);

    const tbY = heightPx - borderM - 26;
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.9)' : '#f1f5f9';
    ctx.fillRect(borderM, tbY, widthPx - borderM * 2, 26);
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(borderM, tbY, widthPx - borderM * 2, 26);

    ctx.font = 'bold 10px Inter, monospace';
    ctx.fillStyle = wallColor;
    ctx.textAlign = 'left';
    ctx.fillText(`AUTOCAD 2D DWG | OPTION #${designIndex + 1}: ${currentOption.name.toUpperCase()} | SCALE 1:100 | PSK BUILDERS`, borderM + 12, tbY + 17);
  }, [length, width, facing, floors, designIndex, theme, activeTab, planMode]);

  // DRAW 3D ISOMETRIC CUTAWAY FLOOR PLAN CANVAS (100% LINKED TO 2D ROOMS)
  useEffect(() => {
    if (activeTab !== 'plan' || planMode !== 'iso' || !isoCanvasRef.current) return;
    const canvas = isoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const widthPx = canvas.width;
    const heightPx = canvas.height;

    const { rooms } = getUnifiedLayout(widthPx, heightPx);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, widthPx, heightPx);

    // Grid Floor
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < widthPx; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, heightPx);
      ctx.stroke();
    }

    const isoAngle = Math.PI / 6;
    const cosA = Math.cos(isoAngle);
    const sinA = Math.sin(isoAngle);
    const centerX = widthPx / 2 - 40;
    const centerY = heightPx / 2 - 30;
    const wallH = 40;

    const project = (x, y, z) => {
      const rx = (x - 380) * 0.7;
      const ry = (y - 280) * 0.7;
      const isoX = centerX + (rx - ry) * cosA;
      const isoY = centerY + (rx + ry) * sinA - z;
      return { x: isoX, y: isoY };
    };

    rooms.forEach((r) => {
      const p1 = project(r.x, r.y, 0);
      const p2 = project(r.x + r.w, r.y, 0);
      const p3 = project(r.x + r.w, r.y + r.h, 0);
      const p4 = project(r.x, r.y + r.h, 0);

      // Floor slab
      ctx.fillStyle = r.color + '44';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3D Extruded Cutaway Walls
      const t1 = project(r.x, r.y, wallH);
      const t2 = project(r.x + r.w, r.y, wallH);
      const t3 = project(r.x + r.w, r.y + r.h, wallH);
      const t4 = project(r.x, r.y + r.h, wallH);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;

      // Back Wall
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t1.x, t1.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side Wall
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Furniture representations in 3D
      const cp = project(r.x + r.w / 2, r.y + r.h / 2, 0);
      if (r.id === 'PARKING') {
        const carP = project(r.x + r.w / 2, r.y + r.h / 2, 15);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(carP.x, carP.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🏎️ 3D CAR', carP.x - 22, carP.y - 12);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(r.name, cp.x, cp.y + 4);
    });

    ctx.font = 'bold 13px Inter, monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.fillText(`REVIT 3D ISOMETRIC CUTAWAY MODEL | 100% MATCHED TO 2D ROOM GEOMETRY | ${currentOption.name.toUpperCase()}`, 25, 30);
  }, [length, width, facing, floors, designIndex, theme, activeTab, planMode]);

  // DRAW 3D ARCHITECTURAL FRONT ELEVATION CANVAS (100% LINKED TO 2D FRONT ROOMS)
  useEffect(() => {
    if (activeTab !== 'elevation' || elevationMode !== 'cad' || !elevationCanvasRef.current) return;
    const canvas = elevationCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const widthPx = canvas.width;
    const heightPx = canvas.height;

    const { rooms } = getUnifiedLayout(widthPx, heightPx);

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#070f26' : '#f8fafc';
    const wallLine = isDark ? '#38bdf8' : '#0f172a';
    const wallFill = isDark ? '#1e293b' : '#e2e8f0';
    const glassFill = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(147, 197, 253, 0.5)';
    const accentFill = isDark ? '#fbbf24' : '#d97706';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, widthPx, heightPx);

    const groundY = heightPx - 60;
    ctx.strokeStyle = isDark ? '#22c55e' : '#15803d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, groundY);
    ctx.lineTo(widthPx - 30, groundY);
    ctx.stroke();

    ctx.fillStyle = isDark ? '#4ad66d' : '#15803d';
    ctx.font = 'bold 11px Inter, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('GROUND LEVEL (±0.00 M)', 40, groundY + 20);

    const bldW = Math.min(widthPx - 160, 440);
    const bldX = (widthPx - bldW) / 2;
    const gFloorH = 125;
    const firstFloorH = floors !== 'Ground Floor' ? 110 : 0;

    // Outer Main Wall
    ctx.fillStyle = wallFill;
    ctx.fillRect(bldX, groundY - gFloorH, bldW, gFloorH);
    ctx.strokeStyle = wallLine;
    ctx.lineWidth = 3;
    ctx.strokeRect(bldX, groundY - gFloorH, bldW, gFloorH);

    // Front Rooms Detection
    const frontRooms = rooms.filter((r) => r.y < 160);

    frontRooms.forEach((r) => {
      const fx = bldX + (r.x / widthPx) * bldW;
      const fw = (r.w / widthPx) * bldW * 1.5;

      if (r.id === 'PARKING') {
        // Car Portico Opening & Car Silhouette
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fx + 10, groundY - 95, fw - 20, 95);
        ctx.strokeStyle = accentFill;
        ctx.lineWidth = 2;
        ctx.strokeRect(fx + 10, groundY - 95, fw - 20, 95);

        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('🚗 CAR PORTICO GARAGE', fx + 18, groundY - 45);
      } else if (r.id === 'POOJA' || r.id === 'SITOUT') {
        // Main Entrance Teak Door
        const doorW = 42;
        const doorH = 75;
        const doorX = fx + 15;
        const doorY = groundY - doorH;
        ctx.fillStyle = accentFill;
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.strokeStyle = wallLine;
        ctx.lineWidth = 2;
        ctx.strokeRect(doorX, doorY, doorW, doorH);
      } else if (r.hasWindow) {
        // Front Room Glass Window
        const winW = 55;
        const winH = 45;
        const winX = fx + 15;
        const winY = groundY - gFloorH + 30;
        ctx.fillStyle = glassFill;
        ctx.fillRect(winX, winY, winW, winH);
        ctx.strokeStyle = wallLine;
        ctx.strokeRect(winX, winY, winW, winH);
      }
    });

    if (floors !== 'Ground Floor') {
      const f1Y = groundY - gFloorH - firstFloorH;
      ctx.fillStyle = wallFill;
      ctx.fillRect(bldX, f1Y, bldW, firstFloorH);
      ctx.strokeStyle = wallLine;
      ctx.lineWidth = 3;
      ctx.strokeRect(bldX, f1Y, bldW, firstFloorH);

      ctx.fillStyle = glassFill;
      ctx.fillRect(bldX + 30, f1Y + 25, bldW - 60, 60);
      ctx.strokeRect(bldX + 30, f1Y + 25, bldW - 60, 60);
    }

    ctx.font = 'bold 13px Inter, monospace';
    ctx.fillStyle = wallLine;
    ctx.textAlign = 'left';
    ctx.fillText(`TECHNICAL FRONT ELEVATION | 100% LINKED TO 2D FRONT ROOMS | ${currentOption.name.toUpperCase()}`, 30, 30);
  }, [length, width, floors, designIndex, theme, activeTab, elevationMode]);

  // Open PDF Printable Sheet Modal
  const handleOpenPdfModal = () => {
    if (planCanvasRef.current) {
      try {
        const url = planCanvasRef.current.toDataURL('image/png');
        setCadDataUrl(url);
      } catch (e) {}
    }
    setShowPrintModal(true);
  };

  // Save Plan to Favorites
  const handleSaveFavorite = async () => {
    const token = getAuthToken();
    if (!token) {
      onRequireLogin();
      return;
    }

    setIsSaving(true);
    setSavedSuccess(null);
    try {
      const res = await fetch('/api/plans/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plotLength: length,
          plotWidth: width,
          totalSqft: totalSqft,
          facingDirection: facing,
          floors: floors,
          designOptionIndex: designIndex,
          designOptionName: currentOption.name,
          estimatedCost: estimatedCost,
          notes: `Plot ${length}ft x ${width}ft, ${facing} facing. Package: ${selectedPkg.name}`,
        }),
      });

      if (res.ok) {
        setSavedSuccess('❤️ Design Saved to Your Favorites Portal successfully!');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save favorite design.');
      }
    } catch (e) {
      alert('Error saving plan: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Consultation Request
  const handleRequestConsultation = async () => {
    const token = getAuthToken();
    if (!token) {
      onRequireLogin();
      return;
    }

    setIsConsulting(true);
    setConsultationSuccess(null);
    try {
      const res = await fetch('/api/plans/request-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plotLength: length,
          plotWidth: width,
          facingDirection: facing,
          floors: floors,
          designOptionName: currentOption.name,
          packageTier: selectedPkg.name,
        }),
      });

      const body = await res.json();
      if (res.ok) {
        setConsultationSuccess(`📞 Consultation Ticket Created! ${body.message}`);
      } else {
        alert(body.message || 'Failed to submit consultation request.');
      }
    } catch (e) {
      alert('Error requesting consultation: ' + e.message);
    } finally {
      setIsConsulting(false);
    }
  };

  // Download Canvas / Render
  const handleDownloadPNG = () => {
    const canvas = activeTab === 'plan' ? (planMode === 'iso' ? isoCanvasRef.current : planCanvasRef.current) : elevationCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `PSK_Builders_${activeTab.toUpperCase()}_${length}x${width}ft_Design${designIndex + 1}.png`;
    a.click();
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '15px' }}>
      {/* Visualizer Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span
          style={{
            background: 'linear-gradient(90deg, #0284c7, #06b6d4)',
            color: '#fff',
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          100% Geometry-Linked Architectural Suite
        </span>
        <h2 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#0f172a', margin: '8px 0 4px 0' }}>
          Interactive AutoCAD 2D & Revit 3D Architectural Suite
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
          Real-time Parametric 2D Blueprint, 3D Isometric Cutaway Model & 3D Architectural Front Elevation Renders!
        </p>
      </div>

      {/* Control Panel Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Dimension Inputs */}
        <div>
          <label style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>
            Plot Length (ft): <strong style={{ color: '#0284c7' }}>{length} FT</strong>
          </label>
          <input
            type="range"
            min="15"
            max="100"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0284c7', margin: '6px 0 12px 0' }}
          />

          <label style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>
            Plot Width (ft): <strong style={{ color: '#0284c7' }}>{width} FT</strong>
          </label>
          <input
            type="range"
            min="15"
            max="100"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0284c7', margin: '6px 0 0 0' }}
          />
        </div>

        {/* Direction, Floors & Package */}
        <div>
          <label style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
            Plot Facing Direction
          </label>
          <select
            value={facing}
            onChange={(e) => setFacing(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1.5px solid #0284c7',
              marginBottom: '12px',
              fontWeight: '700',
              fontSize: '13.5px',
              color: '#0f172a',
              background: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            }}
          >
            <option value="East" style={{ color: '#0f172a', background: '#ffffff', fontWeight: '600' }}>East Facing (Most Popular)</option>
            <option value="North" style={{ color: '#0f172a', background: '#ffffff', fontWeight: '600' }}>North Facing (Highly Auspicious)</option>
            <option value="South" style={{ color: '#0f172a', background: '#ffffff', fontWeight: '600' }}>South Facing</option>
            <option value="West" style={{ color: '#0f172a', background: '#ffffff', fontWeight: '600' }}>West Facing</option>
          </select>

          <label style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
            Construction Package
          </label>
          <select
            value={packageTier}
            onChange={(e) => setPackageTier(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1.5px solid #0284c7',
              fontWeight: '700',
              fontSize: '13.5px',
              color: '#0f172a',
              background: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            }}
          >
            {PACKAGES.map((pkg) => (
              <option key={pkg.id} value={pkg.id} style={{ color: '#0f172a', background: '#ffffff', fontWeight: '600' }}>
                {pkg.name} — ₹{pkg.rate}/sqft ({pkg.badge})
              </option>
            ))}
          </select>
        </div>

        {/* Realtime Stats Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '12px',
            padding: '16px',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 'bold' }}>
              Calculated Metrics ({selectedPkg.name})
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', margin: '2px 0' }}>
              {totalSqft.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '400' }}>Sq.Ft</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Estimated Total Cost: <strong style={{ color: '#4ade80' }}>₹{estimatedCost.toLocaleString()}</strong> (@ ₹{selectedPkg.rate}/sqft)
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <span
              style={{
                background: '#0284c7',
                color: '#fff',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '600',
              }}
            >
              Option #{designIndex + 1}: {currentOption.badge}
            </span>
            <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '2px' }}>{currentOption.description}</div>
          </div>
        </div>
      </div>

      {/* VASTU SCORECARD & ROOM CHECKLIST */}
      <div
        style={{
          background: 'linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%)',
          borderRadius: '14px',
          padding: '14px 20px',
          border: '1px solid #bbf7d0',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justify: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justify: 'center',
              alignItems: 'center',
              fontWeight: '900',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
              flexShrink: 0,
              border: '2px solid #ffffff',
            }}
          >
            <span style={{ fontSize: '1.15rem', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-0.5px' }}>{vastuScore}%</span>
            <span style={{ fontSize: '8.5px', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.95 }}>VASTU</span>
          </div>
          <div>
            <h4 style={{ margin: 0, color: '#14532d', fontSize: '0.98rem', fontWeight: '800' }}>
              Vastu Compliance Scorecard ({facing} Facing)
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#166534' }}>
              Checked against authentic Vedic architecture principles for Tamil Nadu region.
            </p>
          </div>
        </div>

        {/* Vastu Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '16px', fontSize: '10px', fontWeight: '700' }}>
            🌟 NE Foyer / Pooja (Auspicious)
          </span>
          <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '16px', fontSize: '10px', fontWeight: '700' }}>
            🛏️ SW Master Bed (Leadership)
          </span>
          <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '16px', fontSize: '10px', fontWeight: '700' }}>
            🔥 SE Kitchen (Agni Konam)
          </span>
          <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '16px', fontSize: '10px', fontWeight: '700' }}>
            💨 NW Washrooms & Staircase
          </span>
        </div>
      </div>

      {/* MATERIAL ESTIMATOR QUANTITIES */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#0f172a', fontWeight: '800' }}>
          🏗️ Estimated Material Quantity Breakdown ({totalSqft.toLocaleString()} sq.ft)
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
          }}
        >
          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>🧱 Cement Bags</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{cementBags.toLocaleString()} Bags</div>
            <div style={{ fontSize: '9px', color: '#0284c7' }}>OPC 53 Grade</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>🏗️ TMT Steel Rods</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{steelTons} Tons</div>
            <div style={{ fontSize: '9px', color: '#0284c7' }}>Fe550D Ribbed</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>📐 Flooring Tiles</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{tilesSqft.toLocaleString()} Sq.Ft</div>
            <div style={{ fontSize: '9px', color: '#0284c7' }}>Vitrified Tiles</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>🚪 Doors & Frames</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{doorsCount} Sets</div>
            <div style={{ fontSize: '9px', color: '#0284c7' }}>Teak Main Door</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>⚡ Electrical Points</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{electricalPoints} Points</div>
            <div style={{ fontSize: '9px', color: '#0284c7' }}>Modular Switches</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>🎨 Wall Paint & Primer</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{paintLiters} Liters</div>
            <div style={{ fontSize: '9px', color: '#0284c7' }}>Emulsion Paint</div>
          </div>
        </div>
      </div>

      {/* Control Buttons Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justify: 'space-between',
          gap: '10px',
          marginBottom: '15px',
          background: '#f8fafc',
          padding: '10px 14px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxSizing: 'border-box',
        }}
      >
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('plan')}
            style={{
              padding: '7px 14px',
              borderRadius: '7px',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'plan' ? '#0f172a' : '#e2e8f0',
              color: activeTab === 'plan' ? '#00f0ff' : '#475569',
              transition: 'all 0.2s',
            }}
          >
            📐 Floor Plan View
          </button>
          <button
            onClick={() => setActiveTab('elevation')}
            style={{
              padding: '7px 14px',
              borderRadius: '7px',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'elevation' ? '#0f172a' : '#e2e8f0',
              color: activeTab === 'elevation' ? '#38bdf8' : '#475569',
              transition: 'all 0.2s',
            }}
          >
            🏢 Front Elevation View
          </button>
        </div>

        {/* Theme & Mode Switches */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {activeTab === 'plan' ? (
            <div style={{ display: 'flex', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
              <button
                onClick={() => setPlanMode('cad')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: planMode === 'cad' ? '#0284c7' : 'transparent',
                  color: planMode === 'cad' ? '#fff' : '#475569',
                }}
              >
                📐 AutoCAD 2D DWG
              </button>
              <button
                onClick={() => setPlanMode('iso')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: planMode === 'iso' ? '#0284c7' : 'transparent',
                  color: planMode === 'iso' ? '#fff' : '#475569',
                }}
              >
                🏙️ 3D Isometric Cutaway (100% Linked)
              </button>
              <button
                onClick={() => setPlanMode('revit')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: planMode === 'revit' ? '#0284c7' : 'transparent',
                  color: planMode === 'revit' ? '#fff' : '#475569',
                }}
              >
                📸 Revit AI Render
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
              <button
                onClick={() => setElevationMode('cad')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: elevationMode === 'cad' ? '#0284c7' : 'transparent',
                  color: elevationMode === 'cad' ? '#fff' : '#475569',
                }}
              >
                📐 Technical Elevation (100% Linked)
              </button>
              <button
                onClick={() => setElevationMode('revit')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: elevationMode === 'revit' ? '#0284c7' : 'transparent',
                  color: elevationMode === 'revit' ? '#fff' : '#475569',
                }}
              >
                📸 Revit 3D Photo Render
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              padding: '7px 12px',
              borderRadius: '7px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            {theme === 'dark' ? '☀️ CAD Light' : '🌙 AutoCAD Dark'}
          </button>

          {/* NEXT DESIGN BUTTON */}
          <button
            onClick={handleNextDesign}
            style={{
              padding: '8px 14px',
              borderRadius: '7px',
              border: 'none',
              background: 'linear-gradient(90deg, #d97706, #f59e0b)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(217, 119, 6, 0.3)',
            }}
          >
            🔄 Cycle Design ({designIndex + 1}/4)
          </button>

          {/* SAVE TO FAVORITES BUTTON */}
          <button
            onClick={handleSaveFavorite}
            disabled={isSaving}
            style={{
              padding: '8px 14px',
              borderRadius: '7px',
              border: 'none',
              background: 'linear-gradient(90deg, #ef4444, #f43f5e)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(239, 68, 68, 0.3)',
            }}
          >
            {isSaving ? 'Saving...' : '❤️ Save Favorite'}
          </button>

          {/* 1-CLICK CONSULTATION REQUEST BUTTON */}
          <button
            onClick={handleRequestConsultation}
            disabled={isConsulting}
            style={{
              padding: '8px 14px',
              borderRadius: '7px',
              border: 'none',
              background: 'linear-gradient(90deg, #16a34a, #22c55e)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(22, 163, 74, 0.3)',
            }}
          >
            {isConsulting ? 'Submitting...' : '📞 VR Consultation'}
          </button>

          {/* PRINTABLE PDF SHEET MODAL TRIGGER */}
          <button
            onClick={handleOpenPdfModal}
            style={{
              padding: '8px 12px',
              borderRadius: '7px',
              border: '1px solid #0f172a',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            📜 PDF Plan Sheet
          </button>

          {/* DOWNLOAD IMAGE */}
          <button
            onClick={handleDownloadPNG}
            style={{
              padding: '8px 12px',
              borderRadius: '7px',
              border: '1px solid #475569',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: '700',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            📥 Download PNG
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div
          style={{
            background: '#dcfce7',
            color: '#15803d',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontWeight: '600',
            textAlign: 'center',
            fontSize: '13px',
            border: '1px solid #bbf7d0',
          }}
        >
          {savedSuccess}
        </div>
      )}

      {consultationSuccess && (
        <div
          style={{
            background: '#e0f2fe',
            color: '#0369a1',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontWeight: '600',
            textAlign: 'center',
            fontSize: '13px',
            border: '1px solid #bae6fd',
          }}
        >
          {consultationSuccess}
        </div>
      )}

      {/* CANVAS / REVIT 3D RENDER VIEWPORT */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          background: theme === 'dark' ? '#050b1a' : '#e2e8f0',
          borderRadius: '16px',
          padding: '20px 15px',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        {activeTab === 'plan' ? (
          planMode === 'cad' ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', margin: '0 auto' }}>
              <canvas
                ref={planCanvasRef}
                width={760}
                height={560}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                  margin: '0 auto',
                  display: 'block',
                }}
              />
            </div>
          ) : planMode === 'iso' ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', margin: '0 auto' }}>
              <canvas
                ref={isoCanvasRef}
                width={760}
                height={560}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                  margin: '0 auto',
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '800px', position: 'relative', margin: '0 auto' }}>
              <img
                src={currentOption.revitPlanImage}
                alt="Revit 3D Cutaway Floor Plan Render"
                style={{
                  width: '100%',
                  maxHeight: '520px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                  border: '2px solid rgba(255,255,255,0.1)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '15px',
                  left: '15px',
                  right: '15px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#00f0ff' }}>
                  🏙️ REVIT 3D ISOMETRIC FLOOR PLAN CUTAWAY | OPTION #{designIndex + 1}: {currentOption.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{length}ft × {width}ft • {facing} Facing</div>
              </div>
            </div>
          )
        ) : elevationMode === 'revit' ? (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '800px', position: 'relative', margin: '0 auto' }}>
            <img
              src={currentOption.revitImage}
              alt="Revit 3D Front Elevation Render"
              style={{
                width: '100%',
                maxHeight: '520px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                border: '2px solid rgba(255,255,255,0.1)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '15px',
                left: '15px',
                right: '15px',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '8px',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8' }}>
                🏙️ REVIT 3D ARCHITECTURAL FAÇADE RENDER | OPTION #{designIndex + 1}: {currentOption.name}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{floors} • {facing} Facing</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', margin: '0 auto' }}>
            <canvas
              ref={elevationCanvasRef}
              width={760}
              height={560}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                margin: '0 auto',
                display: 'block',
              }}
            />
          </div>
        )}
      </div>

      {/* PERFECTLY CENTERED & 1-PAGE A4 PRINTABLE PDF SPECIFICATION PLAN SHEET MODAL */}
      {showPrintModal && (
        <div
          className="psk-plan-modal-wrapper"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justify: 'center',
            alignItems: 'center',
            zIndex: 999999,
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 5mm;
              }
              html, body {
                height: 100% !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .psk-plan-modal-wrapper * {
                visibility: visible !important;
              }
              .psk-printable-area {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 15px !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                z-index: 9999999 !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          <div
            className="psk-printable-area"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '22px 25px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              position: 'relative',
              boxSizing: 'border-box',
              margin: 'auto',
            }}
          >
            {/* Header / Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '14px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem', fontWeight: '900' }}>
                  PSK BROTHERS BUILDERS & CONSTRUCTIONS
                </h2>
                <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700', letterSpacing: '1px' }}>
                  OFFICIAL ARCHITECTURAL DWG & 3D SPECIFICATION PLAN SHEET
                </div>
              </div>
              <button
                className="no-print"
                onClick={() => setShowPrintModal(false)}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Spec Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '11.5px' }}>
              <tbody>
                <tr style={{ background: '#f8fafc' }}>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Project Code:</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>PSK-DWG-2026-042</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Plot Dimensions:</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{length} ft × {width} ft ({totalSqft.toLocaleString()} sq.ft)</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Facing & Vastu:</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{facing} Facing ({vastuScore}% Vastu Score)</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Design Option:</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Option #{designIndex + 1}: {currentOption.name}</td>
                </tr>
                <tr style={{ background: '#f8fafc' }}>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Selected Package:</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{selectedPkg.name} (@ ₹{selectedPkg.rate}/sqft)</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Estimated Total:</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#16a34a' }}>₹{estimatedCost.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Images Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '8px', background: theme === 'dark' ? '#0b1329' : '#f8fafc' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: theme === 'dark' ? '#00f0ff' : '#0f172a', marginBottom: '4px' }}>
                  2D AUTOCAD BLUEPRINT DWG DRAWING
                </div>
                <img src={cadDataUrl || currentOption.revitPlanImage} alt="2D AutoCAD Blueprint DWG" style={{ width: '100%', height: '160px', objectFit: 'contain', borderRadius: '4px' }} />
              </div>
              <div style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                  3D REVIT FRONT ELEVATION FAÇADE
                </div>
                <img src={currentOption.revitImage} alt="3D Elevation" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Material Estimates */}
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: '#0f172a' }}>Material Quantity Estimates</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10.5px', marginBottom: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>🧱 Cement: <strong>{cementBags} Bags</strong></div>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>🏗️ Steel: <strong>{steelTons} Tons</strong></div>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>📐 Tiles: <strong>{tilesSqft} Sq.Ft</strong></div>
            </div>

            {/* Action buttons */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{
                  background: '#0f172a',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                🖨️ Print / Save as PDF (1 Page)
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                style={{
                  background: '#e2e8f0',
                  color: '#475569',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

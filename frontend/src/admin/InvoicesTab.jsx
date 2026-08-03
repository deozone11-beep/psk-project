import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Printer, Share2, Edit3, Eye, FileText, Search, CheckCircle, AlertCircle, Layers, CheckSquare } from 'lucide-react';
import { api } from './api';

// Helper function to convert numbers to Indian Rupee Words
function numberToIndianWords(num) {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'overflow';
    const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
    str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
    str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
    str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
    str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
    return str;
  }

  const integerPart = Math.floor(num);
  const words = inWords(integerPart);
  return (words ? words.trim() : 'Zero') + ' Rupees Only';
}

const DEFAULT_DIGITAL_SIGNATURE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 70" width="180" height="60"><path d="M 15 45 C 30 15, 45 10, 55 30 C 65 50, 75 35, 85 22 C 95 12, 105 40, 120 30 C 135 20, 150 15, 160 38 C 170 52, 185 28, 200 22 C 215 16, 230 35, 250 28" fill="none" stroke="%231d4ed8" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><text x="20" y="58" font-family="'Brush Script MT', 'Dancing Script', cursive, sans-serif" font-size="22" font-weight="bold" fill="%231e40af" font-style="italic">S. Senthil Murugan</text></svg>`;

const DEFAULT_CIRCULAR_SEAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" width="90" height="90"><g transform="rotate(-6 70 70)"><circle cx="70" cy="70" r="64" fill="none" stroke="%23e2262b" stroke-width="3" stroke-dasharray="8 3"/><circle cx="70" cy="70" r="56" fill="none" stroke="%23e2262b" stroke-width="1.5"/><path id="circlePath" fill="none" d="M 22,70 A 48,48 0 1,1 118,70 A 48,48 0 1,1 22,70"/><text fill="%23e2262b" font-size="9.5" font-weight="900" font-family="sans-serif" letter-spacing="1"><textPath href="%23circlePath" startOffset="50%" text-anchor="middle">PSK BROTHERS BUILDERS</textPath></text><path id="circlePath2" fill="none" d="M 118,70 A 48,48 0 1,1 22,70"/><text fill="%23e2262b" font-size="8.5" font-weight="800" font-family="sans-serif" letter-spacing="1.5"><textPath href="%23circlePath2" startOffset="50%" text-anchor="middle">★ CHENNAI ★</textPath></text><circle cx="70" cy="70" r="32" fill="rgba(226,38,43,0.05)" stroke="%23e2262b" stroke-width="1"/><text x="70" y="66" text-anchor="middle" fill="%23e2262b" font-size="8" font-weight="900" font-family="sans-serif" letter-spacing="0.5">OFFICIAL</text><text x="70" y="78" text-anchor="middle" fill="%23e2262b" font-size="8" font-weight="900" font-family="sans-serif" letter-spacing="0.5">SEAL</text></g></svg>`;

function getDynamicMilestones(floors = []) {
  if (!Array.isArray(floors) || floors.length === 0) {
    return [
      { stage: 'Advance / Booking & Architectural Plan', pct: 10 },
      { stage: 'Foundation & Plinth Beam Completion', pct: 15 },
      { stage: 'Ground Floor Roof Slab Completion', pct: 20 },
      { stage: 'First Floor Roof Slab Completion', pct: 20 },
      { stage: 'Brickwork & Plastering Completion', pct: 15 },
      { stage: 'Flooring, Tiles, Plumbing & Electrical', pct: 15 },
      { stage: 'Painting, Finishing & Key Handover', pct: 5 }
    ];
  }

  // Filter out minor additions like Portico/Headroom if main floors exist
  const mainFloors = floors.filter(f => {
    const fn = (f.floorName || '').toLowerCase();
    return !fn.includes('portico') && !fn.includes('head room') && !fn.includes('compound');
  });

  const targetFloors = mainFloors.length > 0 ? mainFloors : floors;

  const result = [
    { stage: 'Advance / Booking & Architectural Plan', pct: 10 },
    { stage: 'Foundation & Plinth Beam Completion', pct: 15 }
  ];

  // Distribute ~40% total among roof slabs
  const totalRoofPct = 40;
  const perRoofPct = Math.max(10, Math.floor(totalRoofPct / targetFloors.length));

  targetFloors.forEach(f => {
    let name = (f.floorName || 'Floor').replace(/Area/i, '').replace(/Construction/i, '').trim();
    if (!name.toLowerCase().includes('roof')) {
      name = `${name} Roof Slab Completion`;
    }
    result.push({ stage: name, pct: perRoofPct });
  });

  const roofUsed = perRoofPct * targetFloors.length;
  const remaining = 100 - (10 + 15 + roofUsed);

  const brickPct = Math.max(8, Math.floor(remaining * 0.40));
  const floorPct = Math.max(8, Math.floor(remaining * 0.45));
  const finishPct = 100 - (10 + 15 + roofUsed + brickPct + floorPct);

  result.push({ stage: 'Brickwork & Plastering Completion', pct: brickPct });
  result.push({ stage: 'Flooring, Tiles, Plumbing & Electrical', pct: floorPct });
  result.push({ stage: 'Painting, Finishing & Key Handover', pct: finishPct });

  return result;
}

const DEFAULT_SPECS = {
  structure: 'Tata Tiscon / ARS 550D TMT Steel, UltraTech 53 Grade Cement, 9" First Quality Red Bricks.',
  flooring: '2x2 Vitrified Tiles (Rs. 60/sqft limit), Anti-skid Ceramic Tiles for Bathrooms.',
  doors: 'Teak Wood Main Door Frame & Shutter, Flush Doors for Bedrooms, PVC for Bathrooms.',
  electrical: 'Finolex / Havells Fire-resistant Wires, Anchor Roma Modular Switches & Sockets.',
  plumbing: 'Ashirvad CPVC/PVC Pipes, Parryware / Jaquar Fittings, 1000L Overhead Water Tank.',
  painting: 'Asian Paints Apex Exterior & Tractor Emulsion Interior (2 coats over putty).'
};

export default function InvoicesTab({ creds }) {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [showBankReport, setShowBankReport] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  // Digital Signature & Seal States
  const [customSignature, setCustomSignature] = useState(() => localStorage.getItem('psk_custom_signature') || null);
  const [customSeal, setCustomSeal] = useState(() => localStorage.getItem('psk_custom_seal') || null);
  const [showSignModal, setShowSignModal] = useState(false);

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomSignature(reader.result);
        localStorage.setItem('psk_custom_signature', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSealUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomSeal(reader.result);
        localStorage.setItem('psk_custom_seal', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetSignatures = () => {
    setCustomSignature(null);
    setCustomSeal(null);
    localStorage.removeItem('psk_custom_signature');
    localStorage.removeItem('psk_custom_seal');
  };

  // Form State
  const [form, setForm] = useState({
    id: null,
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerId: '',
    billType: 'ESTIMATE', // ESTIMATE vs RA_STAGE vs EXTRA_WORK vs PAYMENT_RECEIPT
    stageName: 'House Construction Quotation & Estimation',
    floors: [
      { floorName: 'Ground Floor Construction', sqft: 1000, rate: 1850, amount: 1850000 },
      { floorName: 'First Floor Construction', sqft: 600, rate: 1850, amount: 1110000 }
    ],
    lineItems: [
      { description: 'Elevation Design & Architectural Blueprint', qty: 1, unit: 'Job', rate: 0, amount: 0 }
    ],
    materialSpecs: { ...DEFAULT_SPECS },
    includeSchedule: true,
    gstPercentage: 0,
    discountAmount: 0,
    amountPaidSoFar: 0,
    status: 'SENT',
    notes: 'Quotation valid for 30 days. EB Connection & Approval fees extra.'
  });

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    Promise.all([
      api('/admin/invoices', creds),
      api('/admin/customers', creds)
    ]).then(([invList, custList]) => {
      setInvoices(Array.isArray(invList) ? invList : []);
      setCustomers(Array.isArray(custList) ? custList : []);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }

  function handleOpenCreate(type = 'ESTIMATE') {
    const nextNum = type === 'ESTIMATE' ? 'PSK-EST-' + Math.floor(100000 + Math.random() * 900000) : 'PSK-INV-' + Math.floor(100000 + Math.random() * 900000);
    const selCust = customers.length > 0 ? customers[0] : null;
    const sqft = selCust && selCust.estimatedSqft ? selCust.estimatedSqft : 1200;

    setForm({
      id: null,
      invoiceNumber: nextNum,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      customerId: selCust ? selCust.id : '',
      billType: type,
      stageName: type === 'ESTIMATE' ? 'House Construction Full Estimation' : 'Stage 1 - Foundation & Structure',
      floors: [
        { floorName: 'Ground Floor Area', sqft: Math.round(sqft * 0.65), rate: 1850, amount: Math.round(sqft * 0.65 * 1850) },
        { floorName: 'First Floor Area', sqft: Math.round(sqft * 0.35), rate: 1850, amount: Math.round(sqft * 0.35 * 1850) }
      ],
      lineItems: type === 'ESTIMATE' ? [
        { description: 'Elevation Design & Architectural Blueprint', qty: 1, unit: 'Job', rate: 0, amount: 0 }
      ] : [
        { description: 'Foundation & Basement Work', qty: sqft, unit: 'Sq.ft', rate: 1850, amount: sqft * 1850 }
      ],
      materialSpecs: { ...DEFAULT_SPECS },
      includeSchedule: true,
      gstPercentage: 0,
      discountAmount: 0,
      amountPaidSoFar: 0,
      status: 'SENT',
      notes: type === 'ESTIMATE'
        ? 'Estimation is based on current material rates. EB Connection & Plan Approval fees extra.'
        : 'Payment to be made by Cheque/NEFT in favor of PSK BROTHERS BUILDERS & CONSTRUCTIONS.'
    });
    setShowModal(true);
  }

  function handleEdit(inv) {
    let parsedData = {};
    try {
      parsedData = JSON.parse(inv.lineItemsJson || '{}');
    } catch (e) { parsedData = {}; }

    const isComplex = Array.isArray(parsedData.floors);

    setForm({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber || '',
      invoiceDate: inv.invoiceDate || '',
      dueDate: inv.dueDate || '',
      customerId: inv.customer ? inv.customer.id : '',
      billType: inv.billType || 'RA_STAGE',
      stageName: inv.stageName || '',
      builtUpArea: inv.builtUpArea || '',
      ratePerSqft: inv.ratePerSqft || '',
      floors: isComplex && parsedData.floors ? parsedData.floors : [{ floorName: 'Main Building Area', sqft: inv.builtUpArea || 1000, rate: inv.ratePerSqft || 1850, amount: (inv.builtUpArea || 1000) * (inv.ratePerSqft || 1850) }],
      lineItems: isComplex ? (parsedData.lineItems || []) : (Array.isArray(parsedData) ? parsedData : [{ description: inv.stageName || 'Construction Work', qty: 1, unit: 'Job', rate: inv.subTotal || 0, amount: inv.subTotal || 0 }]),
      materialSpecs: isComplex && parsedData.specs ? parsedData.specs : { ...DEFAULT_SPECS },
      includeSchedule: isComplex && parsedData.includeSchedule !== undefined ? parsedData.includeSchedule : true,
      gstPercentage: inv.gstPercentage || 0,
      discountAmount: inv.discountAmount || 0,
      amountPaidSoFar: inv.amountPaidSoFar || 0,
      status: inv.status || 'DRAFT',
      notes: inv.notes || ''
    });
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this bill/estimation?')) return;
    try {
      await api(`/admin/invoices/${id}`, creds, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  // Calculation helpers
  function updateFloor(idx, field, val) {
    const updated = [...form.floors];
    updated[idx][field] = val;
    if (field === 'sqft' || field === 'rate') {
      const sq = parseFloat(updated[idx].sqft) || 0;
      const rt = parseFloat(updated[idx].rate) || 0;
      updated[idx].amount = Math.round(sq * rt);
    }
    setForm({ ...form, floors: updated });
  }

  function addFloor() {
    setForm({ ...form, floors: [...form.floors, { floorName: 'Portico / Head Room', sqft: 200, rate: 1200, amount: 240000 }] });
  }

  function removeFloor(idx) {
    setForm({ ...form, floors: form.floors.filter((_, i) => i !== idx) });
  }

  function updateLineItem(idx, field, val) {
    const updated = [...form.lineItems];
    updated[idx][field] = val;
    if (field === 'qty' || field === 'rate') {
      const q = parseFloat(updated[idx].qty) || 0;
      const r = parseFloat(updated[idx].rate) || 0;
      updated[idx].amount = Math.round(q * r);
    }
    setForm({ ...form, lineItems: updated });
  }

  function addLineItem() {
    setForm({ ...form, lineItems: [...form.lineItems, { description: '', qty: 1, unit: 'Sq.ft', rate: 0, amount: 0 }] });
  }

  function removeLineItem(idx) {
    setForm({ ...form, lineItems: form.lineItems.filter((_, i) => i !== idx) });
  }

  // Calculate totals
  const floorsSubtotal = form.billType === 'ESTIMATE' ? form.floors.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) : 0;
  const itemsSubtotal = form.lineItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  const subTotal = floorsSubtotal + itemsSubtotal;

  const totalSqft = form.billType === 'ESTIMATE' ? form.floors.reduce((sum, f) => sum + (parseFloat(f.sqft) || 0), 0) : 0;
  const taxAmount = Math.round(subTotal * ((parseFloat(form.gstPercentage) || 0) / 100));
  const totalAmount = Math.max(0, subTotal + taxAmount - (parseFloat(form.discountAmount) || 0));
  const balanceDue = Math.max(0, totalAmount - (parseFloat(form.amountPaidSoFar) || 0));
  const amountInWords = numberToIndianWords(totalAmount);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.customerId) {
      alert('Please select a customer');
      return;
    }
    const payload = {
      ...form,
      customerId: Number(form.customerId),
      builtUpArea: totalSqft,
      ratePerSqft: form.floors.length > 0 ? form.floors[0].rate : 1850,
      lineItemsJson: JSON.stringify({
        floors: form.floors,
        lineItems: form.lineItems,
        specs: form.materialSpecs,
        includeSchedule: form.includeSchedule
      }),
      subTotal,
      taxAmount,
      totalAmount,
      balanceDue,
      amountInWords
    };

    try {
      await api('/admin/invoices', creds, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('Save error: ' + err.message);
    }
  }

  // Filtered list
  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    const custName = inv.customer?.displayName || '';
    const invNum = inv.invoiceNumber || '';
    return matchesStatus && (custName.toLowerCase().includes(search.toLowerCase()) || invNum.toLowerCase().includes(search.toLowerCase()));
  });

  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaidSoFar || 0), 0);
  const totalPending = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  function shareWhatsApp(inv) {
    const phone = inv.customer?.phone ? inv.customer.phone.replace(/[^0-9]/g, '') : '';
    const isEst = inv.billType === 'ESTIMATE';
    const message = `*PSK BROTHERS BUILDERS & CONSTRUCTIONS*\n` +
      `-------------------------------------\n` +
      `*${isEst ? 'OFFICIAL HOUSE CONSTRUCTION ESTIMATION' : 'STAGE BILL / INVOICE'}*\n` +
      `📄 No: ${inv.invoiceNumber}\n` +
      `📅 Date: ${inv.invoiceDate}\n` +
      `👤 Customer: ${inv.customer?.displayName || 'Valued Customer'}\n` +
      `🏗️ Project: ${inv.customer?.projectName || 'Construction Work'}\n` +
      `-------------------------------------\n` +
      `💰 *Total Estimated Cost*: ₹${inv.totalAmount?.toLocaleString('en-IN')}\n` +
      `✅ *Paid Amount*: ₹${inv.amountPaidSoFar?.toLocaleString('en-IN')}\n` +
      `🔴 *Balance*: ₹${inv.balanceDue?.toLocaleString('en-IN')}\n` +
      `-------------------------------------\n` +
      `For queries or site visit call: 9941426479 / 9003177934.`;

    const url = phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="invoicesTabShell">
      {/* Stats Cards */}
      <div className="invoiceStatsGrid">
        <div className="statCard">
          <div className="statIcon bg-blue"><FileText size={22} /></div>
          <div>
            <div className="statLabel">Total Estimates & Invoices</div>
            <div className="statValue">₹{totalInvoiced.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="statCard">
          <div className="statIcon bg-green"><CheckCircle size={22} /></div>
          <div>
            <div className="statLabel">Total Collected</div>
            <div className="statValue">₹{totalPaid.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="statCard">
          <div className="statIcon bg-orange"><AlertCircle size={22} /></div>
          <div>
            <div className="statLabel">Pending Balance</div>
            <div className="statValue">₹{totalPending.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="adminTableControls">
        <div className="searchBox">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search estimate # or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filterGroup">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filterSelect">
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
          </select>
          <button className="btnSecondary" onClick={() => setShowSignModal(true)}>
            ✒️ Upload Signature &amp; Seal
          </button>
          <button className="btnSecondary" onClick={() => handleOpenCreate('RA_STAGE')}>
            <Plus size={18} /> New Itemized Bill
          </button>
          <button className="btnPrimary" onClick={() => handleOpenCreate('ESTIMATE')}>
            <Layers size={18} /> Create Full Estimation Sheet
          </button>
        </div>
      </div>

      {/* List Table */}
      <div className="adminTableWrapper">
        <table className="adminTable">
          <thead>
            <tr>
              <th>Doc #</th>
              <th>Customer & Project</th>
              <th>Document Type</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Paid / Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading documents...</td></tr>
            ) : filteredInvoices.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No estimations or bills found.</td></tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td><strong>{inv.invoiceNumber}</strong></td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{inv.customer?.displayName || 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{inv.customer?.projectName || ''}</div>
                  </td>
                  <td>
                    <span className={`badgeType ${inv.billType === 'ESTIMATE' ? 'badgeEst' : ''}`}>
                      {inv.billType === 'ESTIMATE' ? '📄 Full Estimation' : inv.billType}
                    </span>
                    <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: '3px' }}>{inv.stageName || '-'}</div>
                  </td>
                  <td>{inv.invoiceDate}</td>
                  <td><strong style={{ color: '#0f172a' }}>₹{inv.totalAmount?.toLocaleString('en-IN')}</strong></td>
                  <td>
                    <div style={{ color: '#16a34a', fontSize: '0.85rem' }}>Paid: ₹{inv.amountPaidSoFar?.toLocaleString('en-IN') || 0}</div>
                    <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '500' }}>Bal: ₹{inv.balanceDue?.toLocaleString('en-IN') || 0}</div>
                  </td>
                  <td>
                    <span className={`statusBadge status-${(inv.status || 'DRAFT').toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div className="actionBtns">
                      <button title="View & Print Official Document" className="iconBtn btnPreview" onClick={() => setPreviewInvoice(inv)}>
                        <Eye size={16} />
                      </button>
                      <button title="Share on WhatsApp" className="iconBtn btnWhatsapp" onClick={() => shareWhatsApp(inv)}>
                        <Share2 size={16} />
                      </button>
                      <button title="Edit" className="iconBtn btnEdit" onClick={() => handleEdit(inv)}>
                        <Edit3 size={16} />
                      </button>
                      <button title="Delete" className="iconBtn btnDelete" onClick={() => handleDelete(inv.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="modalOverlay">
          <div className="modalCard modalLarge">
            <div className="modalHeader">
              <h2>{form.id ? 'Edit Document' : (form.billType === 'ESTIMATE' ? 'Create Full Construction Estimation Sheet' : 'Create Stage / Itemized Bill')}</h2>
              <button className="closeBtn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="modalBody">
              <div className="formGrid2">
                <div className="formGroup">
                  <label>Customer Account *</label>
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    required
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.displayName || c.username} ({c.projectName || 'No Project'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="formGroup">
                  <label>Document Mode</label>
                  <select value={form.billType} onChange={(e) => setForm({ ...form, billType: e.target.value })}>
                    <option value="ESTIMATE">House Construction Full Estimation Sheet</option>
                    <option value="RA_STAGE">Running Account (RA Stage Claim Bill)</option>
                    <option value="EXTRA_WORK">Extra Work & Material Bill</option>
                    <option value="PAYMENT_RECEIPT">Payment Receipt</option>
                  </select>
                </div>

                <div className="formGroup">
                  <label>Document Number</label>
                  <input
                    type="text"
                    value={form.invoiceNumber}
                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label>Date</label>
                  <input
                    type="date"
                    value={form.invoiceDate}
                    onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                    required
                  />
                </div>

                <div className="formGroup formGroupFull">
                  <label>Title / Description</label>
                  <input
                    type="text"
                    value={form.stageName}
                    onChange={(e) => setForm({ ...form, stageName: e.target.value })}
                  />
                </div>
              </div>

              {/* ESTIMATION MODE: Floor-wise Area Calculator */}
              {form.billType === 'ESTIMATE' && (
                <div className="lineItemsSection">
                  <div className="lineItemsHeader">
                    <h3>🏗️ Floor-wise Construction Built-up Area Breakdown</h3>
                    <button type="button" className="btnSecondary btnSm" onClick={addFloor}>
                      <Plus size={15} /> Add Floor Row
                    </button>
                  </div>
                  <table className="lineItemsTable">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Floor / Section Name</th>
                        <th>Area (Sq.ft)</th>
                        <th>Rate (₹/sqft)</th>
                        <th>Total Amount (₹)</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.floors.map((fl, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              value={fl.floorName}
                              onChange={(e) => updateFloor(idx, 'floorName', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={fl.sqft}
                              onChange={(e) => updateFloor(idx, 'sqft', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={fl.rate}
                              onChange={(e) => updateFloor(idx, 'rate', e.target.value)}
                            />
                          </td>
                          <td>
                            <strong>₹{(fl.amount || 0).toLocaleString('en-IN')}</strong>
                          </td>
                          <td>
                            {form.floors.length > 1 && (
                              <button type="button" className="iconBtn btnDelete" onClick={() => removeFloor(idx)}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '10px', fontSize: '0.88rem', color: '#0f172a', fontWeight: '700' }}>
                    Total Built-up Area: {totalSqft.toLocaleString('en-IN')} Sq.ft · Building Subtotal: ₹{floorsSubtotal.toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              {/* Extra Line Items Table */}
              <div className="lineItemsSection">
                <div className="lineItemsHeader">
                  <h3>{form.billType === 'ESTIMATE' ? '➕ Additional Custom Items / Add-ons' : '📋 Bill Particulars & Line Items'}</h3>
                  <button type="button" className="btnSecondary btnSm" onClick={addLineItem}>
                    <Plus size={15} /> Add Particular Line
                  </button>
                </div>
                <table className="lineItemsTable">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Item Description</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Rate (₹)</th>
                      <th>Amount (₹)</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. Compound Wall / Elevation extra"
                            value={item.description}
                            onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.qty}
                            onChange={(e) => updateLineItem(idx, 'qty', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) => updateLineItem(idx, 'rate', e.target.value)}
                          />
                        </td>
                        <td>
                          <strong>₹{(item.amount || 0).toLocaleString('en-IN')}</strong>
                        </td>
                        <td>
                          <button type="button" className="iconBtn btnDelete" onClick={() => removeLineItem(idx)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Material Specs Checklist for Estimation Mode */}
              {form.billType === 'ESTIMATE' && (
                <div className="lineItemsSection">
                  <h3>🧱 Standard Included Material Specifications</h3>
                  <div className="formGrid2" style={{ marginTop: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Steel, Cement & Bricks</label>
                      <input
                        type="text"
                        value={form.materialSpecs.structure}
                        onChange={(e) => setForm({ ...form, materialSpecs: { ...form.materialSpecs, structure: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Tiles & Flooring</label>
                      <input
                        type="text"
                        value={form.materialSpecs.flooring}
                        onChange={(e) => setForm({ ...form, materialSpecs: { ...form.materialSpecs, flooring: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Doors & Windows</label>
                      <input
                        type="text"
                        value={form.materialSpecs.doors}
                        onChange={(e) => setForm({ ...form, materialSpecs: { ...form.materialSpecs, doors: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Electrical & Wiring</label>
                      <input
                        type="text"
                        value={form.materialSpecs.electrical}
                        onChange={(e) => setForm({ ...form, materialSpecs: { ...form.materialSpecs, electrical: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary & Totals */}
              <div className="calcSummaryGrid">
                <div>
                  <div className="formGroup">
                    <label>Amount in Words (Auto-generated)</label>
                    <input type="text" value={amountInWords} readOnly className="inputReadOnly" />
                  </div>
                  <div className="formGroup" style={{ marginTop: '10px' }}>
                    <label>Notes & Terms</label>
                    <textarea
                      rows="3"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="calcTotalsBlock">
                  <div className="calcRow">
                    <span>Subtotal:</span>
                    <strong>₹{subTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="calcRow">
                    <span>GST (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="28"
                      value={form.gstPercentage}
                      onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })}
                      style={{ width: '70px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div className="calcRow calcTotal">
                    <span>Grand Total:</span>
                    <strong>₹{totalAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="calcRow">
                    <span>Paid / Advance (₹):</span>
                    <input
                      type="number"
                      min="0"
                      value={form.amountPaidSoFar}
                      onChange={(e) => setForm({ ...form, amountPaidSoFar: e.target.value })}
                      style={{ width: '120px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div className="calcRow calcBalance">
                    <span>Balance Due:</span>
                    <strong>₹{balanceDue.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="formGroup" style={{ marginTop: '12px' }}>
                    <label>Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="DRAFT">DRAFT</option>
                      <option value="SENT">SENT</option>
                      <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                      <option value="PAID">FULLY PAID</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modalFooter">
                <button type="button" className="btnSecondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btnPrimary">Save Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE LETTERHEAD MODAL */}
      {previewInvoice && (
        <div className="modalOverlay">
          <div className="modalCard modalLetterheadView">
            <div className="modalHeader noPrint">
              <h2>Official PSK Brothers Document Preview</h2>
              <div className="previewActions">
                <button className="btnPrimary" onClick={() => window.print()}><Printer size={16} /> Print / Save PDF</button>
                <button className="btnSecondary" onClick={() => setShowBankReport(true)}>🏦 Bank Valuation Report</button>
                <button className="btnSecondary" onClick={() => setShowAgreement(true)}>📜 Legal Agreement Contract</button>
                <button className="btnSecondary" onClick={() => shareWhatsApp(previewInvoice)}><Share2 size={16} /> WhatsApp Share</button>
                <button className="closeBtn" onClick={() => setPreviewInvoice(null)}>×</button>
              </div>
            </div>

            <div className="letterheadContainer printableArea">
              <div className="lhTopAccent"></div>
              <div className="lhHeader">
                <div className="lhHeaderLeft">
                  <div className="lhLogoBox">
                    <img src="/logo.png" alt="PSK Brothers Builders & Constructions" className="lhLogo" />
                  </div>
                  <div className="lhPartners">
                    <div>S. Prakash</div>
                    <div>S. Senthil Murugan</div>
                  </div>
                </div>

                <div className="lhHeaderRight">
                  <div className="lhContactRow"><strong>Mob:</strong> 9941426479</div>
                  <div className="lhContactRow">9003177934</div>
                  <div className="lhDateRow"><strong>Date:</strong> {previewInvoice.invoiceDate}</div>
                </div>
              </div>

              <div className="lhHeaderLine"></div>

              <div className="lhInvoiceBanner">
                <div className="lhBillTitle">
                  {previewInvoice.billType === 'ESTIMATE' ? 'HOUSE CONSTRUCTION COST ESTIMATION SHEET' : 'CONSTRUCTION STAGE BILL / INVOICE'}
                </div>
                <div className="lhInvNumber">No: {previewInvoice.invoiceNumber}</div>
              </div>

              <div className="lhDetailsGrid">
                <div className="lhDetailsBox">
                  <div className="lhDetailHeader">CLIENT & PROJECT DETAILS</div>
                  <div className="lhDetailRow"><strong>Customer Name:</strong> {previewInvoice.customer?.displayName || 'Valued Client'}</div>
                  <div className="lhDetailRow"><strong>Phone:</strong> {previewInvoice.customer?.phone || 'N/A'}</div>
                  <div className="lhDetailRow"><strong>Project Name:</strong> {previewInvoice.customer?.projectName || 'Residential Construction'}</div>
                </div>
                <div className="lhDetailsBox">
                  <div className="lhDetailHeader">SPECIFICATION OVERVIEW</div>
                  <div className="lhDetailRow"><strong>Doc Type:</strong> {previewInvoice.billType === 'ESTIMATE' ? 'Full Construction Estimate' : previewInvoice.billType}</div>
                  <div className="lhDetailRow"><strong>Built-up Area:</strong> {previewInvoice.builtUpArea ? `${previewInvoice.builtUpArea} Sq.ft` : 'N/A'}</div>
                  <div className="lhDetailRow"><strong>Valid Till:</strong> {previewInvoice.dueDate || '30 Days'}</div>
                </div>
              </div>

              {/* ESTIMATION MODE: Floors & Milestones */}
              {(() => {
                let parsed = {};
                try { parsed = JSON.parse(previewInvoice.lineItemsJson || '{}'); } catch (e) { }
                const isEstimate = previewInvoice.billType === 'ESTIMATE';

                return (
                  <>
                    {/* Floor-wise table if Estimate */}
                    {isEstimate && parsed.floors && parsed.floors.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', marginBottom: '8px' }}>
                          1. BUILT-UP AREA & FLOOR-WISE COST BREAKDOWN
                        </div>
                        <table className="lhTable">
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Floor / Area Particulars</th>
                              <th>Area (Sq.ft)</th>
                              <th>Rate (₹/sqft)</th>
                              <th>Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsed.floors.map((fl, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td><strong>{fl.floorName}</strong></td>
                                <td>{fl.sqft} sqft</td>
                                <td>₹{Number(fl.rate || 0).toLocaleString('en-IN')}</td>
                                <td><strong>₹{Number(fl.amount || 0).toLocaleString('en-IN')}</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Additional particulars */}
                    {parsed.lineItems && parsed.lineItems.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', marginBottom: '8px' }}>
                          {isEstimate ? '2. ADDITIONAL PARTICULAR CHARGES / ADD-ONS' : 'BILL PARTICULARS'}
                        </div>
                        <table className="lhTable">
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Particulars / Description</th>
                              <th>Qty</th>
                              <th>Unit</th>
                              <th>Rate (₹)</th>
                              <th>Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsed.lineItems.map((it, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td><strong>{it.description}</strong></td>
                                <td>{it.qty}</td>
                                <td>{it.unit || '-'}</td>
                                <td>₹{Number(it.rate || 0).toLocaleString('en-IN')}</td>
                                <td><strong>₹{Number(it.amount || 0).toLocaleString('en-IN')}</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Stage Payment Schedule for Estimation */}
                    {isEstimate && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#e2262b', marginBottom: '8px' }}>
                          3. STAGE-WISE PAYMENT MILESTONE SCHEDULE
                        </div>
                        <table className="lhTable">
                          <thead>
                            <tr>
                              <th>Stage #</th>
                              <th>Construction Stage Milestone</th>
                              <th>Percentage (%)</th>
                              <th>Stage Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getDynamicMilestones(parsed.floors).map((st, idx) => {
                              const stageAmt = Math.round((previewInvoice.totalAmount || 0) * (st.pct / 100));
                              return (
                                <tr key={idx}>
                                  <td><strong>Stage {idx + 1}</strong></td>
                                  <td>{st.stage}</td>
                                  <td><strong>{st.pct}%</strong></td>
                                  <td><strong>₹{stageAmt.toLocaleString('en-IN')}</strong></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Material Specs */}
                    {isEstimate && parsed.specs && (
                      <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', marginBottom: '8px' }}>
                          4. STANDARD INCLUDED MATERIAL SPECIFICATIONS
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                          <div><strong>Steel &amp; Cement:</strong> {parsed.specs.structure}</div>
                          <div><strong>Flooring &amp; Tiles:</strong> {parsed.specs.flooring}</div>
                          <div><strong>Doors &amp; Windows:</strong> {parsed.specs.doors}</div>
                          <div><strong>Electrical Wiring:</strong> {parsed.specs.electrical}</div>
                          <div><strong>Plumbing &amp; Sanitary:</strong> {parsed.specs.plumbing}</div>
                          <div><strong>Paint Finish:</strong> {parsed.specs.painting}</div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="lhSummarySection">
                <div className="lhWordsBox">
                  <div className="lhWordsLabel">AMOUNT IN WORDS:</div>
                  <div className="lhWordsText">{previewInvoice.amountInWords || numberToIndianWords(previewInvoice.totalAmount)}</div>
                  {previewInvoice.notes && (
                    <div className="lhNotesBox">
                      <strong>Notes &amp; Terms:</strong> {previewInvoice.notes}
                    </div>
                  )}
                </div>

                <div className="lhTotalsTable">
                  <div className="lhTotRow">
                    <span>Sub Total:</span>
                    <strong>₹{Number(previewInvoice.subTotal || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  {previewInvoice.gstPercentage > 0 && (
                    <div className="lhTotRow">
                      <span>GST ({previewInvoice.gstPercentage}%):</span>
                      <span>+ ₹{Number(previewInvoice.taxAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="lhTotRow lhGrandTotal">
                    <span>Total Estimated Cost:</span>
                    <strong>₹{Number(previewInvoice.totalAmount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="lhTotRow">
                    <span>Advance Paid:</span>
                    <span className="textGreen">₹{Number(previewInvoice.amountPaidSoFar || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="lhTotRow lhBalanceRow">
                    <span>Balance Due:</span>
                    <strong className="textRed">₹{Number(previewInvoice.balanceDue || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* 3-Column Layout: Left (Client Sign), Center (Company Stamp Seal), Right (Authorized Signatory) */}
              <div className="lhSignSection" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-end', marginTop: '30px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px' }}>
                {/* Left Column: Client Signature */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '65px', borderBottom: '1px dashed #94a3b8', width: '90%', marginBottom: '6px' }}></div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Client Signature</div>
                </div>

                {/* Center Column: Company Stamp Seal */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={customSeal || DEFAULT_CIRCULAR_SEAL_SVG}
                      alt="PSK Official Seal"
                      style={{ height: '80px', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
                    Official Stamp Seal
                  </div>
                </div>

                {/* Right Column: Authorized Signatory */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', width: '100%' }}>
                    <img
                      src={customSignature || DEFAULT_DIGITAL_SIGNATURE_SVG}
                      alt="Authorized Signature"
                      style={{ height: '75px', maxHeight: '85px', maxWidth: '220px', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ borderTop: '1px dashed #94a3b8', width: '90%', paddingTop: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#0f172a' }}>
                      For PSK BROTHERS BUILDERS
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>(Authorized Signatory)</div>
                  </div>
                </div>
              </div>

              <div className="lhFooterLine"></div>
              <div className="lhFooterAddress">
                Old No.123, New No. 1 Bajanai Koil Main Road Choolaimedu Chennai - 600094.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature & Stamp Seal Management Modal */}
      {showSignModal && (
        <div className="modalOverlay" onClick={() => setShowSignModal(false)}>
          <div className="modalCard" style={{ maxWidth: '520px', width: '100%', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>✒️ Upload Authorized Signature &amp; Seal</h3>
              <button className="closeBtn" onClick={() => setShowSignModal(false)}>×</button>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '18px' }}>
              Upload your official digital signature and company stamp seal images. They will be automatically printed on all PDF Estimation Sheets &amp; Bills.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Signature Upload */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                  1. Authorized Digital Signature Image (PNG / JPG / SVG)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  style={{ fontSize: '0.82rem', marginBottom: '10px' }}
                />
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Current Preview:</div>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', marginTop: '4px', textAlign: 'center' }}>
                  <img
                    src={customSignature || DEFAULT_DIGITAL_SIGNATURE_SVG}
                    alt="Signature Preview"
                    style={{ height: '65px', maxHeight: '75px', objectFit: 'contain' }}
                  />
                </div>
              </div>

              {/* Seal Upload */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                  2. Official Company Stamp Seal Image (PNG / JPG / SVG)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSealUpload}
                  style={{ fontSize: '0.82rem', marginBottom: '10px' }}
                />
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Current Preview:</div>
                <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', border: '1px dashed #cbd5e1', marginTop: '4px', textAlign: 'center' }}>
                  {customSeal ? (
                    <img src={customSeal} alt="Seal Preview" style={{ height: '48px', objectFit: 'contain' }} />
                  ) : (
                    <div style={{
                      display: 'inline-block',
                      border: '2px dashed #e2262b',
                      color: '#e2262b',
                      padding: '4px 10px',
                      fontWeight: '900',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      transform: 'rotate(-5deg)',
                      borderRadius: '4px',
                      background: 'rgba(226, 38, 43, 0.04)'
                    }}>
                      PSK BROTHERS BUILDERS
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <button
                type="button"
                onClick={handleResetSignatures}
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Reset to Default
              </button>

              <button
                type="button"
                className="btnPrimary"
                onClick={() => setShowSignModal(false)}
                style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bank Housing Loan Detailed Technical Valuation Report Modal (STAAD.Pro Certified Style) */}
      {showBankReport && previewInvoice && (
        <div className="modalOverlay" style={{ zIndex: 999999 }}>
          <div className="modalCard modalLetterheadView" style={{ maxWidth: '920px', padding: '0' }}>
            <div className="modalHeader noPrint" style={{ padding: '16px 24px', background: '#0f172a', color: '#fff' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.15rem' }}>🏦 Official Bank Detailed Technical Cost Estimation &amp; Valuation Report</h2>
              <div className="previewActions">
                <button className="btnPrimary" onClick={() => window.print()}><Printer size={16} /> Print / Save Bank PDF</button>
                <button className="closeBtn" style={{ color: '#fff' }} onClick={() => setShowBankReport(false)}>×</button>
              </div>
            </div>

            <div className="letterheadContainer printableArea" style={{ padding: '30px' }}>
              {/* Header Accent */}
              <div style={{ borderBottom: '3px solid #e2262b', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>PSK BROTHERS BUILDERS &amp; CONSTRUCTIONS</h1>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#e2262b', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '3px' }}>
                      DETAILED TECHNICAL &amp; MATERIAL COST VALUATION REPORT (FOR BANK HOUSING LOAN)
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                      Chartered Engineers, Govt Approved Valuers &amp; Structural Engineering Consultants
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#334155' }}>
                    <div><strong>Valuation Ref:</strong> PSK-BANK-VAL-{previewInvoice.invoiceNumber || '2026-089'}</div>
                    <div><strong>Date:</strong> {previewInvoice.invoiceDate || new Date().toISOString().split('T')[0]}</div>
                    <div><strong>Bank Target:</strong> SBI / Canara / HDFC / ICICI Bank</div>
                  </div>
                </div>
              </div>

              {/* 1. PROJECT & CLIENT SPECIFICATIONS */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px' }}>
                  SECTION I: CLIENT, SITE LOCATION &amp; PROPERTY SPECIFICATIONS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                  <div><strong>Borrower / Client Name:</strong> {previewInvoice.customer?.displayName || 'Valued Client'}</div>
                  <div><strong>Contact Number:</strong> {previewInvoice.customer?.phone || 'N/A'}</div>
                  <div><strong>Construction Site Address:</strong> {previewInvoice.customer?.projectName || 'Plot No 42, Bajanai Koil Main Road, Choolaimedu, Chennai'}</div>
                  <div><strong>Total Plot Area:</strong> {Math.round((previewInvoice.builtUpArea || 1200) * 0.7)} Sq.ft</div>
                  <div><strong>Total Proposed Built-up Area:</strong> <strong style={{ color: '#0284c7' }}>{previewInvoice.builtUpArea || 1200} Sq.ft</strong></div>
                  <div><strong>Structure Type:</strong> Framed RCC Structure (IS 456:2000 Seismic Safe)</div>
                  <div><strong>Estimated Execution Duration:</strong> 10 Months</div>
                  <div><strong>Total Certified Valuation Cost:</strong> <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>₹{Number(previewInvoice.totalAmount || 0).toLocaleString('en-IN')}</strong></div>
                </div>
              </div>

              {/* 2. ITEMISED MATERIAL QUANTITY & FINANCIAL VALUATION BREAKDOWN */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', marginBottom: '8px' }}>
                  SECTION II: ITEMISED MATERIAL QUANTITY &amp; WORK VALUATION BREAKUP (LIVE MARKET RATES)
                </div>
                <table className="lhTable" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px' }}>Item #</th>
                      <th style={{ padding: '8px' }}>Material / Work Particulars</th>
                      <th style={{ padding: '8px' }}>Est. Quantity</th>
                      <th style={{ padding: '8px' }}>Unit Rate (₹)</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Total Valuation (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const totalArea = previewInvoice.builtUpArea || 1200;
                      const totAmt = previewInvoice.totalAmount || (totalArea * 1850);
                      
                      const matBreakup = [
                        { item: 'Cement (UltraTech / Ramco 53-Grade)', qty: `${Math.round(totalArea * 0.4)} Bags`, rate: 420, amount: Math.round(totAmt * 0.12) },
                        { item: 'TMT Steel Reinforcement Bars (Tata Tiscon 550D Fe)', qty: `${(totalArea * 0.003).toFixed(2)} Tons`, rate: 68000, amount: Math.round(totAmt * 0.14) },
                        { item: 'M-Sand & River Sand for PCC & Masonry', qty: `${Math.round(totalArea * 2.0)} Cu.ft`, rate: 65, amount: Math.round(totAmt * 0.08) },
                        { item: 'Coarse Blue Metal Aggregates (20mm & 40mm)', qty: `${Math.round(totalArea * 1.2)} Cu.ft`, rate: 45, amount: Math.round(totAmt * 0.05) },
                        { item: 'First Class Chamber Red Bricks / AAC Blocks', qty: `${Math.round(totalArea * 12)} Nos`, rate: 11, amount: Math.round(totAmt * 0.09) },
                        { item: 'Vitrified Flooring Tiles & Granite Stones (Somany/Kajaria)', qty: `${Math.round(totalArea * 0.9)} Sq.ft`, rate: 85, amount: Math.round(totAmt * 0.08) },
                        { item: 'Teak Main Door, Flush Interior Doors & UPVC Windows', qty: '1 Job Complete', rate: 0, amount: Math.round(totAmt * 0.07) },
                        { item: 'CPVC Plumbing Pipes, Overhead Tank & Sanitaryware (Jaquar)', qty: '1 Job Complete', rate: 0, amount: Math.round(totAmt * 0.06) },
                        { item: 'Fire-Resistant Copper Wiring & Modular Switchgear (Finolex)', qty: '1 Job Complete', rate: 0, amount: Math.round(totAmt * 0.06) },
                        { item: 'Wall Putty, Primer & Asian Apex Weatherproof Painting', qty: '1 Job Complete', rate: 0, amount: Math.round(totAmt * 0.05) },
                        { item: 'Centering, Shuttering, Earthwork Excavation & Skilled Labor', qty: '1 Job Complete', rate: 0, amount: Math.round(totAmt * 0.20) }
                      ];

                      return matBreakup.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 8px' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 8px' }}><strong>{m.item}</strong></td>
                          <td style={{ padding: '6px 8px' }}>{m.qty}</td>
                          <td style={{ padding: '6px 8px' }}>{m.rate > 0 ? `₹${m.rate}` : 'Lumpsum'}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{m.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* 3. STAGE-WISE BANK DISBURSEMENT SCHEDULE */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#e2262b', marginBottom: '8px' }}>
                  SECTION III: STAGE-WISE BANK LOAN DISBURSEMENT SCHEDULE
                </div>
                <table className="lhTable" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px' }}>Stage #</th>
                      <th style={{ padding: '8px' }}>Construction Stage Milestone</th>
                      <th style={{ padding: '8px' }}>Disbursement %</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Stage Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let parsed = {};
                      try { parsed = JSON.parse(previewInvoice.lineItemsJson || '{}'); } catch (e) { }
                      return getDynamicMilestones(parsed.floors).map((st, idx) => {
                        const stageAmt = Math.round((previewInvoice.totalAmount || 0) * (st.pct / 100));
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px 8px' }}><strong>Stage {idx + 1}</strong></td>
                            <td style={{ padding: '6px 8px' }}>{st.stage}</td>
                            <td style={{ padding: '6px 8px' }}><strong>{st.pct}%</strong></td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{stageAmt.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* 4. STRUCTURAL ENGINEER CERTIFICATION STATEMENT */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '8px', marginBottom: '25px', fontSize: '0.8rem', color: '#166534' }}>
                <strong>TECHNICAL CERTIFICATION STATEMENT:</strong>
                <br />
                This is to certify that the detailed construction estimate for <strong>{previewInvoice.customer?.displayName || 'Valued Client'}</strong>'s proposed residential building of <strong>{previewInvoice.builtUpArea || 1200} Sq.ft</strong> total area has been evaluated based on prevalent market rates in Chennai. The structural design complies with National Building Code (NBC) &amp; IS 456:2000 specifications for earthquake and structural safety. Recommended for bank housing loan sanction.
              </div>

              {/* 3-Column Footer Signature */}
              <div className="lhSignSection" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-end', marginTop: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px' }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '65px', borderBottom: '1px dashed #94a3b8', width: '90%', marginBottom: '6px' }}></div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Borrower / Client Signature</div>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={customSeal || DEFAULT_CIRCULAR_SEAL_SVG} alt="Official Seal" style={{ height: '80px', objectFit: 'contain' }} />
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', marginTop: '4px' }}>OFFICIAL VALUER STAMP SEAL</div>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', width: '100%' }}>
                    <img src={customSignature || DEFAULT_DIGITAL_SIGNATURE_SVG} alt="Authorized Signature" style={{ height: '75px', maxHeight: '85px', maxWidth: '220px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ borderTop: '1px dashed #94a3b8', width: '90%', paddingTop: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a' }}>For PSK BROTHERS BUILDERS</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Licensed Structural Engineer &amp; Valuer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official House Construction Legal Agreement & Contract Modal */}
      {showAgreement && previewInvoice && (
        <div className="modalOverlay" style={{ zIndex: 999999 }}>
          <div className="modalCard modalLetterheadView" style={{ maxWidth: '920px', padding: '0' }}>
            <div className="modalHeader noPrint" style={{ padding: '16px 24px', background: '#0f172a', color: '#fff' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.15rem' }}>📜 Official House Construction Legal Agreement &amp; Contract Document</h2>
              <div className="previewActions">
                <button className="btnPrimary" onClick={() => window.print()}><Printer size={16} /> Print / Save Contract PDF</button>
                <button className="closeBtn" style={{ color: '#fff' }} onClick={() => setShowAgreement(false)}>×</button>
              </div>
            </div>

            <div className="letterheadContainer printableArea" style={{ padding: '35px' }}>
              {/* Agreement Header */}
              <div style={{ textAlign: 'center', borderBottom: '3px double #0f172a', paddingBottom: '14px', marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', letterSpacing: '0.5px' }}>
                  PSK BROTHERS BUILDERS &amp; CONSTRUCTIONS
                </h1>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#e2262b', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '4px' }}>
                  OFFICIAL HOUSE CONSTRUCTION LEGAL AGREEMENT &amp; CONTRACT
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Registered Office: Old No.123, New No. 1 Bajanai Koil Main Road, Choolaimedu, Chennai - 600094 | Mob: 9941426479
                </div>
              </div>

              {/* CLAUSE 1: PARTIES */}
              <div style={{ fontSize: '0.86rem', lineHeight: '1.6', color: '#1e293b', marginBottom: '20px' }}>
                This House Construction Agreement is entered into on <strong>{previewInvoice.invoiceDate || new Date().toLocaleDateString()}</strong> between:
                <br /><br />
                <strong>1. THE BUILDER:</strong> <strong>PSK BROTHERS BUILDERS &amp; CONSTRUCTIONS</strong>, represented by Partners S. Prakash &amp; S. Senthil Murugan, having registered office at Choolaimedu, Chennai (hereinafter referred to as the "FIRST PARTY / BUILDER").
                <br /><br />
                <strong>2. THE CLIENT / OWNER:</strong> <strong>{previewInvoice.customer?.displayName || 'Valued Client'}</strong>, residing at {previewInvoice.customer?.projectName || 'Chennai'}, Contact: {previewInvoice.customer?.phone || 'N/A'} (hereinafter referred to as the "SECOND PARTY / CLIENT").
              </div>

              {/* CLAUSE 2: SCOPE OF WORK & COST */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a', marginBottom: '8px' }}>
                  CLAUSE 1: SCOPE OF WORK &amp; TOTAL CONTRACT VALUE
                </div>
                <div>
                  The Builder agrees to construct a turnkey Residential Building of <strong>{previewInvoice.builtUpArea || 1200} Sq.ft total built-up area</strong> for the total fixed contract sum of:
                  <br />
                  <strong style={{ fontSize: '1.1rem', color: '#e2262b', display: 'block', margin: '6px 0' }}>
                    ₹{Number(previewInvoice.totalAmount || 0).toLocaleString('en-IN')} ({previewInvoice.amountInWords || numberToIndianWords(previewInvoice.totalAmount)})
                  </strong>
                  The construction rate includes all labor, Tata Tiscon steel, UltraTech cement, Somany tiles, teak doors, plumbing, electrical, and finishing as detailed in the technical specification attachment.
                </div>
              </div>

              {/* CLAUSE 3: MILESTONE PAYMENT SCHEDULE */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a', marginBottom: '8px' }}>
                  CLAUSE 2: STAGE-WISE MILESTONE PAYMENT SCHEDULE
                </div>
                <table className="lhTable" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px' }}>Stage #</th>
                      <th style={{ padding: '8px' }}>Work Milestone Stage</th>
                      <th style={{ padding: '8px' }}>Payment %</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Amount Payable (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let parsed = {};
                      try { parsed = JSON.parse(previewInvoice.lineItemsJson || '{}'); } catch (e) { }
                      return getDynamicMilestones(parsed.floors).map((st, idx) => {
                        const stageAmt = Math.round((previewInvoice.totalAmount || 0) * (st.pct / 100));
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px 8px' }}><strong>Stage {idx + 1}</strong></td>
                            <td style={{ padding: '6px 8px' }}>{st.stage}</td>
                            <td style={{ padding: '6px 8px' }}><strong>{st.pct}%</strong></td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{stageAmt.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* CLAUSE 4: TIMELINE, WARRANTY & LEGAL TERMS */}
              <div style={{ fontSize: '0.83rem', lineHeight: '1.6', color: '#334155', marginBottom: '25px' }}>
                <strong>CLAUSE 3: TIMELINE &amp; STRUCTURAL WARRANTY TERMS</strong>
                <ul style={{ margin: '6px 0', paddingLeft: '20px' }}>
                  <li><strong>Timeline:</strong> Construction shall be completed within <strong>10 Months</strong> from foundation commencement, subject to timely stage payments.</li>
                  <li><strong>10-Year Warranty:</strong> PSK Builders provides a <strong>10-Year Structural Guarantee</strong> for RCC columns, beams, footings, and roof slabs.</li>
                  <li><strong>Extra Work:</strong> Any design changes or extra additions requested by the Client outside the contract specifications will be billed separately.</li>
                  <li><strong>Jurisdiction:</strong> All legal disputes shall be subject to the exclusive jurisdiction of the Courts in Chennai, Tamil Nadu.</li>
                </ul>
              </div>

              {/* 3-COLUMN SIGNATURE BLOCK */}
              <div className="lhSignSection" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-end', marginTop: '30px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px' }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '65px', borderBottom: '1px dashed #94a3b8', width: '90%', marginBottom: '6px' }}></div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Client / Property Owner Signature</div>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={customSeal || DEFAULT_CIRCULAR_SEAL_SVG} alt="Official Seal" style={{ height: '80px', objectFit: 'contain' }} />
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', marginTop: '4px' }}>OFFICIAL STAMP SEAL</div>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', width: '100%' }}>
                    <img src={customSignature || DEFAULT_DIGITAL_SIGNATURE_SVG} alt="Authorized Signature" style={{ height: '75px', maxHeight: '85px', maxWidth: '220px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ borderTop: '1px dashed #94a3b8', width: '90%', paddingTop: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a' }}>For PSK BROTHERS BUILDERS</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>(Authorized Signatory)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

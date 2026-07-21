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

const DEFAULT_STAGES = [
  { stage: '1. Advance / Booking & Architectural Plan', pct: 10 },
  { stage: '2. Foundation & Plinth Beam Completion', pct: 15 },
  { stage: '3. Ground Floor Roof Slab Completion', pct: 20 },
  { stage: '4. First Floor Roof Slab Completion', pct: 20 },
  { stage: '5. Brickwork & Plastering Completion', pct: 15 },
  { stage: '6. Flooring, Tiles, Plumbing & Electrical', pct: 15 },
  { stage: '7. Painting, Finishing & Key Handover', pct: 5 }
];

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
                            {DEFAULT_STAGES.map((st, idx) => {
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
                          <div><strong>Steel & Cement:</strong> {parsed.specs.structure}</div>
                          <div><strong>Flooring & Tiles:</strong> {parsed.specs.flooring}</div>
                          <div><strong>Doors & Windows:</strong> {parsed.specs.doors}</div>
                          <div><strong>Electrical Wiring:</strong> {parsed.specs.electrical}</div>
                          <div><strong>Plumbing & Sanitary:</strong> {parsed.specs.plumbing}</div>
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
                      <strong>Notes & Terms:</strong> {previewInvoice.notes}
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

              <div className="lhSignSection">
                <div className="lhSignBox">
                  <div className="lhSignSpace"></div>
                  <div>Client Signature</div>
                </div>
                <div className="lhSignBox">
                  <div className="lhSignSpace">
                    <span className="stampSealText">PSK BROTHERS BUILDERS</span>
                  </div>
                  <div><strong>For PSK BROTHERS BUILDERS</strong><br />(Authorized Signatory)</div>
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
    </div>
  );
}

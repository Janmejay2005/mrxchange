import React, { useState } from 'react';
import { Package, Plus, Home, Search, FileText, X, Edit, Trash2 } from 'lucide-react';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import PdfExportModal from '../components/common/PdfExportModal';

export default function NewInHandStock() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [brand, setBrand] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Book / Sell Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [sellForm, setSellForm] = useState({
    quantity: 1,
    soldBy: 'Staff',
    soldTo: '',
    paymentType: 'installment', // 'installment' | 'complete'
    actualAmount: '',
    paidAmount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Edit Device Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    sno: null,
    brand: '',
    model: '',
    storage: '',
    ram: '',
    color: '',
    purchasedBy: '',
    amount: ''
  });

  const [stock, setStock] = useState(() => {
    const initial = [
      { sno: 1, date: '2026-09-15', brand: 'Google Pixel', model: 'Pixel 8 Pro', storage: 256, ram: 12, color: 'Bay Blue', purchasedBy: 'Jeet', amount: 89000, procedure: 'Sell' },
      { sno: 2, date: '2026-09-14', brand: 'Apple', model: 'iPhone 15 Pro Max', storage: 512, ram: 8, color: 'Natural Titanium', purchasedBy: 'Sonal', amount: 132000, procedure: 'Sell' },
      { sno: 3, date: '2026-09-14', brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: 256, ram: 12, color: 'Titanium Black', purchasedBy: 'Rohit', amount: 114000, procedure: 'Hold' },
      { sno: 4, date: '2026-09-13', brand: 'OnePlus', model: 'OnePlus 12', storage: 512, ram: 16, color: 'Silky Black', purchasedBy: 'Neha', amount: 64999, procedure: 'Sell' },
      { sno: 5, date: '2026-09-12', brand: 'Vivo', model: 'X100 Pro', storage: 512, ram: 16, color: 'Sunset Orange', purchasedBy: 'Aman', amount: 89999, procedure: 'Sell' },
      { sno: 6, date: '2026-09-11', brand: 'Nothing', model: 'Phone (2a)', storage: 256, ram: 12, color: 'Milk White', purchasedBy: 'Karan', amount: 27999, procedure: 'Check' },
      { sno: 7, date: '2026-09-11', brand: 'Xiaomi', model: '14 Ultra', storage: 512, ram: 16, color: 'White', purchasedBy: 'Vikram', amount: 99999, procedure: 'Sell' },
      { sno: 8, date: '2026-09-10', brand: 'Realme', model: 'GT 5 Pro', storage: 256, ram: 12, color: 'Silver', purchasedBy: 'Sunal', amount: 42000, procedure: 'Sell' },
      { sno: 9, date: '2026-09-09', brand: 'Motorola', model: 'Edge 50 Ultra', storage: 512, ram: 16, color: 'Nordic Wood', purchasedBy: 'Ananya', amount: 59999, procedure: 'Hold' },
      { sno: 10, date: '2026-09-08', brand: 'Oppo', model: 'Find N3 Flip', storage: 256, ram: 12, color: 'Gold', purchasedBy: 'Jeet', amount: 84999, procedure: 'Sell' }
    ];
    try {
      const deliveredItems = JSON.parse(localStorage.getItem('mrx_new_in_hand_stock') || '[]');
      return [...deliveredItems, ...initial];
    } catch (e) {
      return initial;
    }
  });

  const toYMD = (val) => {
    if (!val) return '';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const filteredStock = stock.filter((item) => {
    if (brand !== 'All' && item.brand !== brand) return false;
    if (selectedDate) {
      const itemYMD = toYMD(item.date);
      const selYMD = toYMD(selectedDate);
      if (itemYMD && selYMD && itemYMD !== selYMD) return false;
    }
    if (fromDate) {
      const itemYMD = toYMD(item.date);
      const fYMD = toYMD(fromDate);
      if (itemYMD && fYMD && itemYMD < fYMD) return false;
    }
    if (toDate) {
      const itemYMD = toYMD(item.date);
      const tYMD = toYMD(toDate);
      if (itemYMD && tYMD && itemYMD > tYMD) return false;
    }
    const q = (searchQuery || globalSearch || '').trim().toLowerCase();
    if (q) {
      const matchModel = item.model.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchPerson = (item.purchasedBy || '').toLowerCase().includes(q);
      const matchColor = (item.color || '').toLowerCase().includes(q);
      if (!matchModel && !matchBrand && !matchPerson && !matchColor) return false;
    }
    return true;
  });

  const openSellModal = (item = null) => {
    setSelectedStockItem(item);
    setSellForm({
      quantity: 1,
      soldBy: 'Staff',
      soldTo: item ? item.purchasedBy || '' : '',
      paymentType: 'installment',
      actualAmount: item ? item.amount || '' : '',
      paidAmount: item ? item.amount || '' : '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsSellModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditForm({
      sno: item.sno,
      brand: item.brand,
      model: item.model,
      storage: item.storage,
      ram: item.ram,
      color: item.color,
      purchasedBy: item.purchasedBy,
      amount: item.amount
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setStock(prev => prev.map(item => item.sno === editForm.sno ? {
      ...item,
      brand: editForm.brand,
      model: editForm.model,
      storage: Number(editForm.storage),
      ram: Number(editForm.ram),
      color: editForm.color,
      purchasedBy: editForm.purchasedBy,
      amount: Number(editForm.amount)
    } : item));
    setIsEditModalOpen(false);
    alert('Device details updated successfully!');
  };

  const handleDeleteDevice = (sno) => {
    if (window.confirm('Are you sure you want to delete this device from New In-hand stock?')) {
      setStock(prev => prev.filter(item => item.sno !== sno));
      const deliveredItems = JSON.parse(localStorage.getItem('mrx_new_in_hand_stock') || '[]');
      const updatedDelivered = deliveredItems.filter(item => item.sno !== sno);
      localStorage.setItem('mrx_new_in_hand_stock', JSON.stringify(updatedDelivered));
    }
  };

  const handleSellSubmit = (e) => {
    e.preventDefault();
    alert(`Device "${selectedStockItem ? selectedStockItem.model : 'Mobile'}" sold / booked successfully! Recorded for ${sellForm.soldTo}.`);
    setIsSellModalOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['Sno', 'Date', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Purchased By', 'Amount (Rs)', 'Further Procedure'];
    const rows = filteredStock.map((item, idx) => [
      idx + 1,
      item.date,
      item.brand,
      item.model,
      `${item.storage} GB`,
      `${item.ram} GB`,
      item.color || '-',
      item.purchasedBy || '-',
      `Rs. ${item.amount.toLocaleString()}`,
      'Book / Sell'
    ]);
    const totalVal = filteredStock.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    setExportModalConfig({
      isOpen: true,
      title: 'New In-hand Stock PDF Report',
      headers,
      rows,
      filename: `New_In_Hand_Stock_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Valuation', value: `Rs. ${totalVal.toLocaleString()}`, color: '#0284c7' }
      ]
    });
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>New In-hand Stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>List of newly purchased mobiles currently in hand.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>New In-hand Stock</span>
          </div>
          <button onClick={handleExportPdf} className="btn-secondary" style={{ padding: '9px 16px', borderRadius: '8px' }}>
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={() => openSellModal(null)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
            <Plus size={16} /> Book / Sell Device
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>From Date</label>
          <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '160px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>To Date</label>
          <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '160px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Brand</label>
          <select className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
            <option>All</option>
            <option>Google Pixel</option>
            <option>Apple</option>
            <option>Samsung</option>
            <option>OnePlus</option>
            <option>Vivo</option>
            <option>Xiaomi</option>
            <option>Nothing</option>
            <option>Realme</option>
            <option>Motorola</option>
            <option>Oppo</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '220px', marginTop: '18px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by model, brand, color, or person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={() => { setFromDate(''); setToDate(''); setBrand('All'); setSearchQuery(''); }} className="btn-secondary">Clear</button>
          <button className="btn-primary">Apply</button>
        </div>
      </div>

      {/* New In-hand Stock Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Sno</th>
              <th>Date</th>
              <th>Brand Name</th>
              <th>Model</th>
              <th>Storage (GB)</th>
              <th>RAM (GB)</th>
              <th>Color</th>
              <th>Purchased By</th>
              <th>Purchased Amount (₹)</th>
              <th>Further Procedure</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No devices match the specified filter criteria.
                </td>
              </tr>
            ) : (
              filteredStock.map((item, idx) => (
                <tr key={item.sno}>
                  <td>{idx + 1}</td>
                  <td>{item.date}</td>
                  <td style={{ fontWeight: 600 }}>{item.brand}</td>
                  <td style={{ fontWeight: 700 }}>{item.model}</td>
                  <td>{item.storage}</td>
                  <td>{item.ram}</td>
                  <td>{item.color}</td>
                  <td>{item.purchasedBy}</td>
                  <td style={{ fontWeight: 700 }}>
                    <CurrencyAmount amount={item.amount} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        onClick={() => openEditModal(item)} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#0284c7', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteDevice(item.sno)} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ef4444', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Book / Sell Device Modal matching user diagram */}
      {isSellModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>Book / Sell Device</h2>
                {selectedStockItem && (
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                    {selectedStockItem.brand} {selectedStockItem.model} ({selectedStockItem.storage}GB / {selectedStockItem.ram}GB)
                  </p>
                )}
              </div>
              <button onClick={() => setIsSellModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleSellSubmit}>
              {/* -> Quantity */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Quantity</label>
                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc' }}>
                  <button 
                    type="button" 
                    onClick={() => setSellForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))} 
                    style={{ padding: '8px 16px', border: 'none', background: '#e2e8f0', cursor: 'pointer', fontWeight: 800, fontSize: '16px', color: '#334155' }}
                  >
                    -
                  </button>
                  <span style={{ width: '44px', textAlign: 'center', fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                    {sellForm.quantity}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setSellForm(prev => ({ ...prev, quantity: prev.quantity + 1 }))} 
                    style={{ padding: '8px 16px', border: 'none', background: '#e2e8f0', cursor: 'pointer', fontWeight: 800, fontSize: '16px', color: '#334155' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* -> Sold by */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Sold by *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter salesperson / staff name" 
                  value={sellForm.soldBy} 
                  onChange={(e) => setSellForm({ ...sellForm, soldBy: e.target.value })} 
                  required 
                />
              </div>

              {/* -> Sold to (Party name) */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Sold to (Party name) *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter customer / party name" 
                  value={sellForm.soldTo} 
                  onChange={(e) => setSellForm({ ...sellForm, soldTo: e.target.value })} 
                  required 
                />
              </div>

              {/* -> Installment or complete */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Installment or complete *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <button
                    type="button"
                    onClick={() => setSellForm({ ...sellForm, paymentType: 'installment' })}
                    style={{
                      padding: '9px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      background: sellForm.paymentType === 'installment' ? '#0284c7' : 'transparent',
                      color: sellForm.paymentType === 'installment' ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Installment
                  </button>
                  <button
                    type="button"
                    onClick={() => setSellForm({ ...sellForm, paymentType: 'complete' })}
                    style={{
                      padding: '9px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      background: sellForm.paymentType === 'complete' ? '#059669' : 'transparent',
                      color: sellForm.paymentType === 'complete' ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Complete
                  </button>
                </div>
              </div>

              {/* -> Actual amount */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Actual amount (₹) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="₹ Total sale price" 
                  value={sellForm.actualAmount} 
                  onChange={(e) => setSellForm({ ...sellForm, actualAmount: e.target.value })} 
                  required 
                />
              </div>

              {/* -> Paid amount */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Paid amount (₹) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="₹ Paid amount" 
                  value={sellForm.paidAmount} 
                  onChange={(e) => setSellForm({ ...sellForm, paidAmount: e.target.value })} 
                  required 
                />
              </div>

              {/* -> Date */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Date *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={sellForm.date} 
                  onChange={(e) => setSellForm({ ...sellForm, date: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsSellModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Confirm Sale / Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>Edit In-hand Device</h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>Update stock specifications and purchasing details.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label">Brand Name *</label>
                  <input type="text" className="form-control" value={editForm.brand} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Model *</label>
                  <input type="text" className="form-control" value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Storage (GB) *</label>
                  <input type="number" className="form-control" value={editForm.storage} onChange={(e) => setEditForm({ ...editForm, storage: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">RAM (GB) *</label>
                  <input type="number" className="form-control" value={editForm.ram} onChange={(e) => setEditForm({ ...editForm, ram: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Color *</label>
                  <input type="text" className="form-control" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Purchased By *</label>
                  <input type="text" className="form-control" value={editForm.purchasedBy} onChange={(e) => setEditForm({ ...editForm, purchasedBy: e.target.value })} required />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Purchased Amount (₹) *</label>
                <input type="number" className="form-control" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Export Preview Dialogue Modal */}
      <PdfExportModal
        isOpen={exportModalConfig.isOpen}
        onClose={() => setExportModalConfig({ ...exportModalConfig, isOpen: false })}
        title={exportModalConfig.title}
        headers={exportModalConfig.headers}
        rows={exportModalConfig.rows}
        filename={exportModalConfig.filename}
        summaryInfo={exportModalConfig.summaryInfo}
      />
    </div>
  );
}

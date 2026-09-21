import React, { useState } from 'react';
import { Package, Plus, Home, Search, FileText } from 'lucide-react';
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

  const handleExportPdf = () => {
    const headers = ['Sno', 'Date', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Purchased By', 'Amount (Rs)', 'Status'];
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
      item.procedure || 'Sell'
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
          <button onClick={handleExportPdf} className="btn-primary">
            <FileText size={16} /> Export PDF
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
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
                    <span style={{ 
                      fontWeight: 600, 
                      color: item.procedure === 'Sell' ? '#0284c7' : item.procedure === 'Hold' ? '#d97706' : '#64748b' 
                    }}>
                      {item.procedure}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button className="btn-primary" style={{ padding: '4px 14px', fontSize: '12px', borderRadius: '6px' }}>
                        Sell
                      </button>
                      <button className="btn-secondary" style={{ padding: '4px 8px', borderRadius: '6px' }}>...</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

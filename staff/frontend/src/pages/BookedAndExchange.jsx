import React, { useState } from 'react';
import { RefreshCw, Plus, Home, Search, X, CheckCircle, XCircle, MoreHorizontal, FileText } from 'lucide-react';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useNavigate } from 'react-router-dom';
import PdfExportModal from '../components/common/PdfExportModal';

export default function BookedAndExchange() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'bookings' | 'exchanges'
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [purchasedBy, setPurchasedBy] = useState('All');
  const [mobileBrand, setMobileBrand] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Book Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    customerName: '',
    purchasedAmount: '',
    via: 'Cash',
    payBy: 'Staff',
    platform: 'Offline',
    accountId: '',
    newBrand: 'Google Pixel',
    newModel: 'Pixel 8 Pro',
    storage: '256',
    ram: '12',
    color: 'Bay Blue',
    oldDeviceId: '',
    totalExchangeCost: 0,
    actualCost: 0
  });

  const [exchanges, setExchanges] = useState([
    { id: 1, date: '15 Sep 2026', newBrand: 'Apple', newModel: 'iPhone 15 Pro Max', newStorage: 256, newRam: 8, newColor: 'Natural Titanium', newPurchasedBy: 'Jeet', newAmount: 125000, oldBrand: 'Samsung', oldModel: 'S23 Ultra', oldStorage: 256, oldRam: 12, oldColor: 'Phantom Black', oldPurchasedBy: 'Jeet', oldAmount: 58000, status: 'Booked' },
    { id: 2, date: '14 Sep 2026', newBrand: 'Samsung', newModel: 'Galaxy S24 Ultra', newStorage: 512, newRam: 12, newColor: 'Titanium Gray', newPurchasedBy: 'Sonal', newAmount: 118000, oldBrand: 'OnePlus', oldModel: '11', oldStorage: 256, oldRam: 16, oldColor: 'Eternal Green', oldPurchasedBy: 'Sonal', oldAmount: 32000, status: 'Booked' },
    { id: 3, date: '13 Sep 2026', newBrand: 'Google Pixel', newModel: 'Pixel 8 Pro', newStorage: 256, newRam: 12, newColor: 'Obsidian', newPurchasedBy: 'Rohit', newAmount: 92000, oldBrand: 'Google Pixel', oldModel: 'Pixel 6 Pro', oldStorage: 128, oldRam: 12, oldColor: 'Stormy Black', oldPurchasedBy: 'Rohit', oldAmount: 26000, status: 'Booked' },
    { id: 4, date: '12 Sep 2026', newBrand: 'OnePlus', newModel: 'OnePlus 12', newStorage: 512, newRam: 16, newColor: 'Flowy Emerald', newPurchasedBy: 'Neha', newAmount: 64999, oldBrand: 'Xiaomi', oldModel: '12 Pro', oldStorage: 256, oldRam: 12, oldColor: 'Blue', oldPurchasedBy: 'Neha', oldAmount: 22000, status: 'Booked' },
    { id: 5, date: '11 Sep 2026', newBrand: 'Vivo', newModel: 'X100 Pro', newStorage: 512, newRam: 16, newColor: 'Asteroid Black', newPurchasedBy: 'Aman', newAmount: 89999, oldBrand: 'Vivo', oldModel: 'V27 Pro', oldStorage: 256, oldRam: 12, oldColor: 'Magic Blue', oldPurchasedBy: 'Aman', oldAmount: 24000, status: 'Booked' },
    { id: 6, date: '10 Sep 2026', newBrand: 'Nothing', newModel: 'Phone (2)', newStorage: 256, newRam: 12, newColor: 'Dark Gray', newPurchasedBy: 'Karan', newAmount: 44999, oldBrand: 'Nothing', oldModel: 'Phone (1)', oldStorage: 128, oldRam: 8, oldColor: 'White', oldPurchasedBy: 'Karan', oldAmount: 18000, status: 'Booked' },
    { id: 7, date: '09 Sep 2026', newBrand: 'Motorola', newModel: 'Edge 50 Ultra', newStorage: 512, newRam: 16, newColor: 'Peach Fuzz', newPurchasedBy: 'Vikram', newAmount: 59999, oldBrand: 'Motorola', oldModel: 'Edge 40', oldStorage: 256, oldRam: 8, oldColor: 'Eclipse Black', oldPurchasedBy: 'Vikram', oldAmount: 20000, status: 'Booked' },
    { id: 8, date: '08 Sep 2026', newBrand: 'Xiaomi', newModel: '14 Ultra', newStorage: 512, newRam: 16, newColor: 'Black', newPurchasedBy: 'Ananya', newAmount: 99999, oldBrand: 'Oppo', oldModel: 'Reno 10 Pro+', oldStorage: 256, oldRam: 12, oldColor: 'Silver', oldPurchasedBy: 'Ananya', oldAmount: 29000, status: 'Booked' }
  ]);

  const filteredExchanges = exchanges.filter(item => {
    if (purchasedBy !== 'All' && item.newPurchasedBy !== purchasedBy && item.oldPurchasedBy !== purchasedBy) {
      return false;
    }
    if (mobileBrand !== 'All' && item.newBrand !== mobileBrand && item.oldBrand !== mobileBrand) {
      return false;
    }
    if (fromDate) {
      const itemDate = new Date(item.date);
      const fDate = new Date(fromDate);
      if (!isNaN(itemDate) && !isNaN(fDate) && itemDate < fDate) return false;
    }
    if (toDate) {
      const itemDate = new Date(item.date);
      const tDate = new Date(toDate);
      if (!isNaN(itemDate) && !isNaN(tDate) && itemDate > tDate) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNew = `${item.newBrand} ${item.newModel} ${item.newPurchasedBy} ${item.newColor}`.toLowerCase().includes(q);
      const matchOld = `${item.oldBrand} ${item.oldModel} ${item.oldPurchasedBy} ${item.oldColor}`.toLowerCase().includes(q);
      if (!matchNew && !matchOld) return false;
    }
    return true;
  });

  const totalBookingValue = filteredExchanges.reduce((sum, item) => sum + item.newAmount, 0);
  const totalExchangeValue = filteredExchanges.reduce((sum, item) => sum + item.oldAmount, 0);
  const netPayableBalance = totalBookingValue - totalExchangeValue;

  const handleBookSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: exchanges.length + 1,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      newBrand: bookForm.newBrand,
      newModel: bookForm.newModel,
      newStorage: bookForm.storage,
      newRam: bookForm.ram,
      newColor: bookForm.color,
      newPurchasedBy: bookForm.customerName || 'Customer',
      newAmount: Number(bookForm.purchasedAmount) || 50000,
      oldBrand: 'Samsung',
      oldModel: 'S21',
      oldStorage: 128,
      oldRam: 8,
      oldColor: 'Black',
      oldPurchasedBy: 'Staff',
      oldAmount: 18000,
      status: 'Booked'
    };
    setExchanges([newEntry, ...exchanges]);
    setIsModalOpen(false);
  };

  const handleDeliverAction = (id) => {
    const itemToDeliver = exchanges.find(item => item.id === id);
    if (itemToDeliver) {
      const newStockItem = {
        sno: Date.now(),
        date: new Date().toISOString().split('T')[0],
        brand: itemToDeliver.newBrand,
        model: itemToDeliver.newModel,
        storage: itemToDeliver.newStorage,
        ram: itemToDeliver.newRam,
        color: itemToDeliver.newColor,
        purchasedBy: itemToDeliver.newPurchasedBy,
        amount: itemToDeliver.newAmount,
        procedure: 'Sell'
      };

      const existingNewStock = JSON.parse(localStorage.getItem('mrx_new_in_hand_stock') || '[]');
      localStorage.setItem('mrx_new_in_hand_stock', JSON.stringify([newStockItem, ...existingNewStock]));
    }

    setExchanges(prev => prev.filter(item => item.id !== id));
    setActiveMenuId(null);
    alert(`Device "${itemToDeliver?.newBrand} ${itemToDeliver?.newModel}" marked as Delivered! New mobile transferred to New In-hand Stock.`);
    navigate('/new-in-hand');
  };

  const handleCancelAction = (id) => {
    const itemToCancel = exchanges.find(item => item.id === id);
    if (itemToCancel) {
      const oldStockItem = {
        id: `MRX-${Date.now().toString().slice(-5)}`,
        device_code: `MRX-${Date.now().toString().slice(-5)}`,
        brand: itemToCancel.oldBrand,
        model: itemToCancel.oldModel,
        storage: itemToCancel.oldStorage,
        ram: itemToCancel.oldRam,
        colour: itemToCancel.oldColor,
        purchase_amount: itemToCancel.oldAmount,
        paid_by: itemToCancel.oldPurchasedBy,
        intake_date: new Date().toISOString().split('T')[0],
        status: 'OLD_IN_HAND',
        image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'
      };

      const existingOldStock = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify([oldStockItem, ...existingOldStock]));
    }

    setExchanges(prev => prev.filter(item => item.id !== id));
    setActiveMenuId(null);
    alert(`Booking Cancelled! Exchanged old device "${itemToCancel?.oldBrand} ${itemToCancel?.oldModel}" transferred to Old In-hand Inventory.`);
    navigate('/old-in-hand');
  };

  const handleExportPdf = () => {
    let headers = [];
    let rows = [];
    let title = 'Booked & Exchange Report';

    if (activeTab === 'bookings') {
      title = 'New Phone Bookings Report';
      headers = ['#', 'Date', 'Customer Name', 'New Phone Model', 'Specs', 'Color', 'Booking Amount (Rs)', 'Status'];
      rows = filteredExchanges.map((item, idx) => [
        idx + 1,
        item.date,
        item.newPurchasedBy || 'Customer',
        `${item.newBrand} ${item.newModel}`,
        `${item.newStorage}GB / ${item.newRam}GB`,
        item.newColor,
        `Rs. ${item.newAmount.toLocaleString()}`,
        item.status || 'Booked'
      ]);
    } else if (activeTab === 'exchanges') {
      title = 'Old Phone Exchanges Report';
      headers = ['#', 'Date', 'Staff / Evaluator', 'Exchanged Old Device', 'Specs', 'Color', 'Trade-in Valuation (Rs)', 'Trade Status'];
      rows = filteredExchanges.map((item, idx) => [
        idx + 1,
        item.date,
        item.oldPurchasedBy || 'Staff',
        `${item.oldBrand} ${item.oldModel}`,
        `${item.oldStorage}GB / ${item.oldRam}GB`,
        item.oldColor,
        `Rs. ${item.oldAmount.toLocaleString()}`,
        'Received for Trade-in'
      ]);
    } else {
      headers = ['#', 'Date', 'New Phone Model', 'New Price (Rs)', 'Exchanged Old Model', 'Exchange Val (Rs)', 'Customer / Purchased By', 'Status'];
      rows = filteredExchanges.map((item, idx) => [
        idx + 1,
        item.date,
        `${item.newBrand} ${item.newModel}`,
        `Rs. ${item.newAmount.toLocaleString()}`,
        `${item.oldBrand} ${item.oldModel}`,
        `Rs. ${item.oldAmount.toLocaleString()}`,
        item.newPurchasedBy || '-',
        item.status || 'Booked'
      ]);
    }

    setExportModalConfig({
      isOpen: true,
      title,
      headers,
      rows,
      filename: `Booked_Exchange_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Booking Value', value: `Rs. ${totalBookingValue.toLocaleString()}`, color: '#0284c7' },
        { label: 'Total Exchange Value', value: `Rs. ${totalExchangeValue.toLocaleString()}`, color: '#16a34a' },
        { label: 'Net Trade Balance', value: `Rs. ${netPayableBalance.toLocaleString()}`, color: '#7c3aed' }
      ]
    });
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Booked and Exchange</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage new phone pre-orders, old phone trade-in valuations, and exchange reconciliations.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Booked and Exchange</span>
          </div>
          <button onClick={handleExportPdf} className="btn-secondary" style={{ padding: '9px 16px', borderRadius: '8px' }}>
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
            <Plus size={16} /> Book New Device
          </button>
        </div>
      </div>

      {/* KPI Cards Summary Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', tracking: '0.05em' }}>Total Booking Value</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
            <CurrencyAmount amount={totalBookingValue} />
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{filteredExchanges.length} New Phone Bookings</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', tracking: '0.05em' }}>Total Exchange Valuation</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
            <CurrencyAmount amount={totalExchangeValue} />
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{filteredExchanges.length} Trade-in Old Devices</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', tracking: '0.05em' }}>Net Cash Collectible Balance</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed', marginTop: '6px' }}>
            <CurrencyAmount amount={netPayableBalance} />
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Difference payable by customers</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', tracking: '0.05em' }}>Active Status</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
            {filteredExchanges.length} Active
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Pending Customer Delivery</div>
        </div>
      </div>

      {/* Tabulation Bar & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'all' ? '#ffffff' : 'transparent',
              color: activeTab === 'all' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'all' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            All Overview ({filteredExchanges.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'bookings' ? '#ffffff' : 'transparent',
              color: activeTab === 'bookings' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'bookings' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            📱 New Phone Bookings ({filteredExchanges.length})
          </button>
          <button
            onClick={() => setActiveTab('exchanges')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'exchanges' ? '#ffffff' : 'transparent',
              color: activeTab === 'exchanges' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'exchanges' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            🔄 Old Phone Exchanges ({filteredExchanges.length})
          </button>
        </div>

        {/* Quick Search */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search brand, model, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', borderRadius: '8px', fontSize: '13px' }}
          />
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
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Purchased By / Customer</label>
          <select className="form-control" value={purchasedBy} onChange={(e) => setPurchasedBy(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
            <option>All</option>
            <option>Jeet</option>
            <option>Sonal</option>
            <option>Rohit</option>
            <option>Neha</option>
            <option>Aman</option>
            <option>Karan</option>
            <option>Vikram</option>
            <option>Ananya</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Mobile Brand</label>
          <select className="form-control" value={mobileBrand} onChange={(e) => setMobileBrand(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
            <option>All</option>
            <option>Apple</option>
            <option>Samsung</option>
            <option>Google Pixel</option>
            <option>OnePlus</option>
            <option>Vivo</option>
            <option>Oppo</option>
            <option>Xiaomi</option>
            <option>Nothing</option>
            <option>Motorola</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={() => { setFromDate(''); setToDate(''); setPurchasedBy('All'); setMobileBrand('All'); setSearchTerm(''); }} className="btn-secondary">Clear Filters</button>
        </div>
      </div>

      {/* TAB CONTENT: 1. ALL OVERVIEW TAB (Dual Grouped Header Table) */}
      {activeTab === 'all' && (
        <div className="table-responsive">
          <table className="custom-table" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th rowSpan="2" style={{ width: '40px' }}>#</th>
                <th rowSpan="2">Date</th>
                <th colSpan="7" style={{ textAlign: 'center', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>New Mobile</th>
                <th colSpan="7" style={{ textAlign: 'center', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 800 }}>Old Mobile</th>
                <th rowSpan="2">Action</th>
              </tr>
              <tr>
                {/* New Mobile Subheaders */}
                <th style={{ backgroundColor: '#e0f2fe' }}>Brand Name</th>
                <th style={{ backgroundColor: '#e0f2fe' }}>Model</th>
                <th style={{ backgroundColor: '#e0f2fe' }}>Storage (GB)</th>
                <th style={{ backgroundColor: '#e0f2fe' }}>RAM (GB)</th>
                <th style={{ backgroundColor: '#e0f2fe' }}>Color</th>
                <th style={{ backgroundColor: '#e0f2fe' }}>Purchased By</th>
                <th style={{ backgroundColor: '#e0f2fe' }}>Purchased Amount 🔄 Exchange</th>

                {/* Old Mobile Subheaders */}
                <th style={{ backgroundColor: '#f1f5f9' }}>Brand Name</th>
                <th style={{ backgroundColor: '#f1f5f9' }}>Model</th>
                <th style={{ backgroundColor: '#f1f5f9' }}>Storage (GB)</th>
                <th style={{ backgroundColor: '#f1f5f9' }}>RAM (GB)</th>
                <th style={{ backgroundColor: '#f1f5f9' }}>Color</th>
                <th style={{ backgroundColor: '#f1f5f9' }}>Purchased By</th>
                <th style={{ backgroundColor: '#f1f5f9' }}>Purchased Amount 🔄 Exchange</th>
              </tr>
            </thead>
            <tbody>
              {filteredExchanges.length === 0 ? (
                <tr>
                  <td colSpan="17" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No booked or exchange items match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredExchanges.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>{row.date}</td>

                    {/* New Mobile Cells */}
                    <td style={{ fontWeight: 600 }}>{row.newBrand}</td>
                    <td style={{ fontWeight: 700 }}>{row.newModel}</td>
                    <td>{row.newStorage}</td>
                    <td>{row.newRam}</td>
                    <td>{row.newColor}</td>
                    <td>{row.newPurchasedBy}</td>
                    <td style={{ fontWeight: 700 }}>
                      <CurrencyAmount amount={row.newAmount} />
                      <span style={{ fontSize: '11px', color: '#0284c7', marginLeft: '4px' }}>🔄</span>
                    </td>

                    {/* Old Mobile Cells */}
                    <td style={{ fontWeight: 600, color: '#475569' }}>{row.oldBrand}</td>
                    <td style={{ fontWeight: 700, color: '#475569' }}>{row.oldModel}</td>
                    <td>{row.oldStorage}</td>
                    <td>{row.oldRam}</td>
                    <td>{row.oldColor}</td>
                    <td>{row.oldPurchasedBy}</td>
                    <td style={{ fontWeight: 700 }}>
                      <CurrencyAmount amount={row.oldAmount} />
                      <span style={{ fontSize: '11px', color: '#0284c7', marginLeft: '4px' }}>🔄</span>
                    </td>

                    <td style={{ position: 'relative' }}>
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                        className="btn-secondary"
                        style={{ padding: '6px' }}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* Actions: Delivered (New In-hand) / Cancel (Old In-hand) */}
                      {activeMenuId === row.id && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          zIndex: 50,
                          background: '#ffffff',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                          borderRadius: '8px',
                          padding: '6px',
                          minWidth: '180px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <button
                            onClick={() => handleDeliverAction(row.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#059669', fontSize: '12px', fontWeight: 700, cursor: 'pointer', borderRadius: '4px' }}
                          >
                            <CheckCircle size={14} /> Delivered (New In-hand)
                          </button>
                          <button
                            onClick={() => handleCancelAction(row.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer', borderRadius: '4px' }}
                          >
                            <XCircle size={14} /> Cancel (Old In-hand)
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: 2. NEW PHONE BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ width: '40px' }}>#</th>
                <th>Booking Date</th>
                <th>Purchased By / Customer</th>
                <th>New Phone Brand</th>
                <th>Model</th>
                <th>Storage</th>
                <th>RAM</th>
                <th>Color</th>
                <th>Booking Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExchanges.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No new phone bookings match your search.
                  </td>
                </tr>
              ) : (
                filteredExchanges.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>{row.date}</td>
                    <td style={{ fontWeight: 700, color: '#0369a1' }}>{row.newPurchasedBy}</td>
                    <td style={{ fontWeight: 600 }}>{row.newBrand}</td>
                    <td style={{ fontWeight: 700 }}>{row.newModel}</td>
                    <td>{row.newStorage} GB</td>
                    <td>{row.newRam} GB</td>
                    <td>{row.newColor}</td>
                    <td style={{ fontWeight: 800, color: '#0284c7' }}>
                      <CurrencyAmount amount={row.newAmount} />
                    </td>
                    <td>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                        {row.status || 'Booked'}
                      </span>
                    </td>
                    <td style={{ position: 'relative' }}>
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                        className="btn-secondary"
                        style={{ padding: '6px' }}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {activeMenuId === row.id && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          zIndex: 50,
                          background: '#ffffff',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                          borderRadius: '8px',
                          padding: '6px',
                          minWidth: '180px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <button
                            onClick={() => handleDeliverAction(row.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#059669', fontSize: '12px', fontWeight: 700, cursor: 'pointer', borderRadius: '4px' }}
                          >
                            <CheckCircle size={14} /> Delivered (New In-hand)
                          </button>
                          <button
                            onClick={() => handleCancelAction(row.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer', borderRadius: '4px' }}
                          >
                            <XCircle size={14} /> Cancel (Old In-hand)
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: 3. OLD PHONE EXCHANGES TAB */}
      {activeTab === 'exchanges' && (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ width: '40px' }}>#</th>
                <th>Intake Date</th>
                <th>Staff / Evaluator</th>
                <th>Old Phone Brand</th>
                <th>Model</th>
                <th>Storage</th>
                <th>RAM</th>
                <th>Color</th>
                <th>Trade Valuation (Rs)</th>
                <th>Trade Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExchanges.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No old phone exchanges match your search.
                  </td>
                </tr>
              ) : (
                filteredExchanges.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>{row.date}</td>
                    <td style={{ fontWeight: 700, color: '#475569' }}>{row.oldPurchasedBy}</td>
                    <td style={{ fontWeight: 600 }}>{row.oldBrand}</td>
                    <td style={{ fontWeight: 700 }}>{row.oldModel}</td>
                    <td>{row.oldStorage} GB</td>
                    <td>{row.oldRam} GB</td>
                    <td>{row.oldColor}</td>
                    <td style={{ fontWeight: 800, color: '#16a34a' }}>
                      <CurrencyAmount amount={row.oldAmount} />
                    </td>
                    <td>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                        Trade-in Received
                      </span>
                    </td>
                    <td style={{ position: 'relative' }}>
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                        className="btn-secondary"
                        style={{ padding: '6px' }}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {activeMenuId === row.id && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          zIndex: 50,
                          background: '#ffffff',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                          borderRadius: '8px',
                          padding: '6px',
                          minWidth: '180px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <button
                            onClick={() => handleDeliverAction(row.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#059669', fontSize: '12px', fontWeight: 700, cursor: 'pointer', borderRadius: '4px' }}
                          >
                            <CheckCircle size={14} /> Delivered (New In-hand)
                          </button>
                          <button
                            onClick={() => handleCancelAction(row.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer', borderRadius: '4px' }}
                          >
                            <XCircle size={14} /> Cancel (Old In-hand)
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Book a Mobile Modal with Scroll feature and Exchange Icon */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px', maxHeight: '85vh', overflowY: 'auto', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'sticky', top: 0, background: '#fff', zIndex: 10, paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>Book a Mobile</h2>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Enter the details to book a mobile for exchange.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleBookSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Purchased by (New Phone) *</label>
                  <input type="text" className="form-control" placeholder="Enter customer name" value={bookForm.customerName} onChange={(e) => setBookForm({ ...bookForm, customerName: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Purchased Amount (New Phone) 🔄 Exchange *</label>
                  <input type="number" className="form-control" placeholder="₹ Enter amount" value={bookForm.purchasedAmount} onChange={(e) => setBookForm({ ...bookForm, purchasedAmount: e.target.value })} required />
                </div>

                <div>
                  <label className="form-label">Via *</label>
                  <select className="form-control" value={bookForm.via} onChange={(e) => setBookForm({ ...bookForm, via: e.target.value })}>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Pay By *</label>
                  <select className="form-control" value={bookForm.payBy} onChange={(e) => setBookForm({ ...bookForm, payBy: e.target.value })}>
                    <option>Staff</option>
                    <option>Rohit</option>
                    <option>Neha</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Platform *</label>
                  <select className="form-control" value={bookForm.platform} onChange={(e) => setBookForm({ ...bookForm, platform: e.target.value })}>
                    <option>Offline / Store</option>
                    <option>Website</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Account ID</label>
                  <input type="text" className="form-control" placeholder="Enter account ID / UTR" value={bookForm.accountId} onChange={(e) => setBookForm({ ...bookForm, accountId: e.target.value })} />
                </div>

                <div>
                  <label className="form-label">New Phone Brand *</label>
                  <select className="form-control" value={bookForm.newBrand} onChange={(e) => setBookForm({ ...bookForm, newBrand: e.target.value })}>
                    <option>Apple</option>
                    <option>Samsung</option>
                    <option>OnePlus</option>
                    <option>Vivo</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Storage *</label>
                  <select className="form-control" value={bookForm.storage} onChange={(e) => setBookForm({ ...bookForm, storage: e.target.value })}>
                    <option value="64">64 GB</option>
                    <option value="128">128 GB</option>
                    <option value="256">256 GB</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label className="form-label">Exchange By (Old Phone) 🔄 *</label>
                <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '13px', color: '#0369a1' }}>
                  <Search size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Select a mobile from in-hand inventory to auto-fill details (brand, model, storage, color, etc.)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Book</button>
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

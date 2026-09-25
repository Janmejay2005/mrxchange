import React, { useState, useEffect } from 'react';
import { Package, Plus, Home, Search, FileText, X, Edit, Trash2, Camera, ShoppingBag, AlertTriangle, CheckCircle, UserCheck, Users } from 'lucide-react';
import { CurrencyAmount, KPICard } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PdfExportModal from '../components/common/PdfExportModal';
import CameraCaptureModal from '../components/common/CameraCaptureModal';

export default function NewInHandStock() {
  const { user, isSuperAdmin } = useAuth();
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [brand, setBrand] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Account Bifurcation State
  const loggedInAccountName = user?.name || user?.username || 'Jeet Khubchandani';
  const [accountFilter, setAccountFilter] = useState(isSuperAdmin ? 'All Accounts' : loggedInAccountName);

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
  const [sellError, setSellError] = useState('');
  const [sellForm, setSellForm] = useState({
    model: '',
    unit: 1,
    soldBy: loggedInAccountName,
    soldTo: '',
    paymentType: 'COMPLETE',
    soldPrice: '',
    totalAmount: '',
    paidAmount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Edit Device Modal & Camera State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    sno: null,
    brand: '',
    model: '',
    storage: '',
    ram: '',
    color: '',
    purchasedBy: '',
    amount: '',
    totalUnits: 1,
    image_url: ''
  });

  const getInitialSampleStock = () => [
    { sno: 'sample_1', date: '2026-09-15', brand: 'Google Pixel', model: 'Pixel 8 Pro', storage: 256, ram: 12, color: 'Bay Blue', purchasedBy: 'Jeet Khubchandani', amount: 89000, totalUnits: 15, soldUnits: 0, procedure: 'Sell' },
    { sno: 'sample_2', date: '2026-09-14', brand: 'Apple', model: 'iPhone 15 Pro Max', storage: 512, ram: 8, color: 'Natural Titanium', purchasedBy: 'Sonal Wadwani', amount: 132000, totalUnits: 24, soldUnits: 0, procedure: 'Sell' },
    { sno: 'sample_3', date: '2026-09-14', brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: 256, ram: 12, color: 'Titanium Black', purchasedBy: 'Rohit Kumar', amount: 114000, totalUnits: 10, soldUnits: 0, procedure: 'Hold' },
    { sno: 'sample_4', date: '2026-09-13', brand: 'OnePlus', model: 'OnePlus 12', storage: 512, ram: 16, color: 'Silky Black', purchasedBy: 'Neha Gupta', amount: 64999, totalUnits: 8, soldUnits: 0, procedure: 'Sell' },
    { sno: 'sample_5', date: '2026-09-12', brand: 'Vivo', model: 'X100 Pro', storage: 512, ram: 16, color: 'Sunset Orange', purchasedBy: 'Aman Verma', amount: 89999, totalUnits: 12, soldUnits: 0, procedure: 'Sell' },
    { sno: 'sample_6', date: '2026-09-11', brand: 'Nothing', model: 'Phone (2a)', storage: 256, ram: 12, color: 'Milk White', purchasedBy: 'Karan Malhotra', amount: 27999, totalUnits: 5, soldUnits: 0, procedure: 'Check' },
    { sno: 'sample_7', date: '2026-09-11', brand: 'Xiaomi', model: '14 Ultra', storage: 512, ram: 16, color: 'White', purchasedBy: 'Vikram Singh', amount: 99999, totalUnits: 6, soldUnits: 0, procedure: 'Sell' },
    { sno: 'sample_8', date: '2026-09-10', brand: 'Realme', model: 'GT 5 Pro', storage: 256, ram: 12, color: 'Silver', purchasedBy: 'Sunal Rao', amount: 42000, totalUnits: 7, soldUnits: 0, procedure: 'Sell' },
    { sno: 'sample_9', date: '2026-09-09', brand: 'Motorola', model: 'Edge 50 Ultra', storage: 512, ram: 16, color: 'Nordic Wood', purchasedBy: 'Ananya Roy', amount: 59999, totalUnits: 9, soldUnits: 0, procedure: 'Hold' },
    { sno: 'sample_10', date: '2026-09-08', brand: 'Oppo', model: 'Find N3 Flip', storage: 256, ram: 12, color: 'Gold', purchasedBy: 'Jeet Khubchandani', amount: 84999, totalUnits: 4, soldUnits: 0, procedure: 'Sell' }
  ];

  const fetchCombinedStock = () => {
    try {
      const deliveredItems = JSON.parse(localStorage.getItem('mrx_new_in_hand_stock') || '[]');
      const seenKeys = new Set();
      const combined = [];

      for (const item of deliveredItems) {
        const key = String(item.sno || item.id || `${item.brand}_${item.model}_${item.date}`);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          combined.push({
            ...item,
            sno: item.sno || key,
            totalUnits: Number(item.totalUnits || item.quantity || 1),
            soldUnits: Number(item.soldUnits || 0)
          });
        }
      }
      return combined;
    } catch (e) {
      return [];
    }
  };

  const [stock, setStock] = useState(fetchCombinedStock);

  useEffect(() => {
    const handleSync = () => {
      setStock(fetchCombinedStock());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('mrx_inventory_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mrx_inventory_updated', handleSync);
    };
  }, []);

  const saveStockToStorage = (updatedStockList) => {
    setStock(updatedStockList);
    try {
      localStorage.setItem('mrx_new_in_hand_stock', JSON.stringify(updatedStockList));
      window.dispatchEvent(new Event('mrx_inventory_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

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

  // BIFURCATION FILTERING LOGIC BY LOGGED-IN ACCOUNT
  const filteredStock = stock.filter((item) => {
    // Account Bifurcation Check
    if (!isSuperAdmin) {
      // Non-superadmin staff see ONLY stock attributed to their logged-in account
      const itemOwner = (item.purchasedBy || '').toLowerCase();
      const userOwner = (loggedInAccountName || '').toLowerCase();
      if (!itemOwner.includes(userOwner) && !userOwner.includes(itemOwner)) {
        return false;
      }
    } else {
      // Superadmin can filter by account or view All Accounts
      if (accountFilter !== 'All Accounts') {
        const itemOwner = (item.purchasedBy || '').toLowerCase();
        const selectedOwner = accountFilter.toLowerCase();
        if (!itemOwner.includes(selectedOwner) && !selectedOwner.includes(itemOwner)) {
          return false;
        }
      }
    }

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

  // Calculate Total Available Stock Units across all brands in current account scope
  const totalAvailableUnits = filteredStock.reduce((sum, item) => {
    const avail = Math.max(0, (item.totalUnits || 1) - (item.soldUnits || 0));
    return sum + avail;
  }, 0);

  const totalDeliveredValuation = filteredStock.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const openSellModal = (item) => {
    setSelectedStockItem(item);
    setSellError('');
    const avail = Math.max(0, (item.totalUnits || 1) - (item.soldUnits || 0));
    const fetchedModel = `${item.brand} ${item.model}`;
    const initialPrice = item.amount || 0;
    
    setSellForm({
      model: fetchedModel,
      soldBy: loggedInAccountName,
      unit: avail > 0 ? 1 : 0,
      soldTo: item.purchasedBy || 'Customer',
      soldPrice: initialPrice,
      totalAmount: initialPrice,
      paidAmount: initialPrice,
      date: new Date().toISOString().split('T')[0]
    });
    setIsSellModalOpen(true);
  };

  const handleSellSubmit = (e) => {
    e.preventDefault();
    setSellError('');

    if (!selectedStockItem) return;

    const availableUnits = Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0));
    const requestedUnits = Number(sellForm.unit) || 1;

    if (availableUnits <= 0) {
      setSellError(`⚠️ Out of stock! 0 units available for ${selectedStockItem.brand} ${selectedStockItem.model}.`);
      return;
    }

    if (requestedUnits > availableUnits) {
      setSellError(`⚠️ Cannot sell ${requestedUnits} unit(s). Only ${availableUnits} unit(s) available in stock for ${selectedStockItem.brand} ${selectedStockItem.model}.`);
      return;
    }

    // Deduct stock quantity (increment soldUnits by requestedUnits)
    const updatedStock = stock.map(item => {
      if (String(item.sno) === String(selectedStockItem.sno)) {
        const newSoldUnits = (item.soldUnits || 0) + requestedUnits;
        return {
          ...item,
          soldUnits: newSoldUnits
        };
      }
      return item;
    });

    saveStockToStorage(updatedStock);
    alert(`Successfully sold ${requestedUnits} unit(s) of "${selectedStockItem.brand} ${selectedStockItem.model}" under account "${loggedInAccountName}"! ${availableUnits - requestedUnits} unit(s) remaining in stock.`);
    setIsSellModalOpen(false);
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
      amount: item.amount,
      totalUnits: item.totalUnits || 1,
      image_url: item.image_url || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'
    });
    setIsEditModalOpen(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updatedStock = stock.map(item => item.sno === editForm.sno ? {
      ...item,
      brand: editForm.brand,
      model: editForm.model,
      storage: Number(editForm.storage),
      ram: Number(editForm.ram),
      color: editForm.color,
      purchasedBy: editForm.purchasedBy,
      amount: Number(editForm.amount),
      totalUnits: Number(editForm.totalUnits) || 1,
      image_url: editForm.image_url,
      images: [editForm.image_url]
    } : item);

    saveStockToStorage(updatedStock);
    setIsEditModalOpen(false);
    alert('Device details updated successfully!');
  };

  const handleDeleteDevice = (sno) => {
    if (window.confirm('Are you sure you want to delete this device from New In-hand stock?')) {
      const updatedStock = stock.filter(item => item.sno !== sno);
      saveStockToStorage(updatedStock);
    }
  };

  const handleExportPdf = () => {
    const headers = ['Sno', 'Date', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Available Units', 'Purchased By (Account)', 'Amount (Rs)'];
    const rows = filteredStock.map((item, idx) => {
      const avail = Math.max(0, (item.totalUnits || 1) - (item.soldUnits || 0));
      return [
        idx + 1,
        item.date,
        item.brand,
        item.model,
        `${item.storage} GB`,
        `${item.ram} GB`,
        item.color || '-',
        `${avail} / ${item.totalUnits || 1} Units`,
        item.purchasedBy || '-',
        `Rs. ${item.amount.toLocaleString()}`
      ];
    });
    setExportModalConfig({
      isOpen: true,
      title: `New In-hand Stock Report (${isSuperAdmin ? accountFilter : loggedInAccountName})`,
      headers,
      rows,
      filename: `New_In_Hand_Stock_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Account Scope', value: isSuperAdmin ? accountFilter : loggedInAccountName, color: '#7c3aed' },
        { label: 'Total Available Units', value: `${totalAvailableUnits} Units`, color: '#0284c7' },
        { label: 'Total Valuation', value: `Rs. ${totalDeliveredValuation.toLocaleString()}`, color: '#059669' }
      ]
    });
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>New In-hand Stock</h1>
            <span style={{ 
              background: '#f3e8ff', 
              color: '#7c3aed', 
              padding: '4px 12px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <UserCheck size={14} /> Account Bifurcated
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Stock inventory bifurcated by logged-in user account ({isSuperAdmin ? accountFilter : loggedInAccountName}).
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleExportPdf} className="btn-secondary" style={{ padding: '9px 16px', borderRadius: '8px' }}>
            <FileText size={16} /> Export PDF Report
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <KPICard 
          title="Account Scope" 
          value={isSuperAdmin ? accountFilter : loggedInAccountName} 
          icon={Users}
          iconBg="#f3e8ff"
          iconColor="#7c3aed"
        />
        <KPICard 
          title="Available Stock Units (Account)" 
          value={`${totalAvailableUnits} Units`} 
          icon={Package}
          iconBg="#e0f2fe"
          iconColor="#0284c7"
        />
        <KPICard 
          title="Stock Valuation (Account)" 
          value={`₹${totalDeliveredValuation.toLocaleString('en-IN')}`} 
          icon={ShoppingBag}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
      </div>

      {/* Top Filter Bar with Account Bifurcation Dropdown */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
        
        {/* Account Bifurcation Selector */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed', display: 'block', marginBottom: '4px' }}>
            👤 Account Scope Bifurcation
          </label>
          {isSuperAdmin ? (
            <select 
              className="form-control" 
              value={accountFilter} 
              onChange={(e) => setAccountFilter(e.target.value)} 
              style={{ width: '180px', padding: '7px 12px', borderColor: '#a855f7', fontWeight: 700, color: '#7c3aed' }}
            >
              <option value="All Accounts">All Accounts</option>
              <option value="Jeet Khubchandani">Jeet Khubchandani</option>
              <option value="Sonal Wadwani">Sonal Wadwani</option>
              <option value="Rohit Kumar">Rohit Kumar</option>
              <option value="Neha Gupta">Neha Gupta</option>
              <option value="Aman Verma">Aman Verma</option>
              <option value="Karan Malhotra">Karan Malhotra</option>
              <option value="Vikram Singh">Vikram Singh</option>
              <option value="Sunal Rao">Sunal Rao</option>
              <option value="Ananya Roy">Ananya Roy</option>
            </select>
          ) : (
            <div style={{ padding: '7px 12px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '6px', fontWeight: 800, fontSize: '13px', border: '1px solid #d8b4fe' }}>
              🔒 {loggedInAccountName}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>From Date</label>
          <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '150px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>To Date</label>
          <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '150px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Brand</label>
          <select className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ width: '140px', padding: '7px 12px' }}>
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

        <div style={{ flex: 1, minWidth: '200px', marginTop: '18px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by model, brand, color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={() => { setFromDate(''); setToDate(''); setBrand('All'); setSearchQuery(''); if (isSuperAdmin) setAccountFilter('All Accounts'); }} className="btn-secondary">Clear</button>
        </div>
      </div>

      {/* New In-hand Stock Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Brand Name</th>
              <th>Model</th>
              <th>Specs (Storage / RAM)</th>
              <th>Color</th>
              <th>Available Stock Units</th>
              <th>Account Owner</th>
              <th>Purchased Amount (₹)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No new in-hand stock items match the selected account scope ({isSuperAdmin ? accountFilter : loggedInAccountName}).
                </td>
              </tr>
            ) : (
              filteredStock.map((item, idx) => {
                const availUnits = Math.max(0, (item.totalUnits || 1) - (item.soldUnits || 0));
                const isOutOfStock = availUnits <= 0;

                return (
                  <tr key={item.sno}>
                    <td data-label="#">{idx + 1}</td>
                    <td data-label="Date">{item.date}</td>
                    <td data-label="Brand" style={{ fontWeight: 700, color: '#0f172a' }}>{item.brand}</td>
                    <td data-label="Model" style={{ fontWeight: 800, color: '#0284c7' }}>{item.model}</td>
                    <td data-label="Specs">{item.storage} GB / {item.ram} GB</td>
                    <td data-label="Color">{item.color}</td>
                    <td data-label="Available Stock">
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: 800,
                        backgroundColor: isOutOfStock ? '#fee2e2' : '#ecfdf5',
                        color: isOutOfStock ? '#dc2626' : '#047857',
                        border: isOutOfStock ? '1px solid #fecaca' : '1px solid #a7f3d0'
                      }}>
                        {isOutOfStock ? '❌ Out of Stock (0 Units)' : `📦 ${availUnits} / ${item.totalUnits || 1} Units Available`}
                      </span>
                    </td>
                    <td data-label="Account Owner">
                      <span style={{ padding: '3px 8px', borderRadius: '10px', background: '#f3e8ff', color: '#7c3aed', fontSize: '12px', fontWeight: 800 }}>
                        👤 {item.purchasedBy}
                      </span>
                    </td>
                    <td data-label="Purchased Amount" style={{ fontWeight: 700 }}>
                      <CurrencyAmount amount={item.amount} />
                    </td>
                    <td data-label="Action">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => openSellModal(item)} 
                          style={{ 
                            padding: '6px 16px', 
                            fontSize: '12px', 
                            borderRadius: '6px', 
                            fontWeight: 800,
                            backgroundColor: isOutOfStock ? '#94a3b8' : '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            opacity: isOutOfStock ? 0.6 : 1
                          }}
                          title={isOutOfStock ? "Out of Stock - Cannot sell more than available quantity" : `Sell from ${availUnits} available units`}
                        >
                          {isOutOfStock ? 'Sold Out' : 'Sell'}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          title="Edit stock details & total units"
                        >
                          <Edit size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Sell Mobile Modal with Available Stock Enforcement */}
      {isSellModalOpen && selectedStockItem && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>Sell New Mobile</h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Account Scope: <strong>{selectedStockItem.purchasedBy}</strong> (Sold by: {loggedInAccountName})
                </p>
              </div>
              <button onClick={() => setIsSellModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            {/* Available Stock Units Info Box */}
            <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Available Stock Units</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                  📦 {Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0))} Unit(s) Available ({selectedStockItem.brand} {selectedStockItem.model})
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>
                Total: {selectedStockItem.totalUnits || 1} | Sold: {selectedStockItem.soldUnits || 0}
              </div>
            </div>

            {sellError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', border: '1px solid #fecaca', marginBottom: '14px', fontWeight: 700 }}>
                {sellError}
              </div>
            )}

            <form onSubmit={handleSellSubmit}>
              {/* Device Model */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#0284c7' }}>Device Model *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={sellForm.model} 
                  onChange={(e) => setSellForm({ ...sellForm, model: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                {/* Sold by */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Sold by *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={sellForm.soldBy} 
                    onChange={(e) => setSellForm({ ...sellForm, soldBy: e.target.value })} 
                    required 
                  />
                </div>

                {/* Unit (Quantity) with Max Limit Validation */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700, color: '#dc2626' }}>
                    Sell Quantity (Max: {Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0))}) *
                  </label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={sellForm.unit} 
                    onChange={(e) => {
                      const u = parseInt(e.target.value) || 0;
                      const sp = Number(sellForm.soldPrice) || 0;
                      setSellForm({ ...sellForm, unit: u, totalAmount: u * sp });
                      const maxUnits = Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0));
                      if (u > maxUnits) {
                        setSellError(`⚠️ Cannot sell ${u} units. Only ${maxUnits} unit(s) available in stock.`);
                      } else {
                        setSellError('');
                      }
                    }} 
                    min="1"
                    max={Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0))}
                    required 
                  />
                </div>
              </div>

              {/* Customer / Party Name */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Customer Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter customer or party name" 
                  value={sellForm.soldTo} 
                  onChange={(e) => setSellForm({ ...sellForm, soldTo: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                {/* Sold Price per Unit */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Price Per Unit (₹) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={sellForm.soldPrice} 
                    onChange={(e) => {
                      const sp = e.target.value;
                      const u = Number(sellForm.unit) || 1;
                      setSellForm({ ...sellForm, soldPrice: sp, totalAmount: Number(sp) * u });
                    }} 
                    required 
                  />
                </div>

                {/* Total Amount */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700, color: '#059669' }}>Total Selling Price (₹) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={sellForm.totalAmount} 
                    onChange={(e) => setSellForm({ ...sellForm, totalAmount: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              {/* Paid Amount */}
              <div style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Paid Amount (₹) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="₹ Amount paid so far" 
                  value={sellForm.paidAmount} 
                  onChange={(e) => setSellForm({ ...sellForm, paidAmount: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsSellModalOpen(false)} className="btn-secondary">Cancel</button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={sellForm.unit > Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0))}
                  style={{ 
                    padding: '10px 24px', 
                    fontWeight: 800,
                    opacity: sellForm.unit > Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0)) ? 0.5 : 1,
                    cursor: sellForm.unit > Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0)) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Confirm Sale ({sellForm.unit} Unit)
                </button>
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
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>Edit Stock Quantity & Details</h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>Update stock unit count and specifications.</p>
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
                  <label className="form-label">Total Stock Quantity Units *</label>
                  <input type="number" className="form-control" value={editForm.totalUnits} onChange={(e) => setEditForm({ ...editForm, totalUnits: e.target.value })} min="1" required />
                </div>
                <div>
                  <label className="form-label">Purchased Amount (₹) *</label>
                  <input type="number" className="form-control" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required />
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
                  <label className="form-label">Account Owner / Purchased By *</label>
                  <input type="text" className="form-control" value={editForm.purchasedBy} onChange={(e) => setEditForm({ ...editForm, purchasedBy: e.target.value })} required />
                </div>
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

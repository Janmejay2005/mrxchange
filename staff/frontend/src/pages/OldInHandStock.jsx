import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Search, 
  Layers, 
  HardDrive, 
  Cpu, 
  Download,
  FileText,
  ShoppingCart,
  Tag,
  Edit,
  Trash2,
  X,
  Camera
} from 'lucide-react';
import { deviceService, statsService, saleService } from '../services/api';
import { KPICard, CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import { exportToXls } from '../utils/pdfGenerator';
import PdfExportModal from '../components/common/PdfExportModal';
import CameraCaptureModal from '../components/common/CameraCaptureModal';

export default function OldInHandStock() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');

  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Edit Modal & Camera State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    brand: '',
    model: '',
    storage: '',
    ram: '',
    colour: '',
    purchase_amount: '',
    paid_by: '',
    image_url: ''
  });

  const openEditModal = (device) => {
    setEditForm({
      id: device.id,
      brand: device.brand || '',
      model: device.model || '',
      storage: device.storage || '',
      ram: device.ram || '',
      colour: device.colour || '',
      purchase_amount: device.purchase_amount || '',
      paid_by: device.paid_by || 'Staff',
      image_url: device.image_url || (device.images && device.images[0]) || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'
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

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setDevices(prev => prev.map(d => String(d.id) === String(editForm.id) ? {
      ...d,
      brand: editForm.brand,
      model: editForm.model,
      storage: Number(editForm.storage),
      ram: Number(editForm.ram),
      colour: editForm.colour,
      purchase_amount: Number(editForm.purchase_amount),
      paid_by: editForm.paid_by,
      image_url: editForm.image_url,
      images: [editForm.image_url]
    } : d));

    // Update localStorage if saved in mrx_old_in_hand_stock
    const stored = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
    const updated = stored.map(item => String(item.id) === String(editForm.id) ? {
      ...item,
      brand: editForm.brand,
      model: editForm.model,
      storage: Number(editForm.storage),
      ram: Number(editForm.ram),
      colour: editForm.colour,
      purchase_amount: Number(editForm.purchase_amount),
      paid_by: editForm.paid_by,
      image_url: editForm.image_url,
      images: [editForm.image_url]
    } : item);
    localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updated));

    setIsEditModalOpen(false);
    alert('Device details and photo updated successfully!');
  };

  const handleDeleteDevice = (id) => {
    if (window.confirm('Are you sure you want to delete this device from Old In-hand stock?')) {
      setDevices(prev => prev.filter(d => String(d.id) !== String(id)));
      const stored = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      const updated = stored.filter(item => String(item.id) !== String(id));
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updated));
      alert('Device deleted successfully!');
    }
  };

  const handleExchangeAction = (device) => {
    // 1. Remove device immediately from Old In-hand Inventory view
    setDevices(prev => prev.filter(item => String(item.id) !== String(device.id)));

    // 2. Remove device from mrx_old_in_hand_stock local storage
    try {
      const storedInHand = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      const updatedInHand = storedInHand.filter(item => String(item.id) !== String(device.id));
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updatedInHand));
    } catch (e) {}

    // 3. Save device into mrx_exchange_pool so it is available in the Exchange tab drop-down
    const poolItem = {
      id: device.id || `exch_${Date.now()}`,
      brand: device.brand || '',
      model: device.model || '',
      storage: Number(device.storage) || 128,
      ram: Number(device.ram) || 6,
      colour: device.colour || 'Default',
      amount: Number(device.purchase_amount || device.amount) || 0,
      purchase_amount: Number(device.purchase_amount || device.amount) || 0,
      paid_by: device.paid_by || 'Staff',
      image_url: device.image_url || (device.images && device.images[0]) || ''
    };

    try {
      const exchangePool = JSON.parse(localStorage.getItem('mrx_exchange_pool') || '[]');
      const filteredPool = exchangePool.filter(item => String(item.id) !== String(poolItem.id));
      localStorage.setItem('mrx_exchange_pool', JSON.stringify([poolItem, ...filteredPool]));
    } catch (e) {}

    // 4. Trigger real-time sync events across tabs & components
    window.dispatchEvent(new Event('mrx_inventory_updated'));
    window.dispatchEvent(new Event('mrx_exchange_pool_updated'));
    window.dispatchEvent(new Event('storage'));

    alert(`Device "${device.brand} ${device.model}" transferred to Exchange tab! You can now select it in Book New Mobile.`);
  };

  // Sell Modal State
  const [sellModal, setSellModal] = useState({
    isOpen: false,
    device: null,
    sellingPrice: '',
    customerName: '',
    customerPhone: '',
    paymentMethod: 'UPI',
    paymentType: 'COMPLETE',
    soldBy: 'Rohit'
  });

  const fetchOldInHandStock = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevices({
        status: 'OLD_IN_HAND',
        q: localSearch || globalSearch || '',
        brand: selectedBrand,
        from: selectedDate || '',
        to: selectedDate || ''
      });
      const dataList = Array.isArray(res) ? res : (res?.data || []);
      const cancelledItems = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      
      const sampleStock = [
        { id: 'old_hand_1', device_code: 'MRX-00101', brand: 'Apple', model: 'iPhone 13', storage: 128, ram: 4, colour: 'Midnight', purchase_amount: 32000, paid_by: 'Rohit', intake_date: '2026-09-15', status: 'OLD_IN_HAND', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
        { id: 'old_hand_2', device_code: 'MRX-00102', brand: 'Samsung', model: 'Galaxy S22', storage: 256, ram: 8, colour: 'Phantom Black', purchase_amount: 28000, paid_by: 'Aadarsh', intake_date: '2026-09-14', status: 'OLD_IN_HAND', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' },
        { id: 'old_hand_3', device_code: 'MRX-00103', brand: 'Apple', model: 'iPhone 12', storage: 64, ram: 4, colour: 'White', purchase_amount: 18000, paid_by: 'Neha', intake_date: '2026-09-14', status: 'OLD_IN_HAND', image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=100' },
        { id: 'old_hand_4', device_code: 'MRX-00104', brand: 'OnePlus', model: 'OnePlus 10R', storage: 128, ram: 8, colour: 'Sierra Black', purchase_amount: 20000, paid_by: 'Rohit', intake_date: '2026-09-13', status: 'OLD_IN_HAND', image_url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=100' }
      ];

      const rawCombined = [...cancelledItems, ...dataList, ...sampleStock];
      const seenFingerprints = new Set();
      const allInHand = [];

      for (const item of rawCombined) {
        if (!item) continue;
        const brand = (item.brand || '').trim().toLowerCase();
        const model = (item.model || '').trim().toLowerCase();
        const amount = Number(item.purchase_amount || item.amount || 0);
        const paidBy = (item.paid_by || item.purchasedBy || '').trim().toLowerCase();
        const date = item.intake_date || item.created_at || item.date || '';

        const fingerprint = `${brand}|${model}|${item.storage || ''}|${item.ram || ''}|${amount}|${paidBy}|${date}`;

        if (!seenFingerprints.has(fingerprint)) {
          seenFingerprints.add(fingerprint);
          allInHand.push(item);
        }
      }

      setDevices(allInHand.filter(d => d.status === 'OLD_IN_HAND' || !d.status));

      const statsRes = await statsService.getInHandStats({ type: 'OLD_IN_HAND' });
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      const cancelledItems = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      setDevices(cancelledItems);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOldInHandStock();

    const handleSync = () => fetchOldInHandStock();
    window.addEventListener('storage', handleSync);
    window.addEventListener('mrx_inventory_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mrx_inventory_updated', handleSync);
    };
  }, [localSearch, globalSearch, selectedBrand, selectedDate]);

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

  const filteredDevices = devices.filter(d => {
    if (selectedBrand !== 'All Brands' && d.brand !== selectedBrand) return false;
    if (selectedDate) {
      const devYMD = toYMD(d.intake_date || d.created_at || d.date);
      const selYMD = toYMD(selectedDate);
      if (devYMD && selYMD && devYMD !== selYMD) return false;
    }
    return true;
  });

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    try {
      await saleService.createSale({
        device_id: sellModal.device.id,
        selling_price: parseFloat(sellModal.sellingPrice),
        customer_name: sellModal.customerName,
        customer_phone: sellModal.customerPhone,
        payment_method: sellModal.paymentMethod,
        payment_type: sellModal.paymentType,
        sold_by: sellModal.soldBy
      });
      alert('Sale transaction recorded successfully!');
      setSellModal({ ...sellModal, isOpen: false });
      fetchOldInHandStock();
    } catch (err) {
      alert(err.message || 'Failed to record sale');
    }
  };

  const handleExportXls = () => {
    const headers = ['#', 'Device Code', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Purchase Amount (Rs)', 'Intake Date', 'Status'];
    const rows = filteredDevices.map((d, idx) => [
      idx + 1,
      d.device_code || d.id,
      d.brand,
      d.model,
      `${d.storage} GB`,
      `${d.ram} GB`,
      d.colour || '-',
      d.purchase_amount,
      d.intake_date || '-',
      d.status || 'OLD_IN_HAND'
    ]);
    exportToXls('Old In-hand Stock Report', headers, rows, `Old_In_Hand_Stock_${new Date().toISOString().slice(0, 10)}.xls`);
  };

  const handleExportPdf = () => {
    const headers = ['#', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Amount (Rs)', 'Status'];
    const rows = filteredDevices.map((d, idx) => [
      idx + 1,
      d.brand,
      d.model,
      `${d.storage} GB`,
      `${d.ram} GB`,
      d.colour || '-',
      `Rs. ${d.purchase_amount}`,
      d.status || 'OLD_IN_HAND'
    ]);
    const totalVal = filteredDevices.reduce((sum, d) => sum + (Number(d.purchase_amount) || 0), 0);
    setExportModalConfig({
      isOpen: true,
      title: 'Old In-hand Stock PDF Report',
      headers,
      rows,
      filename: `Old_In_Hand_Stock_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Stock Value', value: `Rs. ${totalVal.toLocaleString()}`, color: '#0284c7' }
      ]
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Old In-hand Stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Pre-existing / acquired mobile devices ready for customer sale • {selectedDate ? `Date: ${selectedDate}` : 'All Stock'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportXls} className="btn-secondary" title="Export Excel (.xls)">
            <Download size={15} color="#0284c7" /> Excel (.xls)
          </button>
          <button onClick={handleExportPdf} className="btn-secondary" title="Export PDF">
            <FileText size={15} color="#dc2626" /> PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard 
          title="Old In-hand Units" 
          value={stats?.total_in_hand || devices.length} 
          icon={Smartphone}
          iconBg="#e0f2fe"
          iconColor="#0284c7"
        />
        <KPICard 
          title="Unique Models" 
          value={stats?.unique_models || '14'} 
          icon={Layers}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <KPICard 
          title="Total Storage (GB)" 
          value={stats?.total_storage?.toLocaleString() || '1,840'} 
          icon={HardDrive}
          iconBg="#f3e8ff"
          iconColor="#9333ea"
        />
        <KPICard 
          title="Total RAM (GB)" 
          value={stats?.total_ram?.toLocaleString() || '320'} 
          icon={Cpu}
          iconBg="#ffedd5"
          iconColor="#ea580c"
        />
      </div>

      {/* Filter toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ width: '280px' }}>
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search old in-hand devices..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        <select 
          className="form-control" 
          style={{ width: '180px' }}
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
        >
          <option value="All Brands">All Brands</option>
          <option value="Apple">Apple</option>
          <option value="Samsung">Samsung</option>
          <option value="OnePlus">OnePlus</option>
          <option value="Xiaomi">Xiaomi</option>
        </select>
      </div>

      {/* Table: Brand, Model, Storage, RAM, Color Name, Paid Amount, Purchased By, Date Added, Action (Sell) */}
      {/* IMEI is omitted per PRD */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Storage</th>
              <th>RAM</th>
              <th>Color Name</th>
              <th>Purchase Price</th>
              <th>Purchased By</th>
              <th>Date Added</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading stock...
                </td>
              </tr>
            ) : filteredDevices.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No Old In-hand devices available.
                </td>
              </tr>
            ) : (
              filteredDevices.map((d) => (
                <tr key={d.id}>
                  <td data-label="Image">
                    {d.images && d.images.length > 1 ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <img 
                          src={d.images[0]} 
                          alt="Front" 
                          className="device-thumb" 
                          title="Front View"
                        />
                        <img 
                          src={d.images[1]} 
                          alt="Back" 
                          className="device-thumb" 
                          title="Back View"
                        />
                      </div>
                    ) : (
                      <img 
                        src={d.image_url || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'} 
                        alt={d.model} 
                        className="device-thumb" 
                      />
                    )}
                  </td>

                  <td data-label="Brand" style={{ fontWeight: 700 }}>{d.brand}</td>
                  <td data-label="Model">{d.model}</td>
                  <td data-label="Storage">{d.storage} GB</td>
                  <td data-label="RAM">{d.ram} GB</td>
                  <td data-label="Color Name"><span style={{ fontWeight: 600 }}>{d.colour}</span></td>
                  <td data-label="Purchase Price"><CurrencyAmount amount={d.purchase_amount} /></td>
                  <td data-label="Purchased By"><span style={{ color: '#0284c7', fontWeight: 600 }}>{d.paid_by || 'Rohit'}</span></td>
                  <td data-label="Date Added">{d.intake_date ? String(d.intake_date).slice(0, 10) : 'Today'}</td>
                  <td data-label="Action" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      {d.isExchanged ? (
                        <span style={{ 
                          background: '#fef9c3', 
                          color: '#854d0e', 
                          border: '1px solid #fef08a', 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          fontSize: '12px', 
                          fontWeight: 800 
                        }}>
                          Exchange ✔️
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleExchangeAction(d)}
                          style={{ background: '#f59e0b', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                          title="Transfer device data to Exchange tab"
                        >
                          Exchange
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteDevice(d.id)}
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

      {/* Sell Modal */}
      {sellModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                Sell {sellModal.device?.brand} {sellModal.device?.model}
              </h3>
              <button onClick={() => setSellModal({ ...sellModal, isOpen: false })}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSellSubmit}>
              <div className="modal-body">
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  <div><strong>Purchase Price:</strong> ₹{parseFloat(sellModal.device?.purchase_amount || 0).toLocaleString('en-IN')}</div>
                  <div><strong>Purchased By:</strong> {sellModal.device?.paid_by}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Selling Price (₹ INR) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter selling price"
                    value={sellModal.sellingPrice}
                    onChange={(e) => setSellModal({ ...sellModal, sellingPrice: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Customer name"
                      value={sellModal.customerName}
                      onChange={(e) => setSellModal({ ...sellModal, customerName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="10-digit number"
                      value={sellModal.customerPhone}
                      onChange={(e) => setSellModal({ ...sellModal, customerPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-control"
                      value={sellModal.paymentMethod}
                      onChange={(e) => setSellModal({ ...sellModal, paymentMethod: e.target.value })}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Credit/Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Type</label>
                    <select
                      className="form-control"
                      value={sellModal.paymentType}
                      onChange={(e) => setSellModal({ ...sellModal, paymentType: e.target.value })}
                    >
                      <option value="COMPLETE">Complete Payment</option>
                      <option value="INSTALLMENT">Installment</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setSellModal({ ...sellModal, isOpen: false })} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
                  Complete Sale & Record in Ledger
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
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>Edit Old In-hand Device</h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>Update stock specifications and purchasing details.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleSaveEdit}>
              {/* Device Photo / Image Edit Section */}
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0284c7', margin: 0 }}>
                    📸 Device Photo / Image
                  </label>
                  <button 
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Camera size={13} /> Take Photo via Camera
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {editForm.image_url ? (
                    <img 
                      src={editForm.image_url} 
                      alt="Preview" 
                      style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }} 
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#64748b' }}>
                      No Image
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Upload New Photo</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageFileChange} 
                      style={{ fontSize: '12px', marginBottom: '6px', width: '100%' }}
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Or paste Image URL (e.g. https://...)" 
                      value={editForm.image_url} 
                      onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} 
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

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
                  <input type="text" className="form-control" value={editForm.colour} onChange={(e) => setEditForm({ ...editForm, colour: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Purchased By *</label>
                  <input type="text" className="form-control" value={editForm.paid_by} onChange={(e) => setEditForm({ ...editForm, paid_by: e.target.value })} required />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Purchase Price (₹) *</label>
                <input type="number" className="form-control" value={editForm.purchase_amount} onChange={(e) => setEditForm({ ...editForm, purchase_amount: e.target.value })} required />
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

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setEditForm(prev => ({ ...prev, image_url: dataUrl }))}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Search, 
  Layers, 
  HardDrive, 
  Cpu, 
  Download,
  FileText,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { deviceService, statsService } from '../services/api';
import { KPICard, CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import PdfExportModal from '../components/common/PdfExportModal';

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

  // Edit Modal State
  const [editModal, setEditModal] = useState({
    isOpen: false,
    device: null,
    brand: '',
    model: '',
    storage: '',
    ram: '',
    colour: '',
    purchase_amount: '',
    paid_by: ''
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

      const rawCombined = [...cancelledItems, ...dataList];
      const seenKeys = new Set();
      const combinedData = [];
      for (const item of rawCombined) {
        const key = String(item.id || item.device_code);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          combinedData.push(item);
        }
      }

      const dataIds = new Set(combinedData.map(d => String(d.id)));
      const dataCodes = new Set(combinedData.map(d => d.device_code).filter(Boolean));

      const filteredSamples = sampleStock.filter(s =>
        !dataIds.has(String(s.id)) && (!s.device_code || !dataCodes.has(s.device_code))
      );

      const allInHand = [...combinedData, ...filteredSamples].filter(d => d.status === 'OLD_IN_HAND' || !d.status);
      setDevices(allInHand);

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

  const handleEditClick = (d) => {
    setEditModal({
      isOpen: true,
      device: d,
      brand: d.brand || '',
      model: d.model || '',
      storage: String(d.storage || ''),
      ram: String(d.ram || ''),
      colour: d.colour || '',
      purchase_amount: String(d.purchase_amount || ''),
      paid_by: d.paid_by || ''
    });
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    const updated = devices.map(d => {
      if (d.id === editModal.device.id) {
        return {
          ...d,
          brand: editModal.brand,
          model: editModal.model,
          storage: Number(editModal.storage) || d.storage,
          ram: Number(editModal.ram) || d.ram,
          colour: editModal.colour,
          purchase_amount: Number(editModal.purchase_amount) || d.purchase_amount,
          paid_by: editModal.paid_by
        };
      }
      return d;
    });
    setDevices(updated);

    const localItems = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
    const updatedLocal = localItems.map(item => {
      if (item.id === editModal.device.id) {
        return {
          ...item,
          brand: editModal.brand,
          model: editModal.model,
          storage: Number(editModal.storage) || item.storage,
          ram: Number(editModal.ram) || item.ram,
          colour: editModal.colour,
          purchase_amount: Number(editModal.purchase_amount) || item.purchase_amount,
          paid_by: editModal.paid_by
        };
      }
      return item;
    });
    localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updatedLocal));

    setEditModal({ ...editModal, isOpen: false });
    alert('Device details updated successfully!');
  };

  const handleDeleteClick = (deviceId) => {
    if (window.confirm('Are you sure you want to delete this old in-hand device?')) {
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      const localItems = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      const updatedLocal = localItems.filter(item => item.id !== deviceId);
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updatedLocal));
    }
  };

  const handleExportCsv = () => {
    const url = statsService.getCsvExportUrl('inventory', { status: 'OLD_IN_HAND' });
    window.open(url, '_blank');
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
          <button onClick={handleExportCsv} className="btn-secondary" title="Export CSV">
            <Download size={15} color="#0284c7" /> CSV
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

      {/* Table: Brand, Model, Storage, RAM, Color Name, Paid Amount, Purchased By, Date Added, Action (Edit / Delete) */}
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
                  <td>
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

                  <td style={{ fontWeight: 700 }}>{d.brand}</td>
                  <td>{d.model}</td>
                  <td>{d.storage} GB</td>
                  <td>{d.ram} GB</td>
                  <td><span style={{ fontWeight: 600 }}>{d.colour}</span></td>
                  <td><CurrencyAmount amount={d.purchase_amount} /></td>
                  <td><span style={{ color: '#0284c7', fontWeight: 600 }}>{d.paid_by || 'Rohit'}</span></td>
                  <td>{d.intake_date ? String(d.intake_date).slice(0, 10) : 'Today'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleEditClick(d)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', color: '#0284c7', borderColor: '#bae6fd' }}
                        title="Edit Device"
                      >
                        <Edit size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(d.id)}
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Delete Device"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Edit Device: {editModal.device?.brand} {editModal.device?.model}
              </h3>
              <button onClick={() => setEditModal({ ...editModal, isOpen: false })}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Brand *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editModal.brand}
                      onChange={(e) => setEditModal({ ...editModal, brand: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editModal.model}
                      onChange={(e) => setEditModal({ ...editModal, model: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Storage (GB) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editModal.storage}
                      onChange={(e) => setEditModal({ ...editModal, storage: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">RAM (GB) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editModal.ram}
                      onChange={(e) => setEditModal({ ...editModal, ram: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Color Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editModal.colour}
                      onChange={(e) => setEditModal({ ...editModal, colour: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchased By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editModal.paid_by}
                      onChange={(e) => setEditModal({ ...editModal, paid_by: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Price (₹ INR) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editModal.purchase_amount}
                    onChange={(e) => setEditModal({ ...editModal, purchase_amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditModal({ ...editModal, isOpen: false })} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#0284c7' }}>
                  Save Changes
                </button>
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

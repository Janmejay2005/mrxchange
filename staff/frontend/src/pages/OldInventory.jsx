import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText,
  Database,
  Smartphone,
  Filter
} from 'lucide-react';
import { deviceService } from '../services/api';
import { CurrencyAmount } from '../components/common/UIComponents';
import AddMobileModal from '../components/modals/AddMobileModal';
import PdfExportModal from '../components/common/PdfExportModal';
import { useOutletContext, useNavigate } from 'react-router-dom';

const BRANDS = ['All Brands', 'Google Pixel', 'Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Vivo', 'Oppo', 'Realme', 'Nothing', 'Motorola'];
const MODELS_BY_BRAND = {
  'Google Pixel': ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7a', 'Pixel 6 Pro'],
  'Apple': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11'],
  'Samsung': ['Galaxy S24 Ultra', 'Galaxy S23 Ultra', 'Galaxy S22', 'Galaxy A54', 'Galaxy A52'],
  'OnePlus': ['OnePlus 12', 'OnePlus 11', 'OnePlus 10R', 'OnePlus Nord 3'],
  'Xiaomi': ['14 Ultra', 'Redmi Note 12', 'Redmi Note 10', 'Mi 11X'],
  'Vivo': ['Vivo X100 Pro', 'Vivo V27', 'Vivo V21', 'Vivo Y200'],
  'Oppo': ['Find N3 Flip', 'Reno 10 Pro+', 'Oppo F19', 'Oppo A78'],
  'Realme': ['GT 5 Pro', 'Realme 11 Pro', 'Realme 8'],
  'Nothing': ['Phone (2a)', 'Phone (2)', 'Phone (1)'],
  'Motorola': ['Edge 50 Ultra', 'Edge 40']
};

const getSampleDevices = () => [
  { id: '1', device_code: 'MRX-00001', brand: 'Google Pixel', model: 'Pixel 8 Pro', storage: 256, ram: 12, colour: 'Bay Blue', condition: 'Like New', purchase_amount: 68000, paid_by: 'Jeet', intake_date: '2026-09-15', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
  { id: '2', device_code: 'MRX-00002', brand: 'Apple', model: 'iPhone 15 Pro Max', storage: 512, ram: 8, colour: 'Natural Titanium', condition: 'Excellent', purchase_amount: 105000, paid_by: 'Sonal', intake_date: '2026-09-14', status: 'OLD_IN_HAND', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' },
  { id: '3', device_code: 'MRX-00003', brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: 256, ram: 12, colour: 'Titanium Black', condition: 'Good', purchase_amount: 88000, paid_by: 'Rohit', intake_date: '2026-09-14', status: 'IN_REPAIR', image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=100' },
  { id: '4', device_code: 'MRX-00004', brand: 'OnePlus', model: 'OnePlus 12', storage: 512, ram: 16, colour: 'Silky Black', condition: 'Like New', purchase_amount: 49000, paid_by: 'Neha', intake_date: '2026-09-13', status: 'REJECTED', image_url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=100' },
  { id: '5', device_code: 'MRX-00005', brand: 'Vivo', model: 'Vivo X100 Pro', storage: 512, ram: 16, colour: 'Sunset Orange', condition: 'Good', purchase_amount: 68000, paid_by: 'Aman', intake_date: '2026-09-13', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
  { id: '6', device_code: 'MRX-00006', brand: 'Nothing', model: 'Phone (2a)', storage: 256, ram: 12, colour: 'Milk White', condition: 'Good', purchase_amount: 19000, paid_by: 'Karan', intake_date: '2026-09-12', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
  { id: '7', device_code: 'MRX-00007', brand: 'Motorola', model: 'Edge 50 Ultra', storage: 512, ram: 16, colour: 'Nordic Wood', condition: 'Excellent', purchase_amount: 43000, paid_by: 'Vikram', intake_date: '2026-09-11', status: 'OLD_IN_HAND', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' }
];

export default function OldInventory() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [popupDevice, setPopupDevice] = useState(null); // Image click popup device state

  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Brand filter
  const [selectedBrand, setSelectedBrand] = useState('All Brands');

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevices({
        q: globalSearch || '',
        brand: selectedBrand === 'All Brands' ? '' : selectedBrand,
        from: selectedDate || '',
        to: selectedDate || ''
      });
      const dataList = Array.isArray(res) ? res : (res?.data || []);
      const sampleList = getSampleDevices();

      // Deduplicate: dataList overrides sampleList for the same id or device_code
      const dataIds = new Set(dataList.map(d => String(d.id)));
      const dataCodes = new Set(dataList.map(d => d.device_code).filter(Boolean));

      const filteredSamples = sampleList.filter(s => 
        !dataIds.has(String(s.id)) && (!s.device_code || !dataCodes.has(s.device_code))
      );

      const allDevices = [...dataList, ...filteredSamples];
      const inventoryDevices = allDevices.filter(d => (!d.status || d.status === 'OLD_INVENTORY'));
      
      setDevices(inventoryDevices);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setDevices(getSampleDevices().filter(s => !s.status || s.status === 'OLD_INVENTORY'));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [globalSearch, selectedDate, selectedBrand]);

  const handleStatusChange = async (device, newStatus) => {
    try {
      const deviceObj = typeof device === 'object' ? device : { id: device };
      const deviceId = deviceObj.id;
      const updatedDevice = {
        ...deviceObj,
        status: newStatus
      };

      await deviceService.updateStatus(deviceId, updatedDevice, updatedDevice);
      
      if (newStatus === 'OLD_IN_HAND') {
        const oldInHandStock = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
        const filtered = oldInHandStock.filter(d => String(d.id) !== String(deviceId));
        filtered.unshift(updatedDevice);
        localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(filtered));
      }
      
      // Immediately remove device from Old Inventory view
      setDevices(prev => prev.filter(d => String(d.id) !== String(deviceId)));
      
      // Automatic navigation based on new status option selected
      if (newStatus === 'IN_REPAIR') {
        navigate('/repair-stock');
      } else if (newStatus === 'REJECTED') {
        navigate('/rejected-stocks');
      } else if (newStatus === 'OLD_IN_HAND') {
        navigate('/old-in-hand');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Date helper
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

  // Filtered devices list based on selected Brand & selectedDate
  const filteredDevices = devices.filter(d => {
    if (selectedBrand !== 'All Brands' && d.brand !== selectedBrand) return false;
    if (selectedDate) {
      const devYMD = toYMD(d.intake_date || d.created_at || d.date);
      const selYMD = toYMD(selectedDate);
      if (devYMD && selYMD && devYMD !== selYMD) return false;
    }
    return true;
  });

  const isAllSelected = filteredDevices.length > 0 && filteredDevices.every(d => selectedIds.includes(String(d.id)));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDevices.map(d => String(d.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const strId = String(id);
    setSelectedIds(prev =>
      prev.includes(strId) ? prev.filter(i => i !== strId) : [...prev, strId]
    );
  };

  const handleExportPdf = () => {
    const targetDevices = selectedIds.length > 0
      ? filteredDevices.filter(d => selectedIds.includes(String(d.id)))
      : filteredDevices;

    const headers = ['Brand', 'Model', 'Storage', 'RAM', 'Amount', 'Status'];
    const rows = targetDevices.map(d => [
      d.brand,
      d.model,
      `${d.storage} GB`,
      `${d.ram} GB`,
      `Rs. ${d.purchase_amount}`,
      d.status || 'OLD_INVENTORY'
    ]);
    const totalVal = targetDevices.reduce((sum, d) => sum + (Number(d.purchase_amount) || 0), 0);
    setExportModalConfig({
      isOpen: true,
      title: selectedIds.length > 0 
        ? `Master Inventory Report (${selectedIds.length} Selected)`
        : 'Master Inventory PDF Report',
      headers,
      rows,
      filename: `Master_Inventory_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Valuation', value: `Rs. ${totalVal.toLocaleString()}`, color: '#0284c7' }
      ]
    });
  };

  return (
    <div>
      {/* Header section with Listed Devices Card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Old Inventory</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Master device intake register • {selectedDate ? `Filtered for ${selectedDate}` : 'All Intake History'}
          </p>
          <div style={{ marginTop: '16px' }}>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
              <Plus size={18} /> Add Mobile
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="kpi-card" style={{ minWidth: '180px', margin: 0 }}>
            <div className="kpi-icon-wrap" style={{ backgroundColor: '#e0f2fe' }}>
              <Smartphone size={24} color="#0284c7" />
            </div>
            <div className="kpi-info">
              <span className="kpi-title">Listed Devices</span>
              <span className="kpi-value" style={{ fontSize: '22px' }}>{filteredDevices.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar with Brand Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Brand Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="#64748b" />
            <select 
              className="form-control" 
              style={{ width: '180px', padding: '7px 12px', fontSize: '13px' }}
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              {BRANDS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleExportPdf} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }} title="Generate PDF report">
            <FileText size={15} /> Export PDF {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </button>
        </div>
      </div>

      {/* Master Inventory Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={isAllSelected} 
                  onChange={toggleSelectAll} 
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }} 
                  title="Select / Deselect All"
                />
              </th>
              <th>Image</th>
              <th>Brand / Model</th>
              <th>Storage</th>
              <th>RAM</th>
              <th>Condition</th>
              <th>Paid Amount</th>
              <th>Paid By</th>
              <th>Date Added</th>
              <th>Status Dropdown</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading inventory...
                </td>
              </tr>
            ) : filteredDevices.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No devices found matching current filters.
                </td>
              </tr>
            ) : (
              filteredDevices.map((device, idx) => (
                <tr key={device.id || idx}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(String(device.id))} 
                      onChange={() => toggleSelectOne(device.id)} 
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                  <td>
                    <div 
                      onClick={() => setPopupDevice(device)} 
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                      title="Click to view details & status"
                    >
                      {device.images && device.images.length > 1 ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <img 
                            src={device.images[0]} 
                            alt="Front" 
                            className="device-thumb" 
                            title="Front View - Click for popup"
                          />
                          <img 
                            src={device.images[1]} 
                            alt="Back" 
                            className="device-thumb" 
                            title="Back View - Click for popup"
                          />
                        </div>
                      ) : (
                        <img 
                          src={device.image_url || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'} 
                          alt={device.model} 
                          className="device-thumb" 
                        />
                      )}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{device.brand} {device.model}</div>
                  </td>
                  <td>{device.storage} GB</td>
                  <td>{device.ram} GB</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: 700,
                      background: device.condition === 'Fresh' ? '#ecfdf5' : '#fffbeb',
                      color: device.condition === 'Fresh' ? '#047857' : '#b45309'
                    }}>
                      {device.condition || 'Fair'}
                    </span>
                  </td>
                  <td>
                    <CurrencyAmount amount={device.purchase_amount} />
                  </td>
                  <td>{device.paid_by || 'Staff'}</td>
                  <td>{device.intake_date ? String(device.intake_date).slice(0, 10) : 'Today'}</td>
                  <td>
                    {/* Status Dropdown: old-inhand, repair, rejected stock, old-inventory */}
                    <select
                      value={device.status || 'OLD_INVENTORY'}
                      onChange={(e) => handleStatusChange(device, e.target.value)}
                      className="form-control"
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        backgroundColor: 
                          device.status === 'OLD_IN_HAND' || device.status === 'IN_HAND' ? '#e0f2fe' :
                          device.status === 'IN_REPAIR' ? '#fef3c7' :
                          device.status === 'REJECTED' ? '#fee2e2' : '#f1f5f9',
                        color: 
                          device.status === 'OLD_IN_HAND' || device.status === 'IN_HAND' ? '#0284c7' :
                          device.status === 'IN_REPAIR' ? '#d97706' :
                          device.status === 'REJECTED' ? '#dc2626' : '#475569',
                        border: '1px solid #cbd5e1'
                      }}
                    >
                      <option value="OLD_INVENTORY">Old Inventory</option>
                      <option value="OLD_IN_HAND">Old In-Hand</option>
                      <option value="IN_REPAIR">Repair</option>
                      <option value="REJECTED">Rejected Stock</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Image Click Popup Modal (Brand, Storage, RAM & Status Dropdown) */}
      {popupDevice && (
        <div className="modal-overlay" onClick={() => setPopupDevice(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '420px', borderRadius: '16px', padding: '24px', textAlign: 'center' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Device Details</h3>
              <button onClick={() => setPopupDevice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 700, color: '#64748b' }}>✕</button>
            </div>

            {/* Device Image Preview */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <img 
                src={popupDevice.image_url || (popupDevice.images && popupDevice.images[0]) || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=200'} 
                alt={popupDevice.model} 
                style={{ maxHeight: '160px', objectFit: 'contain', borderRadius: '8px' }} 
              />
            </div>

            {/* Info Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', background: '#f1f5f9', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Brand:</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{popupDevice.brand}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Model:</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{popupDevice.model}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Storage:</span>
                <span style={{ color: '#0284c7', fontWeight: 800 }}>{popupDevice.storage} GB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>RAM:</span>
                <span style={{ color: '#0284c7', fontWeight: 800 }}>{popupDevice.ram} GB</span>
              </div>
            </div>

            {/* Status Dropdown */}
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '6px' }}>Update Status</label>
              <select
                value={popupDevice.status || 'OLD_INVENTORY'}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  handleStatusChange(popupDevice, newStatus);
                  setPopupDevice(null);
                }}
                className="form-control"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #0284c7',
                  color: '#0f172a'
                }}
              >
                <option value="OLD_INVENTORY">Old Inventory</option>
                <option value="OLD_IN_HAND">Old In-Hand</option>
                <option value="IN_REPAIR">Repair</option>
                <option value="REJECTED">Rejected Stock</option>
              </select>
            </div>

            <button 
              onClick={() => setPopupDevice(null)} 
              className="btn-secondary" 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 700 }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Mobile Modal */}
      <AddMobileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchInventory}
      />

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

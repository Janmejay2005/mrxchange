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

  // Filtered devices list based on selected Brand
  const filteredDevices = devices.filter(d => {
    if (selectedBrand !== 'All Brands' && d.brand !== selectedBrand) return false;
    return true;
  });

  const handleExportPdf = () => {
    const headers = ['Code', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Amount', 'Status'];
    const rows = filteredDevices.map(d => [
      d.device_code || d.id,
      d.brand,
      d.model,
      `${d.storage} GB`,
      `${d.ram} GB`,
      d.colour || '-',
      `Rs. ${d.purchase_amount}`,
      d.status || 'OLD_INVENTORY'
    ]);
    const totalVal = filteredDevices.reduce((sum, d) => sum + (Number(d.purchase_amount) || 0), 0);
    setExportModalConfig({
      isOpen: true,
      title: 'Master Inventory PDF Report',
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
      {/* Header section with Stats Cards */}
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

          <div className="kpi-card" style={{ minWidth: '220px', margin: 0 }}>
            <div className="kpi-icon-wrap" style={{ backgroundColor: '#ecfdf5' }}>
              <Database size={24} color="#059669" />
            </div>
            <div className="kpi-info">
              <span className="kpi-title">System Capacity</span>
              <span className="kpi-value" style={{ fontSize: '18px', color: '#059669' }}>5000+ Devices</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Enterprise Scalability</span>
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
            <FileText size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Master Inventory Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" /></th>
              <th>Code</th>
              <th>Image</th>
              <th>Brand / Model</th>
              <th>Storage</th>
              <th>RAM</th>
              <th>Color Name</th>
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
                <td colSpan="12" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading inventory...
                </td>
              </tr>
            ) : filteredDevices.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No devices found matching current filters.
                </td>
              </tr>
            ) : (
              filteredDevices.map((device, idx) => (
                <tr key={device.id || idx}>
                  <td><input type="checkbox" /></td>
                  <td style={{ fontWeight: 600, color: '#64748b' }}>{device.device_code || `MRX-${idx + 1}`}</td>
                  <td>
                    {device.images && device.images.length > 1 ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <img 
                          src={device.images[0]} 
                          alt="Front" 
                          className="device-thumb" 
                          title="Front View"
                        />
                        <img 
                          src={device.images[1]} 
                          alt="Back" 
                          className="device-thumb" 
                          title="Back View"
                        />
                      </div>
                    ) : (
                      <img 
                        src={device.image_url || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'} 
                        alt={device.model} 
                        className="device-thumb" 
                      />
                    )}
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{device.brand} {device.model}</div>
                  </td>
                  <td>{device.storage} GB</td>
                  <td>{device.ram} GB</td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {device.colour || 'Default'}
                    </span>
                  </td>
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

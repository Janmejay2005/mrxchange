import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  RotateCcw, 
  Printer, 
  FileText,
  Download,
  Database,
  Smartphone
} from 'lucide-react';
import { deviceService, statsService } from '../services/api';
import { StatusBadge, CurrencyAmount } from '../components/common/UIComponents';
import AddMobileModal from '../components/modals/AddMobileModal';
import { useOutletContext } from 'react-router-dom';

export default function OldInventory() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('ALL');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = [
    { label: 'All Stock', value: 'ALL' },
    { label: 'Old Inventory', value: 'OLD_INVENTORY' },
    { label: 'In-hand Stock', value: 'IN_HAND' },
    { label: 'In Repair', value: 'IN_REPAIR' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevices({
        status: activeTab === 'ALL' ? '' : activeTab,
        q: globalSearch || '',
        from: selectedDate || '',
        to: selectedDate || ''
      });
      setDevices(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Fallback sample data if backend not connected
      setDevices([
        { id: '1', device_code: 'MRX-00001', brand: 'Apple', model: 'iPhone 13', storage: 128, ram: 4, colour: 'Midnight', condition: 'Good', purchase_amount: 32000, paid_by: 'Rohit', intake_date: '2026-09-15', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
        { id: '2', device_code: 'MRX-00002', brand: 'Samsung', model: 'Galaxy S22', storage: 256, ram: 8, colour: 'Phantom Black', condition: 'Good', purchase_amount: 28000, paid_by: 'Aadarsh', intake_date: '2026-09-14', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' },
        { id: '3', device_code: 'MRX-00003', brand: 'Apple', model: 'iPhone 12', storage: 64, ram: 4, colour: 'White', condition: 'Fair', purchase_amount: 18000, paid_by: 'Neha', intake_date: '2026-09-14', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=100' },
        { id: '4', device_code: 'MRX-00004', brand: 'OnePlus', model: 'OnePlus 10R', storage: 128, ram: 8, colour: 'Sierra Black', condition: 'Good', purchase_amount: 20000, paid_by: 'Rohit', intake_date: '2026-09-13', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=100' },
        { id: '5', device_code: 'MRX-00005', brand: 'Apple', model: 'iPhone 11', storage: 64, ram: 4, colour: 'Green', condition: 'Fair', purchase_amount: 14000, paid_by: 'Rohit', intake_date: '2026-09-13', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [activeTab, globalSearch, selectedDate]);

  const handleExportCsv = () => {
    const url = statsService.getCsvExportUrl('inventory', { 
      status: activeTab === 'ALL' ? '' : activeTab,
      from: selectedDate || '' 
    });
    window.open(url, '_blank');
  };

  const handleExportPdf = () => {
    const url = statsService.getPdfExportUrl('inventory', { 
      status: activeTab === 'ALL' ? '' : activeTab,
      from: selectedDate || '' 
    });
    window.open(url, '_blank');
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
              <span className="kpi-value" style={{ fontSize: '22px' }}>{devices.length}</span>
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

      {/* Action Toolbar - Filter and Action buttons removed per PRD, CSV and PDF added */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={handleExportCsv} className="btn-secondary" title="Export CSV report">
          <Download size={15} color="#0284c7" /> Export CSV
        </button>
        <button onClick={handleExportPdf} className="btn-secondary" title="Generate PDF report">
          <FileText size={15} color="#dc2626" /> Export PDF
        </button>
        <button onClick={() => fetchInventory()} className="btn-secondary">
          <RotateCcw size={15} /> Reset
        </button>
        <button onClick={() => window.print()} className="btn-primary" style={{ background: '#0f172a' }}>
          <Printer size={15} /> Print Out
        </button>
      </div>

      {/* Tabs list */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '20px', marginBottom: '20px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              padding: '10px 4px',
              fontSize: '13px',
              fontWeight: 700,
              color: activeTab === tab.value ? '#0284c7' : '#64748b',
              borderBottom: activeTab === tab.value ? '2px solid #0284c7' : 'none',
              marginBottom: '-2px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Master Inventory Table - IMEI and Action button strictly removed per PRD */}
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
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading inventory...
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No devices found matching current search or selected date.
                </td>
              </tr>
            ) : (
              devices.map((device, idx) => (
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
                    <StatusBadge status={device.status} />
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
    </div>
  );
}

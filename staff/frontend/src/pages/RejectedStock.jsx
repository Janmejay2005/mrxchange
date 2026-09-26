import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  FileText, 
  Home, 
  RotateCcw,
  Wrench,
  CheckCircle
} from 'lucide-react';
import { deviceService } from '../services/api';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import PdfExportModal from '../components/common/PdfExportModal';

export default function RejectedStock() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Resolution modal
  const [resolveModal, setResolveModal] = useState({
    isOpen: false,
    device: null,
    resolution: 'Repair Attempted',
    destination: 'IN_REPAIR',
    notes: ''
  });

  const fetchRejectedStock = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevices({
        status: 'REJECTED',
        q: globalSearch || ''
      });
      const dataList = Array.isArray(res) ? res : (res?.data || []);
      const localRejected = JSON.parse(localStorage.getItem('mrx_rejected_stock') || '[]');

      const allRejected = [...localRejected, ...dataList].filter(d => d.status === 'REJECTED' || !d.status);
      setDevices(allRejected);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedStock();
  }, [globalSearch, selectedDate]);

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
    if (selectedDate) {
      const devYMD = toYMD(d.intake_date || d.created_at || d.date);
      const selYMD = toYMD(selectedDate);
      if (devYMD && selYMD && devYMD !== selYMD) return false;
    }
    return true;
  });

  const handleResolve = async () => {
    try {
      const { device, destination, resolution, notes } = resolveModal;
      await deviceService.updateStatus(device.id, {
        status: destination,
        reason: `Rejection resolved (${resolution}): ${notes}`
      });
      setResolveModal({ ...resolveModal, isOpen: false });
      alert(`Device moved to ${destination}!`);
      fetchRejectedStock();
    } catch (err) {
      alert(err.message || 'Resolution failed');
    }
  };

  const handleCleanInventory = async () => {
    if (window.confirm('Are you sure you want to clean/clear all central database inventory data? This will reset all server database rows to 0 across all devices.')) {
      try {
        await deviceService.cleanDatabase();
      } catch (err) {
        console.warn('Backend DB clean warning:', err);
      }

      localStorage.setItem('mrx_old_inventory', JSON.stringify([]));
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify([]));
      localStorage.setItem('mrx_new_in_hand_stock', JSON.stringify([]));
      localStorage.setItem('mrx_repair_stock', JSON.stringify([]));
      localStorage.setItem('mrx_rejected_stock', JSON.stringify([]));
      localStorage.setItem('mrx_exchanges', JSON.stringify([]));
      localStorage.setItem('mrx_exchange_pool', JSON.stringify([]));
      localStorage.setItem('mrx_pending_payments', JSON.stringify([]));
      localStorage.setItem('mrx_sales', JSON.stringify([]));
      localStorage.setItem('mrx_devices', JSON.stringify([]));
      localStorage.setItem('mrx_inventory_cleared', 'true');

      window.dispatchEvent(new Event('mrx_inventory_updated'));
      window.dispatchEvent(new Event('mrx_exchanges_updated'));
      window.dispatchEvent(new Event('mrx_pending_payments_updated'));
      window.dispatchEvent(new Event('storage'));

      setDevices([]);
      alert('Central database & local memory cleared to 0 successfully!');
    }
  };

  const handleExportPdf = () => {
    const headers = ['#', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Amount (Rs)', 'Reason'];
    const rows = filteredDevices.map((d, idx) => [
      idx + 1,
      d.brand,
      d.model,
      `${d.storage} GB`,
      `${d.ram} GB`,
      d.colour || '-',
      `Rs. ${d.purchase_amount}`,
      d.last_rejection_reason || 'Rejected'
    ]);
    const totalVal = filteredDevices.reduce((sum, d) => sum + (Number(d.purchase_amount) || 0), 0);
    setExportModalConfig({
      isOpen: true,
      title: 'Rejected Stock PDF Report',
      headers,
      rows,
      filename: `Rejected_Stock_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Rejected Value', value: `Rs. ${totalVal.toLocaleString()}`, color: '#dc2626' }
      ]
    });
  };

  return (
    <div>
      {/* Header & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Rejected Stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Mobiles rejected due to non-repairable or unusable condition.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#ef4444', fontWeight: 600 }}>Rejected Stock</span>
          </div>
          <button 
            onClick={handleCleanInventory} 
            style={{ 
              padding: '9px 16px', 
              borderRadius: '8px', 
              background: '#fef2f2', 
              color: '#dc2626', 
              border: '1px solid #fecaca', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              fontSize: '13px'
            }}
            title="Clear all local inventory stock, exchanges, payments, and sales to test fresh flow"
          >
            <Trash2 size={15} /> Clean Inventory
          </button>
          <button onClick={handleExportPdf} className="btn-primary">
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Summary Section for Rejected Valuation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rejected Devices</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginTop: '6px' }}>
            {filteredDevices.length} Items
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Unrepairable / Returned stock</div>
        </div>
      </div>

      {/* Rejected Stock Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mobile Brand</th>
              <th>Mobile Model</th>
              <th>Storage (GB)</th>
              <th>RAM (GB)</th>
              <th>Color</th>
              <th>Paid Amount (₹)</th>
              <th>Paid By</th>
              <th>Date</th>
              <th>Last Reason of Rejection</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device, idx) => (
              <tr key={device.id || idx}>
                <td data-label="#">{idx + 1}</td>
                <td data-label="Brand" style={{ fontWeight: 600 }}>{device.brand}</td>
                <td data-label="Model" style={{ fontWeight: 700 }}>{device.model}</td>
                <td data-label="Storage">{device.storage} GB</td>
                <td data-label="RAM">{device.ram} GB</td>
                <td data-label="Color">{device.colour || '-'}</td>
                <td data-label="Paid Amount" style={{ fontWeight: 700 }}>
                  <CurrencyAmount amount={device.purchase_amount} />
                </td>
                <td data-label="Paid By" style={{ color: '#64748b' }}>{device.paid_by || 'Rohit'}</td>
                <td data-label="Date" style={{ color: '#64748b' }}>{device.intake_date}</td>
                <td data-label="Rejection Reason" style={{ color: '#dc2626', fontWeight: 600 }}>
                  {device.last_rejection_reason || 'Defective piece'}
                </td>
                <td data-label="Action" style={{ textAlign: 'center' }}>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete ${device.brand} ${device.model} permanently from Rejected Stock?`)) {
                        await deviceService.deleteDevice(device.id);
                        setDevices(prev => prev.filter(d => String(d.id) !== String(device.id)));
                        const localRej = JSON.parse(localStorage.getItem('mrx_rejected_stock') || '[]');
                        const updatedRej = localRej.filter(d => String(d.id) !== String(device.id));
                        localStorage.setItem('mrx_rejected_stock', JSON.stringify(updatedRej));
                        window.dispatchEvent(new Event('mrx_inventory_updated'));
                        window.dispatchEvent(new Event('storage'));
                        alert('Item permanently deleted from Rejected Stock!');
                      }
                    }}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
        <span>Showing all {devices.length} rejected stock items</span>
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

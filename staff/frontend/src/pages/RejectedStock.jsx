import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Printer, 
  Home, 
  RotateCcw,
  Wrench,
  CheckCircle
} from 'lucide-react';
import { deviceService } from '../services/api';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';

export default function RejectedStock() {
  const { globalSearch } = useOutletContext() || {};
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

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
      const sampleRejected = [
        { id: 'rej_1', brand: 'Google Pixel', model: 'Pixel 8 Pro', storage: 256, ram: 12, colour: 'Bay Blue', purchase_amount: 68000, paid_by: 'Jeet', intake_date: '15 Sep 2026', last_rejection_reason: 'Display IC fault', status: 'REJECTED' },
        { id: 'rej_2', brand: 'Apple', model: 'iPhone 15 Pro Max', storage: 512, ram: 8, colour: 'Natural Titanium', purchase_amount: 105000, paid_by: 'Sonal', intake_date: '14 Sep 2026', last_rejection_reason: 'Motherboard short circuit', status: 'REJECTED' },
        { id: 'rej_3', brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: 256, ram: 12, colour: 'Titanium Black', purchase_amount: 88000, paid_by: 'Rohit', intake_date: '13 Sep 2026', last_rejection_reason: 'Liquid damage', status: 'REJECTED' }
      ];
      const customLocal = JSON.parse(localStorage.getItem('mrx_devices') || '[]').filter(d => d.status === 'REJECTED');
      const rejectedList = [...customLocal, ...dataList.filter(d => d.status === 'REJECTED')];
      setDevices(rejectedList.length > 0 ? rejectedList : sampleRejected);
      setLoading(false);
    } catch (err) {
      console.error(err);
      const customLocal = JSON.parse(localStorage.getItem('mrx_devices') || '[]').filter(d => d.status === 'REJECTED');
      setDevices(customLocal);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedStock();
  }, [globalSearch]);

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

  return (
    <div>
      {/* Header & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Rejected Stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Mobiles rejected due to non-repairable or unusable condition.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#ef4444', fontWeight: 600 }}>Rejected Stock</span>
          </div>
          <button onClick={() => window.print()} className="btn-primary">
            <Printer size={16} /> Print Report
          </button>
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
            </tr>
          </thead>
          <tbody>
            {devices.map((device, idx) => (
              <tr key={device.id || idx}>
                <td>{idx + 1}</td>
                <td style={{ fontWeight: 600 }}>{device.brand}</td>
                <td style={{ fontWeight: 700 }}>{device.model}</td>
                <td>{device.storage}</td>
                <td>{device.ram}</td>
                <td>{device.colour}</td>
                <td style={{ fontWeight: 700 }}>
                  <CurrencyAmount amount={device.purchase_amount} />
                </td>
                <td style={{ color: '#64748b' }}>{device.paid_by || 'Rohit'}</td>
                <td style={{ color: '#64748b' }}>{device.intake_date}</td>
                <td style={{ color: '#dc2626', fontWeight: 600 }}>
                  {device.last_rejection_reason || 'Defective piece'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
        <span>Showing all {devices.length} rejected stock items</span>
      </div>
    </div>
  );
}

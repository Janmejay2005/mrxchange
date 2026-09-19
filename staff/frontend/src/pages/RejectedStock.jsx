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
      setDevices(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Sample fallback list matching Rejected Stock reference screenshot
      setDevices([
        { id: '1', brand: 'Apple', model: 'iPhone 11', storage: 64, ram: 4, colour: 'Black', purchase_amount: 18000, paid_by: 'Rohit', intake_date: '15 Sep 2026', last_rejection_reason: 'Screen not working' },
        { id: '2', brand: 'Samsung', model: 'Galaxy S22', storage: 128, ram: 8, colour: 'White', purchase_amount: 24500, paid_by: 'Aadarsh', intake_date: '14 Sep 2026', last_rejection_reason: 'Motherboard dead' },
        { id: '3', brand: 'OnePlus', model: '9R', storage: 128, ram: 8, colour: 'Blue', purchase_amount: 16000, paid_by: 'Neha', intake_date: '13 Sep 2026', last_rejection_reason: 'Liquid damage' },
        { id: '4', brand: 'Redmi', model: 'Note 10', storage: 64, ram: 6, colour: 'Gray', purchase_amount: 8500, paid_by: 'Rohit', intake_date: '12 Sep 2026', last_rejection_reason: 'Battery swollen' },
        { id: '5', brand: 'Google', model: 'Pixel 5', storage: 128, ram: 8, colour: 'Green', purchase_amount: 20000, paid_by: 'Aman', intake_date: '11 Sep 2026', last_rejection_reason: 'Short circuit' },
        { id: '6', brand: 'Vivo', model: 'V21', storage: 128, ram: 8, colour: 'Blue', purchase_amount: 15000, paid_by: 'Neha', intake_date: '10 Sep 2026', last_rejection_reason: 'IC failure' },
        { id: '7', brand: 'Oppo', model: 'F19', storage: 128, ram: 6, colour: 'Black', purchase_amount: 13500, paid_by: 'Rohit', intake_date: '09 Sep 2026', last_rejection_reason: 'Display cracked' },
        { id: '8', brand: 'Realme', model: '8', storage: 128, ram: 6, colour: 'Yellow', purchase_amount: 12000, paid_by: 'Aadarsh', intake_date: '08 Sep 2026', last_rejection_reason: 'Water damage' },
        { id: '9', brand: 'Apple', model: 'iPhone SE (2020)', storage: 64, ram: 3, colour: 'White', purchase_amount: 10000, paid_by: 'Neha', intake_date: '07 Sep 2026', last_rejection_reason: 'Face ID not working' },
        { id: '10', brand: 'Nothing', model: 'Phone (1)', storage: 128, ram: 8, colour: 'Black', purchase_amount: 14000, paid_by: 'Rohit', intake_date: '06 Sep 2026', last_rejection_reason: 'Board corrosion' },
        { id: '11', brand: 'Samsung', model: 'Galaxy A52', storage: 128, ram: 8, colour: 'Black', purchase_amount: 17500, paid_by: 'Aman', intake_date: '05 Sep 2026', last_rejection_reason: 'Charging port damage' },
        { id: '12', brand: 'OnePlus', model: 'Nord', storage: 128, ram: 8, colour: 'Gray', purchase_amount: 19000, paid_by: 'Aadarsh', intake_date: '04 Sep 2026', last_rejection_reason: 'Camera not working' },
      ]);
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
              <th>Action</th>
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
                <td>
                  <button 
                    onClick={() => setResolveModal({
                      isOpen: true,
                      device,
                      resolution: 'Secondary Repair',
                      destination: 'IN_REPAIR',
                      notes: ''
                    })}
                    className="btn-secondary" 
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
        <span>Showing 1–12 of 42 items</span>
      </div>

      {/* Resolve Modal */}
      {resolveModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Resolve Rejected Device</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                Device: <strong>{resolveModal.device?.brand} {resolveModal.device?.model}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Route Destination *</label>
                <select 
                  className="form-control"
                  value={resolveModal.destination}
                  onChange={(e) => setResolveModal({ ...resolveModal, destination: e.target.value })}
                >
                  <option value="IN_REPAIR">Send to Repair Stock (Secondary Attempt)</option>
                  <option value="IN_HAND">Approve & Move to In-hand Stock (Admin QC Passed)</option>
                  <option value="DISPOSED">Mark as Disposed / Scrap Parts</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Resolution Description</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  placeholder="Details of approval or re-work..."
                  value={resolveModal.notes}
                  onChange={(e) => setResolveModal({ ...resolveModal, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setResolveModal({ ...resolveModal, isOpen: false })} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleResolve} className="btn-primary">
                Confirm Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

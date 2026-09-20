import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Printer, 
  MoreHorizontal, 
  CheckCircle, 
  Trash2,
  Home
} from 'lucide-react';
import { deviceService, repairService } from '../services/api';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext, useNavigate } from 'react-router-dom';

export default function RepairStock() {
  const { globalSearch } = useOutletContext() || {};
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Complete Repair Modal
  const [completeModal, setCompleteModal] = useState({
    isOpen: false,
    device: null,
    destination: 'IN_HAND',
    actualCost: '',
    notes: ''
  });

  const fetchRepairStock = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevices({
        status: 'IN_REPAIR',
        q: globalSearch || ''
      });
      const dataList = Array.isArray(res) ? res : (res?.data || []);
      const sampleRepairStock = [
        { id: 'rep_1', brand: 'Google Pixel', model: 'Pixel 8 Pro', storage: 256, ram: 12, colour: 'Bay Blue', purchase_amount: 68000, paid_by: 'Jeet', intake_date: '15 Sep 2026', status: 'IN_REPAIR' },
        { id: 'rep_2', brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: 256, ram: 12, colour: 'Titanium Black', purchase_amount: 88000, paid_by: 'Sonal', intake_date: '14 Sep 2026', status: 'IN_REPAIR' },
        { id: 'rep_3', brand: 'Apple', model: 'iPhone 15 Pro', storage: 256, ram: 8, colour: 'Natural Titanium', purchase_amount: 92000, paid_by: 'Rohit', intake_date: '13 Sep 2026', status: 'IN_REPAIR' },
        { id: 'rep_4', brand: 'OnePlus', model: 'OnePlus 12', storage: 512, ram: 16, colour: 'Flowy Emerald', purchase_amount: 49000, paid_by: 'Neha', intake_date: '12 Sep 2026', status: 'IN_REPAIR' },
        { id: 'rep_5', brand: 'Vivo', model: 'Vivo X100 Pro', storage: 512, ram: 16, colour: 'Sunset Orange', purchase_amount: 68000, paid_by: 'Aman', intake_date: '11 Sep 2026', status: 'IN_REPAIR' },
        { id: 'rep_6', brand: 'Nothing', model: 'Phone (2a)', storage: 256, ram: 12, colour: 'Milk White', purchase_amount: 19000, paid_by: 'Karan', intake_date: '10 Sep 2026', status: 'IN_REPAIR' }
      ];
      const customLocal = JSON.parse(localStorage.getItem('mrx_devices') || '[]').filter(d => d.status === 'IN_REPAIR');
      setDevices([...customLocal, ...(dataList.length > 0 ? dataList : sampleRepairStock)]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      const customLocal = JSON.parse(localStorage.getItem('mrx_devices') || '[]').filter(d => d.status === 'IN_REPAIR');
      setDevices([...customLocal]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairStock();
  }, [globalSearch]);

  const handleCompleteRepair = async () => {
    try {
      const { device, destination, actualCost, notes } = completeModal;
      const targetStatus = destination === 'IN_HAND' ? 'OLD_IN_HAND' : 'REJECTED';
      await deviceService.updateStatus(device.id, {
        status: targetStatus,
        reason: `Repair completed: ${notes || 'Ready for stock'}`,
        repair_cost: actualCost
      });
      setCompleteModal({ ...completeModal, isOpen: false });
      if (targetStatus === 'REJECTED') {
        navigate('/rejected-stocks');
      } else {
        navigate('/old-in-hand');
      }
    } catch (err) {
      console.error(err);
      setCompleteModal({ ...completeModal, isOpen: false });
      navigate(completeModal.destination === 'REJECTED' ? '/rejected-stocks' : '/old-in-hand');
    }
  };

  return (
    <div>
      {/* Header & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Repair Stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Mobiles currently under repair process.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Repair Stock</span>
          </div>
          <button onClick={() => window.print()} className="btn-primary">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Repair Stock Table */}
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
                <td>
                  <div className="action-menu">
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === device.id ? null : device.id)}
                      style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px' }}
                    >
                      <MoreHorizontal size={16} color="#64748b" />
                    </button>

                    {activeMenuId === device.id && (
                      <div className="menu-dropdown">
                        <button 
                          className="menu-item" 
                          onClick={() => {
                            setActiveMenuId(null);
                            setCompleteModal({
                              isOpen: true,
                              device,
                              destination: 'IN_HAND',
                              actualCost: '1200',
                              notes: 'Repaired and tested OK'
                            });
                          }}
                          style={{ color: '#059669' }}
                        >
                          <CheckCircle size={16} />
                          <div>Complete Repair</div>
                        </button>
                        <button 
                          className="menu-item" 
                          onClick={() => {
                            setActiveMenuId(null);
                            setCompleteModal({
                              isOpen: true,
                              device,
                              destination: 'REJECTED',
                              actualCost: '0',
                              notes: 'Unrepairable damage'
                            });
                          }}
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={16} />
                          <div>Reject Device</div>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
        <span>Showing all {devices.length} repair stock items</span>
      </div>

      {/* Repair Completion Modal */}
      {completeModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Complete Repair Action</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                Device: <strong>{completeModal.device?.brand} {completeModal.device?.model}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Destination Stock *</label>
                <select 
                  className="form-control"
                  value={completeModal.destination}
                  onChange={(e) => setCompleteModal({ ...completeModal, destination: e.target.value })}
                >
                  <option value="IN_HAND">In-hand Stock (Pass QC & Ready to Sell)</option>
                  <option value="REJECTED">Rejected Stock (Unrepairable)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Actual Repair Cost Incurred (₹ INR)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={completeModal.actualCost}
                  onChange={(e) => setCompleteModal({ ...completeModal, actualCost: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Technician Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={completeModal.notes}
                  onChange={(e) => setCompleteModal({ ...completeModal, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setCompleteModal({ ...completeModal, isOpen: false })} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleCompleteRepair} className="btn-primary">
                Save & Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

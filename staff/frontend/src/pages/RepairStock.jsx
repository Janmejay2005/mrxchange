import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Printer, 
  MoreHorizontal, 
  CheckCircle, 
  Trash2,
  Home,
  FileText
} from 'lucide-react';
import { deviceService, repairService } from '../services/api';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { exportToPdf } from '../utils/pdfGenerator';

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
    actualCost: '',
    paidBy: 'Rohit',
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
        { id: 'rep_3', brand: 'Apple', model: 'iPhone 15 Pro', storage: 256, ram: 8, colour: 'Natural Titanium', purchase_amount: 92000, paid_by: 'Rohit', intake_date: '13 Sep 2026', status: 'IN_REPAIR' }
      ];

      const dataIds = new Set(dataList.map(d => String(d.id)));
      const dataCodes = new Set(dataList.map(d => d.device_code).filter(Boolean));

      const filteredSamples = sampleRepairStock.filter(s => 
        !dataIds.has(String(s.id)) && (!s.device_code || !dataCodes.has(s.device_code))
      );

      const allRepair = [...dataList, ...filteredSamples].filter(d => d.status === 'IN_REPAIR');
      setDevices(allRepair);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairStock();
  }, [globalSearch]);

  const handleExportPdf = () => {
    const headers = ['#', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Amount', 'Paid By', 'Date'];
    const rows = devices.map((d, idx) => [
      idx + 1,
      d.brand,
      d.model,
      `${d.storage} GB`,
      `${d.ram} GB`,
      d.colour || '-',
      `Rs. ${d.purchase_amount}`,
      d.paid_by || 'Staff',
      d.intake_date || 'Today'
    ]);
    exportToPdf('Repair Stock Report', headers, rows, `Repair_Stock_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleCompleteRepair = async () => {
    try {
      const { device, actualCost, paidBy, notes } = completeModal;
      await deviceService.updateStatus(device.id, {
        status: 'OLD_INVENTORY',
        reason: `Repair completed: ${notes || 'Ready for stock'}`,
        repair_cost: actualCost,
        repair_paid_by: paidBy
      }, device);
      setCompleteModal({ ...completeModal, isOpen: false });
      navigate('/old-inventory');
    } catch (err) {
      console.error(err);
      setCompleteModal({ ...completeModal, isOpen: false });
      navigate('/old-inventory');
    }
  };

  const handleRejectDevice = async (device) => {
    try {
      setActiveMenuId(null);
      await deviceService.updateStatus(device.id, {
        status: 'REJECTED',
        reason: 'Unrepairable damage'
      }, device);
      navigate('/rejected-stocks');
    } catch (err) {
      console.error(err);
      navigate('/rejected-stocks');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Repair Stock</span>
          </div>
          <button onClick={handleExportPdf} className="btn-primary" style={{ borderRadius: '8px' }}>
            <FileText size={15} /> Export PDF
          </button>
          <button onClick={() => window.print()} className="btn-secondary" style={{ borderRadius: '8px' }}>
            <Printer size={15} /> Print Report
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
                              actualCost: '1200',
                              paidBy: 'Rohit',
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
                          onClick={() => handleRejectDevice(device)}
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
          <div className="modal-card" style={{ maxWidth: '440px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Complete Repair Action</h3>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 120px)', padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                Device: <strong>{completeModal.device?.brand} {completeModal.device?.model}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Actual Repair Cost Incurred (₹ INR)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="e.g. 1200"
                  value={completeModal.actualCost}
                  onChange={(e) => setCompleteModal({ ...completeModal, actualCost: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Paid By *</label>
                <select 
                  className="form-control"
                  value={completeModal.paidBy}
                  onChange={(e) => setCompleteModal({ ...completeModal, paidBy: e.target.value })}
                >
                  <option value="Rohit">Rohit</option>
                  <option value="Aadarsh">Aadarsh</option>
                  <option value="Neha">Neha</option>
                  <option value="Aman">Aman</option>
                  <option value="Jeet">Jeet</option>
                  <option value="Sunal">Sunal</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Technician Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  placeholder="Notes about repair work..."
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

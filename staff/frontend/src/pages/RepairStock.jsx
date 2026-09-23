import React, { useState, useEffect } from 'react';
import {
  Wrench,
  FileText,
  MoreHorizontal,
  CheckCircle,
  Trash2,
  Home
} from 'lucide-react';
import { deviceService, repairService } from '../services/api';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext, useNavigate } from 'react-router-dom';
import PdfExportModal from '../components/common/PdfExportModal';

export default function RepairStock() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

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

  const handleCompleteRepair = async () => {
    try {
      const { device, actualCost, paidBy, notes } = completeModal;
      const initialAmount = Number(device?.purchase_amount || 0);
      const repairAmount = Number(actualCost || 0);
      const totalNewAmount = initialAmount + repairAmount;

      const inHandDevice = {
        ...device,
        purchase_amount: totalNewAmount,
        initial_purchase_amount: initialAmount,
        repair_cost: repairAmount,
        repair_person: paidBy || 'Technician',
        repair_notes: notes || 'Repaired and tested OK',
        status: 'OLD_IN_HAND',
        intake_date: new Date().toISOString().split('T')[0]
      };

      // Save into mrx_old_in_hand_stock localStorage
      const oldInHandStock = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      const filtered = oldInHandStock.filter(d => String(d.id) !== String(device.id));
      filtered.unshift(inHandDevice);
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(filtered));

      try {
        await deviceService.updateStatus(device.id, {
          status: 'OLD_IN_HAND',
          purchase_amount: totalNewAmount,
          repair_cost: repairAmount,
          repair_paid_by: paidBy,
          reason: `Repair completed: ${notes || 'Ready for stock'}`
        });
      } catch (e) {
        console.error(e);
      }

      setCompleteModal({ ...completeModal, isOpen: false });
      alert(`Repair completed! Device moved to Old In-hand Inventory with total valuation ₹ ${totalNewAmount.toLocaleString('en-IN')} (Initial ₹ ${initialAmount.toLocaleString('en-IN')} + Repair ₹ ${repairAmount.toLocaleString('en-IN')}).`);
      navigate('/old-in-hand');
    } catch (err) {
      console.error(err);
      setCompleteModal({ ...completeModal, isOpen: false });
      navigate('/old-in-hand');
    }
  };

  const handleRejectDevice = async (device) => {
    try {
      setActiveMenuId(null);
      await deviceService.updateStatus(device.id, {
        status: 'REJECTED',
        reason: 'Unrepairable damage'
      });
      navigate('/rejected-stocks');
    } catch (err) {
      console.error(err);
      navigate('/rejected-stocks');
    }
  };

  const handleExportPdf = () => {
    const headers = ['#', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Amount (Rs)', 'Paid By', 'Date'];
    const rows = devices.map((d, idx) => [
      idx + 1,
      d.brand,
      d.model,
      `${d.storage} GB`,
      `${d.ram} GB`,
      d.colour || '-',
      `Rs. ${d.purchase_amount}`,
      d.paid_by || 'Rohit',
      d.intake_date || '-'
    ]);
    const totalCost = devices.reduce((sum, d) => sum + (Number(d.purchase_amount) || 0), 0);
    setExportModalConfig({
      isOpen: true,
      title: 'Repair Inventory Stock Report',
      headers,
      rows,
      filename: `Repair_Stock_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Repair Value', value: `Rs. ${totalCost.toLocaleString()}`, color: '#ea580c' }
      ]
    });
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
          <button onClick={handleExportPdf} className="btn-primary">
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Summary Section for Repair Costs & Valuations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Under Repair</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
            {filteredDevices.length} Devices
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Active repair process</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Purchase Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
            <CurrencyAmount amount={filteredDevices.reduce((sum, d) => sum + (Number(d.purchase_amount) || 0), 0)} />
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Initial acquisition value</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Repair Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed', marginTop: '6px' }}>
            <CurrencyAmount amount={filteredDevices.reduce((sum, d) => sum + (Number(d.repair_cost || d.estimated_repair_cost || 1500)), 0)} />
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Estimated / Incurred repairs</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Inventory Investment</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
            <CurrencyAmount amount={filteredDevices.reduce((sum, d) => sum + (Number(d.purchase_amount) || 0) + (Number(d.repair_cost || d.estimated_repair_cost || 1500)), 0)} />
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Purchase + Repair combined</div>
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
            {filteredDevices.map((device, idx) => (
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
                <label className="form-label" style={{ fontWeight: 700 }}>Technician / Person Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter technician name (e.g. Ramesh / Rohit)"
                  value={completeModal.paidBy}
                  onChange={(e) => setCompleteModal({ ...completeModal, paidBy: e.target.value })}
                  required
                />
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

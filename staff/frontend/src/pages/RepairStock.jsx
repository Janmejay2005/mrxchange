import React, { useState, useEffect } from 'react';
import {
  Wrench,
  FileText,
  MoreHorizontal,
  CheckCircle,
  Trash2,
  Home,
  X
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
  const [popupDevice, setPopupDevice] = useState(null);

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
      const localRepair = JSON.parse(localStorage.getItem('mrx_repair_stock') || '[]');

      const rawCombined = [...localRepair, ...dataList];
      const seenFingerprints = new Set();
      const repairDevices = [];

      for (const item of rawCombined) {
        if (!item) continue;
        if (item.status && item.status !== 'IN_REPAIR') continue;
        const brand = (item.brand || '').trim().toLowerCase();
        const model = (item.model || '').trim().toLowerCase();
        const amount = Number(item.purchase_amount || item.amount || 0);
        const paidBy = (item.paid_by || item.purchasedBy || '').trim().toLowerCase();
        const date = item.intake_date || item.created_at || item.date || '';

        const fingerprint = item.device_code
          ? `code_${item.device_code}`
          : item.id ? `id_${item.id}`
          : `${brand}|${model}|${item.storage || ''}|${item.ram || ''}|${amount}|${paidBy}|${date}`;

        if (!seenFingerprints.has(fingerprint)) {
          seenFingerprints.add(fingerprint);
          repairDevices.push(item);
        }
      }
      setDevices(repairDevices);
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

      {/* KPI Cards Summary Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Under Repair</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
            {filteredDevices.length} Devices
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Active repair process</div>
        </div>
      </div>

      {/* Repair Stock Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Image</th>
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
                <td data-label="#">{idx + 1}</td>
                <td data-label="Image">
                  <div 
                    onClick={() => setPopupDevice(device)} 
                    style={{ cursor: 'pointer', display: 'inline-block' }}
                    title="Click to view full photos & details"
                  >
                    {device.images && device.images.length > 1 ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <img 
                          src={device.images[0]} 
                          alt="Front" 
                          className="device-thumb" 
                          title="Front View - Click to expand"
                        />
                        <img 
                          src={device.images[1]} 
                          alt="Back" 
                          className="device-thumb" 
                          title="Back View - Click to expand"
                        />
                      </div>
                    ) : (
                      <img 
                        src={device.image_url || device.image_data || (device.images && device.images[0]) || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'} 
                        alt={device.model} 
                        className="device-thumb" 
                      />
                    )}
                  </div>
                </td>
                <td data-label="Brand" style={{ fontWeight: 600 }}>{device.brand}</td>
                <td data-label="Model" style={{ fontWeight: 700 }}>{device.model}</td>
                <td data-label="Storage">{device.storage} GB</td>
                <td data-label="RAM">{device.ram} GB</td>
                <td data-label="Color">{device.colour}</td>
                <td data-label="Paid Amount" style={{ fontWeight: 700 }}>
                  <CurrencyAmount amount={device.purchase_amount} />
                </td>
                <td data-label="Paid By" style={{ color: '#64748b' }}>{device.paid_by || 'Rohit'}</td>
                <td data-label="Date" style={{ color: '#64748b' }}>{device.intake_date}</td>
                <td data-label="Action">
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

      {/* Image Preview Modal */}
      {popupDevice && (
        <div className="modal-overlay" onClick={() => setPopupDevice(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '480px', borderRadius: '16px', padding: '24px', textAlign: 'center' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Repair Device Photos & Details</h3>
              <button onClick={() => setPopupDevice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 700, color: '#64748b' }}>✕</button>
            </div>

            {/* Device Image Preview */}
            {(() => {
              const allImgs = (popupDevice.images && popupDevice.images.length > 0)
                ? popupDevice.images.filter(Boolean)
                : [popupDevice.image_url || popupDevice.image_data].filter(Boolean);
              const previewList = allImgs.length > 0 ? allImgs : ['https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=200'];

              return (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', marginBottom: '16px', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                  {previewList.map((imgSrc, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <img 
                        src={imgSrc} 
                        alt={`${popupDevice.model} - Photo ${i+1}`} 
                        style={{ maxHeight: '160px', maxWidth: previewList.length > 1 ? '160px' : '260px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                      />
                      {previewList.length > 1 && (
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>
                          Photo {i+1} {i === 0 ? '(Front)' : i === 1 ? '(Back)' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Device Specs Details */}
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
                <span style={{ color: '#64748b', fontWeight: 600 }}>Specs (Storage / RAM):</span>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>{popupDevice.storage} GB / {popupDevice.ram} GB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Color:</span>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>{popupDevice.colour || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
                <span style={{ color: '#ea580c', fontWeight: 800, background: '#ffedd5', padding: '2px 8px', borderRadius: '6px' }}>Under Repair</span>
              </div>
            </div>

            <button onClick={() => setPopupDevice(null)} className="btn-secondary" style={{ width: '100%', padding: '10px' }}>
              Close Preview
            </button>
          </div>
        </div>
      )}

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

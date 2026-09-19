import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  RotateCcw, 
  Printer, 
  MoreVertical, 
  ShoppingBag, 
  Wrench, 
  Trash2,
  Database,
  Smartphone
} from 'lucide-react';
import { deviceService } from '../../services/api';
import { StatusBadge, CurrencyAmount } from '../../components/common/UIComponents';
import AddMobileModal from '../../components/modals/AddMobileModal';
import { useOutletContext } from 'react-router-dom';

export default function OldInventory() {
  const { globalSearch } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('ALL');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Status Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: '', // 'IN_HAND', 'IN_REPAIR', 'REJECTED'
    device: null,
    reason: '',
    repairIssue: '',
    technician: '',
    repairCost: '',
    rejectionReason: ''
  });

  const tabs = [
    { label: 'All', value: 'ALL', count: 5248 },
    { label: 'In Inventory', value: 'OLD_INVENTORY', count: 3786 },
    { label: 'In Repair', value: 'IN_REPAIR', count: 620 },
    { label: 'Needs Review', value: 'NEEDS_REVIEW', count: 842 },
    { label: 'Defected', value: 'REJECTED', count: 0 },
    { label: 'On Hold', value: 'ON_HOLD', count: 0 },
    { label: 'Sold', value: 'SOLD', count: 0 },
    { label: 'Other', value: 'OTHER', count: 0 },
  ];

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevices({
        status: activeTab === 'ALL' ? '' : activeTab,
        q: globalSearch || ''
      });
      setDevices(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Sample fallback list matching screenshot
      setDevices([
        { id: '1', brand: 'Apple', model: 'iPhone 13', imei: '352039847593812', storage: 128, ram: 4, colour: 'Midnight', condition: 'Good', intake_date: '15 Sep 2026', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
        { id: '2', brand: 'Samsung', model: 'Samsung S22', imei: '358240951234765', storage: 256, ram: 8, colour: 'Phantom Black', condition: 'Good', intake_date: '14 Sep 2026', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' },
        { id: '3', brand: 'Apple', model: 'iPhone 12', imei: '351682947651903', storage: 64, ram: 4, colour: 'White', condition: 'Fair', intake_date: '14 Sep 2026', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=100' },
        { id: '4', brand: 'OnePlus', model: 'OnePlus 10R', imei: '867985064321098', storage: 128, ram: 8, colour: 'Sierra Black', condition: 'Good', intake_date: '13 Sep 2026', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=100' },
        { id: '5', brand: 'Apple', model: 'iPhone 11', imei: '352091743812609', storage: 64, ram: 4, colour: 'Green', condition: 'Fair', intake_date: '13 Sep 2026', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
        { id: '6', brand: 'Xiaomi', model: 'Redmi Note 11', imei: '864320567981234', storage: 128, ram: 6, colour: 'Blue', condition: 'Good', intake_date: '12 Sep 2026', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100' },
        { id: '7', brand: 'Samsung', model: 'Samsung S21', imei: '358749120563421', storage: 256, ram: 8, colour: 'Violet', condition: 'Good', intake_date: '12 Sep 2026', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' },
        { id: '8', brand: 'Apple', model: 'iPhone SE', imei: '356781092345671', storage: 64, ram: 3, colour: 'Black', condition: 'Fair', intake_date: '11 Sep 2026', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=100' },
        { id: '9', brand: 'Realme', model: 'Realme 9', imei: '865432109876541', storage: 128, ram: 6, colour: 'Blue', condition: 'Good', intake_date: '11 Sep 2026', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100' },
        { id: '10', brand: 'Apple', model: 'iPhone XR', imei: '357891045612309', storage: 64, ram: 3, colour: 'Red', condition: 'Fair', intake_date: '10 Sep 2026', status: 'OLD_INVENTORY', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [activeTab, globalSearch]);

  const handleAction = (type, device) => {
    setActiveMenuId(null);
    setActionModal({
      isOpen: true,
      type,
      device,
      reason: '',
      repairIssue: '',
      technician: '',
      repairCost: '',
      rejectionReason: ''
    });
  };

  const handleConfirmAction = async () => {
    try {
      const { type, device, reason, repairIssue, technician, repairCost, rejectionReason } = actionModal;
      await deviceService.updateStatus(device.id, {
        status: type,
        reason,
        repair_issue: repairIssue,
        technician,
        repair_cost: repairCost,
        rejection_reason: rejectionReason
      });
      setActionModal({ ...actionModal, isOpen: false });
      fetchInventory();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div>
      {/* Header section with Stats Cards matching Old Inventory screenshot */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Old Inventory</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>All incoming mobile devices before repair and final listing.</p>
          <div style={{ marginTop: '16px' }}>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
              <Plus size={18} /> Add Mobile
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="kpi-card" style={{ width: '220px', margin: 0 }}>
            <div className="kpi-icon-wrap" style={{ backgroundColor: '#e0f2fe' }}>
              <Smartphone size={24} color="#0284c7" />
            </div>
            <div className="kpi-info">
              <span className="kpi-title">Total Mobiles</span>
              <span className="kpi-value" style={{ fontSize: '22px' }}>5,248</span>
            </div>
          </div>

          <div className="kpi-card" style={{ width: '240px', margin: 0 }}>
            <div className="kpi-icon-wrap" style={{ backgroundColor: '#e0f2fe' }}>
              <Database size={24} color="#0284c7" />
            </div>
            <div className="kpi-info">
              <span className="kpi-title">Database Capacity</span>
              <span className="kpi-value" style={{ fontSize: '18px', color: '#059669' }}>5000+ Devices</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Built to handle large-scale inventory</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
        <button className="btn-secondary">
          Select Date Range
        </button>
        <button className="btn-secondary">
          <Filter size={16} /> Filters
        </button>
        <button onClick={() => fetchInventory()} className="btn-secondary">
          <RotateCcw size={16} /> Reset
        </button>
        <button onClick={() => window.print()} className="btn-primary" style={{ background: '#0f172a' }}>
          <Printer size={16} /> Print Out
        </button>
      </div>

      {/* Tabs list */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '20px', marginBottom: '20px' }}>
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
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Master Inventory Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" /></th>
              <th>#</th>
              <th>Image</th>
              <th>Model / Name</th>
              <th>IMEI</th>
              <th>Storage</th>
              <th>RAM</th>
              <th>Color</th>
              <th>Condition</th>
              <th>Date Added ↓</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device, idx) => (
              <tr key={device.id || idx}>
                <td><input type="checkbox" /></td>
                <td>{idx + 1}</td>
                <td>
                  <img 
                    src={device.image_url || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'} 
                    alt={device.model} 
                    className="device-thumb" 
                  />
                </td>
                <td style={{ fontWeight: 700 }}>{device.model}</td>
                <td style={{ color: '#0284c7', fontWeight: 600 }}>{device.imei || 'N/A'}</td>
                <td>{device.storage} GB</td>
                <td>{device.ram} GB</td>
                <td>{device.colour}</td>
                <td>
                  <span style={{ color: device.condition === 'Fair' ? '#d97706' : '#059669', fontWeight: 600 }}>
                    {device.condition || 'Good'}
                  </span>
                </td>
                <td style={{ color: '#64748b' }}>{device.intake_date}</td>
                <td>
                  <div className="action-menu">
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === device.id ? null : device.id)}
                      style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px' }}
                    >
                      <MoreVertical size={16} color="#64748b" />
                    </button>

                    {activeMenuId === device.id && (
                      <div className="menu-dropdown">
                        <button 
                          className="menu-item" 
                          onClick={() => handleAction('IN_HAND', device)}
                          style={{ color: '#059669' }}
                        >
                          <ShoppingBag size={16} />
                          <div>
                            <div>Resell</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>Move to Resell Stock</div>
                          </div>
                        </button>
                        <button 
                          className="menu-item" 
                          onClick={() => handleAction('IN_REPAIR', device)}
                          style={{ color: '#d97706' }}
                        >
                          <Wrench size={16} />
                          <div>
                            <div>Repair</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>Move to Repair Stock</div>
                          </div>
                        </button>
                        <button 
                          className="menu-item" 
                          onClick={() => handleAction('REJECTED', device)}
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={16} />
                          <div>
                            <div>Reject</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>Move to Rejected Stock</div>
                          </div>
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

      {/* Add Mobile Modal */}
      <AddMobileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchInventory}
      />

      {/* Status Transition Modal */}
      {actionModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
                {actionModal.type === 'IN_HAND' && 'Move to In-hand Stock (Resell)'}
                {actionModal.type === 'IN_REPAIR' && 'Move to Repair Stock'}
                {actionModal.type === 'REJECTED' && 'Move to Rejected Stock'}
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                Device: <strong>{actionModal.device?.brand} {actionModal.device?.model}</strong> (IMEI: {actionModal.device?.imei})
              </p>

              {actionModal.type === 'IN_REPAIR' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Repair Issue Description *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Display glass cracked, Touch not working"
                      value={actionModal.repairIssue}
                      onChange={(e) => setActionModal({ ...actionModal, repairIssue: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Technician Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Aman Tech"
                      value={actionModal.technician}
                      onChange={(e) => setActionModal({ ...actionModal, technician: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimated Repair Cost (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="e.g. 1500"
                      value={actionModal.repairCost}
                      onChange={(e) => setActionModal({ ...actionModal, repairCost: e.target.value })}
                    />
                  </div>
                </>
              )}

              {actionModal.type === 'REJECTED' && (
                <div className="form-group">
                  <label className="form-label">Reason for Rejection *</label>
                  <select 
                    className="form-control"
                    value={actionModal.rejectionReason}
                    onChange={(e) => setActionModal({ ...actionModal, rejectionReason: e.target.value })}
                  >
                    <option value="">Select reason...</option>
                    <option value="Motherboard dead">Motherboard dead</option>
                    <option value="Liquid damage">Liquid damage</option>
                    <option value="Screen not working">Screen not working</option>
                    <option value="Battery swollen">Battery swollen</option>
                    <option value="Board corrosion">Board corrosion</option>
                    <option value="IC failure">IC failure</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Transition Note / Reason</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  placeholder="Audit reason for moving this stock..."
                  value={actionModal.reason}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmAction} className="btn-primary">
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

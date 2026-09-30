import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  Download, 
  Smartphone, 
  Calendar, 
  ShieldCheck, 
  User, 
  Tag, 
  CheckCircle,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { deviceService } from '../../services/api';
import { CurrencyAmount } from '../common/UIComponents';
import { exportToXls } from '../../utils/pdfGenerator';

export default function MobileHistoryModal({ isOpen, onClose }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('All Super Admins');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [expandedImage, setExpandedImage] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let apiDevs = [];
      try {
        const res = await deviceService.getDevices({ limit: 500 });
        apiDevs = Array.isArray(res) ? res : (res?.data || []);
      } catch (e) {
        console.warn('API fetch offline fallback for history log:', e);
      }

      const localOldInv = JSON.parse(localStorage.getItem('mrx_old_inventory') || '[]');
      const localDevs = JSON.parse(localStorage.getItem('mrx_devices') || '[]');
      const localInHand = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');

      const combinedRaw = [...localOldInv, ...localDevs, ...localInHand, ...apiDevs];
      const seenMap = new Map();

      combinedRaw.forEach((item) => {
        if (!item) return;
        const code = item.device_code || item.id || `DEV-${Math.random().toString().slice(2, 8)}`;
        const b = (item.brand || '').trim();
        const m = (item.model || '').trim();
        const amt = Number(item.purchase_amount || item.amount || 0);
        const date = item.intake_date || item.created_at || item.date || new Date().toISOString().split('T')[0];
        
        // Deduplicate using unique key (id or code) to fix duplicate intake bug
        const uniqueKey = item.id || item.device_code || `${b}_${m}_${amt}_${date}`;

        if (!seenMap.has(String(uniqueKey))) {
          seenMap.set(String(uniqueKey), {
            id: code,
            device_code: item.device_code || code,
            brand: b || 'Unknown Brand',
            model: m || 'Unknown Model',
            storage: item.storage || '128',
            ram: item.ram || '6',
            colour: item.colour || item.color || '-',
            paid_amount: amt,
            paid_by: item.paid_by || item.purchasedBy || item.paidBy || 'Jeet Khubchandani',
            added_by: item.created_by || item.added_by || 'Staff',
            date: date,
            status: item.status || 'OLD_INVENTORY',
            image_url: item.image_url || (Array.isArray(item.images) && item.images[0]) || item.image || ''
          });
        }
      });

      // Sort newest intake first
      const sorted = Array.from(seenMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistoryList(sorted);
    } catch (err) {
      console.error('Error compiling history log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSync = () => {
      if (isOpen) fetchHistory();
    };
    window.addEventListener('mrx_inventory_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('mrx_inventory_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredHistory = historyList.filter((item) => {
    if (selectedAdmin !== 'All Super Admins') {
      const p = String(item.paid_by).toLowerCase();
      const sel = String(selectedAdmin).toLowerCase();
      if (sel.includes('jeet') && !p.includes('jeet')) return false;
      if (sel.includes('sonal') && !p.includes('sonal')) return false;
    }

    if (selectedStatus !== 'All') {
      if (selectedStatus === 'In Stock' && (item.status !== 'OLD_INVENTORY' && item.status !== 'OLD_IN_HAND')) return false;
      if (selectedStatus === 'Booked' && (item.status !== 'Booked' && item.status !== 'BOOKED')) return false;
      if (selectedStatus === 'Under Repair' && item.status !== 'IN_REPAIR') return false;
      if (selectedStatus === 'Sold' && item.status !== 'Sold') return false;
    }

    if (fromDate && item.date < fromDate) return false;
    if (toDate && item.date > toDate) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const mMatch = String(item.model).toLowerCase().includes(q);
      const bMatch = String(item.brand).toLowerCase().includes(q);
      const cMatch = String(item.device_code).toLowerCase().includes(q);
      const pMatch = String(item.paid_by).toLowerCase().includes(q);
      if (!mMatch && !bMatch && !cMatch && !pMatch) return false;
    }

    return true;
  });

  const totalInvested = filteredHistory.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);

  const handleExportExcel = () => {
    const headers = ['#', 'Device Code', 'Brand & Model', 'Intake Date', 'Paid Amount (Rs)', 'Paid By (Super Admin)', 'Added By', 'Status'];
    const rows = filteredHistory.map((item, idx) => [
      idx + 1,
      item.device_code,
      `${item.brand} ${item.model} (${item.storage}GB)`,
      item.date,
      `Rs. ${item.paid_amount.toLocaleString()}`,
      item.paid_by,
      item.added_by,
      item.status
    ]);
    exportToXls('Mobile_Intake_History_Report', headers, rows, `Mobile_Intake_History_${new Date().toISOString().slice(0, 10)}.xls`);
  };

  const getStatusBadge = (status) => {
    if (status === 'Sold') {
      return <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>Sold ✔️</span>;
    }
    if (status === 'Booked' || status === 'BOOKED') {
      return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>Booked 📱</span>;
    }
    if (status === 'IN_REPAIR') {
      return <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>Under Repair 🔧</span>;
    }
    return <span style={{ background: '#f1f5f9', color: '#0284c7', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>In Stock 📦</span>;
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9990, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-card" style={{ maxWidth: '1100px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px', background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>📜 Mobile Device Intake History</h2>
              <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                {filteredHistory.length} Devices Recorded
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Complete deduplicated audit trail of all historical and real-time mobile intake entries.</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px 0', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search code, model, brand, payer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          {/* Admin Filter */}
          <select
            className="form-control"
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            style={{ width: '180px', height: '38px', fontSize: '13px', fontWeight: 700 }}
          >
            <option>All Super Admins</option>
            <option>Jeet Khubchandani</option>
            <option>Sonal Wadwani</option>
          </select>

          {/* Status Filter */}
          <select
            className="form-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: '140px', height: '38px', fontSize: '13px', fontWeight: 700 }}
          >
            <option value="All">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Booked">Booked</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Sold">Sold</option>
          </select>

          {/* Date range */}
          <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '140px', height: '38px', fontSize: '13px' }} title="From Date" />
          <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '140px', height: '38px', fontSize: '13px' }} title="To Date" />

          {/* Export button */}
          <button onClick={handleExportExcel} className="btn-secondary" style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Download size={15} color="#0284c7" /> Excel (.xls)
          </button>
        </div>

        {/* Summary Metric */}
        <div style={{ background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', margin: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Total Capital Intake Valuation:</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#0284c7' }}>
            ₹{totalInvested.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Table Content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px' }}>
          <table className="custom-table" style={{ fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ width: '40px' }}>#</th>
                <th>Device Code</th>
                <th>Brand & Model</th>
                <th>Intake Date</th>
                <th>Paid Amount</th>
                <th>Paid By (Super Admin)</th>
                <th>Current Status</th>
                <th>Photo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading intake history log...</td></tr>
              ) : filteredHistory.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No intake records match the selected filters.</td></tr>
              ) : (
                filteredHistory.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>{item.device_code}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0284c7' }}>{item.brand} {item.model}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{item.storage}GB RAM: {item.ram}GB • {item.colour}</div>
                    </td>
                    <td>{item.date}</td>
                    <td style={{ fontWeight: 800, color: '#059669' }}>
                      <CurrencyAmount amount={item.paid_amount} />
                    </td>
                    <td style={{ fontWeight: 700, color: '#475569' }}>{item.paid_by}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.model} 
                          onClick={() => setExpandedImage(item.image_url)}
                          title="Click to zoom image"
                          style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', cursor: 'zoom-in', border: '1px solid #cbd5e1' }}
                        />
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>No photo</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 24px' }}>Close</button>
        </div>

        {/* Lightbox Modal for Photo Zoom */}
        {expandedImage && (
          <div className="modal-overlay" onClick={() => setExpandedImage(null)} style={{ zIndex: 9999, background: 'rgba(0,0,0,0.85)', cursor: 'zoom-out', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setExpandedImage(null)}
                style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={28} />
              </button>
              <img 
                src={expandedImage} 
                alt="Expanded Preview" 
                style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', border: '2px solid #ffffff' }} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

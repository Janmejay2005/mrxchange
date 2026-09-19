import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Layers, 
  HardDrive, 
  Cpu, 
  Download,
  FileText,
  ShoppingCart,
  ShieldAlert,
  X
} from 'lucide-react';
import { deviceService, statsService, saleService } from '../services/api';
import { KPICard, CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NewInHandStock() {
  const { isSuperAdmin } = useAuth();
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');

  // Sell Modal State
  const [sellModal, setSellModal] = useState({
    isOpen: false,
    device: null,
    sellingPrice: '',
    customerName: '',
    customerPhone: '',
    paymentMethod: 'UPI',
    paymentType: 'COMPLETE',
    soldBy: 'Admin23'
  });

  // Guard: Superadmin only
  if (!isSuperAdmin) {
    return <Navigate to="/old-in-hand" replace />;
  }

  const fetchNewInHandStock = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevices({
        status: 'NEW_IN_HAND',
        q: localSearch || globalSearch || '',
        brand: selectedBrand,
        from: selectedDate || '',
        to: selectedDate || ''
      });
      setDevices(res.data || []);

      const statsRes = await statsService.getInHandStats({ type: 'NEW_IN_HAND' });
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setDevices([
        { id: '11', device_code: 'MRX-00011', brand: 'Apple', model: 'iPhone 14 Pro', storage: 256, ram: 6, colour: 'Space Black', purchase_amount: 58000, paid_by: 'Jeet', intake_date: '2026-09-18', status: 'NEW_IN_HAND', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
        { id: '12', device_code: 'MRX-00012', brand: 'Samsung', model: 'Galaxy S23 Ultra', storage: 512, ram: 12, colour: 'Green', purchase_amount: 52000, paid_by: 'Sunal', intake_date: '2026-09-17', status: 'NEW_IN_HAND', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' },
        { id: '13', device_code: 'MRX-00013', brand: 'Google', model: 'Pixel 7 Pro', storage: 128, ram: 12, colour: 'Obsidian', purchase_amount: 34000, paid_by: 'Jeet', intake_date: '2026-09-17', status: 'NEW_IN_HAND', image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100' },
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewInHandStock();
  }, [localSearch, globalSearch, selectedBrand, selectedDate]);

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    try {
      await saleService.createSale({
        device_id: sellModal.device.id,
        selling_price: parseFloat(sellModal.sellingPrice),
        customer_name: sellModal.customerName,
        customer_phone: sellModal.customerPhone,
        payment_method: sellModal.paymentMethod,
        payment_type: sellModal.paymentType,
        sold_by: sellModal.soldBy
      });
      alert('Sale recorded and credited in Central Ledger!');
      setSellModal({ ...sellModal, isOpen: false });
      fetchNewInHandStock();
    } catch (err) {
      alert(err.message || 'Failed to record sale');
    }
  };

  const handleExportCsv = () => {
    const url = statsService.getCsvExportUrl('inventory', { status: 'NEW_IN_HAND' });
    window.open(url, '_blank');
  };

  const handleExportPdf = () => {
    const url = statsService.getPdfExportUrl('inventory', { status: 'NEW_IN_HAND' });
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* Header with Superadmin badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>New In-hand Stock</h1>
            <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
              Superadmin Only
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Fresh arrivals routed from intake • Distinct from Old In-hand • {selectedDate ? `Date: ${selectedDate}` : 'All Fresh Stock'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCsv} className="btn-secondary" title="Export CSV">
            <Download size={15} color="#0284c7" /> CSV
          </button>
          <button onClick={handleExportPdf} className="btn-secondary" title="Export PDF">
            <FileText size={15} color="#dc2626" /> PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard 
          title="Fresh In-hand Units" 
          value={stats?.total_in_hand || devices.length} 
          icon={Sparkles}
          iconBg="#f5f3ff"
          iconColor="#7c3aed"
        />
        <KPICard 
          title="Unique Models" 
          value={stats?.unique_models || '3'} 
          icon={Layers}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <KPICard 
          title="Total Storage (GB)" 
          value={stats?.total_storage?.toLocaleString() || '896'} 
          icon={HardDrive}
          iconBg="#e0f2fe"
          iconColor="#0284c7"
        />
        <KPICard 
          title="Total RAM (GB)" 
          value={stats?.total_ram?.toLocaleString() || '30'} 
          icon={Cpu}
          iconBg="#ffedd5"
          iconColor="#ea580c"
        />
      </div>

      {/* Filter toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ width: '280px' }}>
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search fresh in-hand devices..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        <select 
          className="form-control" 
          style={{ width: '180px' }}
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
        >
          <option value="All Brands">All Brands</option>
          <option value="Apple">Apple</option>
          <option value="Samsung">Samsung</option>
          <option value="Google">Google</option>
          <option value="OnePlus">OnePlus</option>
        </select>
      </div>

      {/* Table: Brand, Model, Storage, RAM, Color Name, Purchase Price, Purchased By, Date Added, Action (Sell) */}
      {/* IMEI is omitted per PRD */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Storage</th>
              <th>RAM</th>
              <th>Color Name</th>
              <th>Purchase Price</th>
              <th>Purchased By</th>
              <th>Date Added</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading fresh stock...
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No New In-hand devices found.
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.images && d.images.length > 1 ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <img 
                          src={d.images[0]} 
                          alt="Front" 
                          className="device-thumb" 
                          title="Front View"
                        />
                        <img 
                          src={d.images[1]} 
                          alt="Back" 
                          className="device-thumb" 
                          title="Back View"
                        />
                      </div>
                    ) : (
                      <img 
                        src={d.image_url || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'} 
                        alt={d.model} 
                        className="device-thumb" 
                      />
                    )}
                  </td>

                  <td style={{ fontWeight: 700 }}>{d.brand}</td>
                  <td>{d.model}</td>
                  <td>{d.storage} GB</td>
                  <td>{d.ram} GB</td>
                  <td><span style={{ fontWeight: 600 }}>{d.colour}</span></td>
                  <td><CurrencyAmount amount={d.purchase_amount} /></td>
                  <td><span style={{ color: '#7c3aed', fontWeight: 600 }}>{d.paid_by || 'Jeet'}</span></td>
                  <td>{d.intake_date ? String(d.intake_date).slice(0, 10) : 'Today'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setSellModal({
                        isOpen: true,
                        device: d,
                        sellingPrice: '',
                        customerName: '',
                        customerPhone: '',
                        paymentMethod: 'UPI',
                        paymentType: 'COMPLETE',
                        soldBy: 'Admin23'
                      })}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px', background: '#059669' }}
                    >
                      <ShoppingCart size={13} /> Sell
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sell Modal */}
      {sellModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                Sell Fresh {sellModal.device?.brand} {sellModal.device?.model}
              </h3>
              <button onClick={() => setSellModal({ ...sellModal, isOpen: false })}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSellSubmit}>
              <div className="modal-body">
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  <div><strong>Purchase Price:</strong> ₹{parseFloat(sellModal.device?.purchase_amount || 0).toLocaleString('en-IN')}</div>
                  <div><strong>Purchased By:</strong> {sellModal.device?.paid_by}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Selling Price (₹ INR) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter selling price"
                    value={sellModal.sellingPrice}
                    onChange={(e) => setSellModal({ ...sellModal, sellingPrice: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Customer name"
                      value={sellModal.customerName}
                      onChange={(e) => setSellModal({ ...sellModal, customerName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="10-digit number"
                      value={sellModal.customerPhone}
                      onChange={(e) => setSellModal({ ...sellModal, customerPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-control"
                      value={sellModal.paymentMethod}
                      onChange={(e) => setSellModal({ ...sellModal, paymentMethod: e.target.value })}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Credit/Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Type</label>
                    <select
                      className="form-control"
                      value={sellModal.paymentType}
                      onChange={(e) => setSellModal({ ...sellModal, paymentType: e.target.value })}
                    >
                      <option value="COMPLETE">Complete Payment</option>
                      <option value="INSTALLMENT">Installment</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setSellModal({ ...sellModal, isOpen: false })} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
                  Complete Sale & Record in Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

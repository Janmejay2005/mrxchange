import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Search, 
  Layers, 
  HardDrive, 
  Cpu, 
  Download,
  FileText,
  ShoppingCart,
  Tag
} from 'lucide-react';
import { deviceService, statsService, saleService } from '../services/api';
import { KPICard, CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';

export default function OldInHandStock() {
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
    soldBy: 'Rohit'
  });

  const fetchOldInHandStock = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevices({
        status: 'OLD_IN_HAND',
        q: localSearch || globalSearch || '',
        brand: selectedBrand,
        from: selectedDate || '',
        to: selectedDate || ''
      });
      const dataList = Array.isArray(res) ? res : (res?.data || []);
      const cancelledItems = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      setDevices([...cancelledItems, ...dataList]);

      const statsRes = await statsService.getInHandStats({ type: 'OLD_IN_HAND' });
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      const cancelledItems = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      const fallback = [
        { id: '1', device_code: 'MRX-00001', brand: 'Apple', model: 'iPhone 13', storage: 128, ram: 4, colour: 'Midnight', purchase_amount: 32000, paid_by: 'Rohit', intake_date: '2026-09-15', status: 'OLD_IN_HAND', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
        { id: '2', device_code: 'MRX-00002', brand: 'Samsung', model: 'Galaxy S22', storage: 256, ram: 8, colour: 'Phantom Black', purchase_amount: 28000, paid_by: 'Aadarsh', intake_date: '2026-09-14', status: 'OLD_IN_HAND', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' },
        { id: '3', device_code: 'MRX-00003', brand: 'Apple', model: 'iPhone 12', storage: 64, ram: 4, colour: 'White', purchase_amount: 18000, paid_by: 'Neha', intake_date: '2026-09-14', status: 'OLD_IN_HAND', image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=100' },
        { id: '4', device_code: 'MRX-00004', brand: 'OnePlus', model: 'OnePlus 10R', storage: 128, ram: 8, colour: 'Sierra Black', purchase_amount: 20000, paid_by: 'Rohit', intake_date: '2026-09-13', status: 'OLD_IN_HAND', image_url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=100' },
      ];
      setDevices([...cancelledItems, ...fallback]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOldInHandStock();
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
      alert('Sale transaction recorded successfully!');
      setSellModal({ ...sellModal, isOpen: false });
      fetchOldInHandStock();
    } catch (err) {
      alert(err.message || 'Failed to record sale');
    }
  };

  const handleExportCsv = () => {
    const url = statsService.getCsvExportUrl('inventory', { status: 'OLD_IN_HAND' });
    window.open(url, '_blank');
  };

  const handleExportPdf = () => {
    const url = statsService.getPdfExportUrl('inventory', { status: 'OLD_IN_HAND' });
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Old In-hand Stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Pre-existing / acquired mobile devices ready for customer sale • {selectedDate ? `Date: ${selectedDate}` : 'All Stock'}
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
          title="Old In-hand Units" 
          value={stats?.total_in_hand || devices.length} 
          icon={Smartphone}
          iconBg="#e0f2fe"
          iconColor="#0284c7"
        />
        <KPICard 
          title="Unique Models" 
          value={stats?.unique_models || '14'} 
          icon={Layers}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <KPICard 
          title="Total Storage (GB)" 
          value={stats?.total_storage?.toLocaleString() || '1,840'} 
          icon={HardDrive}
          iconBg="#f3e8ff"
          iconColor="#9333ea"
        />
        <KPICard 
          title="Total RAM (GB)" 
          value={stats?.total_ram?.toLocaleString() || '320'} 
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
            placeholder="Search old in-hand devices..." 
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
          <option value="OnePlus">OnePlus</option>
          <option value="Xiaomi">Xiaomi</option>
        </select>
      </div>

      {/* Table: Brand, Model, Storage, RAM, Color Name, Paid Amount, Purchased By, Date Added, Action (Sell) */}
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
                  Loading stock...
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No Old In-hand devices available.
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
                  <td><span style={{ color: '#0284c7', fontWeight: 600 }}>{d.paid_by || 'Rohit'}</span></td>
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
                        soldBy: 'Rohit'
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
                Sell {sellModal.device?.brand} {sellModal.device?.model}
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

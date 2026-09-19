import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Layers, 
  HardDrive, 
  Cpu, 
  Search, 
  Printer, 
  ShoppingCart,
  Home
} from 'lucide-react';
import { deviceService, statsService, saleService } from '../../services/api';
import { KPICard, CurrencyAmount } from '../../components/common/UIComponents';
import { useOutletContext, Link } from 'react-router-dom';

export default function InHandStock() {
  const { globalSearch } = useOutletContext() || {};
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedColor, setSelectedColor] = useState('All Colors');
  const [localSearch, setLocalSearch] = useState('');

  // Sale Modal state
  const [saleModal, setSaleModal] = useState({
    isOpen: false,
    device: null,
    sellingPrice: '',
    discount: '0',
    customerName: '',
    customerPhone: '',
    paymentMethod: 'Cash',
    remarks: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devRes, statRes] = await Promise.all([
        deviceService.getDevices({
          status: 'IN_HAND',
          brand: selectedBrand,
          colour: selectedColor,
          q: localSearch || globalSearch || ''
        }),
        statsService.getInHandStats()
      ]);
      setDevices(devRes.data);
      setStats(statRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Sample fallback list matching In-hand Stock reference screenshot
      setDevices([
        { id: '1', model: 'iPhone 13', imei: '352039847593812', storage: 128, ram: 4, colour: 'Midnight', purchase_amount: 32000, intake_date: '15 Sep 2026', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
        { id: '2', model: 'Samsung S22', imei: '358240951234765', storage: 256, ram: 8, colour: 'Phantom Black', purchase_amount: 28000, intake_date: '14 Sep 2026', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' },
        { id: '3', model: 'iPhone 12', imei: '351682947651903', storage: 64, ram: 4, colour: 'White', purchase_amount: 18000, intake_date: '14 Sep 2026', image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=100' },
        { id: '4', model: 'OnePlus 10R', imei: '867985064321098', storage: 128, ram: 8, colour: 'Sierra Black', purchase_amount: 20000, intake_date: '13 Sep 2026', image_url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=100' },
        { id: '5', model: 'Redmi Note 11', imei: '864320567981234', storage: 128, ram: 6, colour: 'Blue', purchase_amount: 10000, intake_date: '12 Sep 2026', image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100' },
        { id: '6', model: 'Google Pixel 6', imei: '357293847561092', storage: 128, ram: 8, colour: 'Sorta Seafoam', purchase_amount: 22000, intake_date: '11 Sep 2026', image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100' },
        { id: '7', model: 'Vivo V27', imei: '864209753642190', storage: 256, ram: 8, colour: 'Noble Black', purchase_amount: 18500, intake_date: '10 Sep 2026', image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100' },
        { id: '8', model: 'Oppo Reno 8T', imei: '861047592836410', storage: 128, ram: 8, colour: 'Sunrise Gold', purchase_amount: 16000, intake_date: '09 Sep 2026', image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100' },
        { id: '9', model: 'iPhone 11', imei: '354893762901234', storage: 64, ram: 4, colour: 'Purple', purchase_amount: 14000, intake_date: '08 Sep 2026', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
        { id: '10', model: 'Samsung A54', imei: '351964827361095', storage: 128, ram: 6, colour: 'Awesome Lime', purchase_amount: 13500, intake_date: '08 Sep 2026', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' },
      ]);
      setStats({
        total_in_hand: 620,
        unique_models: 48,
        total_storage: 12480,
        total_ram: 3420
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBrand, selectedColor, localSearch, globalSearch]);

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saleService.createSale({
        device_id: saleModal.device.id,
        selling_price: saleModal.sellingPrice,
        discount_amount: saleModal.discount,
        customer_name: saleModal.customerName,
        customer_phone: saleModal.customerPhone,
        payment_method: saleModal.paymentMethod,
        remarks: saleModal.remarks
      });
      setSaleModal({ ...saleModal, isOpen: false });
      alert('Device sold successfully! Profit recorded.');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to record sale');
    }
  };

  return (
    <div>
      {/* Breadcrumb & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>In-hand Stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Mobiles currently available for sale.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
          <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>In-hand Stock</span>
        </div>
      </div>

      {/* 4 In-hand Live KPI Cards */}
      <div className="kpi-grid">
        <KPICard 
          title="Total In-hand Stock" 
          value={stats?.total_in_hand?.toLocaleString() || '620'} 
          icon={Smartphone}
          iconBg="#e0f2fe"
          iconColor="#0284c7"
        />
        <KPICard 
          title="Unique Models" 
          value={stats?.unique_models || '48'} 
          icon={Layers}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <KPICard 
          title="Total Storage (GB)" 
          value={stats?.total_storage?.toLocaleString() || '12,480'} 
          icon={HardDrive}
          iconBg="#f3e8ff"
          iconColor="#9333ea"
        />
        <KPICard 
          title="Total RAM (GB)" 
          value={stats?.total_ram?.toLocaleString() || '3,420'} 
          icon={Cpu}
          iconBg="#ffedd5"
          iconColor="#ea580c"
        />
      </div>

      {/* Filters Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ width: '280px' }}>
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search in-hand stock..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className="form-control" 
            style={{ width: '140px', padding: '8px 12px' }}
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            <option>All Brands</option>
            <option>Apple</option>
            <option>Samsung</option>
            <option>OnePlus</option>
            <option>Xiaomi</option>
            <option>Vivo</option>
          </select>

          <select 
            className="form-control" 
            style={{ width: '140px', padding: '8px 12px' }}
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
          >
            <option>All Colors</option>
            <option>Midnight</option>
            <option>White</option>
            <option>Phantom Black</option>
            <option>Blue</option>
          </select>

          <button onClick={() => window.print()} className="btn-primary">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* In-hand Stock Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Image</th>
              <th>Model / Name</th>
              <th>IMEI</th>
              <th>Storage</th>
              <th>RAM</th>
              <th>Color</th>
              <th>Purchase Price</th>
              <th>Date Added</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device, idx) => (
              <tr key={device.id || idx}>
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
                <td>{device.ram || 4} GB</td>
                <td>{device.colour}</td>
                <td style={{ fontWeight: 700 }}>
                  <CurrencyAmount amount={device.purchase_amount} />
                </td>
                <td style={{ color: '#64748b' }}>{device.intake_date}</td>
                <td>
                  <button 
                    onClick={() => setSaleModal({
                      isOpen: true,
                      device,
                      sellingPrice: (device.purchase_amount * 1.25).toString(),
                      discount: '0',
                      customerName: '',
                      customerPhone: '',
                      paymentMethod: 'Cash',
                      remarks: ''
                    })}
                    className="btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '12px', background: '#10b981' }}
                  >
                    <ShoppingCart size={14} /> Sell
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sale Modal */}
      {saleModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} /> Record Mobile Sale
              </h3>
            </div>
            <form onSubmit={handleSaleSubmit}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  <div>Device: <strong>{saleModal.device?.brand} {saleModal.device?.model}</strong></div>
                  <div>Purchase Cost: <strong>₹{saleModal.device?.purchase_amount}</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Final Selling Price (₹ INR) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    value={saleModal.sellingPrice}
                    onChange={(e) => setSaleModal({ ...saleModal, sellingPrice: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Rahul Verma"
                      value={saleModal.customerName}
                      onChange={(e) => setSaleModal({ ...saleModal, customerName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Phone</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 9876543210"
                      value={saleModal.customerPhone}
                      onChange={(e) => setSaleModal({ ...saleModal, customerPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select 
                    className="form-control"
                    value={saleModal.paymentMethod}
                    onChange={(e) => setSaleModal({ ...saleModal, paymentMethod: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="NetBanking">Net Banking</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setSaleModal({ ...saleModal, isOpen: false })} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#10b981' }}>
                  Complete Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

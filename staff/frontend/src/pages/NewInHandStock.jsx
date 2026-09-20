import React, { useState } from 'react';
import { Package, Plus, Home, Search } from 'lucide-react';
import { CurrencyAmount } from '../components/common/UIComponents';

export default function NewInHandStock() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [brand, setBrand] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [stock, setStock] = useState([
    { sno: 1, date: '08/09/2026', brand: 'Oppo', model: 'A57', storage: 128, ram: 8, color: 'Red', purchasedBy: 'Jeet', amount: 12000, procedure: 'Sell' },
    { sno: 2, date: '08/09/2026', brand: 'Samsung', model: 'S23', storage: 256, ram: 12, color: 'Black', purchasedBy: 'Sonal', amount: 32000, procedure: 'Sell' },
    { sno: 3, date: '09/09/2026', brand: 'OnePlus', model: 'Nord 3', storage: 128, ram: 8, color: 'Blue', purchasedBy: 'Rohit', amount: 25000, procedure: 'Hold' },
    { sno: 4, date: '09/09/2026', brand: 'Apple', model: 'iPhone 14', storage: 128, ram: 6, color: 'White', purchasedBy: 'Neha', amount: 48000, procedure: 'Sell' },
    { sno: 5, date: '10/09/2026', brand: 'Vivo', model: 'V27', storage: 128, ram: 8, color: 'Green', purchasedBy: 'Aman', amount: 28000, procedure: 'Sell' },
    { sno: 6, date: '10/09/2026', brand: 'Realme', model: '11 Pro', storage: 256, ram: 12, color: 'Gray', purchasedBy: 'Karan', amount: 24000, procedure: 'Check' },
    { sno: 7, date: '11/09/2026', brand: 'Xiaomi', model: 'Redmi Note 12', storage: 128, ram: 6, color: 'Black', purchasedBy: 'Rohit', amount: 18500, procedure: 'Sell' },
    { sno: 8, date: '11/09/2026', brand: 'Nothing', model: 'Phone (1)', storage: 128, ram: 8, color: 'White', purchasedBy: 'Sonal', amount: 27000, procedure: 'Sell' },
    { sno: 9, date: '12/09/2026', brand: 'Motorola', model: 'Edge 40', storage: 256, ram: 12, color: 'Blue', purchasedBy: 'Jeet', amount: 31000, procedure: 'Hold' },
    { sno: 10, date: '12/09/2026', brand: 'iQOO', model: 'Neo 7', storage: 128, ram: 8, color: 'Black', purchasedBy: 'Neha', amount: 26500, procedure: 'Sell' }
  ]);

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>New In-hand Stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>List of newly purchased mobiles currently in hand.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>New In-hand Stock</span>
          </div>
          <button className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
            <Plus size={16} /> Add Stock
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>From Date</label>
          <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '160px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>To Date</label>
          <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '160px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Brand</label>
          <select className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
            <option>All</option>
            <option>Oppo</option>
            <option>Samsung</option>
            <option>OnePlus</option>
            <option>Apple</option>
            <option>Vivo</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '220px', marginTop: '18px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by model, IMEI, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={() => { setFromDate(''); setToDate(''); setBrand('All'); setSearchQuery(''); }} className="btn-secondary">Clear</button>
          <button className="btn-primary">Apply</button>
        </div>
      </div>

      {/* New In-hand Stock Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Sno</th>
              <th>Date</th>
              <th>Brand Name</th>
              <th>Model</th>
              <th>Storage (GB)</th>
              <th>RAM (GB)</th>
              <th>Color</th>
              <th>Purchased By</th>
              <th>Purchased Amount (₹)</th>
              <th>Further Procedure</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item) => (
              <tr key={item.sno}>
                <td>{item.sno}</td>
                <td>{item.date}</td>
                <td style={{ fontWeight: 600 }}>{item.brand}</td>
                <td style={{ fontWeight: 700 }}>{item.model}</td>
                <td>{item.storage}</td>
                <td>{item.ram}</td>
                <td>{item.color}</td>
                <td>{item.purchasedBy}</td>
                <td style={{ fontWeight: 700 }}>
                  <CurrencyAmount amount={item.amount} />
                </td>
                <td>
                  <span style={{ 
                    fontWeight: 600, 
                    color: item.procedure === 'Sell' ? '#0284c7' : item.procedure === 'Hold' ? '#d97706' : '#64748b' 
                  }}>
                    {item.procedure}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button className="btn-primary" style={{ padding: '4px 14px', fontSize: '12px', borderRadius: '6px' }}>
                      Sell
                    </button>
                    <button className="btn-secondary" style={{ padding: '4px 8px', borderRadius: '6px' }}>...</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

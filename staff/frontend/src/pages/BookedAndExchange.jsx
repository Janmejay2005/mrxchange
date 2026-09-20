import React, { useState } from 'react';
import { RefreshCw, Plus, Home, Search, X } from 'lucide-react';
import { CurrencyAmount } from '../components/common/UIComponents';

export default function BookedAndExchange() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [purchasedBy, setPurchasedBy] = useState('All');
  const [mobileBrand, setMobileBrand] = useState('All');

  // Book Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    customerName: '',
    purchasedAmount: '',
    via: 'Cash',
    payBy: 'Staff',
    platform: 'Offline',
    accountId: '',
    newBrand: 'Apple',
    newModel: 'iPhone 15',
    storage: '128',
    ram: '6',
    color: 'Black',
    oldDeviceId: '',
    totalExchangeCost: 0,
    actualCost: 0
  });

  const [exchanges, setExchanges] = useState([
    { id: 1, date: '15 Sep 2026', newBrand: 'Apple', newModel: 'iPhone 15', newStorage: 128, newRam: 6, newColor: 'Black', newPurchasedBy: 'Rohit', newAmount: 65000, oldBrand: 'Samsung', oldModel: 'S22', oldStorage: 128, oldRam: 8, oldColor: 'White', oldPurchasedBy: 'Rohit', oldAmount: 28000 },
    { id: 2, date: '14 Sep 2026', newBrand: 'Samsung', newModel: 'S24', newStorage: 256, newRam: 12, newColor: 'Gray', newPurchasedBy: 'Neha', newAmount: 72000, oldBrand: 'OnePlus', oldModel: '9R', oldStorage: 128, oldRam: 8, oldColor: 'Blue', oldPurchasedBy: 'Neha', oldAmount: 18000 },
    { id: 3, date: '13 Sep 2026', newBrand: 'OnePlus', newModel: '11', newStorage: 256, newRam: 12, newColor: 'Green', newPurchasedBy: 'Aman', newAmount: 61000, oldBrand: 'Redmi', oldModel: 'Note 10', oldStorage: 64, oldRam: 6, oldColor: 'Gray', oldPurchasedBy: 'Aman', oldAmount: 9500 },
    { id: 4, date: '12 Sep 2026', newBrand: 'Vivo', newModel: 'V27', newStorage: 128, newRam: 8, newColor: 'Blue', newPurchasedBy: 'Karan', newAmount: 42000, oldBrand: 'Vivo', oldModel: 'V21', oldStorage: 128, oldRam: 8, oldColor: 'Blue', oldPurchasedBy: 'Karan', oldAmount: 14000 },
    { id: 5, date: '11 Sep 2026', newBrand: 'Oppo', newModel: 'Find X5', newStorage: 256, newRam: 12, newColor: 'Black', newPurchasedBy: 'Rohit', newAmount: 68000, oldBrand: 'iPhone', oldModel: '11', oldStorage: 64, oldRam: 4, oldColor: 'Black', oldPurchasedBy: 'Rohit', oldAmount: 21000 },
    { id: 6, date: '10 Sep 2026', newBrand: 'Realme', newModel: '11 Pro', newStorage: 128, newRam: 8, newColor: 'Yellow', newPurchasedBy: 'Neha', newAmount: 29000, oldBrand: 'Realme', oldModel: '8', oldStorage: 128, oldRam: 6, oldColor: 'Blue', oldPurchasedBy: 'Neha', oldAmount: 10500 },
    { id: 7, date: '09 Sep 2026', newBrand: 'Apple', newModel: 'iPhone 14', newStorage: 128, newRam: 6, newColor: 'Purple', newPurchasedBy: 'Aman', newAmount: 58000, oldBrand: 'Samsung', oldModel: 'A52', oldStorage: 128, oldRam: 8, oldColor: 'Black', oldPurchasedBy: 'Aman', oldAmount: 16000 },
    { id: 8, date: '08 Sep 2026', newBrand: 'Samsung', newModel: 'S23', newStorage: 256, newRam: 12, newColor: 'White', newPurchasedBy: 'Karan', newAmount: 70000, oldBrand: 'Nothing', oldModel: 'Phone (1)', oldStorage: 128, oldRam: 8, oldColor: 'Black', oldPurchasedBy: 'Karan', oldAmount: 13000 },
    { id: 9, date: '07 Sep 2026', newBrand: 'OnePlus', newModel: 'Nord 3', newStorage: 128, newRam: 8, newColor: 'Green', newPurchasedBy: 'Rohit', newAmount: 33000, oldBrand: 'OnePlus', oldModel: '9R', oldStorage: 128, oldRam: 8, oldColor: 'Blue', oldPurchasedBy: 'Rohit', oldAmount: 15000 },
    { id: 10, date: '06 Sep 2026', newBrand: 'Vivo', newModel: 'T2 Pro', newStorage: 128, newRam: 8, newColor: 'Silver', newPurchasedBy: 'Neha', newAmount: 27000, oldBrand: 'Redmi', oldModel: 'Note 10', oldStorage: 64, oldRam: 6, oldColor: 'Gray', oldPurchasedBy: 'Neha', oldAmount: 8500 }
  ]);

  const handleBookSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: exchanges.length + 1,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      newBrand: bookForm.newBrand,
      newModel: bookForm.newModel,
      newStorage: bookForm.storage,
      newRam: bookForm.ram,
      newColor: bookForm.color,
      newPurchasedBy: bookForm.customerName || 'Customer',
      newAmount: Number(bookForm.purchasedAmount) || 50000,
      oldBrand: 'Samsung',
      oldModel: 'S21',
      oldStorage: 128,
      oldRam: 8,
      oldColor: 'Black',
      oldPurchasedBy: 'Staff',
      oldAmount: 18000
    };
    setExchanges([newEntry, ...exchanges]);
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Booked and Exchange</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>List of booked mobiles and exchanged devices.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Booked and Exchange</span>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
            <Plus size={16} /> Book
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
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Purchased By</label>
          <select className="form-control" value={purchasedBy} onChange={(e) => setPurchasedBy(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
            <option>All</option>
            <option>Rohit</option>
            <option>Neha</option>
            <option>Aman</option>
            <option>Karan</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Mobile Brand</label>
          <select className="form-control" value={mobileBrand} onChange={(e) => setMobileBrand(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
            <option>All</option>
            <option>Apple</option>
            <option>Samsung</option>
            <option>OnePlus</option>
            <option>Vivo</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={() => { setFromDate(''); setToDate(''); setPurchasedBy('All'); setMobileBrand('All'); }} className="btn-secondary">Clear</button>
          <button className="btn-primary">Apply</button>
        </div>
      </div>

      {/* Dual Grouped Header Table */}
      <div className="table-responsive">
        <table className="custom-table" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th rowSpan="2" style={{ width: '40px' }}>#</th>
              <th rowSpan="2">Date</th>
              <th colSpan="7" style={{ textAlign: 'center', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>New Mobile</th>
              <th colSpan="7" style={{ textAlign: 'center', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 800 }}>Old Mobile</th>
              <th rowSpan="2">Action</th>
            </tr>
            <tr>
              {/* New Mobile Subheaders */}
              <th style={{ backgroundColor: '#e0f2fe' }}>Brand Name</th>
              <th style={{ backgroundColor: '#e0f2fe' }}>Model</th>
              <th style={{ backgroundColor: '#e0f2fe' }}>Storage (GB)</th>
              <th style={{ backgroundColor: '#e0f2fe' }}>RAM (GB)</th>
              <th style={{ backgroundColor: '#e0f2fe' }}>Color</th>
              <th style={{ backgroundColor: '#e0f2fe' }}>Purchased By</th>
              <th style={{ backgroundColor: '#e0f2fe' }}>Purchased Amount</th>

              {/* Old Mobile Subheaders */}
              <th style={{ backgroundColor: '#f1f5f9' }}>Brand Name</th>
              <th style={{ backgroundColor: '#f1f5f9' }}>Model</th>
              <th style={{ backgroundColor: '#f1f5f9' }}>Storage (GB)</th>
              <th style={{ backgroundColor: '#f1f5f9' }}>RAM (GB)</th>
              <th style={{ backgroundColor: '#f1f5f9' }}>Color</th>
              <th style={{ backgroundColor: '#f1f5f9' }}>Purchased By</th>
              <th style={{ backgroundColor: '#f1f5f9' }}>Purchased Amount</th>
            </tr>
          </thead>
          <tbody>
            {exchanges.map((row, idx) => (
              <tr key={row.id}>
                <td>{idx + 1}</td>
                <td>{row.date}</td>

                {/* New Mobile Cells */}
                <td style={{ fontWeight: 600 }}>{row.newBrand}</td>
                <td style={{ fontWeight: 700 }}>{row.newModel}</td>
                <td>{row.newStorage}</td>
                <td>{row.newRam}</td>
                <td>{row.newColor}</td>
                <td>{row.newPurchasedBy}</td>
                <td style={{ fontWeight: 700 }}>
                  <CurrencyAmount amount={row.newAmount} />
                </td>

                {/* Old Mobile Cells */}
                <td style={{ fontWeight: 600, color: '#475569' }}>{row.oldBrand}</td>
                <td style={{ fontWeight: 700, color: '#475569' }}>{row.oldModel}</td>
                <td>{row.oldStorage}</td>
                <td>{row.oldRam}</td>
                <td>{row.oldColor}</td>
                <td>{row.oldPurchasedBy}</td>
                <td style={{ fontWeight: 700 }}>
                  <CurrencyAmount amount={row.oldAmount} />
                </td>

                <td>
                  <button className="btn-secondary" style={{ padding: '4px 8px' }}>...</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Book a Mobile Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>Book a Mobile</h2>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Enter the details to book a mobile for exchange.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleBookSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Purchased by (New Phone) *</label>
                  <input type="text" className="form-control" placeholder="Enter customer name" value={bookForm.customerName} onChange={(e) => setBookForm({ ...bookForm, customerName: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Purchased Amount (New Phone) *</label>
                  <input type="number" className="form-control" placeholder="₹ Enter amount" value={bookForm.purchasedAmount} onChange={(e) => setBookForm({ ...bookForm, purchasedAmount: e.target.value })} required />
                </div>

                <div>
                  <label className="form-label">Via *</label>
                  <select className="form-control" value={bookForm.via} onChange={(e) => setBookForm({ ...bookForm, via: e.target.value })}>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Pay By *</label>
                  <select className="form-control" value={bookForm.payBy} onChange={(e) => setBookForm({ ...bookForm, payBy: e.target.value })}>
                    <option>Staff</option>
                    <option>Rohit</option>
                    <option>Neha</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Platform *</label>
                  <select className="form-control" value={bookForm.platform} onChange={(e) => setBookForm({ ...bookForm, platform: e.target.value })}>
                    <option>Offline / Store</option>
                    <option>Website</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Account ID</label>
                  <input type="text" className="form-control" placeholder="Enter account ID / UTR" value={bookForm.accountId} onChange={(e) => setBookForm({ ...bookForm, accountId: e.target.value })} />
                </div>

                <div>
                  <label className="form-label">New Phone Brand *</label>
                  <select className="form-control" value={bookForm.newBrand} onChange={(e) => setBookForm({ ...bookForm, newBrand: e.target.value })}>
                    <option>Apple</option>
                    <option>Samsung</option>
                    <option>OnePlus</option>
                    <option>Vivo</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Storage *</label>
                  <select className="form-control" value={bookForm.storage} onChange={(e) => setBookForm({ ...bookForm, storage: e.target.value })}>
                    <option value="64">64 GB</option>
                    <option value="128">128 GB</option>
                    <option value="256">256 GB</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label className="form-label">Exchange By (Old Phone) *</label>
                <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '13px', color: '#0369a1' }}>
                  <Search size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Select a mobile from in-hand inventory to auto-fill details (brand, model, storage, color, etc.)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

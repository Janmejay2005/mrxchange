import React, { useState } from 'react';
import { CircleDollarSign, Plus, Home, ShoppingCart, X, CreditCard, CheckCircle } from 'lucide-react';
import { CurrencyAmount } from '../components/common/UIComponents';

export default function PendingAndReceivingPayments() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [personCustomer, setPersonCustomer] = useState('All');
  const [mobileBrand, setMobileBrand] = useState('All');

  // Sell Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellForm, setSellForm] = useState({
    quantity: 1,
    soldBy: 'Staff',
    soldTo: '',
    paymentType: 'INSTALLMENT', // 'INSTALLMENT' or 'COMPLETE'
    actualAmount: '',
    paidAmount: '',
    date: '2026-09-15'
  });

  const [payments, setPayments] = useState([
    { id: 1, date: '15 Sep 2026', customerName: 'Rohit', brand: 'Apple', model: 'iPhone 15', imei: '356789123456789', totalAmount: 65000, paidAmount: 50000, pendingAmount: 15000, status: 'Pending', mode: 'UPI', remarks: 'Balance next week' },
    { id: 2, date: '14 Sep 2026', customerName: 'Neha', brand: 'Samsung', model: 'S24', imei: '352671234567890', totalAmount: 72000, paidAmount: 72000, pendingAmount: 0, status: 'Received', mode: 'Cash', remarks: 'Full payment' },
    { id: 3, date: '13 Sep 2026', customerName: 'Aman', brand: 'OnePlus', model: '11', imei: '358912345678901', totalAmount: 61000, paidAmount: 30000, pendingAmount: 31000, status: 'Pending', mode: 'Card', remarks: 'Remaining later' },
    { id: 4, date: '12 Sep 2026', customerName: 'Karan', brand: 'Vivo', model: 'V27', imei: '353456789012345', totalAmount: 42000, paidAmount: 42000, pendingAmount: 0, status: 'Received', mode: 'UPI', remarks: 'Paid in full' },
    { id: 5, date: '11 Sep 2026', customerName: 'Rohit', brand: 'Oppo', model: 'Find X5', imei: '357801234567890', totalAmount: 68000, paidAmount: 20000, pendingAmount: 48000, status: 'Pending', mode: 'UPI', remarks: 'Partial payment' },
    { id: 6, date: '10 Sep 2026', customerName: 'Neha', brand: 'Realme', model: '11 Pro', imei: '359012345678901', totalAmount: 29000, paidAmount: 29000, pendingAmount: 0, status: 'Received', mode: 'Cash', remarks: 'Paid' },
    { id: 7, date: '09 Sep 2026', customerName: 'Aman', brand: 'Apple', model: 'iPhone 14', imei: '352345678901234', totalAmount: 58000, paidAmount: 10000, pendingAmount: 48000, status: 'Pending', mode: 'Card', remarks: 'Customer will pay' },
    { id: 8, date: '08 Sep 2026', customerName: 'Karan', brand: 'Samsung', model: 'S23', imei: '356901234567890', totalAmount: 70000, paidAmount: 70000, pendingAmount: 0, status: 'Received', mode: 'UPI', remarks: 'Paid' },
    { id: 9, date: '07 Sep 2026', customerName: 'Rohit', brand: 'OnePlus', model: 'Nord 3', imei: '353789012345678', totalAmount: 33000, paidAmount: 15000, pendingAmount: 18000, status: 'Pending', mode: 'Cash', remarks: 'Balance pending' },
    { id: 10, date: '06 Sep 2026', customerName: 'Neha', brand: 'Vivo', model: 'T2 Pro', imei: '358123456789012', totalAmount: 27000, paidAmount: 27000, pendingAmount: 0, status: 'Received', mode: 'UPI', remarks: 'Paid in full' }
  ]);

  const handleSellSubmit = (e) => {
    e.preventDefault();
    alert('Sale recorded successfully!');
    setIsSellModalOpen(false);
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Pending and Receiving Payments</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Track pending payments and received payments for purchased and exchanged devices.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Pending and Receiving Payments</span>
          </div>
          <button onClick={() => setIsSellModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
            <Plus size={16} /> Add Payment
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
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Payment Status</label>
          <select className="form-control" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
            <option>All</option>
            <option>Pending</option>
            <option>Received</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Person / Customer</label>
          <select className="form-control" value={personCustomer} onChange={(e) => setPersonCustomer(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
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
          <button onClick={() => { setFromDate(''); setToDate(''); setPaymentStatus('All'); setPersonCustomer('All'); setMobileBrand('All'); }} className="btn-secondary">Clear</button>
          <button className="btn-primary">Apply</button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Brand</th>
              <th>Model</th>
              <th>IMEI / Device ID</th>
              <th>Total Amount (₹)</th>
              <th>Paid Amount (₹)</th>
              <th>Pending Amount (₹)</th>
              <th>Payment Status</th>
              <th>Mode of Payment</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.date}</td>
                <td style={{ fontWeight: 600 }}>{row.customerName}</td>
                <td style={{ fontWeight: 600 }}>{row.brand}</td>
                <td style={{ fontWeight: 700 }}>{row.model}</td>
                <td style={{ color: '#0284c7', fontSize: '12px' }}>{row.imei}</td>
                <td style={{ fontWeight: 700 }}><CurrencyAmount amount={row.totalAmount} /></td>
                <td style={{ fontWeight: 700 }}><CurrencyAmount amount={row.paidAmount} /></td>
                <td style={{ fontWeight: 700, color: row.pendingAmount > 0 ? '#ea580c' : '#059669' }}>
                  <CurrencyAmount amount={row.pendingAmount} />
                </td>
                <td>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: row.status === 'Pending' ? '#fff7ed' : '#ecfdf5',
                    color: row.status === 'Pending' ? '#ea580c' : '#047857'
                  }}>
                    {row.status}
                  </span>
                </td>
                <td>{row.mode}</td>
                <td style={{ fontSize: '12px', color: '#64748b' }}>{row.remarks}</td>
                <td>
                  <button onClick={() => setIsSellModalOpen(true)} className="btn-primary" style={{ padding: '4px 14px', fontSize: '12px', borderRadius: '6px' }}>
                    Sell
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sell Mobile Modal */}
      {isSellModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Sell Mobile</h2>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Enter the details to sell this device.</p>
                </div>
              </div>
              <button onClick={() => setIsSellModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleSellSubmit}>
              {/* Quantity Counter */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Quantity</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => setSellForm({ ...sellForm, quantity: Math.max(1, sellForm.quantity - 1) })} className="btn-secondary" style={{ width: '36px', height: '36px', padding: 0 }}>-</button>
                  <input type="number" className="form-control" value={sellForm.quantity} readOnly style={{ width: '80px', textAlign: 'center', fontWeight: 700 }} />
                  <button type="button" onClick={() => setSellForm({ ...sellForm, quantity: sellForm.quantity + 1 })} className="btn-secondary" style={{ width: '36px', height: '36px', padding: 0 }}>+</button>
                </div>
              </div>

              {/* Sold by */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Sold by</label>
                <select className="form-control" value={sellForm.soldBy} onChange={(e) => setSellForm({ ...sellForm, soldBy: e.target.value })}>
                  <option>Select staff</option>
                  <option>Rohit</option>
                  <option>Neha</option>
                  <option>Aadarsh</option>
                </select>
              </div>

              {/* Sold to */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Sold to (Party name)</label>
                <input type="text" className="form-control" placeholder="Enter customer/party name" value={sellForm.soldTo} onChange={(e) => setSellForm({ ...sellForm, soldTo: e.target.value })} />
              </div>

              {/* Installment vs Complete Mode Toggle */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Installment or complete</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setSellForm({ ...sellForm, paymentType: 'INSTALLMENT' })}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: sellForm.paymentType === 'INSTALLMENT' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: sellForm.paymentType === 'INSTALLMENT' ? '#e0f2fe' : '#ffffff',
                      color: sellForm.paymentType === 'INSTALLMENT' ? '#0284c7' : '#475569',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <CreditCard size={16} /> Installment
                  </button>
                  <button
                    type="button"
                    onClick={() => setSellForm({ ...sellForm, paymentType: 'COMPLETE' })}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: sellForm.paymentType === 'COMPLETE' ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: sellForm.paymentType === 'COMPLETE' ? '#ecfdf5' : '#ffffff',
                      color: sellForm.paymentType === 'COMPLETE' ? '#059669' : '#475569',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle size={16} /> Complete
                  </button>
                </div>
              </div>

              {/* Amounts & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Actual amount</label>
                  <input type="number" className="form-control" placeholder="₹ 0" value={sellForm.actualAmount} onChange={(e) => setSellForm({ ...sellForm, actualAmount: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Paid amount</label>
                  <input type="number" className="form-control" placeholder="₹ 0" value={sellForm.paidAmount} onChange={(e) => setSellForm({ ...sellForm, paidAmount: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={sellForm.date} onChange={(e) => setSellForm({ ...sellForm, date: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsSellModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

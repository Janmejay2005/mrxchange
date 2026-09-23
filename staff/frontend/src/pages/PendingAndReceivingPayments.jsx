import React, { useState } from 'react';
import { CircleDollarSign, Plus, Home, ShoppingCart, X, CreditCard, CheckCircle, FileText } from 'lucide-react';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import PdfExportModal from '../components/common/PdfExportModal';

export default function PendingAndReceivingPayments() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [personCustomer, setPersonCustomer] = useState('All');
  const [mobileBrand, setMobileBrand] = useState('All');

  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Equate Modal State
  const [isEquateModalOpen, setIsEquateModalOpen] = useState(false);
  const [equateForm, setEquateForm] = useState({
    unitAmount: '',
    quantity: 1,
    equatedBy: 'Staff',
    equatedTo: '',
    paymentType: 'INSTALLMENT', // 'INSTALLMENT' or 'COMPLETE'
    paidAmount: '',
    date: '2026-09-15'
  });

  const [payments, setPayments] = useState([
    { id: 1, date: '15 Sep 2026', customerName: 'Jeet Patel', brand: 'Google Pixel', model: 'Pixel 8 Pro', imei: '356789123456789', totalAmount: 89000, paidAmount: 60000, pendingAmount: 29000, status: 'Pending', mode: 'UPI', remarks: 'Balance in 2 weeks' },
    { id: 2, date: '14 Sep 2026', customerName: 'Sonal Sharma', brand: 'Apple', model: 'iPhone 15 Pro Max', imei: '352671234567890', totalAmount: 132000, paidAmount: 132000, pendingAmount: 0, status: 'Received', mode: 'Cash', remarks: 'Paid in full' },
    { id: 3, date: '13 Sep 2026', customerName: 'Rohit Kumar', brand: 'Samsung', model: 'Galaxy S24 Ultra', imei: '358912345678901', totalAmount: 114000, paidAmount: 70000, pendingAmount: 44000, status: 'Pending', mode: 'Card', remarks: 'Installment 2 pending' },
    { id: 4, date: '12 Sep 2026', customerName: 'Neha Gupta', brand: 'OnePlus', model: 'OnePlus 12', imei: '353456789012345', totalAmount: 64999, paidAmount: 64999, pendingAmount: 0, status: 'Received', mode: 'UPI', remarks: 'Paid via GPay' },
    { id: 5, date: '11 Sep 2026', customerName: 'Aman Verma', brand: 'Vivo', model: 'X100 Pro', imei: '357801234567890', totalAmount: 89999, paidAmount: 50000, pendingAmount: 39999, status: 'Pending', mode: 'UPI', remarks: 'Remaining next month' },
    { id: 6, date: '10 Sep 2026', customerName: 'Karan Malhotra', brand: 'Nothing', model: 'Phone (2a)', imei: '359012345678901', totalAmount: 27999, paidAmount: 27999, pendingAmount: 0, status: 'Received', mode: 'Cash', remarks: 'Full payment' },
    { id: 7, date: '09 Sep 2026', customerName: 'Vikram Singh', brand: 'Xiaomi', model: '14 Ultra', imei: '352345678901234', totalAmount: 99999, paidAmount: 40000, pendingAmount: 59999, status: 'Pending', mode: 'Card', remarks: 'Post-dated cheque' },
    { id: 8, date: '08 Sep 2026', customerName: 'Sunal Rao', brand: 'Realme', model: 'GT 5 Pro', imei: '356901234567890', totalAmount: 42000, paidAmount: 42000, pendingAmount: 0, status: 'Received', mode: 'UPI', remarks: 'Paid' },
    { id: 9, date: '07 Sep 2026', customerName: 'Ananya Roy', brand: 'Motorola', model: 'Edge 50 Ultra', imei: '353789012345678', totalAmount: 59999, paidAmount: 30000, pendingAmount: 29999, status: 'Pending', mode: 'Cash', remarks: 'Balance due 25 Sep' }
  ]);

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

  const filteredPayments = payments.filter((item) => {
    if (paymentStatus !== 'All' && item.status !== paymentStatus) return false;
    if (personCustomer !== 'All' && !item.customerName.toLowerCase().includes(personCustomer.toLowerCase())) return false;
    if (mobileBrand !== 'All' && item.brand !== mobileBrand) return false;
    if (selectedDate) {
      const itemYMD = toYMD(item.date);
      const selYMD = toYMD(selectedDate);
      if (itemYMD && selYMD && itemYMD !== selYMD) return false;
    }
    if (fromDate) {
      const itemYMD = toYMD(item.date);
      const fYMD = toYMD(fromDate);
      if (itemYMD && fYMD && itemYMD < fYMD) return false;
    }
    if (toDate) {
      const itemYMD = toYMD(item.date);
      const tYMD = toYMD(toDate);
      if (itemYMD && tYMD && itemYMD > tYMD) return false;
    }
    const q = (globalSearch || '').trim().toLowerCase();
    if (q) {
      const matchCustomer = item.customerName.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchModel = item.model.toLowerCase().includes(q);
      if (!matchCustomer && !matchBrand && !matchModel) return false;
    }
    return true;
  });

  const handleEquateSubmit = (e) => {
    e.preventDefault();
    const calcTotal = (Number(equateForm.unitAmount) || 0) * (Number(equateForm.quantity) || 1);
    alert(`Equated successfully! Total amount: ₹ ${calcTotal.toLocaleString('en-IN')}`);
    setIsEquateModalOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['#', 'Date', 'Customer', 'Device Model', 'Total (Rs)', 'Paid (Rs)', 'Pending (Rs)', 'Status', 'Mode'];
    const rows = filteredPayments.map((item, idx) => [
      idx + 1,
      item.date,
      item.customerName,
      `${item.brand} ${item.model}`,
      `Rs. ${item.totalAmount.toLocaleString()}`,
      `Rs. ${item.paidAmount.toLocaleString()}`,
      `Rs. ${item.pendingAmount.toLocaleString()}`,
      item.status,
      item.mode
    ]);
    const totalPending = filteredPayments.reduce((sum, item) => sum + item.pendingAmount, 0);
    setExportModalConfig({
      isOpen: true,
      title: 'Payments & Receivables Report',
      headers,
      rows,
      filename: `Payments_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Pending', value: `Rs. ${totalPending.toLocaleString()}`, color: '#dc2626' }
      ]
    });
  };

  const calculatedTotalAmount = (Number(equateForm.unitAmount) || 0) * (Number(equateForm.quantity) || 1);

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
          <button onClick={handleExportPdf} className="btn-secondary" style={{ padding: '9px 16px', borderRadius: '8px' }}>
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={() => setIsEquateModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
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
            <option>Jeet</option>
            <option>Sonal</option>
            <option>Rohit</option>
            <option>Neha</option>
            <option>Aman</option>
            <option>Karan</option>
            <option>Vikram</option>
            <option>Sunal</option>
            <option>Ananya</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Mobile Brand</label>
          <select className="form-control" value={mobileBrand} onChange={(e) => setMobileBrand(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
            <option>All</option>
            <option>Google Pixel</option>
            <option>Apple</option>
            <option>Samsung</option>
            <option>OnePlus</option>
            <option>Vivo</option>
            <option>Xiaomi</option>
            <option>Nothing</option>
            <option>Realme</option>
            <option>Motorola</option>
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
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No payment records match the specified filter criteria.
                </td>
              </tr>
            ) : (
              filteredPayments.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>{row.date}</td>
                <td style={{ fontWeight: 600 }}>{row.customerName}</td>
                <td style={{ fontWeight: 600 }}>{row.brand}</td>
                <td style={{ fontWeight: 700 }}>{row.model}</td>
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
                  <button onClick={() => setIsEquateModalOpen(true)} className="btn-primary" style={{ padding: '4px 14px', fontSize: '12px', borderRadius: '6px' }}>
                    Equate
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Equate Mobile Modal */}
      {isEquateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Equate Mobile</h2>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Enter the amount and quantity to calculate total equated payment.</p>
                </div>
              </div>
              <button onClick={() => setIsEquateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleEquateSubmit}>
              {/* Amount per Unit */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Unit Amount (₹) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="e.g. 25000" 
                  value={equateForm.unitAmount} 
                  onChange={(e) => setEquateForm({ ...equateForm, unitAmount: e.target.value })} 
                  required
                />
              </div>

              {/* Quantity Counter */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Quantity *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => setEquateForm({ ...equateForm, quantity: Math.max(1, equateForm.quantity - 1) })} className="btn-secondary" style={{ width: '36px', height: '36px', padding: 0 }}>-</button>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={equateForm.quantity} 
                    onChange={(e) => setEquateForm({ ...equateForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={{ width: '80px', textAlign: 'center', fontWeight: 700 }} 
                  />
                  <button type="button" onClick={() => setEquateForm({ ...equateForm, quantity: equateForm.quantity + 1 })} className="btn-secondary" style={{ width: '36px', height: '36px', padding: 0 }}>+</button>
                </div>
              </div>

              {/* Dynamic Calculation Output (Quantity * Amount) */}
              <div style={{ background: '#f0f9ff', border: '1px solid #38bdf8', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                  Total Equated Amount (Quantity × Unit Amount)
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                  ₹ {calculatedTotalAmount.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {equateForm.quantity} unit(s) × ₹ {Number(equateForm.unitAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Equated by */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Equated by</label>
                <select className="form-control" value={equateForm.equatedBy} onChange={(e) => setEquateForm({ ...equateForm, equatedBy: e.target.value })}>
                  <option>Select staff</option>
                  <option>Jeet</option>
                  <option>Sonal</option>
                  <option>Rohit</option>
                  <option>Neha</option>
                  <option>Aman</option>
                </select>
              </div>

              {/* Equated to */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Equated to (Party / Customer Name)</label>
                <input type="text" className="form-control" placeholder="Enter customer/party name" value={equateForm.equatedTo} onChange={(e) => setEquateForm({ ...equateForm, equatedTo: e.target.value })} />
              </div>

              {/* Installment vs Complete Mode Toggle */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Payment Mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setEquateForm({ ...equateForm, paymentType: 'INSTALLMENT' })}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: equateForm.paymentType === 'INSTALLMENT' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: equateForm.paymentType === 'INSTALLMENT' ? '#e0f2fe' : '#ffffff',
                      color: equateForm.paymentType === 'INSTALLMENT' ? '#0284c7' : '#475569',
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
                    onClick={() => setEquateForm({ ...equateForm, paymentType: 'COMPLETE' })}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: equateForm.paymentType === 'COMPLETE' ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: equateForm.paymentType === 'COMPLETE' ? '#ecfdf5' : '#ffffff',
                      color: equateForm.paymentType === 'COMPLETE' ? '#059669' : '#475569',
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

              {/* Paid amount & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Paid amount</label>
                  <input type="number" className="form-control" placeholder="₹ 0" value={equateForm.paidAmount} onChange={(e) => setEquateForm({ ...equateForm, paidAmount: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" value={equateForm.date} onChange={(e) => setEquateForm({ ...equateForm, date: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsEquateModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontWeight: 800 }}>Save Equated</button>
              </div>
            </form>
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

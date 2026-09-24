import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Plus, Home, ShoppingCart, X, CreditCard, CheckCircle, Clock, FileText, ArrowUpRight } from 'lucide-react';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PdfExportModal from '../components/common/PdfExportModal';

export default function PendingAndReceivingPayments() {
  const { user } = useAuth();
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [personCustomer, setPersonCustomer] = useState(() => user?.name || 'All');
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
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isEquateModalOpen, setIsEquateModalOpen] = useState(false);
  const [equateForm, setEquateForm] = useState({
    pendingPayment: '',
    equatedBy: user?.name ? (user.name.toLowerCase().includes('jeet') ? 'Jeet' : user.name) : 'Jeet',
    customerName: '',
    orderName: '',
    paymentType: 'INSTALLMENT', // 'INSTALLMENT' or 'COMPLETE'
    newPay: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [payments, setPayments] = useState(() => {
    const stored = localStorage.getItem('mrx_pending_payments');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: 1, date: '15 Sep 2026', customerName: 'Jeet Khubchandani', orderName: 'Jeet / Ord-8891', brand: 'Google Pixel', model: 'Pixel 8 Pro', imei: '356789123456789', totalAmount: 89000, paidAmount: 60000, pendingAmount: 29000, status: 'Pending', mode: 'UPI', remarks: 'Balance in 2 weeks' },
      { id: 2, date: '14 Sep 2026', customerName: 'Sonal Wadwani', orderName: 'Sonal / Ord-9012', brand: 'Apple', model: 'iPhone 15 Pro Max', imei: '352671234567890', totalAmount: 132000, paidAmount: 132000, pendingAmount: 0, status: 'Received', mode: 'Cash', remarks: 'Paid in full' },
      { id: 3, date: '13 Sep 2026', customerName: 'Rohit Kumar', orderName: 'Rohit / Ord-4431', brand: 'Samsung', model: 'Galaxy S24 Ultra', imei: '358912345678901', totalAmount: 114000, paidAmount: 70000, pendingAmount: 44000, status: 'Pending', mode: 'Card', remarks: 'Installment 2 pending' },
      { id: 4, date: '12 Sep 2026', customerName: 'Neha Gupta', orderName: 'Neha / Ord-1029', brand: 'OnePlus', model: 'OnePlus 12', imei: '353456789012345', totalAmount: 64999, paidAmount: 64999, pendingAmount: 0, status: 'Received', mode: 'UPI', remarks: 'Paid via GPay' },
      { id: 5, date: '11 Sep 2026', customerName: 'Aman Verma', orderName: 'Aman / Ord-7720', brand: 'Vivo', model: 'X100 Pro', imei: '357801234567890', totalAmount: 89999, paidAmount: 50000, pendingAmount: 39999, status: 'Pending', mode: 'UPI', remarks: 'Remaining next month' },
      { id: 6, date: '10 Sep 2026', customerName: 'Karan Malhotra', orderName: 'Karan / Ord-3321', brand: 'Nothing', model: 'Phone (2a)', imei: '359012345678901', totalAmount: 27999, paidAmount: 27999, pendingAmount: 0, status: 'Received', mode: 'Cash', remarks: 'Full payment' },
      { id: 7, date: '09 Sep 2026', customerName: 'Vikram Singh', orderName: 'Vikram / Ord-6671', brand: 'Xiaomi', model: '14 Ultra', imei: '352345678901234', totalAmount: 99999, paidAmount: 40000, pendingAmount: 59999, status: 'Pending', mode: 'Card', remarks: 'Post-dated cheque' },
      { id: 8, date: '08 Sep 2026', customerName: 'Sunal Rao', orderName: 'Sunal / Ord-2290', brand: 'Realme', model: 'GT 5 Pro', imei: '356901234567890', totalAmount: 42000, paidAmount: 42000, pendingAmount: 0, status: 'Received', mode: 'UPI', remarks: 'Paid' },
      { id: 9, date: '07 Sep 2026', customerName: 'Ananya Roy', orderName: 'Ananya / Ord-5512', brand: 'Motorola', model: 'Edge 50 Ultra', imei: '353789012345678', totalAmount: 59999, paidAmount: 30000, pendingAmount: 29999, status: 'Pending', mode: 'Cash', remarks: 'Balance due 25 Sep' }
    ];
  });

  // Sync payments from localStorage & external update events
  useEffect(() => {
    const syncPayments = () => {
      const stored = localStorage.getItem('mrx_pending_payments');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setPayments(parsed);
        } catch (e) {}
      }
    };
    syncPayments();
    window.addEventListener('mrx_payments_updated', syncPayments);
    window.addEventListener('mrx_exchanges_updated', syncPayments);
    return () => {
      window.removeEventListener('mrx_payments_updated', syncPayments);
      window.removeEventListener('mrx_exchanges_updated', syncPayments);
    };
  }, []);

  const savePaymentsToStorage = (updatedList) => {
    setPayments(updatedList);
    try {
      localStorage.setItem('mrx_pending_payments', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mrx_payments_updated'));
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleOpenEquateModal = (row = null) => {
    setSelectedPayment(row);
    const pending = row ? row.pendingAmount : '';
    setEquateForm({
      pendingPayment: String(pending),
      equatedBy: user?.name ? (user.name.toLowerCase().includes('jeet') ? 'Jeet' : user.name) : 'Jeet',
      customerName: row ? row.customerName : '',
      orderName: row ? (row.orderName || row.newColor || '') : '',
      paymentType: row && row.pendingAmount === 0 ? 'COMPLETE' : 'INSTALLMENT',
      newPay: '',
      date: row ? (toYMD(row.date) || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
    });
    setIsEquateModalOpen(true);
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
      const matchOrder = (item.orderName || '').toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchModel = item.model.toLowerCase().includes(q);
      if (!matchCustomer && !matchOrder && !matchBrand && !matchModel) return false;
    }
    return true;
  });

  // Split into Pending and Receiving Payments
  const pendingPayments = filteredPayments.filter(p => p.status === 'Pending' || p.pendingAmount > 0);
  const receivingPayments = filteredPayments.filter(p => p.status === 'Received' || p.pendingAmount === 0);

  const totalPendingAmount = pendingPayments.reduce((sum, item) => sum + item.pendingAmount, 0);
  const totalReceivedAmount = receivingPayments.reduce((sum, item) => sum + (item.paidAmount || item.totalAmount), 0);

  const handleEquateSubmit = (e) => {
    e.preventDefault();
    const newPayAmt = Number(equateForm.newPay) || 0;
    if (selectedPayment) {
      const updated = payments.map(p => {
        if (p.id === selectedPayment.id) {
          const newPaidAmount = p.paidAmount + newPayAmt;
          const newPendingAmount = Math.max(0, p.pendingAmount - newPayAmt);
          return {
            ...p,
            customerName: equateForm.customerName || p.customerName,
            orderName: equateForm.orderName || p.orderName,
            paidAmount: newPaidAmount,
            pendingAmount: newPendingAmount,
            status: newPendingAmount === 0 ? 'Received' : 'Pending'
          };
        }
        return p;
      });
      savePaymentsToStorage(updated);
      alert(`Equated successfully for ${equateForm.customerName || selectedPayment.customerName}! New pay of ₹${newPayAmt.toLocaleString()} recorded. Equated by: ${equateForm.equatedBy}`);
    } else {
      const newRec = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        customerName: equateForm.customerName || 'Customer',
        orderName: equateForm.orderName || 'Manual Entry',
        brand: 'Other',
        model: 'Device',
        totalAmount: Number(equateForm.pendingPayment) || newPayAmt,
        paidAmount: newPayAmt,
        pendingAmount: Math.max(0, (Number(equateForm.pendingPayment) || newPayAmt) - newPayAmt),
        status: (Number(equateForm.pendingPayment) || newPayAmt) - newPayAmt === 0 ? 'Received' : 'Pending',
        mode: 'Cash',
        remarks: `Equated by ${equateForm.equatedBy}`
      };
      savePaymentsToStorage([newRec, ...payments]);
      alert(`Payment added successfully for ${equateForm.customerName || 'Customer'}! Equated by: ${equateForm.equatedBy}`);
    }
    setIsEquateModalOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['#', 'Type', 'Date', 'Customer', 'Order Name', 'Device Model', 'Total (Rs)', 'Paid (Rs)', 'Pending (Rs)', 'Status'];
    const rows = filteredPayments.map((item, idx) => [
      idx + 1,
      item.pendingAmount > 0 ? 'Pending' : 'Received',
      item.date,
      item.customerName,
      item.orderName || '-',
      `${item.brand} ${item.model}`,
      `Rs. ${item.totalAmount.toLocaleString()}`,
      `Rs. ${item.paidAmount.toLocaleString()}`,
      `Rs. ${item.pendingAmount.toLocaleString()}`,
      item.status
    ]);
    setExportModalConfig({
      isOpen: true,
      title: 'Pending and Receiving Payments Report',
      headers,
      rows,
      filename: `Payments_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Pending', value: `Rs. ${totalPendingAmount.toLocaleString()}`, color: '#ea580c' },
        { label: 'Total Received', value: `Rs. ${totalReceivedAmount.toLocaleString()}`, color: '#059669' }
      ]
    });
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Pending and Receiving Payments</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Two distinct columns tracking Pending and Receiving payments for booked & exchanged devices.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Pending & Receiving</span>
          </div>
          <button onClick={handleExportPdf} className="btn-secondary" style={{ padding: '9px 16px', borderRadius: '8px' }}>
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={() => handleOpenEquateModal(null)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
            <Plus size={16} /> Add Payment
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>From Date</label>
          <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '150px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>To Date</label>
          <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '150px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Payment Status</label>
          <select className="form-control" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={{ width: '140px', padding: '7px 12px' }}>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Received">Received</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Person / Customer</label>
          <select className="form-control" value={personCustomer} onChange={(e) => setPersonCustomer(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
            <option value="All">All</option>
            <option value="Jeet Khubchandani">Jeet Khubchandani</option>
            <option value="Sonal Wadwani">Sonal Wadwani</option>
            <option value="Rohit Kumar">Rohit Kumar</option>
            <option value="Neha Gupta">Neha Gupta</option>
            <option value="Aman Verma">Aman Verma</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Mobile Brand</label>
          <select className="form-control" value={mobileBrand} onChange={(e) => setMobileBrand(e.target.value)} style={{ width: '140px', padding: '7px 12px' }}>
            <option value="All">All</option>
            <option value="Google Pixel">Google Pixel</option>
            <option value="Apple">Apple</option>
            <option value="Samsung">Samsung</option>
            <option value="OnePlus">OnePlus</option>
            <option value="Vivo">Vivo</option>
            <option value="Xiaomi">Xiaomi</option>
            <option value="Nothing">Nothing</option>
            <option value="Realme">Realme</option>
            <option value="Motorola">Motorola</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={() => { setFromDate(''); setToDate(''); setPaymentStatus('All'); setPersonCustomer('All'); setMobileBrand('All'); }} className="btn-secondary">Clear</button>
        </div>
      </div>

      {/* Summary Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#c2410c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} /> Total Pending ({pendingPayments.length} Accounts)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#ea580c', marginTop: '4px' }}>
              <CurrencyAmount amount={totalPendingAmount} />
            </div>
          </div>
          <span style={{ fontSize: '11px', background: '#ffedd5', color: '#ea580c', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>PENDING</span>
        </div>

        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} /> Total Receiving / Received ({receivingPayments.length} Accounts)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
              <CurrencyAmount amount={totalReceivedAmount} />
            </div>
          </div>
          <span style={{ fontSize: '11px', background: '#d1fae5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>RECEIVING / SETTLED</span>
        </div>
      </div>

      {/* TWO COLUMNS LAYOUT: PENDING vs RECEIVING PAYMENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* COLUMN 1: PENDING PAYMENTS */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '2px solid #ffedd5', overflow: 'hidden', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.05)' }}>
          <div style={{ background: '#fff7ed', padding: '14px 18px', borderBottom: '1px solid #ffedd5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#ea580c" />
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#9a3412', margin: 0 }}>Pending Payments</h2>
            </div>
            <span style={{ background: '#ea580c', color: '#ffffff', fontSize: '12px', padding: '2px 10px', borderRadius: '12px', fontWeight: 800 }}>
              {pendingPayments.length} Pending
            </span>
          </div>

          <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#fffbeb' }}>
                  <th style={{ width: '30px' }}>#</th>
                  <th>Date</th>
                  <th>Person / Order Name</th>
                  <th>Device Model</th>
                  <th>Pending Amt</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No pending payments found.
                    </td>
                  </tr>
                ) : (
                  pendingPayments.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td data-label="#">{idx + 1}</td>
                      <td data-label="Date" style={{ fontSize: '11px', color: '#64748b' }}>{row.date}</td>
                      <td data-label="Person / Order">
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>Order: {row.orderName || row.newColor || '-'}</div>
                      </td>
                      <td data-label="Device">
                        <span style={{ fontWeight: 600 }}>{row.brand}</span> <span style={{ fontWeight: 700 }}>{row.model}</span>
                      </td>
                      <td data-label="Pending Amt" style={{ fontWeight: 800, color: '#ea580c' }}>
                        <CurrencyAmount amount={row.pendingAmount} />
                        {row.totalAmount > row.pendingAmount && (
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total: ₹{row.totalAmount.toLocaleString()}</div>
                        )}
                      </td>
                      <td data-label="Action" style={{ textAlign: 'center' }}>
                        <button onClick={() => handleOpenEquateModal(row)} className="btn-primary" style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '6px', backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
                          Equate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMN 2: RECEIVING PAYMENTS */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '2px solid #a7f3d0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.05)' }}>
          <div style={{ background: '#ecfdf5', padding: '14px 18px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#059669" />
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#065f46', margin: 0 }}>Receiving Payments</h2>
            </div>
            <span style={{ background: '#059669', color: '#ffffff', fontSize: '12px', padding: '2px 10px', borderRadius: '12px', fontWeight: 800 }}>
              {receivingPayments.length} Settled
            </span>
          </div>

          <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f0fdf4' }}>
                  <th style={{ width: '30px' }}>#</th>
                  <th>Date</th>
                  <th>Person / Order Name</th>
                  <th>Device Model</th>
                  <th>Received Amt</th>
                  <th>Mode / Status</th>
                </tr>
              </thead>
              <tbody>
                {receivingPayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No received payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  receivingPayments.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td data-label="#">{idx + 1}</td>
                      <td data-label="Date" style={{ fontSize: '11px', color: '#64748b' }}>{row.date}</td>
                      <td data-label="Person / Order">
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>Order: {row.orderName || row.newColor || '-'}</div>
                      </td>
                      <td data-label="Device">
                        <span style={{ fontWeight: 600 }}>{row.brand}</span> <span style={{ fontWeight: 700 }}>{row.model}</span>
                      </td>
                      <td data-label="Received Amt" style={{ fontWeight: 800, color: '#059669' }}>
                        <CurrencyAmount amount={row.paidAmount || row.totalAmount} />
                      </td>
                      <td data-label="Mode">
                        <span style={{ background: '#d1fae5', color: '#047857', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                          {row.mode || 'Cash'} • Received ✔
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Review and equate pending payment for selected customer.</p>
                </div>
              </div>
              <button onClick={() => setIsEquateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleEquateSubmit}>
              {/* Person / Customer Name */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Person / Customer Name *</label>
                <input type="text" className="form-control" placeholder="Enter customer name" value={equateForm.customerName} onChange={(e) => setEquateForm({ ...equateForm, customerName: e.target.value })} required />
              </div>

              {/* Order Name */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Order Name *</label>
                <input type="text" className="form-control" placeholder="Order Name / ID" value={equateForm.orderName} onChange={(e) => setEquateForm({ ...equateForm, orderName: e.target.value })} required />
              </div>

              {/* Pending Payment Field */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Pending Amount (₹) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="₹ Pending payment amount" 
                  value={equateForm.pendingPayment} 
                  onChange={(e) => setEquateForm({ ...equateForm, pendingPayment: e.target.value })} 
                  required
                />
              </div>

              {/* Equated by */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Equated by</label>
                <select className="form-control" value={equateForm.equatedBy} onChange={(e) => setEquateForm({ ...equateForm, equatedBy: e.target.value })}>
                  <option value="Jeet">Jeet</option>
                  <option value="Sonal">Sonal</option>
                </select>
              </div>

              {/* Installment vs Complete Mode Toggle */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Payment Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setEquateForm({ ...equateForm, paymentType: 'INSTALLMENT', newPay: '' })}
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
                    onClick={() => setEquateForm({ ...equateForm, paymentType: 'COMPLETE', newPay: equateForm.pendingPayment })}
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

              {/* New Pay & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">New Pay (₹) *</label>
                  <input type="number" className="form-control" placeholder="₹ Enter new pay" value={equateForm.newPay} onChange={(e) => setEquateForm({ ...equateForm, newPay: e.target.value })} required />
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

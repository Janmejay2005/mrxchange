import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Plus, Home, ShoppingCart, X, CreditCard, CheckCircle, Clock, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
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
    paymentCategory: 'PENDING', // 'PENDING' (Payable) or 'RECEIVING' (Receivable)
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
      // 1. PENDING PAYMENTS (Payables - Payments we owe for booked/purchased phones)
      { id: 101, date: '15 Sep 2026', customerName: 'Jeet Khubchandani', orderName: 'Jeet / Ord-8891', brand: 'Google Pixel', model: 'Pixel 8 Pro', totalAmount: 89000, paidAmount: 60000, pendingAmount: 29000, status: 'Pending', paymentCategory: 'PENDING', mode: 'UPI', remarks: 'Balance to pay in 2 weeks' },
      { id: 102, date: '13 Sep 2026', customerName: 'Rohit Kumar', orderName: 'Rohit / Ord-4431', brand: 'Samsung', model: 'Galaxy S24 Ultra', totalAmount: 114000, paidAmount: 70000, pendingAmount: 44000, status: 'Pending', paymentCategory: 'PENDING', mode: 'Card', remarks: 'Installment 2 pending to pay' },
      { id: 103, date: '11 Sep 2026', customerName: 'Aman Verma', orderName: 'Aman / Ord-7720', brand: 'Vivo', model: 'X100 Pro', totalAmount: 89999, paidAmount: 50000, pendingAmount: 39999, status: 'Pending', paymentCategory: 'PENDING', mode: 'UPI', remarks: 'Remaining balance due' },
      { id: 104, date: '09 Sep 2026', customerName: 'Vikram Singh', orderName: 'Vikram / Ord-6671', brand: 'Xiaomi', model: '14 Ultra', totalAmount: 99999, paidAmount: 40000, pendingAmount: 59999, status: 'Pending', paymentCategory: 'PENDING', mode: 'Card', remarks: 'Vendor payable' },

      // 2. RECEIVING PAYMENTS (Receivables - Pending payments to receive from sold devices/vendors)
      { id: 201, date: '16 Sep 2026', customerName: 'Kapil Verma (Vendor)', orderName: 'Kapil / Ord-5511', brand: 'Apple', model: 'iPhone 15 Pro', totalAmount: 115000, paidAmount: 65000, pendingAmount: 50000, status: 'Pending', paymentCategory: 'RECEIVING', mode: 'Cash', remarks: 'Pending receivable from sale' },
      { id: 202, date: '14 Sep 2026', customerName: 'Sonal Wadwani', orderName: 'Sonal / Ord-9012', brand: 'Apple', model: 'iPhone 15 Pro Max', totalAmount: 132000, paidAmount: 100000, pendingAmount: 32000, status: 'Pending', paymentCategory: 'RECEIVING', mode: 'Cash', remarks: 'Customer installment receivable' },
      { id: 203, date: '12 Sep 2026', customerName: 'Neha Gupta', orderName: 'Neha / Ord-1029', brand: 'OnePlus', model: 'OnePlus 12', totalAmount: 64999, paidAmount: 44999, pendingAmount: 20000, status: 'Pending', paymentCategory: 'RECEIVING', mode: 'UPI', remarks: 'Vendor pending receivable' },
      { id: 204, date: '08 Sep 2026', customerName: 'Sunal Rao', orderName: 'Sunal / Ord-2290', brand: 'Realme', model: 'GT 5 Pro', totalAmount: 42000, paidAmount: 42000, pendingAmount: 0, status: 'Received', paymentCategory: 'RECEIVING', mode: 'UPI', remarks: 'Fully received' }
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

  const handleOpenEquateModal = (row = null, defaultCategory = 'PENDING') => {
    setSelectedPayment(row);
    const pending = row ? row.pendingAmount : '';
    setEquateForm({
      pendingPayment: String(pending),
      equatedBy: user?.name ? (user.name.toLowerCase().includes('jeet') ? 'Jeet' : user.name) : 'Jeet',
      customerName: row ? row.customerName : '',
      orderName: row ? (row.orderName || row.newColor || '') : '',
      paymentCategory: row ? (row.paymentCategory || defaultCategory) : defaultCategory,
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

  // Categorize into 1. Pending Payments (Payables) & 2. Receiving Payments (Receivables from sales/vendors)
  const pendingPayables = filteredPayments.filter(p => p.paymentCategory === 'PENDING' || !p.paymentCategory);
  const receivingReceivables = filteredPayments.filter(p => p.paymentCategory === 'RECEIVING');

  const totalPendingPayableAmount = pendingPayables.reduce((sum, item) => sum + item.pendingAmount, 0);
  const totalReceivablePendingAmount = receivingReceivables.reduce((sum, item) => sum + item.pendingAmount, 0);
  const totalReceivedAmount = receivingReceivables.reduce((sum, item) => sum + (item.paidAmount || 0), 0);

  const handleEquateSubmit = (e) => {
    e.preventDefault();
    const newPayAmt = Number(equateForm.newPay) || 0;
    if (selectedPayment) {
      const updated = payments.map(p => {
        if (p.id === selectedPayment.id) {
          const newPaidAmount = (p.paidAmount || 0) + newPayAmt;
          const newPendingAmount = Math.max(0, (p.pendingAmount || 0) - newPayAmt);
          const isSettled = newPendingAmount === 0;
          return {
            ...p,
            customerName: equateForm.customerName || p.customerName,
            orderName: equateForm.orderName || p.orderName,
            paidAmount: newPaidAmount,
            pendingAmount: newPendingAmount,
            status: isSettled ? (p.paymentCategory === 'RECEIVING' ? 'Received' : 'Paid') : 'Pending'
          };
        }
        return p;
      });
      savePaymentsToStorage(updated);
      alert(`Equated successfully for ${equateForm.customerName || selectedPayment.customerName}! New pay of ₹${newPayAmt.toLocaleString()} recorded. Equated by: ${equateForm.equatedBy}`);
    } else {
      const cat = equateForm.paymentCategory || 'PENDING';
      const pendVal = Number(equateForm.pendingPayment) || newPayAmt;
      const isSettled = pendVal - newPayAmt <= 0;
      const newRec = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        customerName: equateForm.customerName || 'Customer / Vendor',
        orderName: equateForm.orderName || 'Manual Entry',
        brand: 'Other',
        model: 'Device',
        totalAmount: pendVal,
        paidAmount: newPayAmt,
        pendingAmount: Math.max(0, pendVal - newPayAmt),
        status: isSettled ? (cat === 'RECEIVING' ? 'Received' : 'Paid') : 'Pending',
        paymentCategory: cat,
        mode: 'Cash',
        remarks: `Equated by ${equateForm.equatedBy}`
      };
      savePaymentsToStorage([newRec, ...payments]);
      alert(`Payment entry created successfully for ${equateForm.customerName || 'Customer'}! Equated by: ${equateForm.equatedBy}`);
    }
    setIsEquateModalOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['#', 'Category', 'Date', 'Person / Vendor', 'Order Name', 'Device Model', 'Total (Rs)', 'Paid (Rs)', 'Pending (Rs)', 'Status'];
    const rows = filteredPayments.map((item, idx) => [
      idx + 1,
      item.paymentCategory === 'RECEIVING' ? 'Receivable (Sale)' : 'Payable (Booking)',
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
      title: 'Pending and Receiving Payments Summary Report',
      headers,
      rows,
      filename: `Payments_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Payables Pending', value: `Rs. ${totalPendingPayableAmount.toLocaleString()}`, color: '#ea580c' },
        { label: 'Total Receivables Pending', value: `Rs. ${totalReceivablePendingAmount.toLocaleString()}`, color: '#0284c7' },
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
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Track outgoing payables (Pending) and incoming vendor receivables from sales (Receiving).</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Pending & Receiving</span>
          </div>
          <button onClick={handleExportPdf} className="btn-secondary" style={{ padding: '9px 16px', borderRadius: '8px' }}>
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={() => handleOpenEquateModal(null, 'PENDING')} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
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
            <option value="Received">Received / Settled</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Person / Customer / Vendor</label>
          <select className="form-control" value={personCustomer} onChange={(e) => setPersonCustomer(e.target.value)} style={{ width: '180px', padding: '7px 12px' }}>
            <option value="All">All</option>
            <option value="Jeet Khubchandani">Jeet Khubchandani</option>
            <option value="Sonal Wadwani">Sonal Wadwani</option>
            <option value="Kapil Verma">Kapil Verma</option>
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

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#c2410c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} /> Total Pending (Payables)
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#ea580c', marginTop: '4px' }}>
              <CurrencyAmount amount={totalPendingPayableAmount} />
            </div>
          </div>
          <span style={{ fontSize: '11px', background: '#ffedd5', color: '#ea580c', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>WE OWE</span>
        </div>

        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowDownLeft size={16} /> Pending Receivables (Sales)
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
              <CurrencyAmount amount={totalReceivablePendingAmount} />
            </div>
          </div>
          <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>TO RECEIVE</span>
        </div>

        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} /> Total Received (Sales)
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
              <CurrencyAmount amount={totalReceivedAmount} />
            </div>
          </div>
          <span style={{ fontSize: '11px', background: '#d1fae5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>RECEIVED ✔</span>
        </div>
      </div>

      {/* TWO COLUMNS LAYOUT: PENDING PAYMENTS vs RECEIVING PAYMENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* COLUMN 1: PENDING PAYMENTS (PAYABLES - WE OWE) */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '2px solid #ffedd5', overflow: 'hidden', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.05)' }}>
          <div style={{ background: '#fff7ed', padding: '14px 18px', borderBottom: '1px solid #ffedd5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#ea580c" />
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#9a3412', margin: 0 }}>Pending Payments (Payables)</h2>
                <span style={{ fontSize: '11px', color: '#c2410c' }}>Payments we have to pay out for bookings & trade-ins</span>
              </div>
            </div>
            <span style={{ background: '#ea580c', color: '#ffffff', fontSize: '12px', padding: '2px 10px', borderRadius: '12px', fontWeight: 800 }}>
              {pendingPayables.length} Accounts
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
                {pendingPayables.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No pending payables recorded.
                    </td>
                  </tr>
                ) : (
                  pendingPayables.map((row, idx) => (
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
                      <td data-label="Pending Amt" style={{ fontWeight: 800, color: row.pendingAmount > 0 ? '#ea580c' : '#059669' }}>
                        {row.pendingAmount > 0 ? (
                          <>
                            <CurrencyAmount amount={row.pendingAmount} />
                            {row.totalAmount > row.pendingAmount && (
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total: ₹{row.totalAmount.toLocaleString()}</div>
                            )}
                          </>
                        ) : (
                          <span style={{ color: '#059669', fontSize: '12px' }}>Fully Paid ✔</span>
                        )}
                      </td>
                      <td data-label="Action" style={{ textAlign: 'center' }}>
                        {row.pendingAmount > 0 ? (
                          <button onClick={() => handleOpenEquateModal(row, 'PENDING')} className="btn-primary" style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '6px', backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
                            Equate
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>Settled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMN 2: RECEIVING PAYMENTS (RECEIVABLES - TO RECEIVE FROM SALES/VENDORS) */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '2px solid #bae6fd', overflow: 'hidden', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.05)' }}>
          <div style={{ background: '#f0f9ff', padding: '14px 18px', borderBottom: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowDownLeft size={18} color="#0284c7" />
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#075985', margin: 0 }}>Receiving Payments (Receivables)</h2>
                <span style={{ fontSize: '11px', color: '#0369a1' }}>Pending payments we have to receive from sales & vendors</span>
              </div>
            </div>
            <span style={{ background: '#0284c7', color: '#ffffff', fontSize: '12px', padding: '2px 10px', borderRadius: '12px', fontWeight: 800 }}>
              {receivingReceivables.length} Accounts
            </span>
          </div>

          <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f0f9ff' }}>
                  <th style={{ width: '30px' }}>#</th>
                  <th>Date</th>
                  <th>Customer / Vendor</th>
                  <th>Device / Order</th>
                  <th>Receivable Pending</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {receivingReceivables.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No receiving payment records found.
                    </td>
                  </tr>
                ) : (
                  receivingReceivables.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td data-label="#">{idx + 1}</td>
                      <td data-label="Date" style={{ fontSize: '11px', color: '#64748b' }}>{row.date}</td>
                      <td data-label="Customer / Vendor">
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>Order: {row.orderName || row.newColor || '-'}</div>
                      </td>
                      <td data-label="Device">
                        <span style={{ fontWeight: 600 }}>{row.brand}</span> <span style={{ fontWeight: 700 }}>{row.model}</span>
                      </td>
                      <td data-label="Receivable Pending" style={{ fontWeight: 800, color: row.pendingAmount > 0 ? '#0284c7' : '#059669' }}>
                        {row.pendingAmount > 0 ? (
                          <>
                            <CurrencyAmount amount={row.pendingAmount} />
                            <div style={{ fontSize: '10px', color: '#64748b' }}>Rec'd: ₹{(row.paidAmount || 0).toLocaleString()}</div>
                          </>
                        ) : (
                          <span style={{ color: '#059669', fontSize: '12px' }}>Fully Received ✔</span>
                        )}
                      </td>
                      <td data-label="Action" style={{ textAlign: 'center' }}>
                        {row.pendingAmount > 0 ? (
                          <button onClick={() => handleOpenEquateModal(row, 'RECEIVING')} className="btn-primary" style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '6px', backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                            Equate
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>Received ✔</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Unified Equate Payment Modal for Both Pending & Receiving Payments */}
      {isEquateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: equateForm.paymentCategory === 'RECEIVING' ? '#e0f2fe' : '#ffedd5', color: equateForm.paymentCategory === 'RECEIVING' ? '#0284c7' : '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Equate Payment</h2>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    {equateForm.paymentCategory === 'RECEIVING' ? 'Record new pay received from vendor / customer.' : 'Record new pay out for pending account.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEquateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleEquateSubmit}>
              {/* Payment Category Selector (if creating manual entry) */}
              {!selectedPayment && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Payment Category</label>
                  <select className="form-control" value={equateForm.paymentCategory} onChange={(e) => setEquateForm({ ...equateForm, paymentCategory: e.target.value })}>
                    <option value="PENDING">Pending Payment (Payable - We Owe)</option>
                    <option value="RECEIVING">Receiving Payment (Receivable - To Receive)</option>
                  </select>
                </div>
              )}

              {/* Person / Customer / Vendor Name */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Person / Customer / Vendor Name *</label>
                <input type="text" className="form-control" placeholder="Enter name" value={equateForm.customerName} onChange={(e) => setEquateForm({ ...equateForm, customerName: e.target.value })} required />
              </div>

              {/* Order Name */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Order Name *</label>
                <input type="text" className="form-control" placeholder="Order Name / ID" value={equateForm.orderName} onChange={(e) => setEquateForm({ ...equateForm, orderName: e.target.value })} required />
              </div>

              {/* Pending Amount Field */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {equateForm.paymentCategory === 'RECEIVING' ? 'Receivable Pending (₹) *' : 'Pending Payment (₹) *'}
                </label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="₹ Pending amount" 
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
                <label className="form-label">Payment Mode Option</label>
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

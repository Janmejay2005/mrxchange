import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Plus, Home, ShoppingCart, X, CreditCard, CheckCircle, FileText, Clock, Check } from 'lucide-react';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import PdfExportModal from '../components/common/PdfExportModal';

export default function PendingAndReceivingPayments() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [personCustomer, setPersonCustomer] = useState('All');
  const [mobileBrand, setMobileBrand] = useState('All');
  const [paymentModeFilter, setPaymentModeFilter] = useState('All');

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
    equatedBy: 'Jeet',
    customerName: '',
    paymentType: 'INSTALLMENT', // 'INSTALLMENT' or 'COMPLETE'
    newPay: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Person Breakdown Modal State
  const [selectedPersonForBreakdown, setSelectedPersonForBreakdown] = useState(null);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);

  const openPersonBreakdown = (customerName) => {
    setSelectedPersonForBreakdown(customerName || 'Customer');
    setIsPersonModalOpen(true);
  };

  const getStoredPayments = () => {
    try {
      const localStr = localStorage.getItem('mrx_pending_payments');
      if (localStr) {
        return JSON.parse(localStr);
      }
    } catch (e) {}
    return [];
  };

  const [payments, setPayments] = useState(getStoredPayments);

  useEffect(() => {
    const handleSync = () => {
      setPayments(getStoredPayments());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('mrx_pending_payments_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mrx_pending_payments_updated', handleSync);
    };
  }, []);

  const savePaymentsToStorage = (updatedList) => {
    setPayments(updatedList);
    try {
      localStorage.setItem('mrx_pending_payments', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mrx_pending_payments_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
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
      equatedBy: 'Jeet',
      customerName: row ? row.customerName : '',
      paymentType: row && row.pendingAmount === 0 ? 'COMPLETE' : 'INSTALLMENT',
      newPay: '',
      date: row ? (toYMD(row.date) || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
    });
    setIsEquateModalOpen(true);
  };

  const applyFilters = (itemList) => {
    return itemList.filter((item) => {
      if (personCustomer !== 'All' && !item.customerName.toLowerCase().includes(personCustomer.toLowerCase())) return false;
      if (mobileBrand !== 'All' && item.brand !== mobileBrand) return false;
      if (paymentModeFilter !== 'All' && String(item.mode || item.paymentType || '').toLowerCase() !== paymentModeFilter.toLowerCase()) return false;
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
        const matchMode = (item.mode || '').toLowerCase().includes(q);
        if (!matchCustomer && !matchBrand && !matchModel && !matchMode) return false;
      }
      return true;
    });
  };

  // Helper to distinguish Agent Payables (dues to evaluators/staff) vs Customer Receivables (from sold phones)
  const isAgentPayableItem = (item) => {
    if (item.type === 'AGENT_PAYABLE') return true;
    if (item.type === 'CUSTOMER_RECEIVABLE') return false;
    const idStr = String(item.id || '');
    return idStr.startsWith('EXCH-') || idStr.startsWith('AGENT-') || item.recordCategory === 'BOOK_EXCHANGE';
  };

  // COLUMN 1: Receiving Payments Column (Customer receivables from Sell New Mobile)
  const receivingList = applyFilters(payments.filter(item => !isAgentPayableItem(item)));

  // COLUMN 2: Pending Payments Column (Agent Payables - Book New Device for Exchange)
  const pendingList = applyFilters(payments.filter(item => isAgentPayableItem(item) && Number(item.pendingAmount) > 0));

  const totalPendingVal = pendingList.reduce((sum, item) => sum + (Number(item.pendingAmount) || 0), 0);
  const totalReceivedVal = receivingList.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
  const totalReceivingPendingVal = receivingList.reduce((sum, item) => sum + (Number(item.pendingAmount) || 0), 0);

  // Card Payment Identification & Breakdown
  const cardPaymentsList = payments.filter(item => String(item.mode || item.paymentType || '').toLowerCase() === 'card');
  const totalCardVal = cardPaymentsList.reduce((sum, item) => sum + (Number(item.paidAmount || item.totalAmount) || 0), 0);
  const cardPayersSet = new Set(cardPaymentsList.map(item => item.customerName));

  // Selected Person Statement Breakdown
  const personTransactions = React.useMemo(() => {
    if (!selectedPersonForBreakdown) return [];
    const target = selectedPersonForBreakdown.toLowerCase().trim();
    return payments.filter(p => (p.customerName || '').toLowerCase().includes(target) || (p.equatedBy || '').toLowerCase().includes(target));
  }, [payments, selectedPersonForBreakdown]);

  const personTotalAmount = personTransactions.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
  const personPaidAmount = personTransactions.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
  const personPendingAmount = personTransactions.reduce((sum, item) => sum + (Number(item.pendingAmount) || 0), 0);

  const handleEquateSubmit = (e) => {
    e.preventDefault();
    const newPayAmt = Number(equateForm.newPay) || 0;
    if (newPayAmt <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (selectedPayment) {
      const currentTotal = Number(selectedPayment.totalAmount) || 0;
      const existingPaid = Math.min(currentTotal, Number(selectedPayment.paidAmount) || 0);
      const maxRemaining = Math.max(0, currentTotal - existingPaid);

      if (existingPaid >= currentTotal && currentTotal > 0) {
        alert('This payment is already fully completed (₹0 remaining). Paid amount cannot exceed total price.');
        return;
      }

      if (newPayAmt > maxRemaining && currentTotal > 0) {
        alert(`Paid amount cannot be greater than Total Price! Maximum remaining payable amount is ₹${maxRemaining.toLocaleString()}.`);
        return;
      }

      const updatedList = payments.map(p => {
        if (String(p.id) === String(selectedPayment.id)) {
          const newPaidAmount = Math.min(currentTotal, existingPaid + newPayAmt);
          const newPendingAmount = Math.max(0, currentTotal - newPaidAmount);
          const newStatus = newPendingAmount === 0 ? 'Received' : 'Pending';

          return {
            ...p,
            totalAmount: currentTotal,
            customerName: equateForm.customerName || p.customerName,
            paidAmount: newPaidAmount,
            pendingAmount: newPendingAmount,
            status: newStatus,
            equatedBy: equateForm.equatedBy || 'Jeet'
          };
        }
        return p;
      });
      savePaymentsToStorage(updatedList);
      alert(`Equated successfully for ${equateForm.customerName || selectedPayment.customerName}! Paid Amount equated to Total Price.`);
    } else {
      const isBookExch = equateForm.recordCategory === 'BOOK_EXCHANGE';
      const enteredTotal = Number(equateForm.pendingPayment) || newPayAmt;
      const initialPaid = Math.min(newPayAmt, enteredTotal);
      const calculatedPending = Math.max(0, enteredTotal - initialPaid);

      const newPayEntry = {
        id: isBookExch ? `EXCH-PAY-${Date.now()}` : `PAY-${Date.now()}`,
        date: equateForm.date,
        customerName: equateForm.customerName || (isBookExch ? 'Payer / Account' : 'Customer'),
        brand: 'General',
        model: isBookExch ? 'Exchange Book Device' : 'Sell New Mobile Entry',
        totalAmount: enteredTotal,
        paidAmount: initialPaid,
        pendingAmount: calculatedPending,
        status: calculatedPending <= 0 ? 'Received' : 'Pending',
        type: isBookExch ? 'AGENT_PAYABLE' : 'CUSTOMER_RECEIVABLE',
        recordCategory: isBookExch ? 'BOOK_EXCHANGE' : 'SELL_MOBILE',
        mode: 'Cash',
        equatedBy: equateForm.equatedBy || 'Jeet'
      };
      savePaymentsToStorage([newPayEntry, ...payments]);
      alert(`Payment record created successfully for ${equateForm.customerName || 'Account'}!`);
    }
    setIsEquateModalOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['#', 'Date', 'Customer / Pay By', 'Device Model', 'Total Price (Rs)', 'Paid Amount (Rs)', 'Pending (Rs)', 'Status', 'Mode'];
    const allFiltered = [...receivingList, ...pendingList];
    const rows = allFiltered.map((item, idx) => [
      idx + 1,
      item.date,
      item.customerName,
      `${item.brand} ${item.model}`,
      `Rs. ${(item.totalAmount || 0).toLocaleString()}`,
      `Rs. ${(item.paidAmount || 0).toLocaleString()}`,
      `Rs. ${(item.pendingAmount || 0).toLocaleString()}`,
      item.status,
      item.mode
    ]);
    setExportModalConfig({
      isOpen: true,
      title: 'Pending & Received Payments Report',
      headers,
      rows,
      filename: `Payments_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Received', value: `Rs. ${totalReceivedVal.toLocaleString()}`, color: '#059669' },
        { label: 'Total Pending', value: `Rs. ${totalPendingVal.toLocaleString()}`, color: '#dc2626' }
      ]
    });
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Pending and Receiving Payments</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Dual-column breakdown for Sell New Mobile receivables and Book New Device for Exchange payables.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleExportPdf} className="btn-secondary" style={{ padding: '9px 16px', borderRadius: '8px' }}>
            <FileText size={16} /> Export PDF Report
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
          <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '160px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>To Date</label>
          <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '160px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Person / Account</label>
          <select className="form-control" value={personCustomer} onChange={(e) => setPersonCustomer(e.target.value)} style={{ width: '150px', padding: '7px 12px' }}>
            <option>All</option>
            <option>Jeet Khubchandani</option>
            <option>Sonal Wadwani</option>
            <option>Rohit Kumar</option>
            <option>Neha Gupta</option>
            <option>Aman Verma</option>
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

        <div>
          <label style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed', display: 'block', marginBottom: '4px' }}>💳 Payment Mode</label>
          <select className="form-control" value={paymentModeFilter} onChange={(e) => setPaymentModeFilter(e.target.value)} style={{ width: '150px', padding: '7px 12px', borderColor: '#a855f7', fontWeight: 700, color: '#7c3aed' }}>
            <option value="All">All Modes</option>
            <option value="Card">Card</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={() => { setFromDate(''); setToDate(''); setPersonCustomer('All'); setMobileBrand('All'); setPaymentModeFilter('All'); }} className="btn-secondary">Clear Filters</button>
        </div>
      </div>

      {/* UNIFIED PAYMENTS CONTAINER WITH CARD IDENTIFICATION BANNER AT TOP */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        {/* Card Payment Identification & Summary Banner */}
        <div style={{ background: '#f3e8ff', border: '1px solid #c084fc', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#7c3aed', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>💳 Card Payments Identification</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#581c87', marginTop: '2px' }}>
                ₹{totalCardVal.toLocaleString('en-IN')} <span style={{ fontSize: '13px', fontWeight: 700, color: '#7e22ce' }}>({cardPayersSet.size} Person(s) Paid via Card)</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setPaymentModeFilter(paymentModeFilter === 'Card' ? 'All' : 'Card')} 
            style={{ padding: '8px 16px', background: paymentModeFilter === 'Card' ? '#581c87' : '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CreditCard size={16} /> {paymentModeFilter === 'Card' ? 'Show All Modes' : `Identify Card Payers (${cardPayersSet.size})`}
          </button>
        </div>

        {/* DUAL EQUAL-WIDTH SIDE-BY-SIDE COLUMNS LAYOUT WITH MEDIA QUERY */}
        <style>{`
          .payments-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            align-items: start;
          }
          @media (max-width: 767px) {
            .payments-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <div className="payments-grid">
          {/* COLUMN 1: RECEIVING PAYMENT COLUMN (Sell New Mobile) */}
          <div className="card-container" style={{ borderTop: '4px solid #059669', background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #a7f3d0', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#065f46', margin: 0 }}>Receiving Payment: Sell New Mobile</h2>
                  <span style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>
                    Equate Paid Amount to Total Selling Price ({receivingList.length} items)
                  </span>
                </div>
              </div>

              <div style={{ background: '#ecfdf5', padding: '8px 14px', borderRadius: '10px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', display: 'block' }}>To Receive:</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#dc2626' }}>
                    <CurrencyAmount amount={totalReceivingPendingVal} />
                  </span>
                </div>
                <div style={{ borderLeft: '1px solid #a7f3d0', paddingLeft: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', display: 'block' }}>Collected:</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#065f46' }}>
                    <CurrencyAmount amount={totalReceivedVal} />
                  </span>
                </div>
              </div>
            </div>

            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="custom-table payments-compact-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '8px 4px' }}>#</th>
                    <th style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '8px 6px' }}>Date</th>
                    <th style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '8px 6px' }}>Customer Name *</th>
                    <th style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '8px 6px' }}>Device Model</th>
                    <th style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '8px 6px' }}>Total Selling Price (₹) *</th>
                    <th style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '8px 6px' }}>Paid Amount (₹) *</th>
                    <th style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '8px 6px' }}>Pending (₹)</th>
                    <th style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '8px 6px' }}>Status</th>
                    <th style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '8px 6px' }}>Mode</th>
                    <th style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '8px 6px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receivingList.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No Sell New Mobile records in Receiving Payment.
                      </td>
                    </tr>
                  ) : (
                    receivingList.map((row, idx) => (
                      <tr key={row.id}>
                        <td data-label="#" style={{ padding: '8px 4px' }}>{idx + 1}</td>
                        <td data-label="Date" style={{ padding: '8px 6px', fontSize: '11px' }}>{row.date}</td>
                        <td data-label="Customer Name *" style={{ padding: '8px 6px' }}>
                          <button
                            type="button"
                            onClick={() => openPersonBreakdown(row.customerName)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#059669',
                              fontWeight: 800,
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              padding: 0,
                              textAlign: 'left',
                              fontSize: '11px'
                            }}
                            title={`Click to view breakdown statement for ${row.customerName}`}
                          >
                            👤 {row.customerName}
                          </button>
                        </td>
                        <td data-label="Device Model" style={{ padding: '8px 6px', fontWeight: 700 }}>{row.brand} {row.model}</td>
                        <td data-label="Total Selling Price (₹) *" style={{ padding: '8px 6px', fontWeight: 700 }}><CurrencyAmount amount={row.totalAmount} /></td>
                        <td data-label="Paid Amount (₹) *" style={{ padding: '8px 6px', fontWeight: 700, color: '#059669' }}><CurrencyAmount amount={row.paidAmount} /></td>
                        <td data-label="Pending Amount (₹)" style={{ padding: '8px 6px', fontWeight: 800, color: row.pendingAmount > 0 ? '#dc2626' : '#059669' }}>
                          <CurrencyAmount amount={row.pendingAmount} />
                        </td>
                        <td data-label="Status" style={{ padding: '8px 6px' }}>
                          <span style={{ 
                            padding: '3px 8px', 
                            borderRadius: '12px', 
                            fontSize: '10px', 
                            fontWeight: 800, 
                            background: row.pendingAmount > 0 ? '#fef3c7' : '#ecfdf5', 
                            color: row.pendingAmount > 0 ? '#d97706' : '#047857' 
                          }}>
                            {row.pendingAmount > 0 ? 'Pending Receive' : 'Received ✔️'}
                          </span>
                        </td>
                        <td data-label="Payment Mode" style={{ padding: '8px 6px', fontSize: '11px' }}>{row.mode}</td>
                        <td data-label="Action" style={{ padding: '8px 6px' }}>
                          <button onClick={() => handleOpenEquateModal(row)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', fontWeight: 700 }}>
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

          {/* COLUMN 2: PENDING PAYMENT COLUMN (Book New Device for Exchange) */}
          <div className="card-container" style={{ borderTop: '4px solid #ea580c', background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #fed7aa', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#9a3412', margin: 0 }}>Pending Payment: Book New Device for Exchange</h2>
                  <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 700 }}>
                    Pay By (Payer / Account) *, Purchased Amount (Paid ₹) * ({pendingList.length} items)
                  </span>
                </div>
              </div>

              <div style={{ background: '#fff7ed', padding: '8px 16px', borderRadius: '10px', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ea580c' }}>Total Pending Dues:</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#c2410c' }}>
                  <CurrencyAmount amount={totalPendingVal} />
                </span>
              </div>
            </div>

            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="custom-table payments-compact-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ backgroundColor: '#fff7ed', color: '#9a3412', padding: '8px 4px' }}>#</th>
                    <th style={{ backgroundColor: '#fff7ed', color: '#9a3412', padding: '8px 6px' }}>Date</th>
                    <th style={{ backgroundColor: '#fff7ed', color: '#9a3412', padding: '8px 6px' }}>Pay By (Payer / Account) *</th>
                    <th style={{ backgroundColor: '#fff7ed', color: '#9a3412', padding: '8px 6px' }}>Device Model</th>
                    <th style={{ backgroundColor: '#fff7ed', color: '#9a3412', padding: '8px 6px' }}>Purchased Amount (Paid ₹) *</th>
                    <th style={{ backgroundColor: '#fff7ed', color: '#9a3412', padding: '8px 6px' }}>Paid Amount (₹) *</th>
                    <th style={{ backgroundColor: '#fff7ed', color: '#9a3412', padding: '8px 6px' }}>Pending (₹)</th>
                    <th style={{ backgroundColor: '#fff7ed', color: '#9a3412', padding: '8px 6px' }}>Status</th>
                    <th style={{ backgroundColor: '#fff7ed', color: '#9a3412', padding: '8px 6px' }}>Mode</th>
                    <th style={{ backgroundColor: '#fff7ed', color: '#9a3412', padding: '8px 6px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No Book New Device for Exchange records in Pending Payment.
                      </td>
                    </tr>
                  ) : (
                    pendingList.map((row, idx) => (
                      <tr key={row.id}>
                        <td data-label="#" style={{ padding: '8px 4px' }}>{idx + 1}</td>
                        <td data-label="Date" style={{ padding: '8px 6px', fontSize: '11px' }}>{row.date}</td>
                        <td data-label="Pay By (Payer / Account) *" style={{ padding: '8px 6px' }}>
                          <button
                            type="button"
                            onClick={() => openPersonBreakdown(row.customerName)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ea580c',
                              fontWeight: 800,
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              padding: 0,
                              textAlign: 'left',
                              fontSize: '11px'
                            }}
                            title={`Click to view breakdown statement for ${row.customerName}`}
                          >
                            👤 {row.customerName}
                          </button>
                        </td>
                        <td data-label="Device Model" style={{ padding: '8px 6px', fontWeight: 700 }}>{row.brand} {row.model}</td>
                        <td data-label="Purchased Amount (Paid ₹) *" style={{ padding: '8px 6px', fontWeight: 700 }}><CurrencyAmount amount={row.totalAmount} /></td>
                        <td data-label="Paid Amount (₹) *" style={{ padding: '8px 6px', fontWeight: 700, color: '#059669' }}><CurrencyAmount amount={row.paidAmount} /></td>
                        <td data-label="Pending Amount (₹)" style={{ padding: '8px 6px', fontWeight: 800, color: '#ea580c' }}>
                          <CurrencyAmount amount={row.pendingAmount} />
                        </td>
                        <td data-label="Status" style={{ padding: '8px 6px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, background: '#fff7ed', color: '#ea580c' }}>
                            Pending
                          </span>
                        </td>
                        <td data-label="Payment Mode" style={{ padding: '8px 6px', fontSize: '11px' }}>{row.mode}</td>
                        <td data-label="Action" style={{ padding: '8px 6px' }}>
                          <button onClick={() => handleOpenEquateModal(row)} className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', fontWeight: 700 }}>
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
        </div>
      </div>

      {/* Person Pay Breakdown Statement Modal */}
      {isPersonModalOpen && selectedPersonForBreakdown && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '760px', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  👤 Statement Breakdown: <span style={{ color: '#0284c7' }}>{selectedPersonForBreakdown}</span>
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Detailed statement of all receivables, paid amounts, and balance dues for <strong>{selectedPersonForBreakdown}</strong>.
                </p>
              </div>
              <button onClick={() => setIsPersonModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            {/* KPI Cards Summary for this Person */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Transactions</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  ₹{personTotalAmount.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{personTransactions.length} Record(s)</div>
              </div>

              <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>Total Received / Paid</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  ₹{personPaidAmount.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>Collected to date</div>
              </div>

              <div style={{ background: '#fff7ed', padding: '14px', borderRadius: '12px', border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase' }}>Remaining Pending Balance</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
                  ₹{personPendingAmount.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '11px', color: '#c2410c', marginTop: '2px' }}>Dues pending</div>
              </div>
            </div>

            {/* Breakdown Table for this Person */}
            <div className="table-responsive" style={{ marginBottom: '18px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Device / Item</th>
                    <th>Total Price (₹)</th>
                    <th>Paid Amount (₹)</th>
                    <th>Pending Amount (₹)</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {personTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No records found for {selectedPersonForBreakdown}.
                      </td>
                    </tr>
                  ) : (
                    personTransactions.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td>{item.date}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.brand} {item.model}</td>
                        <td>₹{Number(item.totalAmount || 0).toLocaleString()}</td>
                        <td style={{ color: '#059669', fontWeight: 700 }}>₹{Number(item.paidAmount || 0).toLocaleString()}</td>
                        <td style={{ color: Number(item.pendingAmount) > 0 ? '#ea580c' : '#059669', fontWeight: 800 }}>
                          ₹{Number(item.pendingAmount || 0).toLocaleString()}
                        </td>
                        <td>{item.mode || 'Cash'}</td>
                        <td>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: Number(item.pendingAmount) <= 0 ? '#ecfdf5' : '#fff7ed',
                            color: Number(item.pendingAmount) <= 0 ? '#047857' : '#ea580c'
                          }}>
                            {Number(item.pendingAmount) <= 0 ? 'Received' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPersonModalOpen(false);
                              handleOpenEquateModal(item);
                            }}
                            className="btn-primary"
                            style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '6px' }}
                          >
                            Equate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setIsPersonModalOpen(false)} className="btn-secondary" style={{ padding: '8px 20px' }}>
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equate Mobile Payment Modal */}
      {isEquateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '540px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: '12px', backgroundColor: selectedPayment && isAgentPayableItem(selectedPayment) ? '#fff7ed' : '#e0f2fe', color: selectedPayment && isAgentPayableItem(selectedPayment) ? '#ea580c' : '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {selectedPayment 
                      ? (isAgentPayableItem(selectedPayment) ? 'Equate: Book New Device for Exchange' : 'Equate: Sell New Mobile') 
                      : 'Add Payment Entry'}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {selectedPayment 
                      ? 'Equate Paid Amount to Total Selling Price / Purchased Amount.' 
                      : 'Enter new payment details for tracking & equating.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEquateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            {/* Amount Calculation Breakdown Box */}
            {selectedPayment && (() => {
              const modalTotal = Number(selectedPayment.totalAmount) || 0;
              const modalPaid = Math.min(modalTotal, Number(selectedPayment.paidAmount) || 0);
              const modalPending = Math.max(0, modalTotal - modalPaid);
              const isExch = isAgentPayableItem(selectedPayment);

              return (
                <div style={{ background: isExch ? '#fff7ed' : '#f8fafc', padding: '14px', borderRadius: '12px', border: `1px solid ${isExch ? '#fed7aa' : '#e2e8f0'}`, marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: isExch ? '#c2410c' : '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📊 Amount Calculation Breakdown
                    </div>
                    {modalPending === 0 && modalTotal > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 800, background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: '6px' }}>
                        Fully Equated (₹0 Pending)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
                        {isExch ? 'Purchased Amount (Paid ₹)' : 'Total Selling Price (₹)'} *
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        <CurrencyAmount amount={modalTotal} />
                      </div>
                    </div>
                    <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                      <div style={{ fontSize: '10px', color: '#047857', fontWeight: 700 }}>Paid Amount (₹) *</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                        <CurrencyAmount amount={modalPaid} />
                      </div>
                    </div>
                    <div style={{ background: '#fff7ed', padding: '8px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                      <div style={{ fontSize: '10px', color: '#c2410c', fontWeight: 700 }}>Pending Amount (₹)</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                        <CurrencyAmount amount={modalPending} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleEquateSubmit}>
              {!selectedPayment && (
                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Record Type *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setEquateForm({ ...equateForm, recordCategory: 'SELL_MOBILE' })}
                      style={{
                        padding: '9px',
                        borderRadius: '8px',
                        border: equateForm.recordCategory !== 'BOOK_EXCHANGE' ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: equateForm.recordCategory !== 'BOOK_EXCHANGE' ? '#ecfdf5' : '#ffffff',
                        color: equateForm.recordCategory !== 'BOOK_EXCHANGE' ? '#059669' : '#475569',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}
                    >
                      Sell New Mobile
                    </button>
                    <button
                      type="button"
                      onClick={() => setEquateForm({ ...equateForm, recordCategory: 'BOOK_EXCHANGE' })}
                      style={{
                        padding: '9px',
                        borderRadius: '8px',
                        border: equateForm.recordCategory === 'BOOK_EXCHANGE' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                        background: equateForm.recordCategory === 'BOOK_EXCHANGE' ? '#fff7ed' : '#ffffff',
                        color: equateForm.recordCategory === 'BOOK_EXCHANGE' ? '#ea580c' : '#475569',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}
                    >
                      Book Device Exchange
                    </button>
                  </div>
                </div>
              )}

              {/* Name Field (Dynamic: Customer Name vs Pay By / Account) */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {selectedPayment && isAgentPayableItem(selectedPayment) 
                    ? 'Pay By (Payer / Account) * (Name for equating)' 
                    : (equateForm.recordCategory === 'BOOK_EXCHANGE' ? 'Pay By (Payer / Account) * (Name for equating)' : 'Customer Name *')}
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={selectedPayment && isAgentPayableItem(selectedPayment) ? 'Enter Payer / Account name' : 'Enter customer name'} 
                  value={equateForm.customerName} 
                  onChange={(e) => setEquateForm({ ...equateForm, customerName: e.target.value })} 
                  required 
                />
              </div>

              {/* Equated by */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Equated by (Super Admin) *</label>
                <select className="form-control" value={equateForm.equatedBy} onChange={(e) => setEquateForm({ ...equateForm, equatedBy: e.target.value })}>
                  <option value="Jeet">Jeet (Super Admin)</option>
                  <option value="Sonal">Sonal (Super Admin)</option>
                </select>
              </div>

              {/* Installment vs Complete Toggle */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Payment Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setEquateForm({ ...equateForm, paymentType: 'INSTALLMENT', newPay: '' })}
                    style={{
                      padding: '9px',
                      borderRadius: '8px',
                      border: equateForm.paymentType === 'INSTALLMENT' ? '2px solid #0284c7' : '1px solid #cbd5e1',
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
                    <CreditCard size={15} /> Installment
                  </button>
                  <button
                    type="button"
                    onClick={() => setEquateForm({ 
                      ...equateForm, 
                      paymentType: 'COMPLETE', 
                      newPay: selectedPayment ? String(selectedPayment.pendingAmount) : equateForm.pendingPayment 
                    })}
                    style={{
                      padding: '9px',
                      borderRadius: '8px',
                      border: equateForm.paymentType === 'COMPLETE' ? '2px solid #059669' : '1px solid #cbd5e1',
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
                    <CheckCircle size={15} /> Complete (Equate Total)
                  </button>
                </div>
              </div>

              {/* New Pay & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0284c7' }}>Paid Amount (₹) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="₹ Enter paid amount to equate" 
                    value={equateForm.newPay} 
                    onChange={(e) => setEquateForm({ ...equateForm, newPay: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label">Payment Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={equateForm.date} 
                    onChange={(e) => setEquateForm({ ...equateForm, date: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsEquateModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontWeight: 800 }}>Save & Equate</button>
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

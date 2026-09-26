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

  const samplePayments = [];

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
  };

  const pendingList = applyFilters(payments.filter(item => item.status === 'Pending' || item.pendingAmount > 0));
  const receivingList = applyFilters(payments.filter(item => item.status === 'Received' || item.pendingAmount <= 0));

  const totalPendingVal = pendingList.reduce((sum, item) => sum + (item.pendingAmount || 0), 0);
  const totalReceivedVal = receivingList.reduce((sum, item) => sum + (item.paidAmount || 0), 0);

  const handleEquateSubmit = (e) => {
    e.preventDefault();
    const newPayAmt = Number(equateForm.newPay) || 0;
    if (selectedPayment) {
      const updatedList = payments.map(p => {
        if (String(p.id) === String(selectedPayment.id)) {
          const newPaidAmount = (p.paidAmount || 0) + newPayAmt;
          const newPendingAmount = Math.max(0, (p.pendingAmount || 0) - newPayAmt);
          return {
            ...p,
            customerName: equateForm.customerName || p.customerName,
            paidAmount: newPaidAmount,
            pendingAmount: newPendingAmount,
            status: newPendingAmount === 0 ? 'Received' : 'Pending'
          };
        }
        return p;
      });
      savePaymentsToStorage(updatedList);
      alert(`Equated successfully for ${equateForm.customerName || selectedPayment.customerName}! New pay of ₹${newPayAmt.toLocaleString()} recorded.`);
    } else {
      const newPayEntry = {
        id: `PAY-${Date.now()}`,
        date: equateForm.date,
        customerName: equateForm.customerName,
        brand: 'General',
        model: 'Payment Record',
        totalAmount: Number(equateForm.pendingPayment) || newPayAmt,
        paidAmount: newPayAmt,
        pendingAmount: Math.max(0, (Number(equateForm.pendingPayment) || newPayAmt) - newPayAmt),
        status: (Number(equateForm.pendingPayment) || newPayAmt) - newPayAmt <= 0 ? 'Received' : 'Pending',
        mode: 'Cash'
      };
      savePaymentsToStorage([newPayEntry, ...payments]);
      alert(`Payment added successfully for ${equateForm.customerName}!`);
    }
    setIsEquateModalOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['#', 'Date', 'Customer', 'Device Model', 'Total (Rs)', 'Paid (Rs)', 'Pending (Rs)', 'Status', 'Mode'];
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
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Dual-column breakdown for received payments and pending customer receivables.</p>
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
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Person / Customer</label>
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

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={() => { setFromDate(''); setToDate(''); setPersonCustomer('All'); setMobileBrand('All'); }} className="btn-secondary">Clear Filters</button>
        </div>
      </div>

      {/* DUAL COLUMNS SECTION: RECEIVED PAYMENTS (LEFT COLUMN) & PENDING PAYMENTS (RIGHT COLUMN) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* COLUMN 1: RECEIVED PAYMENTS COLUMN */}
        <div className="card-container" style={{ borderTop: '4px solid #059669', background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #a7f3d0', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#065f46', margin: 0 }}>Received Payments Column</h2>
                <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>Completed customer collections ({receivingList.length} items)</span>
              </div>
            </div>

            <div style={{ background: '#ecfdf5', padding: '8px 16px', borderRadius: '10px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#047857' }}>Total Collected:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
                <CurrencyAmount amount={totalReceivedVal} />
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>#</th>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Date</th>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Customer Name</th>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Brand</th>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Model</th>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Total Amount (₹)</th>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Paid Amount (₹)</th>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Pending Amount (₹)</th>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Payment Status</th>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Mode of Payment</th>
                  <th style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {receivingList.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No received payments in this column.
                    </td>
                  </tr>
                ) : (
                  receivingList.map((row, idx) => (
                    <tr key={row.id}>
                      <td data-label="#">{idx + 1}</td>
                      <td data-label="Date">{row.date}</td>
                      <td data-label="Customer" style={{ fontWeight: 700, color: '#0f172a' }}>{row.customerName}</td>
                      <td data-label="Brand" style={{ fontWeight: 600 }}>{row.brand}</td>
                      <td data-label="Model" style={{ fontWeight: 700 }}>{row.model}</td>
                      <td data-label="Total Amount" style={{ fontWeight: 700 }}><CurrencyAmount amount={row.totalAmount} /></td>
                      <td data-label="Paid Amount" style={{ fontWeight: 700, color: '#059669' }}><CurrencyAmount amount={row.paidAmount} /></td>
                      <td data-label="Pending Amount" style={{ fontWeight: 800, color: '#059669' }}>
                        <CurrencyAmount amount={row.pendingAmount} />
                      </td>
                      <td data-label="Status">
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: '#ecfdf5', color: '#047857' }}>
                          Received
                        </span>
                      </td>
                      <td data-label="Payment Mode">{row.mode}</td>
                      <td data-label="Action">
                        <button onClick={() => handleOpenEquateModal(row)} className="btn-secondary" style={{ padding: '5px 14px', fontSize: '12px', borderRadius: '6px', fontWeight: 700 }}>
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

        {/* COLUMN 2: PENDING PAYMENTS COLUMN */}
        <div className="card-container" style={{ borderTop: '4px solid #ea580c', background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #fed7aa', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#9a3412', margin: 0 }}>Pending Payments Column</h2>
                <span style={{ fontSize: '12px', color: '#c2410c', fontWeight: 600 }}>Uncollected customer receivables ({pendingList.length} items)</span>
              </div>
            </div>

            <div style={{ background: '#fff7ed', padding: '8px 16px', borderRadius: '10px', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c' }}>Total Pending Balance:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#c2410c' }}>
                <CurrencyAmount amount={totalPendingVal} />
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>#</th>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>Date</th>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>Customer Name</th>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>Brand</th>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>Model</th>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>Total Amount (₹)</th>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>Paid Amount (₹)</th>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>Pending Amount (₹)</th>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>Payment Status</th>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>Mode of Payment</th>
                  <th style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No pending payments in this column.
                    </td>
                  </tr>
                ) : (
                  pendingList.map((row, idx) => (
                    <tr key={row.id}>
                      <td data-label="#">{idx + 1}</td>
                      <td data-label="Date">{row.date}</td>
                      <td data-label="Customer" style={{ fontWeight: 700, color: '#0f172a' }}>{row.customerName}</td>
                      <td data-label="Brand" style={{ fontWeight: 600 }}>{row.brand}</td>
                      <td data-label="Model" style={{ fontWeight: 700 }}>{row.model}</td>
                      <td data-label="Total Amount" style={{ fontWeight: 700 }}><CurrencyAmount amount={row.totalAmount} /></td>
                      <td data-label="Paid Amount" style={{ fontWeight: 700, color: '#059669' }}><CurrencyAmount amount={row.paidAmount} /></td>
                      <td data-label="Pending Amount" style={{ fontWeight: 800, color: '#ea580c' }}>
                        <CurrencyAmount amount={row.pendingAmount} />
                      </td>
                      <td data-label="Status">
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: '#fff7ed', color: '#ea580c' }}>
                          Pending
                        </span>
                      </td>
                      <td data-label="Payment Mode">{row.mode}</td>
                      <td data-label="Action">
                        <button onClick={() => handleOpenEquateModal(row)} className="btn-primary" style={{ padding: '5px 14px', fontSize: '12px', borderRadius: '6px', fontWeight: 700 }}>
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

      {/* Equate Mobile Modal with Amount Breakdown */}
      {isEquateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Equate Mobile Payment</h2>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Review calculation breakdown & enter new pay amount.</p>
                </div>
              </div>
              <button onClick={() => setIsEquateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            {/* Amount Calculation Breakdown Box */}
            {selectedPayment && (
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  📊 Amount Calculation Breakdown
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                  <div style={{ background: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Amount</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      <CurrencyAmount amount={selectedPayment.totalAmount} />
                    </div>
                  </div>
                  <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>Paid Amount</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                      <CurrencyAmount amount={selectedPayment.paidAmount} />
                    </div>
                  </div>
                  <div style={{ background: '#fff7ed', padding: '8px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '11px', color: '#c2410c', fontWeight: 600 }}>Pending Amount</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                      <CurrencyAmount amount={selectedPayment.pendingAmount} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleEquateSubmit}>
              {/* Customer Name */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Customer Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter customer name" 
                  value={equateForm.customerName} 
                  onChange={(e) => setEquateForm({ ...equateForm, customerName: e.target.value })} 
                  required 
                />
              </div>

              {/* Equated by */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Equated by *</label>
                <select className="form-control" value={equateForm.equatedBy} onChange={(e) => setEquateForm({ ...equateForm, equatedBy: e.target.value })}>
                  <option value="Jeet">Jeet</option>
                  <option value="Sonal">Sonal</option>
                  <option value="Rohit">Rohit</option>
                </select>
              </div>

              {/* Installment vs Complete Toggle */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Payment Mode</label>
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
                    <CheckCircle size={15} /> Complete
                  </button>
                </div>
              </div>

              {/* New Pay & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0284c7' }}>New Pay (₹) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="₹ Enter new pay" 
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

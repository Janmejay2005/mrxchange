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
    paymentMode: 'UPI', // 'Cash', 'UPI', 'Card', 'NetBanking', 'Cheque'
    screenshot: '',
    newPay: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Person Breakdown Modal State
  const [selectedPersonForBreakdown, setSelectedPersonForBreakdown] = useState(null);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);

  // Partner Attribution Breakdown Modal State
  const [selectedPartnerForBreakdown, setSelectedPartnerForBreakdown] = useState(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  const openPartnerBreakdown = (partnerName) => {
    setSelectedPartnerForBreakdown(partnerName || 'Jeet Khubchandani');
    setIsPartnerModalOpen(true);
  };

  const openPersonBreakdown = (customerName) => {
    setSelectedPersonForBreakdown(customerName || 'Customer');
    setIsPersonModalOpen(true);
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEquateForm(prev => ({ ...prev, screenshot: reader.result }));
      };
      reader.readAsDataURL(file);
    }
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
      paymentMode: row ? (row.mode || 'UPI') : 'UPI',
      screenshot: '',
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
  // Paid Amount (₹) * will be zero for Book New Device for Exchange unless manually equated
  const pendingList = applyFilters(
    payments
      .filter(item => isAgentPayableItem(item))
      .map(item => {
        if (!item.isEquatedManual && (item.recordCategory === 'BOOK_EXCHANGE' || String(item.id).startsWith('EXCH-') || String(item.id).startsWith('AGENT-'))) {
          const tot = Number(item.totalAmount || item.purchasedAmount || 0);
          return {
            ...item,
            paidAmount: 0,
            pendingAmount: tot,
            status: tot > 0 ? 'Pending' : 'Received'
          };
        }
        return item;
      })
      .filter(item => Number(item.pendingAmount) > 0)
  );

  const totalPendingVal = pendingList.reduce((sum, item) => sum + (Number(item.pendingAmount) || 0), 0);
  const totalReceivedVal = receivingList.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
  const totalReceivingPendingVal = receivingList.reduce((sum, item) => sum + (Number(item.pendingAmount) || 0), 0);

  // Admin-Wise Partner Attribution calculation
  const partnerAttributionList = React.useMemo(() => {
    const superAdmins = ['Jeet Khubchandani', 'Sonal Wadwani'];
    
    const localInvestments = JSON.parse(localStorage.getItem('mrx_investments') || '[]');
    const localDevices = JSON.parse(localStorage.getItem('mrx_devices') || '[]');
    const localOldInv = JSON.parse(localStorage.getItem('mrx_old_inventory') || '[]');
    const localOldHand = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
    const localSales = JSON.parse(localStorage.getItem('mrx_sales') || '[]');
    
    const allIntake = [...localDevices, ...localOldInv, ...localOldHand];
    
    const totalProfitEarned = localSales.reduce((sum, s) => {
      const sellPrice = Number(s.sellPrice || s.price_per_unit || s.amount || 0);
      const buyPrice = Number(s.purchase_amount || s.amount || 0);
      return sum + Math.max(0, sellPrice - buyPrice);
    }, 0);
    
    const partnerData = superAdmins.map(adminName => {
      const shortName = adminName.split(' ')[0].toLowerCase();
      
      const capitalInv = localInvestments
        .filter(inv => (inv.investor_name || inv.admin_name || '').toLowerCase().includes(shortName))
        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
        
      const deviceInv = allIntake
        .filter(d => (d.paid_by || d.purchasedBy || '').toLowerCase().includes(shortName))
        .reduce((sum, d) => sum + (Number(d.purchase_amount || d.amount) || 0), 0);
        
      const totalInvested = capitalInv + deviceInv;
      return {
        adminName,
        capitalInv,
        deviceInv,
        totalInvested
      };
    });
    
    const combinedTotalInvestment = partnerData.reduce((sum, p) => sum + p.totalInvested, 0);
    
    return partnerData.map(p => {
      const sharePct = combinedTotalInvestment > 0 
        ? Number(((p.totalInvested / combinedTotalInvestment) * 100).toFixed(1)) 
        : 50.0;
      const profitEarned = Math.round(totalProfitEarned * (sharePct / 100));
      const totalValuation = p.totalInvested + profitEarned;
      
      return {
        ...p,
        sharePct,
        profitEarned,
        totalValuation
      };
    });
  }, [payments]);

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

      const historyItem = {
        id: Date.now(),
        date: equateForm.date,
        amount: newPayAmt,
        mode: equateForm.paymentMode || 'UPI',
        screenshot: equateForm.screenshot || '',
        equatedBy: equateForm.equatedBy || 'Jeet'
      };

      const updatedList = payments.map(p => {
        if (String(p.id) === String(selectedPayment.id)) {
          const newPaidAmount = Math.min(currentTotal, existingPaid + newPayAmt);
          const newPendingAmount = Math.max(0, currentTotal - newPaidAmount);
          const newStatus = newPendingAmount === 0 ? 'Received' : 'Pending';
          const existingHistory = p.equateHistory || [];

          return {
            ...p,
            totalAmount: currentTotal,
            customerName: equateForm.customerName || p.customerName,
            paidAmount: newPaidAmount,
            pendingAmount: newPendingAmount,
            status: newStatus,
            mode: equateForm.paymentMode || p.mode || 'UPI',
            equatedBy: equateForm.equatedBy || 'Jeet',
            isEquatedManual: true,
            equateHistory: [historyItem, ...existingHistory]
          };
        }
        return p;
      });
      savePaymentsToStorage(updatedList);

      // Sync equate status to mrx_exchanges if it matches an exchange
      try {
        const storedExchanges = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
        const targetName = (equateForm.customerName || selectedPayment?.customerName || '').toLowerCase();
        const updatedExchanges = storedExchanges.map(ex => {
          const newPayer = (ex.newPurchasedBy || '').toLowerCase();
          const oldPayer = (ex.oldPurchasedBy || '').toLowerCase();
          const custName = (ex.customerName || '').toLowerCase();
          if ((targetName && (newPayer.includes(targetName) || oldPayer.includes(targetName) || custName.includes(targetName))) || String(ex.id) === String(selectedPayment?.id)) {
            const exPaid = (Number(ex.equatedAmount) || 0) + newPayAmt;
            const exTot = Number(ex.newAmount || ex.purchasedAmount || 0);
            return {
              ...ex,
              equatedAmount: exPaid,
              isEquated: exPaid >= exTot,
              equateStatus: exPaid >= exTot ? 'Equated' : 'Partial',
              equatedDate: equateForm.date,
              equatedBy: equateForm.equatedBy || 'Jeet',
              equateHistory: [historyItem, ...(ex.equateHistory || [])]
            };
          }
          return ex;
        });
        localStorage.setItem('mrx_exchanges', JSON.stringify(updatedExchanges));
        window.dispatchEvent(new Event('mrx_exchanges_updated'));
      } catch (e) {}

      alert(`Equated successfully for ${equateForm.customerName || selectedPayment.customerName}! Mode: ${equateForm.paymentMode || 'UPI'}. Transaction recorded.`);
      setIsEquateModalOpen(false);
    } else {
      const isBookExch = equateForm.recordCategory === 'BOOK_EXCHANGE';
      const enteredTotal = Number(equateForm.pendingPayment) || newPayAmt;
      const initialPaid = Math.min(newPayAmt, enteredTotal);
      const calculatedPending = Math.max(0, enteredTotal - initialPaid);

      const historyItem = {
        id: Date.now(),
        date: equateForm.date,
        amount: initialPaid,
        mode: equateForm.paymentMode || 'UPI',
        screenshot: equateForm.screenshot || '',
        equatedBy: equateForm.equatedBy || 'Jeet'
      };

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
        mode: equateForm.paymentMode || 'UPI',
        equatedBy: equateForm.equatedBy || 'Jeet',
        isEquatedManual: true,
        equateHistory: [historyItem]
      };
      savePaymentsToStorage([newPayEntry, ...payments]);
      alert(`New entry & equate saved for ${equateForm.customerName}! Mode: ${equateForm.paymentMode || 'UPI'}.`);
      setIsEquateModalOpen(false);
    }
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

        {/* ADMIN-WISE PARTNER ATTRIBUTION TABLE */}
        <div className="card-container" style={{ marginTop: '24px', background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderTop: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f3e8ff', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircleDollarSign size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#5b21b6', margin: 0 }}>Admin-Wise Partner Attribution Table</h2>
                <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700 }}>
                  Show Capital Invested and Profits Earned by Super Admins
                </span>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#f5f3ff', color: '#5b21b6' }}>#</th>
                  <th style={{ backgroundColor: '#f5f3ff', color: '#5b21b6' }}>Super Admin / Partner Name</th>
                  <th style={{ backgroundColor: '#f5f3ff', color: '#5b21b6', textAlign: 'right' }}>Total Capital Invested (₹)</th>
                  <th style={{ backgroundColor: '#f5f3ff', color: '#5b21b6', textAlign: 'right' }}>Attributed Net Profit (₹)</th>
                  <th style={{ backgroundColor: '#f5f3ff', color: '#5b21b6', textAlign: 'right' }}>Total Valuation / Payout (₹)</th>
                  <th style={{ backgroundColor: '#f5f3ff', color: '#5b21b6', textAlign: 'center' }}>History Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {partnerAttributionList.map((partner, idx) => (
                  <tr key={partner.adminName}>
                    <td style={{ fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      <button 
                        type="button"
                        onClick={() => openPartnerBreakdown(partner.adminName)}
                        style={{ background: 'none', border: 'none', padding: 0, color: '#5b21b6', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}
                        title="Click to view full investment & profit history breakdown"
                      >
                        👤 {partner.adminName}
                      </button>
                      <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 800, marginLeft: '6px' }}>Super Admin</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0284c7' }}>
                      <CurrencyAmount amount={partner.totalInvested} />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                      <CurrencyAmount amount={partner.profitEarned} />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#7c3aed', fontSize: '13px' }}>
                      <CurrencyAmount amount={partner.totalValuation} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => openPartnerBreakdown(partner.adminName)} 
                        className="btn-secondary" 
                        style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', fontWeight: 700, borderColor: '#c4b5fd', color: '#6d28d9', background: '#f5f3ff' }}
                      >
                        📜 Breakdown History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

              {/* Payment Mode Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Payment Mode *</label>
                  <select 
                    className="form-control" 
                    value={equateForm.paymentMode} 
                    onChange={(e) => setEquateForm({ ...equateForm, paymentMode: e.target.value })}
                  >
                    <option value="UPI">UPI Payment</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="NetBanking">Net Banking</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Upload Payment Screenshot Proof</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="form-control" 
                    onChange={handleScreenshotChange}
                    style={{ fontSize: '12px' }} 
                  />
                  {equateForm.screenshot && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={equateForm.screenshot} alt="Screenshot Proof" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>✓ Screenshot Attached</span>
                    </div>
                  )}
                </div>
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

              {/* Equate History Records Table */}
              {selectedPayment && selectedPayment.equateHistory && selectedPayment.equateHistory.length > 0 && (
                <div style={{ marginBottom: '18px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    📜 Previous Equate Transaction History
                  </div>
                  <div className="table-responsive">
                    <table className="custom-table" style={{ fontSize: '11px', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount Paid (₹)</th>
                          <th>Mode</th>
                          <th>Proof</th>
                          <th>Equated By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPayment.equateHistory.map((h, i) => (
                          <tr key={h.id || i}>
                            <td>{h.date}</td>
                            <td style={{ fontWeight: 700, color: '#059669' }}><CurrencyAmount amount={h.amount} /></td>
                            <td><span style={{ padding: '2px 6px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', fontWeight: 700 }}>{h.mode}</span></td>
                            <td>
                              {h.screenshot ? (
                                <img src={h.screenshot} alt="Proof" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }} onClick={() => window.open(h.screenshot, '_blank')} />
                              ) : (
                                <span style={{ color: '#94a3b8' }}>—</span>
                              )}
                            </td>
                            <td style={{ fontWeight: 700 }}>{h.equatedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsEquateModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontWeight: 800 }}>Save & Equate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Attribution Breakdown History Modal */}
      {isPartnerModalOpen && selectedPartnerForBreakdown && (
        <div className="modal-overlay" onClick={() => setIsPartnerModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#5b21b6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📜 Partner History Breakdown: <span style={{ color: '#7c3aed' }}>{selectedPartnerForBreakdown}</span>
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Itemized investment history, intake contributions, and attributed profit share.
                </p>
              </div>
              <button onClick={() => setIsPartnerModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            {(() => {
              const partnerName = selectedPartnerForBreakdown;
              const shortName = partnerName.split(' ')[0].toLowerCase();
              const localInvestments = JSON.parse(localStorage.getItem('mrx_investments') || '[]');
              const localDevices = JSON.parse(localStorage.getItem('mrx_devices') || '[]');
              const localOldInv = JSON.parse(localStorage.getItem('mrx_old_inventory') || '[]');
              const localOldHand = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
              const localSales = JSON.parse(localStorage.getItem('mrx_sales') || '[]');

              const capitalItems = localInvestments.filter(inv => (inv.investor_name || inv.admin_name || '').toLowerCase().includes(shortName));
              const allIntake = [...localDevices, ...localOldInv, ...localOldHand];
              const intakeItems = allIntake.filter(d => (d.paid_by || d.purchasedBy || '').toLowerCase().includes(shortName));

              const totCap = capitalItems.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
              const totIntake = intakeItems.reduce((sum, d) => sum + (Number(d.purchase_amount || d.amount) || 0), 0);
              const totInv = totCap + totIntake;
              const totGrossProfit = localSales.reduce((sum, s) => {
                const sellPrice = Number(s.sellPrice || s.price_per_unit || s.amount || 0);
                const buyPrice = Number(s.purchase_amount || s.amount || 0);
                return sum + Math.max(0, sellPrice - buyPrice);
              }, 0);
              const profitEarned = Math.round(totGrossProfit * 0.5);

              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#f5f3ff', padding: '12px', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                      <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700 }}>Total Invested</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#5b21b6' }}><CurrencyAmount amount={totInv} /></div>
                    </div>
                    <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                      <span style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>Attributed Profit (50%)</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}><CurrencyAmount amount={profitEarned} /></div>
                    </div>
                    <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                      <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>Total Equity Payout</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}><CurrencyAmount amount={totInv + profitEarned} /></div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>📦 Device Intake Investment History ({intakeItems.length} Devices)</h4>
                  <div className="table-responsive" style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                    <table className="custom-table" style={{ fontSize: '11px' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Device Brand & Model</th>
                          <th>Paid By</th>
                          <th style={{ textAlign: 'right' }}>Amount Paid (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {intakeItems.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>No device intake entries recorded for this admin.</td></tr>
                        ) : (
                          intakeItems.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.intake_date || item.date || 'Today'}</td>
                              <td style={{ fontWeight: 700 }}>{item.brand} {item.model}</td>
                              <td>{item.paid_by || item.purchasedBy || partnerName}</td>
                              <td style={{ textAlign: 'right', fontWeight: 800, color: '#0284c7' }}><CurrencyAmount amount={item.purchase_amount || item.amount} /></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>💰 Capital Contribution Records ({capitalItems.length} Entries)</h4>
                  <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table className="custom-table" style={{ fontSize: '11px' }}>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Remarks</th>
                          <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {capitalItems.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>No direct capital entries recorded.</td></tr>
                        ) : (
                          capitalItems.map((inv, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 700 }}>{inv.investment_code || `INV-${idx+1}`}</td>
                              <td>{inv.investment_date || 'Today'}</td>
                              <td><span style={{ padding: '2px 6px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed', fontWeight: 700 }}>{inv.investment_type}</span></td>
                              <td>{inv.remarks || '—'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 800, color: '#7c3aed' }}><CurrencyAmount amount={inv.amount} /></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
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

import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  Percent, 
  Plus, 
  Home, 
  Download, 
  Users, 
  X, 
  Target,
  Smartphone,
  ChevronDown,
  ChevronUp,
  BookOpen,
  UserCheck,
  Tag
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import PdfExportModal from '../components/common/PdfExportModal';

import { expenseService, saleService, deviceService } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function ProfitExpenseAndStatistic() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'profit' | 'expenses' | 'statistics' | 'booking_staff_expenses'
  const [selectedAdmin, setSelectedAdmin] = useState('All Super Admins');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdown option for Booking & Staff Expenses: 'staff' (1. Staff) or 'book' (2. Book)
  const [expenseViewType, setExpenseViewType] = useState('staff');
  const [expandedPayer, setExpandedPayer] = useState(null);

  // Export PDF Dialogue Modal State
  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Add Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'Shop Rent',
    remarks: ''
  });

  const [phoneProfits, setPhoneProfits] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [exchanges, setExchanges] = useState([]);

  const loadData = async () => {
    try {
      const [salesRes, expRes, devRes] = await Promise.all([
        saleService.getSales(),
        expenseService.getExpenses(),
        deviceService.getDevices().catch(() => [])
      ]);
      setPhoneProfits(salesRes.data || []);
      setExpenses(expRes.data || []);

      // Deduplicate and merge Add Inventory devices from API and localStorage
      const localOldInv = JSON.parse(localStorage.getItem('mrx_old_inventory') || '[]');
      const localDev = JSON.parse(localStorage.getItem('mrx_devices') || '[]');
      const apiDev = Array.isArray(devRes) ? devRes : (devRes?.data || []);

      const combinedDevMap = new Map();
      [...localOldInv, ...localDev, ...apiDev].forEach(d => {
        if (d) {
          const key = d.id || d.device_code || `${d.brand}_${d.model}_${d.purchase_amount}_${d.date || d.intake_date}`;
          combinedDevMap.set(String(key), d);
        }
      });
      setAllDevices(Array.from(combinedDevMap.values()));

      // Deduplicate and load Booking / Exchange records
      const localExchanges = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
      const localOldStock = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]').filter(s => s.status === 'Booked');
      const combinedExchMap = new Map();
      [...localExchanges, ...localOldStock].forEach(e => {
        if (e) {
          const key = e.id || e.exchangeId || `${e.newBrand || e.brand}_${e.newModel || e.model}_${e.newAmount || e.purchasedAmount}_${e.date}`;
          combinedExchMap.set(String(key), e);
        }
      });
      setExchanges(Array.from(combinedExchMap.values()));

    } catch (err) {
      console.error("Error loading profit and expense data:", err);
      try {
        setPhoneProfits(JSON.parse(localStorage.getItem('mrx_sales') || '[]'));
        setExpenses(JSON.parse(localStorage.getItem('mrx_expenses') || '[]'));

        const localOldInv = JSON.parse(localStorage.getItem('mrx_old_inventory') || '[]');
        const localDev = JSON.parse(localStorage.getItem('mrx_devices') || '[]');
        const combinedDevMap = new Map();
        [...localOldInv, ...localDev].forEach(d => {
          if (d) {
            const key = d.id || d.device_code || `${d.brand}_${d.model}_${d.purchase_amount}_${d.date || d.intake_date}`;
            combinedDevMap.set(String(key), d);
          }
        });
        setAllDevices(Array.from(combinedDevMap.values()));

        const localExchanges = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
        setExchanges(localExchanges);
      } catch (e) {}
    }
  };

  React.useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('mrx_sales_updated', handleSync);
    window.addEventListener('mrx_expenses_updated', handleSync);
    window.addEventListener('mrx_inventory_updated', handleSync);
    window.addEventListener('mrx_exchanges_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mrx_sales_updated', handleSync);
      window.removeEventListener('mrx_expenses_updated', handleSync);
      window.removeEventListener('mrx_inventory_updated', handleSync);
      window.removeEventListener('mrx_exchanges_updated', handleSync);
    };
  }, []);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingExpense) return;
    setIsSubmittingExpense(true);
    try {
      const adminName = selectedAdmin === 'All Super Admins' ? 'Jeet' : selectedAdmin;
      const expPayload = {
        date: expenseForm.date,
        expense_date: expenseForm.date,
        admin: adminName,
        admin_name: adminName,
        type: expenseForm.type,
        category: expenseForm.type === 'Salary' ? 'SALARY' : (expenseForm.type === 'Repairing Cost' ? 'REPAIRING_COST' : 'OTHER'),
        amount: Number(expenseForm.amount) || 0,
        remarks: expenseForm.remarks || 'Business expense'
      };
      await expenseService.createExpense(expPayload);
      alert('Expense added successfully & synced across all devices!');
      setIsExpenseModalOpen(false);
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'Shop Rent',
        remarks: ''
      });
      await loadData();
    } catch (err) {
      alert('Failed to add expense: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmittingExpense(false);
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

  const filteredProfits = phoneProfits.filter(p => {
    if (selectedAdmin !== 'All Super Admins' && p.admin !== selectedAdmin) return false;
    if (selectedDate) {
      const pYMD = toYMD(p.date);
      const selYMD = toYMD(selectedDate);
      if (pYMD && selYMD && pYMD !== selYMD) return false;
    }
    if (fromDate) {
      const pYMD = toYMD(p.date);
      const fYMD = toYMD(fromDate);
      if (pYMD && fYMD && pYMD < fYMD) return false;
    }
    if (toDate) {
      const pYMD = toYMD(p.date);
      const tYMD = toYMD(toDate);
      if (pYMD && tYMD && pYMD > tYMD) return false;
    }
    const q = (globalSearch || '').trim().toLowerCase();
    if (q) {
      const matchModel = (p.model || '').toLowerCase().includes(q);
      const matchBrand = (p.brand || '').toLowerCase().includes(q);
      if (!matchModel && !matchBrand) return false;
    }
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (selectedAdmin !== 'All Super Admins' && e.admin !== selectedAdmin) return false;
    if (selectedDate) {
      const eYMD = toYMD(e.date);
      const selYMD = toYMD(selectedDate);
      if (eYMD && selYMD && eYMD !== selYMD) return false;
    }
    if (fromDate) {
      const eYMD = toYMD(e.date);
      const fYMD = toYMD(fromDate);
      if (eYMD && fYMD && eYMD < fYMD) return false;
    }
    if (toDate) {
      const eYMD = toYMD(e.date);
      const tYMD = toYMD(toDate);
      if (eYMD && tYMD && eYMD > tYMD) return false;
    }
    const q = (globalSearch || '').trim().toLowerCase();
    if (q) {
      const matchType = (e.type || '').toLowerCase().includes(q);
      const matchRemarks = (e.remarks || '').toLowerCase().includes(q);
      if (!matchType && !matchRemarks) return false;
    }
    return true;
  });

  const filteredDevices = allDevices.filter(d => {
    if (selectedAdmin !== 'All Super Admins' && (d.paid_by || d.purchasedBy) !== selectedAdmin) return false;
    if (selectedDate) {
      const dYMD = toYMD(d.intake_date || d.date || d.created_at);
      const selYMD = toYMD(selectedDate);
      if (dYMD && selYMD && dYMD !== selYMD) return false;
    }
    if (fromDate) {
      const dYMD = toYMD(d.intake_date || d.date || d.created_at);
      const fYMD = toYMD(fromDate);
      if (dYMD && fYMD && dYMD < fYMD) return false;
    }
    if (toDate) {
      const dYMD = toYMD(d.intake_date || d.date || d.created_at);
      const tYMD = toYMD(toDate);
      if (dYMD && tYMD && dYMD > tYMD) return false;
    }
    const q = (globalSearch || '').trim().toLowerCase();
    if (q) {
      const matchModel = (d.model || '').toLowerCase().includes(q);
      const matchBrand = (d.brand || '').toLowerCase().includes(q);
      const matchPayer = (d.paid_by || d.purchasedBy || '').toLowerCase().includes(q);
      const matchColor = (d.color || d.colour || '').toLowerCase().includes(q);
      if (!matchModel && !matchBrand && !matchPayer && !matchColor) return false;
    }
    return true;
  });

  // 1. Investment = Total amount of devices entered in Add Inventory
  const totalInvestment = filteredDevices.reduce((sum, d) => sum + (Number(d.purchase_amount || d.amount || d.paidAmount) || 0), 0);

  // 2. Selling = Data sum from selling devices in new in hand inventory
  const totalSelling = filteredProfits.reduce((sum, p) => sum + (Number(p.selling || p.selling_price) || 0), 0);

  // 3. Profit = Sold price from new in hand - (repair cost + bought cost)
  const totalProfit = filteredProfits.reduce((sum, p) => {
    const sellPrice = Number(p.selling || p.selling_price) || 0;
    const boughtCost = Number(p.purchase || p.purchase_amount) || 0;
    const repairCost = Number(p.repair_cost || p.repairCost) || 0;
    const calculatedProfit = p.profit !== undefined && p.repair_cost === undefined ? Number(p.profit) : (sellPrice - (boughtCost + repairCost));
    return sum + calculatedProfit;
  }, 0);

  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const finalProfit = totalProfit - totalExpensesAmount;
  const roi = totalInvestment > 0 ? ((finalProfit / totalInvestment) * 100).toFixed(2) : '0.00';

  // -------------------------------------------------------------
  // AGGREGATION 1: STAFF EXPENSES (Add Inventory Payers)
  // -------------------------------------------------------------
  const staffGroups = {};
  filteredDevices.forEach(d => {
    const rawPayer = (d.paid_by || d.purchasedBy || d.paidBy || d.admin || 'General Staff').trim();
    const payer = rawPayer.charAt(0).toUpperCase() + rawPayer.slice(1);
    if (!staffGroups[payer]) {
      staffGroups[payer] = {
        payerName: payer,
        totalAmountPaid: 0,
        mobileCount: 0,
        mobiles: []
      };
    }
    const amount = Number(d.purchase_amount || d.amount || d.paidAmount || 0);
    staffGroups[payer].totalAmountPaid += amount;
    staffGroups[payer].mobileCount += 1;
    staffGroups[payer].mobiles.push({
      id: d.id || d.device_code || Math.random().toString(),
      brand: d.brand || 'Unknown Brand',
      model: d.model || 'Unknown Model',
      ram: d.ram ? `${d.ram} GB` : '-',
      storage: d.storage ? `${d.storage} GB` : '-',
      color: d.color || d.colour || '-',
      amount: amount,
      date: d.date || d.intake_date || d.created_at || '-',
      remarks: d.remarks || d.accessories || d.condition || 'No remarks',
      status: d.status || 'Active in Inventory',
      image: d.image_url || (Array.isArray(d.images) && d.images[0]) || ''
    });
  });

  const staffAggregatedList = Object.values(staffGroups).sort((a, b) => b.totalAmountPaid - a.totalAmountPaid);
  const totalStaffPaidAmount = staffAggregatedList.reduce((sum, s) => sum + s.totalAmountPaid, 0);
  const totalStaffMobilesCount = staffAggregatedList.reduce((sum, s) => sum + s.mobileCount, 0);

  // -------------------------------------------------------------
  // AGGREGATION 2: BOOK EXPENSES (Booking / Exchange Payers)
  // -------------------------------------------------------------
  const filteredExchanges = exchanges.filter(e => {
    if (selectedAdmin !== 'All Super Admins' && (e.newPurchasedBy || e.oldPurchasedBy || e.paid_by) !== selectedAdmin) return false;
    if (selectedDate) {
      const eYMD = toYMD(e.date || e.bookingDate);
      const selYMD = toYMD(selectedDate);
      if (eYMD && selYMD && eYMD !== selYMD) return false;
    }
    if (fromDate) {
      const eYMD = toYMD(e.date || e.bookingDate);
      const fYMD = toYMD(fromDate);
      if (eYMD && fYMD && eYMD < fYMD) return false;
    }
    if (toDate) {
      const eYMD = toYMD(e.date || e.bookingDate);
      const tYMD = toYMD(toDate);
      if (eYMD && tYMD && eYMD > tYMD) return false;
    }
    const q = (globalSearch || '').trim().toLowerCase();
    if (q) {
      const matchPayer = (e.newPurchasedBy || e.newPayBy || e.paid_by || e.customerName || e.oldPurchasedBy || '').toLowerCase().includes(q);
      const matchNewBrand = (e.newBrand || e.brand || '').toLowerCase().includes(q);
      const matchNewModel = (e.newModel || e.model || '').toLowerCase().includes(q);
      const matchOldBrand = (e.oldBrand || '').toLowerCase().includes(q);
      const matchOldModel = (e.oldModel || '').toLowerCase().includes(q);
      const matchPlatform = (e.platform || '').toLowerCase().includes(q);
      if (!matchPayer && !matchNewBrand && !matchNewModel && !matchOldBrand && !matchOldModel && !matchPlatform) return false;
    }
    return true;
  });

  const bookGroups = {};
  filteredExchanges.forEach(e => {
    const rawPayBy = (e.newPurchasedBy || e.newPayBy || e.paid_by || e.customerName || e.oldPurchasedBy || e.soldBy || 'General Booking').trim();
    const payBy = rawPayBy.charAt(0).toUpperCase() + rawPayBy.slice(1);
    if (!bookGroups[payBy]) {
      bookGroups[payBy] = {
        payByName: payBy,
        totalAmountPaid: 0,
        totalExchangeValue: 0,
        mobileCount: 0,
        mobiles: []
      };
    }
    const amount = Number(e.newAmount !== undefined && e.newAmount !== '' ? e.newAmount : (e.purchasedAmount || e.amount || 0));
    const exVal = Number(e.exchangeValue || 0);
    bookGroups[payBy].totalAmountPaid += amount;
    bookGroups[payBy].totalExchangeValue += exVal;
    bookGroups[payBy].mobileCount += 1;
    bookGroups[payBy].mobiles.push({
      id: e.id || e.exchangeId || Math.random().toString(),
      newBrand: e.newBrand || e.brand || 'Unknown Brand',
      newModel: e.newModel || e.model || 'Unknown Model',
      newRam: e.newRam ? `${e.newRam} GB` : (e.ram ? `${e.ram} GB` : '-'),
      newStorage: e.newStorage ? `${e.newStorage} GB` : (e.storage ? `${e.storage} GB` : '-'),
      oldBrand: e.oldBrand || '-',
      oldModel: e.oldModel || '-',
      purchasedAmount: amount,
      exchangeValue: exVal,
      platform: e.platform || 'Offline / Store',
      platformRemarks: e.platformRemarks || e.remarks || '-',
      via: e.via || e.paymentType || 'Cash',
      accountId: e.accountId || e.utr || '-',
      date: e.date || e.bookingDate || '-',
      status: e.status || 'Booked'
    });
  });

  const bookAggregatedList = Object.values(bookGroups).sort((a, b) => b.totalAmountPaid - a.totalAmountPaid);
  const totalBookPaidAmount = bookAggregatedList.reduce((sum, b) => sum + b.totalAmountPaid, 0);
  const totalBookMobilesCount = bookAggregatedList.reduce((sum, b) => sum + b.mobileCount, 0);
  const totalBookExchangeValue = bookAggregatedList.reduce((sum, b) => sum + b.totalExchangeValue, 0);

  // PDF Export Handlers
  const openProfitExport = () => {
    const headers = ['#', 'Date', 'Admin', 'Model', 'Brand', 'Purchase Price (Rs)', 'Selling Price (Rs)', 'Profit (Rs)'];
    const rows = filteredProfits.map((item, idx) => [
      idx + 1,
      item.date,
      item.admin,
      item.model,
      item.brand,
      `Rs. ${Number(item.purchase || 0).toLocaleString()}`,
      `Rs. ${Number(item.selling || 0).toLocaleString()}`,
      `Rs. ${Number(item.profit || 0).toLocaleString()}`
    ]);
    setExportModalConfig({
      isOpen: true,
      title: 'Phone-wise Profit Report',
      headers,
      rows,
      filename: `Phone_Profit_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Profit', value: `Rs. ${totalProfit.toLocaleString()}`, color: '#16a34a' },
        { label: 'Total Sales', value: `Rs. ${totalSelling.toLocaleString()}`, color: '#0284c7' }
      ]
    });
  };

  const openExpensesExport = () => {
    const headers = ['#', 'Date', 'Admin', 'Type', 'Amount (Rs)', 'Remarks'];
    const rows = filteredExpenses.map((exp, idx) => [
      idx + 1,
      exp.date,
      exp.admin,
      exp.type,
      `Rs. ${Number(exp.amount || 0).toLocaleString()}`,
      exp.remarks || '-'
    ]);
    setExportModalConfig({
      isOpen: true,
      title: 'Expenses Register Report',
      headers,
      rows,
      filename: `Expenses_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Expenses', value: `Rs. ${totalExpensesAmount.toLocaleString()}`, color: '#ea580c' }
      ]
    });
  };

  const openStaffExport = () => {
    const headers = ['#', 'Staff / Payer Name', 'Total Mobiles Paid', 'Total Amount Paid (Rs)', 'Devices Summary'];
    const rows = staffAggregatedList.map((s, idx) => [
      idx + 1,
      s.payerName,
      s.mobileCount,
      `Rs. ${s.totalAmountPaid.toLocaleString()}`,
      s.mobiles.map(m => `${m.brand} ${m.model} (Rs. ${m.amount.toLocaleString()})`).join(', ')
    ]);
    setExportModalConfig({
      isOpen: true,
      title: 'Staff Add Inventory Payments Report',
      headers,
      rows,
      filename: `Staff_Inventory_Payments_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Staff Outflow', value: `Rs. ${totalStaffPaidAmount.toLocaleString()}`, color: '#059669' },
        { label: 'Total Mobiles Paid', value: `${totalStaffMobilesCount} Units`, color: '#0284c7' },
        { label: 'Staff Count', value: `${staffAggregatedList.length} Persons`, color: '#64748b' }
      ]
    });
  };

  const openBookExport = () => {
    const headers = ['#', 'Pay By / Agent Name', 'Total Mobiles Booked', 'Purchased Amount Paid (Rs)', 'Exchange Value (Rs)', 'Booking Details'];
    const rows = bookAggregatedList.map((b, idx) => [
      idx + 1,
      b.payByName,
      b.mobileCount,
      `Rs. ${b.totalAmountPaid.toLocaleString()}`,
      `Rs. ${b.totalExchangeValue.toLocaleString()}`,
      b.mobiles.map(m => `${m.newBrand} ${m.newModel} (Rs. ${m.purchasedAmount.toLocaleString()})`).join(', ')
    ]);
    setExportModalConfig({
      isOpen: true,
      title: 'Booking Payments & Purchased Amount Report',
      headers,
      rows,
      filename: `Book_Payments_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Purchased Paid', value: `Rs. ${totalBookPaidAmount.toLocaleString()}`, color: '#0284c7' },
        { label: 'Total Mobiles Booked', value: `${totalBookMobilesCount} Units`, color: '#16a34a' },
        { label: 'Total Exchange Value', value: `Rs. ${totalBookExchangeValue.toLocaleString()}`, color: '#8b5cf6' }
      ]
    });
  };

  const barChartData = {
    labels: ['Investment', 'Selling Amount', 'Profit', 'Expenses', 'Final Profit'],
    datasets: [
      {
        label: 'Amount (in ₹)',
        data: [totalInvestment, totalSelling, totalProfit, totalExpensesAmount, finalProfit],
        backgroundColor: ['#2563eb', '#16a34a', '#0284c7', '#ea580c', '#ec4899'],
        borderRadius: 6,
      }
    ]
  };

  const doughnutData = {
    labels: ['Investment', 'Selling Amount', 'Total Profit', 'Total Expenses', 'Final Profit'],
    datasets: [
      {
        data: [totalInvestment, totalSelling, totalProfit, totalExpensesAmount, Math.max(0, finalProfit)],
        backgroundColor: ['#0284c7', '#16a34a', '#8b5cf6', '#ea580c', '#ec4899'],
        borderWidth: 0,
      }
    ]
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Profit, Expense and Statistic</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Track investment, expenses, profit and overall business performance.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
          <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Profit, Expense and Statistic</span>
        </div>
      </div>

      {/* Top Bar with Super Admin Selector */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Select Super Admin</label>
          <select 
            className="form-control" 
            value={selectedAdmin} 
            onChange={(e) => setSelectedAdmin(e.target.value)}
            style={{ width: '220px', padding: '7px 12px', fontWeight: 700 }}
          >
            <option>All Super Admins</option>
            <option>Aadarsh Sharma</option>
            <option>Rohit Kumar</option>
            <option>Neha Patel</option>
            <option>Vikram Singh</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>From Date</label>
          <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '160px', padding: '7px 12px' }} />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>To Date</label>
          <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '160px', padding: '7px 12px' }} />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={() => { setSelectedAdmin('All Super Admins'); setFromDate(''); setToDate(''); }} className="btn-secondary">Clear</button>
          <button className="btn-primary">Apply</button>
        </div>
      </div>

      {/* Tabulation Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'overview' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'overview' ? '3px solid #0284c7' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <BarChart2 size={16} /> All Overview
        </button>

        <button
          onClick={() => setActiveTab('profit')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'profit' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'profit' ? '3px solid #0284c7' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <TrendingUp size={16} /> Phone-wise Profit
          <span style={{ background: activeTab === 'profit' ? '#0284c7' : '#e2e8f0', color: activeTab === 'profit' ? '#ffffff' : '#64748b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
            {filteredProfits.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'expenses' ? '#ea580c' : '#64748b',
            borderBottom: activeTab === 'expenses' ? '3px solid #ea580c' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Wallet size={16} /> Expenses Register
          <span style={{ background: activeTab === 'expenses' ? '#ea580c' : '#e2e8f0', color: activeTab === 'expenses' ? '#ffffff' : '#64748b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
            {filteredExpenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('statistics')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'statistics' ? '#8b5cf6' : '#64748b',
            borderBottom: activeTab === 'statistics' ? '3px solid #8b5cf6' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Target size={16} /> Statistics & Analytics
        </button>

        <button
          onClick={() => setActiveTab('booking_staff_expenses')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'booking_staff_expenses' ? '#059669' : '#64748b',
            borderBottom: activeTab === 'booking_staff_expenses' ? '3px solid #059669' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Users size={16} /> Booking & Staff Expenses
          <span style={{ background: activeTab === 'booking_staff_expenses' ? '#059669' : '#e2e8f0', color: activeTab === 'booking_staff_expenses' ? '#ffffff' : '#64748b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
            {staffAggregatedList.length + bookAggregatedList.length}
          </span>
        </button>
      </div>

      {/* ----------------- TAB: ALL OVERVIEW ----------------- */}
      {activeTab === 'overview' && (
        <>
          {/* Main 5 Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '18px', borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Investment</span>
                <div style={{ background: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '10px' }}><Wallet size={20} /></div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
                <CurrencyAmount amount={totalInvestment} />
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{filteredDevices.length} Mobiles in Add Inventory</span>
            </div>

            <div className="card" style={{ padding: '18px', borderLeft: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Selling Amount</span>
                <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '8px', borderRadius: '10px' }}><DollarSign size={20} /></div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
                <CurrencyAmount amount={totalSelling} />
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>From sold devices in new stock</span>
            </div>

            <div className="card" style={{ padding: '18px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Profit</span>
                <div style={{ background: '#f0f9ff', color: '#0284c7', padding: '8px', borderRadius: '10px' }}><TrendingUp size={20} /></div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
                <CurrencyAmount amount={totalProfit} />
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sold price - (bought + repair)</span>
            </div>

            <div className="card" style={{ padding: '18px', borderLeft: '4px solid #ea580c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Expenses</span>
                <div style={{ background: '#fff7ed', color: '#ea580c', padding: '8px', borderRadius: '10px' }}><DollarSign size={20} /></div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
                <CurrencyAmount amount={totalExpensesAmount} />
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{filteredExpenses.length} Expense entries</span>
            </div>

            <div className="card" style={{ padding: '18px', borderLeft: `4px solid ${finalProfit >= 0 ? '#10b981' : '#ef4444'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Final Profit</span>
                <div style={{ background: finalProfit >= 0 ? '#ecfdf5' : '#fef2f2', color: finalProfit >= 0 ? '#10b981' : '#ef4444', padding: '8px', borderRadius: '10px' }}><Percent size={20} /></div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: finalProfit >= 0 ? '#10b981' : '#ef4444', margin: '8px 0 2px' }}>
                <CurrencyAmount amount={finalProfit} />
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Profit - Expenses | ROI: {roi}%</span>
            </div>
          </div>

          {/* Dual Table View */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Phone Profits</h3>
                <button onClick={() => setActiveTab('profit')} style={{ color: '#0284c7', background: 'none', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>View All</button>
              </div>
              <div className="table-responsive">
                <table className="custom-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Model</th>
                      <th>Profit (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfits.slice(0, 5).map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td>{p.date}</td>
                        <td style={{ fontWeight: 600 }}>{p.model}</td>
                        <td style={{ fontWeight: 700, color: '#16a34a' }}><CurrencyAmount amount={p.profit} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Expenses</h3>
                <button onClick={() => setActiveTab('expenses')} style={{ color: '#ea580c', background: 'none', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>View All</button>
              </div>
              <div className="table-responsive">
                <table className="custom-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.slice(0, 5).map((e, idx) => (
                      <tr key={e.id || idx}>
                        <td>{e.date}</td>
                        <td><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: '#fff7ed', color: '#ea580c', fontWeight: 600 }}>{e.type}</span></td>
                        <td style={{ fontWeight: 700, color: '#ef4444' }}><CurrencyAmount amount={e.amount} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ----------------- TAB: PHONE-WISE PROFIT ----------------- */}
      {activeTab === 'profit' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Phone-wise Profit Records</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>Showing all sold devices and calculated margins.</p>
            </div>
            <button onClick={openProfitExport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={15} /> Export PDF Report
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Super Admin</th>
                  <th>Brand & Model</th>
                  <th>Bought Cost (₹)</th>
                  <th>Sold Price (₹)</th>
                  <th>Net Profit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfits.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No profit records found.</td></tr>
                ) : (
                  filteredProfits.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{idx + 1}</td>
                      <td>{item.date}</td>
                      <td style={{ fontWeight: 600 }}>{item.admin}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.model}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{item.brand}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#475569' }}><CurrencyAmount amount={item.purchase} /></td>
                      <td style={{ fontWeight: 700, color: '#0284c7' }}><CurrencyAmount amount={item.selling} /></td>
                      <td style={{ fontWeight: 800, color: item.profit >= 0 ? '#16a34a' : '#ef4444' }}>
                        <CurrencyAmount amount={item.profit} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB: EXPENSES REGISTER ----------------- */}
      {activeTab === 'expenses' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Expenses Register</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>Log of rent, payroll, repair costs, and miscellaneous disbursements.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Add Expense
              </button>
              <button onClick={openExpensesExport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={15} /> Export PDF Report
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Admin</th>
                  <th>Expense Type</th>
                  <th>Amount (₹)</th>
                  <th>Remarks / Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No expenses found.</td></tr>
                ) : (
                  filteredExpenses.map((exp, idx) => (
                    <tr key={exp.id || idx}>
                      <td>{idx + 1}</td>
                      <td>{exp.date}</td>
                      <td style={{ fontWeight: 600 }}>{exp.admin}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                          {exp.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#ef4444' }}>
                        <CurrencyAmount amount={exp.amount} />
                      </td>
                      <td style={{ color: '#64748b' }}>{exp.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB: STATISTICS & ANALYTICS ----------------- */}
      {activeTab === 'statistics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Financial Breakdown (Bar View)</h3>
            <div style={{ height: '280px' }}>
              <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Capital Allocation (Doughnut View)</h3>
            <div style={{ height: '280px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: BOOKING & STAFF EXPENSES (DROPDOWN + DETAILS) ----------------- */}
      {activeTab === 'booking_staff_expenses' && (
        <div className="card" style={{ padding: '24px' }}>
          {/* Header with Title and Mode Selector Dropdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: expenseViewType === 'staff' ? '#ecfdf5' : '#eff6ff', color: expenseViewType === 'staff' ? '#059669' : '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${expenseViewType === 'staff' ? '#a7f3d0' : '#bfdbfe'}` }}>
                {expenseViewType === 'staff' ? <Users size={26} /> : <BookOpen size={26} />}
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {expenseViewType === 'staff' ? 'Staff Expenses (Add Inventory Payers)' : 'Book Expenses (Booking & Exchange Payers)'}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0' }}>
                  {expenseViewType === 'staff'
                    ? 'Summary of who paid in Add Inventory, total amount paid, and number of mobiles paid (additive per person).'
                    : 'Summary of booking agents / payers who paid for booked devices, total purchased amount, and mobiles count (additive per person).'
                  }
                </p>
              </div>
            </div>

            {/* Dropdown Selector + Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>Select View:</span>
                <select 
                  className="form-control"
                  value={expenseViewType}
                  onChange={(e) => {
                    setExpenseViewType(e.target.value);
                    setExpandedPayer(null);
                  }}
                  style={{ fontWeight: 800, padding: '6px 12px', fontSize: '13px', width: '250px', borderColor: expenseViewType === 'staff' ? '#059669' : '#0284c7', color: expenseViewType === 'staff' ? '#059669' : '#0284c7', cursor: 'pointer' }}
                >
                  <option value="staff">1. Staff (Add Inventory)</option>
                  <option value="book">2. Book (Booking / Exchange)</option>
                </select>
              </div>

              <button 
                onClick={expenseViewType === 'staff' ? openStaffExport : openBookExport} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontWeight: 700 }}
              >
                <Download size={15} /> Export PDF
              </button>
            </div>
          </div>

          {/* ----------------- SUB-VIEW: 1. STAFF EXPENSES ----------------- */}
          {expenseViewType === 'staff' && (
            <div>
              {/* KPI Summary Cards for Staff View */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f0fdf4', padding: '18px', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>Total Staff Paid Amount</span>
                    <Wallet size={18} color="#15803d" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#166534', marginTop: '6px' }}>
                    <CurrencyAmount amount={totalStaffPaidAmount} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#15803d' }}>Cumulative payout across all staff</span>
                </div>

                <div style={{ background: '#f0f9ff', padding: '18px', borderRadius: '14px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1' }}>Total Mobiles Paid</span>
                    <Smartphone size={18} color="#0369a1" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#0c4a6e', marginTop: '6px' }}>
                    {totalStaffMobilesCount} <span style={{ fontSize: '14px', fontWeight: 600 }}>Mobiles</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#0369a1' }}>Total units entered in Add Inventory</span>
                </div>

                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Active Staff Payers</span>
                    <UserCheck size={18} color="#475569" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                    {staffAggregatedList.length} <span style={{ fontSize: '14px', fontWeight: 600 }}>Members</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Unique persons recording devices</span>
                </div>

                <div style={{ background: '#fdf4ff', padding: '18px', borderRadius: '14px', border: '1px solid #f5d0fe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#a21caf' }}>Avg. Outflow Per Mobile</span>
                    <Tag size={18} color="#a21caf" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#701a75', marginTop: '6px' }}>
                    ₹ {totalStaffMobilesCount > 0 ? Math.round(totalStaffPaidAmount / totalStaffMobilesCount).toLocaleString() : '0'}
                  </div>
                  <span style={{ fontSize: '11px', color: '#a21caf' }}>Average purchase cost per phone</span>
                </div>
              </div>

              {/* Staff Records Aggregated List */}
              <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Staff Members Overview ({staffAggregatedList.length})
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  💡 Click any staff card or row to view the full breakdown of mobiles they paid for
                </span>
              </div>

              {staffAggregatedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Users size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#475569' }}>No Staff Inventory Payment Records Found</div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Mobiles added via Add Inventory will automatically appear and aggregate here by staff payer name.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {staffAggregatedList.map((staff, idx) => {
                    const isExpanded = expandedPayer === `staff_${staff.payerName}`;
                    return (
                      <div 
                        key={`staff_${staff.payerName}_${idx}`} 
                        style={{ 
                          borderRadius: '12px', 
                          border: isExpanded ? '2px solid #059669' : '1px solid #e2e8f0', 
                          background: '#ffffff', 
                          boxShadow: isExpanded ? '0 4px 12px rgba(5, 150, 105, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                          transition: 'all 0.2s ease',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Summary Header Row */}
                        <div 
                          onClick={() => setExpandedPayer(isExpanded ? null : `staff_${staff.payerName}`)}
                          style={{ 
                            padding: '16px 20px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            background: isExpanded ? '#f0fdf4' : '#ffffff'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px' }}>
                              {staff.payerName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                                {staff.payerName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                Total Mobiles Paid: <strong style={{ color: '#0284c7' }}>{staff.mobileCount}</strong> {staff.mobileCount === 1 ? 'Mobile' : 'Mobiles (Additive)'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Amount Paid</span>
                              <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>
                                <CurrencyAmount amount={staff.totalAmountPaid} />
                              </div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: isExpanded ? '#059669' : '#f1f5f9', color: isExpanded ? '#ffffff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Mobiles Breakdown Table */}
                        {isExpanded && (
                          <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e2e8f0', background: '#fafafa' }}>
                            <div style={{ padding: '14px 0 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                                📱 Mobiles Paid by {staff.payerName} ({staff.mobiles.length})
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#dcfce7', padding: '3px 10px', borderRadius: '12px' }}>
                                Additive Total: ₹ {staff.totalAmountPaid.toLocaleString()}
                              </span>
                            </div>

                            <div className="table-responsive" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <table className="custom-table" style={{ fontSize: '12px', margin: 0 }}>
                                <thead>
                                  <tr style={{ background: '#f8fafc' }}>
                                    <th>#</th>
                                    <th>Date Added</th>
                                    <th>Brand & Model</th>
                                    <th>Specs (RAM / Storage)</th>
                                    <th>Color</th>
                                    <th>Paid Amount (₹)</th>
                                    <th>Remarks / Accessories</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {staff.mobiles.map((m, mIdx) => (
                                    <tr key={m.id || mIdx}>
                                      <td>{mIdx + 1}</td>
                                      <td>{m.date}</td>
                                      <td>
                                        <strong style={{ color: '#0f172a' }}>{m.brand}</strong> {m.model}
                                      </td>
                                      <td>{m.ram} / {m.storage}</td>
                                      <td>{m.color}</td>
                                      <td style={{ fontWeight: 800, color: '#059669' }}>
                                        <CurrencyAmount amount={m.amount} />
                                      </td>
                                      <td style={{ color: '#64748b' }}>{m.remarks}</td>
                                      <td>
                                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: '#ecfdf5', color: '#047857' }}>
                                          {m.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ----------------- SUB-VIEW: 2. BOOK EXPENSES ----------------- */}
          {expenseViewType === 'book' && (
            <div>
              {/* KPI Summary Cards for Book View */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f0f9ff', padding: '18px', borderRadius: '14px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1' }}>Total Purchased Amount Paid</span>
                    <Wallet size={18} color="#0369a1" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#0c4a6e', marginTop: '6px' }}>
                    <CurrencyAmount amount={totalBookPaidAmount} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#0369a1' }}>Paid amount recorded for bookings</span>
                </div>

                <div style={{ background: '#f5f3ff', padding: '18px', borderRadius: '14px', border: '1px solid #ddd6fe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#6d28d9' }}>Total Mobiles Booked</span>
                    <Smartphone size={18} color="#6d28d9" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#4c1d95', marginTop: '6px' }}>
                    {totalBookMobilesCount} <span style={{ fontSize: '14px', fontWeight: 600 }}>Units</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6d28d9' }}>Total new exchange booking units</span>
                </div>

                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Active Booking Payers</span>
                    <UserCheck size={18} color="#475569" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                    {bookAggregatedList.length} <span style={{ fontSize: '14px', fontWeight: 600 }}>Payers</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Distinct customers / agents</span>
                </div>

                <div style={{ background: '#fdf2f8', padding: '18px', borderRadius: '14px', border: '1px solid #fbcfe8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#be185d' }}>Total Exchange Value</span>
                    <Tag size={18} color="#be185d" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#831843', marginTop: '6px' }}>
                    <CurrencyAmount amount={totalBookExchangeValue} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#be185d' }}>Combined old device trade-in value</span>
                </div>
              </div>

              {/* Book Records Aggregated List */}
              <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Booking Payers Overview ({bookAggregatedList.length})
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  💡 Click any booking card or row to view the full breakdown of booked mobiles and trade-ins
                </span>
              </div>

              {bookAggregatedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <BookOpen size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#475569' }}>No Booking Payment Records Found</div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Bookings created via Book New Device / Exchange will automatically appear and aggregate here by Pay By name.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bookAggregatedList.map((book, idx) => {
                    const isExpanded = expandedPayer === `book_${book.payByName}`;
                    return (
                      <div 
                        key={`book_${book.payByName}_${idx}`} 
                        style={{ 
                          borderRadius: '12px', 
                          border: isExpanded ? '2px solid #0284c7' : '1px solid #e2e8f0', 
                          background: '#ffffff', 
                          boxShadow: isExpanded ? '0 4px 12px rgba(2, 132, 199, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                          transition: 'all 0.2s ease',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Summary Header Row */}
                        <div 
                          onClick={() => setExpandedPayer(isExpanded ? null : `book_${book.payByName}`)}
                          style={{ 
                            padding: '16px 20px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            background: isExpanded ? '#f0f9ff' : '#ffffff'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#bae6fd', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px' }}>
                              {book.payByName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                                {book.payByName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                Total Booked Mobiles: <strong style={{ color: '#0284c7' }}>{book.mobileCount}</strong> {book.mobileCount === 1 ? 'Mobile' : 'Mobiles (Additive)'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Purchased Amount Paid</span>
                              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>
                                <CurrencyAmount amount={book.totalAmountPaid} />
                              </div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: isExpanded ? '#0284c7' : '#f1f5f9', color: isExpanded ? '#ffffff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Booked Mobiles Breakdown Table */}
                        {isExpanded && (
                          <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e2e8f0', background: '#fafafa' }}>
                            <div style={{ padding: '14px 0 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                                📱 Booked Mobiles Paid by {book.payByName} ({book.mobiles.length})
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '3px 10px', borderRadius: '12px' }}>
                                Additive Total: ₹ {book.totalAmountPaid.toLocaleString()}
                              </span>
                            </div>

                            <div className="table-responsive" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <table className="custom-table" style={{ fontSize: '12px', margin: 0 }}>
                                <thead>
                                  <tr style={{ background: '#f8fafc' }}>
                                    <th>#</th>
                                    <th>Booking Date</th>
                                    <th>New Phone (Booked)</th>
                                    <th>Specs (RAM / Storage)</th>
                                    <th>Old Exchanged Device</th>
                                    <th>Purchased Amount (Paid ₹)</th>
                                    <th>Exchange Value (₹)</th>
                                    <th>Platform</th>
                                    <th>Payment Via / Ref</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {book.mobiles.map((m, mIdx) => (
                                    <tr key={m.id || mIdx}>
                                      <td>{mIdx + 1}</td>
                                      <td>{m.date}</td>
                                      <td>
                                        <strong style={{ color: '#0f172a' }}>{m.newBrand}</strong> {m.newModel}
                                      </td>
                                      <td>{m.newRam} / {m.newStorage}</td>
                                      <td style={{ color: '#475569' }}>
                                        {m.oldBrand !== '-' ? `${m.oldBrand} ${m.oldModel}` : 'Direct Purchase'}
                                      </td>
                                      <td style={{ fontWeight: 800, color: '#0284c7' }}>
                                        <CurrencyAmount amount={m.purchasedAmount} />
                                      </td>
                                      <td style={{ fontWeight: 700, color: '#8b5cf6' }}>
                                        <CurrencyAmount amount={m.exchangeValue} />
                                      </td>
                                      <td>
                                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: '#f1f5f9', color: '#334155', fontWeight: 600 }}>
                                          {m.platform}
                                        </span>
                                      </td>
                                      <td style={{ fontSize: '11px', color: '#64748b' }}>
                                        {m.via} {m.accountId !== '-' ? `(${m.accountId})` : ''}
                                      </td>
                                      <td>
                                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' }}>
                                          {m.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Add Expense</h2>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Record a new business expense. This will be included in overall statistics.</p>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleExpenseSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-control" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-control" placeholder="Enter amount" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Expense Type *</label>
                <select className="form-control" value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}>
                  <option>Shop Rent</option>
                  <option>Staff Salary</option>
                  <option>Repair Cost</option>
                  <option>Transport</option>
                  <option>Utilities (Electricity/Internet)</option>
                  <option>Office Expense</option>
                  <option>Marketing</option>
                  <option>Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Remarks</label>
                <textarea className="form-control" rows="3" placeholder="Enter remarks (optional)..." value={expenseForm.remarks} onChange={(e) => setExpenseForm({ ...expenseForm, remarks: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn-secondary">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmittingExpense} 
                  className="btn-primary" 
                  style={{ padding: '10px 24px', opacity: isSubmittingExpense ? 0.6 : 1, cursor: isSubmittingExpense ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmittingExpense ? 'Saving...' : 'Save Expense'}
                </button>
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

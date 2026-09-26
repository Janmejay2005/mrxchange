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
  Target
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import PdfExportModal from '../components/common/PdfExportModal';

import { expenseService, saleService } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function ProfitExpenseAndStatistic() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'profit' | 'expenses' | 'statistics'
  const [selectedAdmin, setSelectedAdmin] = useState('All Super Admins');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'Shop Rent',
    remarks: ''
  });

  const [phoneProfits, setPhoneProfits] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const loadData = async () => {
    try {
      const [salesRes, expRes] = await Promise.all([
        saleService.getSales(),
        expenseService.getExpenses()
      ]);
      setPhoneProfits(salesRes.data || []);
      setExpenses(expRes.data || []);
    } catch (err) {
      console.error("Error loading profit and expense data:", err);
      try {
        setPhoneProfits(JSON.parse(localStorage.getItem('mrx_sales') || '[]'));
        setExpenses(JSON.parse(localStorage.getItem('mrx_expenses') || '[]'));
      } catch (e) {}
    }
  };

  React.useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('mrx_sales_updated', handleSync);
    window.addEventListener('mrx_expenses_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mrx_sales_updated', handleSync);
      window.removeEventListener('mrx_expenses_updated', handleSync);
    };
  }, []);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
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
    loadData();
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
      const matchModel = p.model.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
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
      const matchType = e.type.toLowerCase().includes(q);
      const matchRemarks = (e.remarks || '').toLowerCase().includes(q);
      if (!matchType && !matchRemarks) return false;
    }
    return true;
  });

  const totalInvestment = filteredProfits.reduce((sum, p) => sum + p.purchase, 0);
  const totalSelling = filteredProfits.reduce((sum, p) => sum + p.selling, 0);
  const totalProfit = filteredProfits.reduce((sum, p) => sum + p.profit, 0);
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const finalProfit = totalProfit - totalExpensesAmount;
  const roi = totalInvestment > 0 ? ((finalProfit / totalInvestment) * 100).toFixed(2) : '0.00';

  const openProfitExport = () => {
    const headers = ['#', 'Date', 'Admin', 'Model', 'Brand', 'Purchase Price (Rs)', 'Selling Price (Rs)', 'Profit (Rs)'];
    const rows = filteredProfits.map((item, idx) => [
      idx + 1,
      item.date,
      item.admin,
      item.model,
      item.brand,
      `Rs. ${item.purchase.toLocaleString()}`,
      `Rs. ${item.selling.toLocaleString()}`,
      `Rs. ${item.profit.toLocaleString()}`
    ]);
    setExportModalConfig({
      isOpen: true,
      title: 'Phone-wise Profit Report',
      headers,
      rows,
      filename: `Phone_Profit_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Sales', value: `Rs. ${totalSelling.toLocaleString()}`, color: '#0284c7' },
        { label: 'Total Profit', value: `Rs. ${totalProfit.toLocaleString()}`, color: '#16a34a' }
      ]
    });
  };

  const openExpensesExport = () => {
    const headers = ['#', 'Date', 'Admin', 'Expense Type', 'Amount (Rs)', 'Remarks'];
    const rows = filteredExpenses.map((exp, idx) => [
      idx + 1,
      exp.date,
      exp.admin,
      exp.type,
      `Rs. ${exp.amount.toLocaleString()}`,
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
      </div>      {/* Tabulation Bar */}
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
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#e0f2fe' }}><TrendingUp size={24} color="#0284c7" /></div>
          <div className="kpi-info">
            <span className="kpi-title" style={{ fontSize: '12px' }}>Total Selling Amount</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800 }}>₹ {totalSelling.toLocaleString()}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#f3e8ff' }}><BarChart2 size={24} color="#8b5cf6" /></div>
          <div className="kpi-info">
            <span className="kpi-title" style={{ fontSize: '12px' }}>Total Profit</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6' }}>₹ {totalProfit.toLocaleString()}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#ffedd5' }}><Wallet size={24} color="#ea580c" /></div>
          <div className="kpi-info">
            <span className="kpi-title" style={{ fontSize: '12px' }}>Total Expenses</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c' }}>₹ {totalExpensesAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#fce7f3' }}><DollarSign size={24} color="#ec4899" /></div>
          <div className="kpi-info">
            <span className="kpi-title" style={{ fontSize: '12px' }}>Final Profit</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: '#ec4899' }}>₹ {finalProfit.toLocaleString()}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#dcfce7' }}><Percent size={24} color="#16a34a" /></div>
          <div className="kpi-info">
            <span className="kpi-title" style={{ fontSize: '12px' }}>Return (ROI)</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>{roi}%</span>
          </div>
        </div>
      </div>

      {/* Tab Content: All Overview */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Phone-wise Profit */}
            <div className="card-container" style={{ margin: 0 }}>
              <div className="card-header-flex">
                <h2 className="card-title">Phone-wise Profit</h2>
                <button onClick={openProfitExport} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><Download size={14} /> Export</button>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Model</th>
                      <th>Brand</th>
                      <th>Purchase (₹)</th>
                      <th>Selling (₹)</th>
                      <th>Profit (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfits.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td>{item.date}</td>
                        <td style={{ fontWeight: 700 }}>{item.model}</td>
                        <td>{item.brand}</td>
                        <td>{item.purchase.toLocaleString()}</td>
                        <td>{item.selling.toLocaleString()}</td>
                        <td style={{ fontWeight: 800, color: '#16a34a' }}>{item.profit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expenses */}
            <div className="card-container" style={{ margin: 0 }}>
              <div className="card-header-flex">
                <h2 className="card-title">Expenses</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}><Plus size={14} /> Add Expense</button>
                  <button onClick={openExpensesExport} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><Download size={14} /> Export</button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount (₹)</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp, idx) => (
                      <tr key={exp.id}>
                        <td>{idx + 1}</td>
                        <td>{exp.date}</td>
                        <td style={{ fontWeight: 600, color: '#0284c7' }}>{exp.type}</td>
                        <td style={{ fontWeight: 700 }}><CurrencyAmount amount={exp.amount} /></td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{exp.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab Content: Phone-wise Profit */}
      {activeTab === 'profit' && (
        <div className="card-container" style={{ margin: 0, marginBottom: '24px' }}>
          <div className="card-header-flex">
            <h2 className="card-title">Phone-wise Profit Breakdown ({filteredProfits.length} Records)</h2>
            <button onClick={openProfitExport} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
              <Download size={15} /> Export PDF Report
            </button>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Intake / Sale Date</th>
                  <th>Super Admin</th>
                  <th>Mobile Brand</th>
                  <th>Mobile Model</th>
                  <th>Purchase Price (₹)</th>
                  <th>Selling Price (₹)</th>
                  <th>Profit Margin (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfits.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No phone profit entries match current date and admin filters.
                    </td>
                  </tr>
                ) : (
                  filteredProfits.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>{item.date}</td>
                      <td style={{ color: '#0284c7', fontWeight: 600 }}>{item.admin}</td>
                      <td>{item.brand}</td>
                      <td style={{ fontWeight: 700 }}>{item.model}</td>
                      <td>{item.purchase.toLocaleString()}</td>
                      <td>{item.selling.toLocaleString()}</td>
                      <td style={{ fontWeight: 800, color: '#16a34a', fontSize: '14px' }}>
                        ₹ {item.profit.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Expenses Register */}
      {activeTab === 'expenses' && (
        <div className="card-container" style={{ margin: 0, marginBottom: '24px' }}>
          <div className="card-header-flex">
            <h2 className="card-title">Business Expenses Register ({filteredExpenses.length} Entries)</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                <Plus size={16} /> Add New Expense
              </button>
              <button onClick={openExpensesExport} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                <Download size={15} /> Export PDF
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Expense Date</th>
                  <th>Recorded By</th>
                  <th>Expense Category</th>
                  <th>Amount (₹)</th>
                  <th>Notes & Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No expenses match current date and admin filters.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp, idx) => (
                    <tr key={exp.id}>
                      <td>{idx + 1}</td>
                      <td>{exp.date}</td>
                      <td style={{ color: '#0284c7', fontWeight: 600 }}>{exp.admin}</td>
                      <td style={{ fontWeight: 700, color: '#ea580c' }}>{exp.type}</td>
                      <td style={{ fontWeight: 800, fontSize: '14px' }}><CurrencyAmount amount={exp.amount} /></td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{exp.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Statistics & Analytics (Shown in Overview and Statistics tab) */}
      {(activeTab === 'overview' || activeTab === 'statistics') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          <div className="card-container" style={{ margin: 0 }}>
            <div className="card-header-flex">
              <h2 className="card-title">Statistics & Comparison Bar Chart</h2>
            </div>
            <div style={{ height: '260px' }}>
              <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="card-container" style={{ margin: 0 }}>
            <div className="card-header-flex">
              <h2 className="card-title">Return & Performance Analysis</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '180px', height: '180px', position: 'relative' }}>
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{roi}%</span>
                  <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>ROI</span>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>• Total Investment</span> <strong>₹ {totalInvestment.toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>• Total Selling Amount</span> <strong>₹ {totalSelling.toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>• Gross Profit</span> <strong>₹ {totalProfit.toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>• Total Expenses</span> <strong>₹ {totalExpensesAmount.toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>• Final Net Profit</span> <strong style={{ color: '#ec4899' }}>₹ {finalProfit.toLocaleString()}</strong>
                </div>

                {/* Business Insight Card */}
                <div style={{ marginTop: '12px', padding: '12px', background: '#e0f2fe', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#0284c7', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                    <Target size={16} /> Business Insight
                  </div>
                  <p style={{ fontSize: '11px', color: '#0369a1', margin: 0 }}>You are getting {roi}% return on your investment. Healthy profit margin across registered inventory sales.</p>
                </div>
              </div>
            </div>
          </div>
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
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Save Expense</button>
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

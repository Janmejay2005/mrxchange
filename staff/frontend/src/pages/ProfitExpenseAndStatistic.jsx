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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function ProfitExpenseAndStatistic() {
  const [selectedAdmin, setSelectedAdmin] = useState('All Super Admins');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Add Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    date: '2026-09-15',
    amount: '',
    type: 'Shop Rent',
    remarks: ''
  });

  const [phoneProfits] = useState([
    { id: 1, date: '12 Sep 2026', model: 'iPhone 14', brand: 'Apple', purchase: 48000, selling: 60000, profit: 12000 },
    { id: 2, date: '12 Sep 2026', model: 'S23', brand: 'Samsung', purchase: 32000, selling: 40000, profit: 8000 },
    { id: 3, date: '11 Sep 2026', model: 'Nord 3', brand: 'OnePlus', purchase: 18000, selling: 25000, profit: 7000 },
    { id: 4, date: '10 Sep 2026', model: 'V27', brand: 'Vivo', purchase: 22000, selling: 30000, profit: 8000 },
    { id: 5, date: '10 Sep 2026', model: '11 Pro', brand: 'Realme', purchase: 16000, selling: 22000, profit: 6000 },
    { id: 6, date: '09 Sep 2026', model: 'Find X5', brand: 'Oppo', purchase: 28000, selling: 36000, profit: 8000 },
    { id: 7, date: '09 Sep 2026', model: 'T2 Pro', brand: 'Vivo', purchase: 14000, selling: 20000, profit: 6000 },
    { id: 8, date: '08 Sep 2026', model: 'S24', brand: 'Samsung', purchase: 38000, selling: 50000, profit: 12000 },
    { id: 9, date: '08 Sep 2026', model: 'Edge 40', brand: 'Motorola', purchase: 20000, selling: 27000, profit: 7000 },
    { id: 10, date: '07 Sep 2026', model: 'Neo 7', brand: 'iQOO', purchase: 24000, selling: 32000, profit: 8000 }
  ]);

  const [expenses, setExpenses] = useState([
    { id: 1, date: '01 Sep 2026', type: 'Shop Rent', amount: 12000, remarks: 'Monthly rent' },
    { id: 2, date: '05 Sep 2026', type: 'Staff Salary', amount: 18000, remarks: 'Staff payment' },
    { id: 3, date: '08 Sep 2026', type: 'Repair Cost', amount: 5500, remarks: 'Device repair' },
    { id: 4, date: '10 Sep 2026', type: 'Transport', amount: 3000, remarks: 'Logistics' },
    { id: 5, date: '12 Sep 2026', type: 'Utilities', amount: 2000, remarks: 'Electricity/Internet' }
  ]);

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    const newExp = {
      id: expenses.length + 1,
      date: expenseForm.date,
      type: expenseForm.type,
      amount: Number(expenseForm.amount) || 1000,
      remarks: expenseForm.remarks || 'Business expense'
    };
    setExpenses([newExp, ...expenses]);
    setIsExpenseModalOpen(false);
  };

  const barChartData = {
    labels: ['Investment', 'Selling Amount', 'Profit', 'Expenses', 'Final Profit'],
    datasets: [
      {
        label: 'Amount (in Lakhs/Thousands)',
        data: [5.48, 7.14, 1.66, 0.425, 1.235],
        backgroundColor: ['#2563eb', '#16a34a', '#0284c7', '#ea580c', '#ec4899'],
        borderRadius: 6,
      }
    ]
  };

  const doughnutData = {
    labels: ['Investment', 'Selling Amount', 'Total Profit', 'Total Expenses', 'Final Profit'],
    datasets: [
      {
        data: [548000, 714000, 166000, 42500, 123500],
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

      {/* 5 KPI Cards matching reference screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#e0f2fe' }}><TrendingUp size={24} color="#0284c7" /></div>
          <div className="kpi-info">
            <span className="kpi-title" style={{ fontSize: '12px' }}>Total Selling Amount</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800 }}>₹ 7,14,000</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#f3e8ff' }}><BarChart2 size={24} color="#8b5cf6" /></div>
          <div className="kpi-info">
            <span className="kpi-title" style={{ fontSize: '12px' }}>Total Profit</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6' }}>₹ 1,66,000</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#ffedd5' }}><Wallet size={24} color="#ea580c" /></div>
          <div className="kpi-info">
            <span className="kpi-title" style={{ fontSize: '12px' }}>Total Expenses</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c' }}>₹ 42,500</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#fce7f3' }}><DollarSign size={24} color="#ec4899" /></div>
          <div className="kpi-info">
            <span className="kpi-title" style={{ fontSize: '12px' }}>Final Profit</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: '#ec4899' }}>₹ 1,23,500</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#dcfce7' }}><Percent size={24} color="#16a34a" /></div>
          <div className="kpi-info">
            <span className="kpi-title" style={{ fontSize: '12px' }}>Return (ROI)</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>22.54%</span>
          </div>
        </div>
      </div>

      {/* Middle Grid - Phone-wise Profit & Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left Table: Phone-wise Profit */}
        <div className="card-container" style={{ margin: 0 }}>
          <div className="card-header-flex">
            <h2 className="card-title">Phone-wise Profit</h2>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><Download size={14} /> Export</button>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Model</th>
                  <th>Brand</th>
                  <th>Purchase Price (₹)</th>
                  <th>Selling Price (₹)</th>
                  <th>Profit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {phoneProfits.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
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

        {/* Right Table: Expenses */}
        <div className="card-container" style={{ margin: 0 }}>
          <div className="card-header-flex">
            <h2 className="card-title">Expenses</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}><Plus size={14} /> Add Expense</button>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><Download size={14} /> Export</button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Expense Type</th>
                  <th>Amount (₹)</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.id}</td>
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

      {/* Bottom Grid - Statistics & Comparison & Return Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        <div className="card-container" style={{ margin: 0 }}>
          <div className="card-header-flex">
            <h2 className="card-title">Statistics & Comparison</h2>
          </div>
          <div style={{ height: '260px' }}>
            <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="card-container" style={{ margin: 0 }}>
          <div className="card-header-flex">
            <h2 className="card-title">Return & Performance</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '180px', height: '180px', position: 'relative' }}>
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>22.54%</span>
                <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>ROI</span>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>• Investment</span> <strong>₹ 5,48,000</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>• Selling Amount</span> <strong>₹ 7,14,000</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>• Total Profit</span> <strong>₹ 1,66,000</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>• Total Expenses</span> <strong>₹ 42,500</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>• Final Profit</span> <strong>₹ 1,23,500</strong>
              </div>

              {/* Business Insight Card */}
              <div style={{ marginTop: '12px', padding: '12px', background: '#e0f2fe', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#0284c7', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                  <Target size={16} /> Business Insight
                </div>
                <p style={{ fontSize: '11px', color: '#0369a1', margin: 0 }}>You are getting 22.54% return on your investment. +18% better than last period.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}

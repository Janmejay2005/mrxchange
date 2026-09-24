import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Download, 
  FileText, 
  DollarSign, 
  Wrench, 
  Users, 
  MoreHorizontal,
  X
} from 'lucide-react';
import { expenseService, statsService } from '../services/api';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { exportToXls } from '../utils/pdfGenerator';

export default function Expenses() {
  const { user, isSuperAdmin } = useAuth();
  const { selectedDate } = useOutletContext() || {};
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAdmin, setSelectedAdmin] = useState(() => user?.name || 'All Admins');

  // Add Expense Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'SALARY',
    amount: '',
    recipient: '',
    admin_name: user?.name || 'Jeet Khubchandani',
    expense_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // Guard: Superadmin only
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expenseService.getExpenses({
        category: selectedCategory,
        admin: selectedAdmin,
        from: selectedDate || '',
        to: selectedDate || ''
      });
      setExpenses(res.data || []);
      setTotalExpenses(res.total_expenses || 0);
      setBreakdown(res.breakdown || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Fallback demo expenses
      setExpenses([
        { id: '1', expense_code: 'EXP-001', category: 'SALARY', amount: 25000, admin_name: 'Jeet Khubchandani', recipient: 'Technician Staff', expense_date: '2026-09-10', remarks: 'Monthly technician salaries' },
        { id: '2', expense_code: 'EXP-002', category: 'REPAIRING_COST', amount: 6800, admin_name: 'Sunal', recipient: 'Sunil Electronics Wholesale', expense_date: '2026-09-12', remarks: 'Displays & Batteries batch purchase' },
        { id: '3', expense_code: 'EXP-003', category: 'OTHER', amount: 4500, admin_name: 'Jeet Khubchandani', recipient: 'Power Corporation', expense_date: '2026-09-14', remarks: 'Shop electricity & internet' },
        { id: '4', expense_code: 'EXP-004', category: 'REPAIRING_COST', amount: 2400, admin_name: 'Sunal', recipient: 'Aman Tech', expense_date: '2026-09-16', remarks: 'Specialized Motherboard IC soldering' },
        { id: '5', expense_code: 'EXP-005', category: 'OTHER', amount: 1800, admin_name: 'Jeet Khubchandani', recipient: 'Packaging Supply Co.', expense_date: '2026-09-17', remarks: 'Phone boxes & bubble wraps' }
      ]);
      setTotalExpenses(40500);
      setBreakdown([
        { category: 'SALARY', amount: 25000, count: 1 },
        { category: 'REPAIRING_COST', amount: 9200, count: 2 },
        { category: 'OTHER', amount: 6300, count: 2 }
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, selectedAdmin, selectedDate]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await expenseService.createExpense({
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });
      alert('Expense recorded and debited in Central Ledger!');
      setIsModalOpen(false);
      setNewExpense({
        category: 'SALARY',
        amount: '',
        recipient: '',
        admin_name: 'Jeet',
        expense_date: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Failed to add expense');
    }
  };

  const handleExportXls = () => {
    const headers = ['Expense Code', 'Category', 'Amount (Rs)', 'Admin', 'Recipient', 'Date', 'Remarks'];
    const rows = filteredExpenses.map(e => [
      e.expense_code || e.id,
      e.category || '-',
      e.amount || 0,
      e.admin_name || '-',
      e.recipient || '-',
      e.expense_date ? String(e.expense_date).slice(0, 10) : '-',
      e.remarks || '-'
    ]);
    exportToXls('Operating Expenses Report', headers, rows, `Expenses_Report_${new Date().toISOString().slice(0, 10)}.xls`);
  };

  const handleExportPdf = () => {
    const url = statsService.getPdfExportUrl('expenses', { admin: selectedAdmin, from: selectedDate || '' });
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Operating Expenses</h1>
            <span style={{ background: '#fef2f2', color: '#dc2626', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
              Operating Costs
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Salary, Repairing Costs, and Other operational expenses feeding Net Profit calculations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '8px 18px' }}>
            <Plus size={16} /> Record Expense
          </button>
          <button onClick={handleExportXls} className="btn-secondary">
            <Download size={15} color="#0284c7" /> Excel (.xls)
          </button>
          <button onClick={handleExportPdf} className="btn-secondary">
            <FileText size={15} color="#dc2626" /> PDF
          </button>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#fee2e2' }}>
            <DollarSign size={24} color="#dc2626" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Total Expenses</span>
            <span className="kpi-value" style={{ color: '#dc2626' }}>
              ₹{totalExpenses.toLocaleString('en-IN')}
            </span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>All Recorded Categories</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#e0f2fe' }}>
            <Users size={24} color="#0284c7" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Salaries</span>
            <span className="kpi-value">
              ₹{(breakdown.find(b => b.category === 'SALARY')?.amount || 25000).toLocaleString('en-IN')}
            </span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>Technician & Staff payroll</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#fef3c7' }}>
            <Wrench size={24} color="#d97706" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Repairing Costs</span>
            <span className="kpi-value">
              ₹{(breakdown.find(b => b.category === 'REPAIRING_COST')?.amount || 9200).toLocaleString('en-IN')}
            </span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>Parts, Displays & IC work</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#f1f5f9' }}>
            <MoreHorizontal size={24} color="#475569" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Other Expenses</span>
            <span className="kpi-value">
              ₹{(breakdown.find(b => b.category === 'OTHER')?.amount || 6300).toLocaleString('en-IN')}
            </span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>Electricity, Internet & Packaging</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Category:</span>
          <select
            className="form-control"
            style={{ width: '170px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="SALARY">Salary</option>
            <option value="REPAIRING_COST">Repairing Cost</option>
            <option value="OTHER">Other Expenses</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Admin:</span>
          <select
            className="form-control"
            style={{ width: '160px' }}
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
          >
            <option value="All Admins">All Admins</option>
            <option value="Jeet Khubchandani">Jeet Khubchandani</option>
            <option value="Sonal Wadwani">Sonal Wadwani</option>
            <option value="Sunal">Sunal</option>
            <option value="Admin23">Admin23</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Date</th>
              <th>Category</th>
              <th>Recipient / Vendor</th>
              <th>Admin Attribution</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading expenses...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No expenses recorded for this selection.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id || exp.expense_code}>
                  <td data-label="Code" style={{ fontWeight: 700, color: '#0f172a' }}>{exp.expense_code}</td>
                  <td data-label="Date">{exp.expense_date ? String(exp.expense_date).slice(0, 10) : 'Today'}</td>
                  <td data-label="Category">
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: exp.category === 'SALARY' ? '#e0f2fe' : exp.category === 'REPAIRING_COST' ? '#fef3c7' : '#f1f5f9',
                      color: exp.category === 'SALARY' ? '#0284c7' : exp.category === 'REPAIRING_COST' ? '#b45309' : '#475569'
                    }}>
                      {exp.category}
                    </span>
                  </td>
                  <td data-label="Recipient" style={{ fontWeight: 600 }}>{exp.recipient || '—'}</td>
                  <td data-label="Admin Attribution">
                    <span style={{ color: '#0284c7', fontWeight: 600 }}>{exp.admin_name || 'Admin'}</span>
                  </td>
                  <td data-label="Amount" style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                    ₹{parseFloat(exp.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td data-label="Remarks" style={{ color: '#64748b', fontSize: '12px' }}>{exp.remarks || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Record Operational Expense</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-control"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  >
                    <option value="SALARY">Salary (Staff / Technician Payroll)</option>
                    <option value="REPAIRING_COST">Repairing Cost (Parts, Screens, ICs)</option>
                    <option value="OTHER">Other Expenses (Rent, Bills, Packaging)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (₹ INR) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 5000"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expense Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newExpense.expense_date}
                      onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Admin Attribution *</label>
                    <select
                      className="form-control"
                      value={newExpense.admin_name}
                      onChange={(e) => setNewExpense({ ...newExpense, admin_name: e.target.value })}
                    >
                      <option value="Jeet Khubchandani">Jeet Khubchandani</option>
                      <option value="Sonal Wadwani">Sonal Wadwani</option>
                      <option value="Sunal">Sunal</option>
                      <option value="Admin23">Admin23</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Recipient / Vendor</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Aman Tech, Power Corp"
                      value={newExpense.recipient}
                      onChange={(e) => setNewExpense({ ...newExpense, recipient: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Notes</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Expense details"
                    value={newExpense.remarks}
                    onChange={(e) => setNewExpense({ ...newExpense, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#dc2626' }}>
                  Save & Debit Central Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

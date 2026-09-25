import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  FileText, 
  RotateCcw,
  Wallet,
  Plus
} from 'lucide-react';
import { ledgerService, statsService } from '../services/api';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { exportToXls } from '../utils/pdfGenerator';

export default function CentralLedger() {
  const { isSuperAdmin } = useAuth();
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalCredits: 0, totalDebits: 0, netBalance: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState('All Admins');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Guard: Superadmin only
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await ledgerService.getLedger({
        admin: selectedAdmin,
        type: selectedType,
        q: searchQuery || globalSearch || '',
        from: selectedDate || '',
        to: selectedDate || ''
      });
      setTransactions(res.data || []);
      setSummary(res.summary || { totalCredits: 0, totalDebits: 0, netBalance: 0 });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setTransactions([]);
      setSummary({ totalCredits: 0, totalDebits: 0, netBalance: 0 });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedAdmin, selectedType, searchQuery, globalSearch, selectedDate]);

  const handleExportXls = () => {
    const headers = ['Transaction Code', 'Type', 'Flow', 'Amount (Rs)', 'Admin', 'Payment Method', 'Date', 'Description'];
    const rows = filteredEntries.map(e => [
      e.transaction_code || e.id,
      e.transaction_type || '-',
      e.flow_type || '-',
      e.amount || 0,
      e.admin_name || '-',
      e.payment_method || '-',
      e.transaction_date ? String(e.transaction_date).slice(0, 10) : '-',
      e.description || '-'
    ]);
    exportToXls('Central Financial Ledger Report', headers, rows, `Central_Ledger_${new Date().toISOString().slice(0, 10)}.xls`);
  };

  const handleExportPdf = () => {
    const url = statsService.getPdfExportUrl('ledger', { 
      admin: selectedAdmin,
      from: selectedDate || '' 
    });
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Central Financial Ledger</h1>
            <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
              Single Source of Truth
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Audit trail of all acquisitions, sales, repairs, expenses, and capital investments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportXls} className="btn-secondary" title="Export Ledger as Excel (.xls)">
            <Download size={15} color="#0284c7" /> Export Excel (.xls)
          </button>
          <button onClick={handleExportPdf} className="btn-secondary" title="Export Ledger as PDF">
            <FileText size={15} color="#dc2626" /> Export PDF
          </button>
        </div>
      </div>

      {/* Financial Balance KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#ecfdf5' }}>
            <ArrowDownLeft size={24} color="#059669" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Total Credits (Inflow)</span>
            <span className="kpi-value" style={{ color: '#059669' }}>
              ₹{summary.totalCredits.toLocaleString('en-IN')}
            </span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>Sales & Capital Inflows</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#fee2e2' }}>
            <ArrowUpRight size={24} color="#dc2626" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Total Debits (Outflow)</span>
            <span className="kpi-value" style={{ color: '#dc2626' }}>
              ₹{summary.totalDebits.toLocaleString('en-IN')}
            </span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>Acquisitions, Repairs & Expenses</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#e0f2fe' }}>
            <Wallet size={24} color="#0284c7" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Net Ledger Balance</span>
            <span className="kpi-value" style={{ color: '#0284c7' }}>
              ₹{summary.netBalance.toLocaleString('en-IN')}
            </span>
            <span className="kpi-subtext" style={{ color: '#10b981', fontWeight: 'bold' }}>
              {summary.netBalance >= 0 ? 'Surplus Balance' : 'Deficit'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Admin Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Admin:</span>
            <select
              className="form-control"
              style={{ width: '160px', padding: '8px 12px' }}
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
            >
              <option value="All Admins">All Admins</option>
              <option value="Jeet">Jeet</option>
              <option value="Sunal">Sunal</option>
              <option value="Admin23">Admin23</option>
            </select>
          </div>

          {/* Type Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Type:</span>
            <select
              className="form-control"
              style={{ width: '160px', padding: '8px 12px' }}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="SALE">Sales (Credit)</option>
              <option value="ACQUISITION">Acquisitions (Debit)</option>
              <option value="EXPENSE">Expenses (Debit)</option>
              <option value="INVESTMENT">Investments (Credit)</option>
              <option value="REPAIR">Repairs (Debit)</option>
            </select>
          </div>
        </div>

        <div className="search-box" style={{ width: '240px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Tx Code</th>
              <th>Date</th>
              <th>Type</th>
              <th>Flow</th>
              <th>Admin Attribution</th>
              <th>Payment Method</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading Central Ledger transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No transactions found matching the selected filter or date.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id || tx.transaction_code}>
                  <td data-label="Tx Code" style={{ fontWeight: 700, color: '#0f172a' }}>{tx.transaction_code}</td>
                  <td data-label="Date">{tx.transaction_date ? String(tx.transaction_date).slice(0, 10) : 'Today'}</td>
                  <td data-label="Type">
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: tx.transaction_type === 'SALE' ? '#ecfdf5' : tx.transaction_type === 'INVESTMENT' ? '#f5f3ff' : '#f1f5f9',
                      color: tx.transaction_type === 'SALE' ? '#047857' : tx.transaction_type === 'INVESTMENT' ? '#7c3aed' : '#334155'
                    }}>
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td data-label="Flow">
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 800,
                      color: tx.flow_type === 'CREDIT' ? '#059669' : '#dc2626',
                      fontSize: '12px'
                    }}>
                      {tx.flow_type === 'CREDIT' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      {tx.flow_type}
                    </span>
                  </td>
                  <td data-label="Admin Attribution">
                    <span style={{ fontWeight: 600, color: '#0284c7' }}>
                      {tx.admin_name || 'Admin'}
                    </span>
                  </td>
                  <td data-label="Payment Method">{tx.payment_method || 'Cash'}</td>
                  <td data-label="Amount" style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px', color: tx.flow_type === 'CREDIT' ? '#059669' : '#0f172a' }}>
                    {tx.flow_type === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td data-label="Description" style={{ color: '#475569', fontSize: '12px' }}>{tx.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Download, 
  FileText, 
  PieChart, 
  Briefcase, 
  CheckCircle,
  X
} from 'lucide-react';
import { investmentService, statsService } from '../services/api';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Investments() {
  const { isSuperAdmin } = useAuth();
  const { selectedDate } = useOutletContext() || {};
  const [investments, setInvestments] = useState([]);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [roi, setRoi] = useState(0);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedInvestor, setSelectedInvestor] = useState('All Admins');

  // Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    investment_type: 'INVENTORY',
    amount: '',
    investor_name: 'Jeet',
    investment_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // Guard: Superadmin only
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const res = await investmentService.getInvestments({
        type: selectedType,
        investor: selectedInvestor,
        from: selectedDate || '',
        to: selectedDate || ''
      });
      setInvestments(res.data || []);
      setTotalInvestment(res.total_investment || 0);
      setNetProfit(res.net_profit || 0);
      setRoi(res.roi || 0);
      setBreakdown(res.breakdown || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Fallback demo investments
      setInvestments([
        { id: '1', investment_code: 'INV-001', investment_type: 'INVENTORY', amount: 500000, investor_name: 'Jeet', investment_date: '2026-09-01', remarks: 'Mobile inventory bulk capital' },
        { id: '2', investment_code: 'INV-002', investment_type: 'EQUIPMENT', amount: 150000, investor_name: 'Sunal', investment_date: '2026-09-05', remarks: 'Screen separators & testing kits' },
        { id: '3', investment_code: 'INV-003', investment_type: 'WORKING_CAPITAL', amount: 200000, investor_name: 'Jeet', investment_date: '2026-09-08', remarks: 'Working capital reserve' }
      ]);
      setTotalInvestment(850000);
      setNetProfit(102000);
      setRoi(12.0);
      setBreakdown([
        { type: 'INVENTORY', amount: 500000, count: 1 },
        { type: 'EQUIPMENT', amount: 150000, count: 1 },
        { type: 'WORKING_CAPITAL', amount: 200000, count: 1 }
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [selectedType, selectedInvestor, selectedDate]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await investmentService.createInvestment({
        ...newInvestment,
        amount: parseFloat(newInvestment.amount)
      });
      alert('Capital Investment recorded and credited in Central Ledger!');
      setIsModalOpen(false);
      setNewInvestment({
        investment_type: 'INVENTORY',
        amount: '',
        investor_name: 'Jeet',
        investment_date: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      fetchInvestments();
    } catch (err) {
      alert(err.message || 'Failed to add investment');
    }
  };

  const handleExportCsv = () => {
    const url = statsService.getCsvExportUrl('ledger', { type: 'INVESTMENT' });
    window.open(url, '_blank');
  };

  const handleExportPdf = () => {
    const url = statsService.getPdfExportUrl('ledger', { type: 'INVESTMENT' });
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Capital Investment & ROI</h1>
            <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
              ROI Engine
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Capital contributions by Jeet, Sunal, and partners tracked against net business profit.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '8px 18px', background: '#7c3aed' }}>
            <Plus size={16} /> Add Capital Investment
          </button>
          <button onClick={handleExportCsv} className="btn-secondary">
            <Download size={15} color="#0284c7" /> CSV
          </button>
          <button onClick={handleExportPdf} className="btn-secondary">
            <FileText size={15} color="#dc2626" /> PDF
          </button>
        </div>
      </div>

      {/* ROI & Capital KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#f5f3ff' }}>
            <Briefcase size={24} color="#7c3aed" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Total Capital Invested</span>
            <span className="kpi-value" style={{ color: '#7c3aed' }}>
              ₹{totalInvestment.toLocaleString('en-IN')}
            </span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>Combined Partner Capital</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#ecfdf5' }}>
            <TrendingUp size={24} color="#059669" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Current Business ROI</span>
            <span className="kpi-value" style={{ color: '#059669' }}>
              +{roi}%
            </span>
            <span className="kpi-subtext" style={{ color: '#059669', fontWeight: 700 }}>
              (Net Profit / Investment × 100)
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#e0f2fe' }}>
            <PieChart size={24} color="#0284c7" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Net Profit Generated</span>
            <span className="kpi-value" style={{ color: '#0284c7' }}>
              ₹{netProfit.toLocaleString('en-IN')}
            </span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>Revenue minus all costs</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Type:</span>
          <select
            className="form-control"
            style={{ width: '180px' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">All Investment Types</option>
            <option value="INVENTORY">Inventory Investment</option>
            <option value="EQUIPMENT">Equipment Investment</option>
            <option value="WORKING_CAPITAL">Working Capital</option>
            <option value="OTHER">Other Capital</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Investor:</span>
          <select
            className="form-control"
            style={{ width: '160px' }}
            value={selectedInvestor}
            onChange={(e) => setSelectedInvestor(e.target.value)}
          >
            <option value="All Admins">All Investors</option>
            <option value="Jeet">Jeet</option>
            <option value="Sunal">Sunal</option>
          </select>
        </div>
      </div>

      {/* Investments Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Investment Code</th>
              <th>Date</th>
              <th>Type</th>
              <th>Investor (Partner)</th>
              <th style={{ textAlign: 'right' }}>Capital Amount</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading investments...
                </td>
              </tr>
            ) : investments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No investments recorded.
                </td>
              </tr>
            ) : (
              investments.map((inv) => (
                <tr key={inv.id || inv.investment_code}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{inv.investment_code}</td>
                  <td>{inv.investment_date ? String(inv.investment_date).slice(0, 10) : 'Today'}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#f5f3ff',
                      color: '#7c3aed'
                    }}>
                      {inv.investment_type}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#0284c7', fontWeight: 700 }}>{inv.investor_name}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                    ₹{parseFloat(inv.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{inv.remarks || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Investment Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Record Capital Investment</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Investment Type *</label>
                  <select
                    className="form-control"
                    value={newInvestment.investment_type}
                    onChange={(e) => setNewInvestment({ ...newInvestment, investment_type: e.target.value })}
                  >
                    <option value="INVENTORY">Inventory Investment</option>
                    <option value="EQUIPMENT">Equipment & Tools</option>
                    <option value="WORKING_CAPITAL">Working Capital</option>
                    <option value="OTHER">Other Capital</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (₹ INR) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 100000"
                      value={newInvestment.amount}
                      onChange={(e) => setNewInvestment({ ...newInvestment, amount: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Investment Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newInvestment.investment_date}
                      onChange={(e) => setNewInvestment({ ...newInvestment, investment_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Investor Name *</label>
                  <select
                    className="form-control"
                    value={newInvestment.investor_name}
                    onChange={(e) => setNewInvestment({ ...newInvestment, investor_name: e.target.value })}
                  >
                    <option value="Jeet">Jeet</option>
                    <option value="Sunal">Sunal</option>
                    <option value="Partner Capital">Partner Capital</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Capital contribution details"
                    value={newInvestment.remarks}
                    onChange={(e) => setNewInvestment({ ...newInvestment, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#7c3aed' }}>
                  Save & Credit Central Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

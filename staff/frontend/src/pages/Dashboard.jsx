import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Layers, 
  ShoppingBag, 
  Wrench, 
  Trash2, 
  ArrowRight,
  TrendingUp,
  DollarSign,
  Briefcase,
  PieChart,
  Percent,
  Sparkles
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { statsService, deviceService, saleService, expenseService } from '../services/api';

const matchesAdmin = (itemAdmin, selAdmin) => {
  if (!selAdmin || selAdmin === 'All Admins' || selAdmin === 'All Super Admins') return true;
  if (!itemAdmin) return false;
  const itemLower = String(itemAdmin).toLowerCase();
  const selLower = String(selAdmin).toLowerCase();
  if (itemLower === selLower) return true;
  if (selLower.includes('jeet') && itemLower.includes('jeet')) return true;
  if (selLower.includes('sonal') && itemLower.includes('sonal')) return true;
  return false;
};
import { KPICard, StatusBadge, CurrencyAmount } from '../components/common/UIComponents';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);


export default function Dashboard() {
  const { user, isSuperAdmin } = useAuth();
  const { selectedDate } = useOutletContext() || {};
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [financeStats, setFinanceStats] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState('All Admins');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      let dbNewHand = [];
      try {
        const res = await deviceService.getDevices({ status: 'NEW_IN_HAND' });
        dbNewHand = Array.isArray(res) ? res : (res?.data || []);
      } catch (e) {}

      // Calculate dynamic local & cloud inventory stock values directly
      const localOldInv = JSON.parse(localStorage.getItem('mrx_old_inventory') || '[]');
      const localOldHand = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      const localNewHand = JSON.parse(localStorage.getItem('mrx_new_in_hand_stock') || '[]');
      const localRepair = JSON.parse(localStorage.getItem('mrx_repair_stock') || '[]');
      const localRejected = JSON.parse(localStorage.getItem('mrx_rejected_stock') || '[]');
      const mrxDevices = JSON.parse(localStorage.getItem('mrx_devices') || '[]');

      const seenNewKeys = new Set();
      const combinedNewHand = [];
      [...dbNewHand, ...localNewHand].forEach(item => {
        if (!item) return;
        const key = String(item.sno || item.id || item.device_code || `${item.brand || item.newBrand}_${item.model || item.newModel}`);
        if (!seenNewKeys.has(key)) {
          seenNewKeys.add(key);
          combinedNewHand.push(item);
        }
      });

      const extraOldInHand = mrxDevices.filter(d => d.status === 'OLD_IN_HAND').length;

      const countOldInv = localOldInv.length;
      const countOldHand = localOldHand.length + extraOldInHand;
      const countNewHand = combinedNewHand.reduce((sum, item) => sum + Math.max(0, (item.totalUnits || item.quantity || 1) - (item.soldUnits || 0)), 0);
      const countRepair = localRepair.filter(d => d.status === 'IN_REPAIR' || !d.status).length;
      const countRejected = localRejected.filter(d => d.status === 'REJECTED' || !d.status).length;

      const totalMobiles = countOldInv + countOldHand + countNewHand + countRepair + countRejected;
      const inHandTotal = countOldHand + countNewHand;

      setStats({
        kpis: {
          total_mobiles: totalMobiles,
          old_inventory: countOldInv,
          old_in_hand: countOldHand,
          new_in_hand: countNewHand,
          in_hand: inHandTotal,
          repair_stock: countRepair,
          rejected_stock: countRejected
        },
        distribution: {
          old_inventory: { count: countOldInv, percentage: totalMobiles > 0 ? Math.round((countOldInv / totalMobiles) * 100) : 0 },
          in_hand: { count: inHandTotal, percentage: totalMobiles > 0 ? Math.round((inHandTotal / totalMobiles) * 100) : 0 },
          repair: { count: countRepair, percentage: totalMobiles > 0 ? Math.round((countRepair / totalMobiles) * 100) : 0 },
          rejected: { count: countRejected, percentage: totalMobiles > 0 ? Math.round((countRejected / totalMobiles) * 100) : 0 }
        },
        trend: [
          { date: '10 Sep', count: totalMobiles },
          { date: '11 Sep', count: totalMobiles },
          { date: '12 Sep', count: totalMobiles },
          { date: '13 Sep', count: totalMobiles },
          { date: '14 Sep', count: totalMobiles },
          { date: '15 Sep', count: totalMobiles }
        ],
        recently_added: localOldInv.slice(0, 5)
      });

      if (isSuperAdmin) {
        let allSales = [];
        let allExpensesList = [];
        let allDevList = [];

        try {
          const [sRes, eRes, dRes] = await Promise.all([
            saleService.getSales().catch(() => ({ data: [] })),
            expenseService.getExpenses().catch(() => ({ data: [] })),
            deviceService.getDevices().catch(() => [])
          ]);
          allSales = sRes?.data || JSON.parse(localStorage.getItem('mrx_sales') || '[]');
          allExpensesList = eRes?.data || JSON.parse(localStorage.getItem('mrx_expenses') || '[]');
          
          const localOldInv = JSON.parse(localStorage.getItem('mrx_old_inventory') || '[]');
          const localDev = JSON.parse(localStorage.getItem('mrx_devices') || '[]');
          const apiDev = Array.isArray(dRes) ? dRes : (dRes?.data || []);
          allDevList = [...localOldInv, ...localDev, ...apiDev];
        } catch (e) {
          allSales = JSON.parse(localStorage.getItem('mrx_sales') || '[]');
          allExpensesList = JSON.parse(localStorage.getItem('mrx_expenses') || '[]');
          allDevList = JSON.parse(localStorage.getItem('mrx_devices') || '[]');
        }

        // Apply admin filter if selected
        const filteredSales = allSales.filter(s => matchesAdmin(s.sold_by || s.soldBy || s.admin, selectedAdmin));
        const filteredExpensesList = allExpensesList.filter(e => matchesAdmin(e.admin_name || e.admin, selectedAdmin));
        const filteredDevicesList = allDevList.filter(d => matchesAdmin(d.paid_by || d.purchasedBy || d.admin, selectedAdmin));

        const totalSalesVal = filteredSales.reduce((sum, s) => sum + (Number(s.selling || s.selling_price || s.soldPrice || s.totalAmount) || 0), 0);
        const totalExpensesVal = filteredExpensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        const grossProfitVal = filteredSales.reduce((sum, s) => {
          const sellPrice = Number(s.selling || s.selling_price || s.soldPrice || s.totalAmount) || 0;
          const buyCost = Number(s.purchase || s.purchase_amount || s.oldAmount) || 0;
          const repairCost = Number(s.repair_cost || s.repairCost) || 0;
          let calculatedProfit = 0;
          if (s.profit !== undefined && s.profit !== null && Number(s.profit) !== 0) {
            calculatedProfit = Number(s.profit);
          } else {
            calculatedProfit = sellPrice - (buyCost + repairCost);
          }
          return sum + calculatedProfit;
        }, 0);

        const netProfitVal = grossProfitVal - totalExpensesVal;

        const totalInvestmentVal = filteredDevicesList.reduce((sum, d) => sum + (Number(d.purchase_amount || d.amount || d.paidAmount) || 0), 0);

        const investmentBase = totalInvestmentVal > 0 ? totalInvestmentVal : (totalSalesVal > 0 ? totalSalesVal : 100000);
        const roiVal = Number(((netProfitVal / investmentBase) * 100).toFixed(2));

        setFinanceStats({
          kpis: {
            total_sales: totalSalesVal,
            gross_profit: grossProfitVal,
            total_expenses: totalExpensesVal,
            net_profit: netProfitVal,
            profit_margin: totalSalesVal > 0 ? Number(((netProfitVal / totalSalesVal) * 100).toFixed(2)) : 0,
            total_investment: totalInvestmentVal,
            roi: roiVal,
            expense_ratio: totalSalesVal > 0 ? Number(((totalExpensesVal / totalSalesVal) * 100).toFixed(2)) : 0
          },
          admin_performance: []
        });
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleSync = () => fetchDashboardData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('mrx_inventory_updated', handleSync);
    window.addEventListener('mrx_exchanges_updated', handleSync);
    window.addEventListener('mrx_pending_payments_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mrx_inventory_updated', handleSync);
      window.removeEventListener('mrx_exchanges_updated', handleSync);
      window.removeEventListener('mrx_pending_payments_updated', handleSync);
    };
  }, [selectedAdmin, selectedDate, isSuperAdmin]);

  const doughnutData = {
    labels: ['Old Inventory', 'In-hand Stock', 'Repair Stock', 'Rejected Stock'],
    datasets: [
      {
        data: [
          stats?.distribution?.old_inventory?.count || 3786,
          stats?.distribution?.in_hand?.count || 620,
          stats?.distribution?.repair?.count || 842,
          stats?.distribution?.rejected?.count || 0
        ],
        backgroundColor: ['#0284c7', '#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      }
    ]
  };

  const lineChartData = {
    labels: stats?.trend?.map(t => t.date) || ['10 Sep', '11 Sep', '12 Sep', '13 Sep', '14 Sep', '15 Sep'],
    datasets: [
      {
        label: 'Total Mobiles',
        data: stats?.trend?.map(t => t.count) || [4700, 4900, 4950, 5100, 5200, 5248],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#0284c7',
      }
    ]
  };

  return (
    <div>
      {/* Top Welcome Title with Admin Scope */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>
              {isSuperAdmin ? 'Superadmin Dashboard' : 'Staff Dashboard'}
            </h1>
            <span style={{ 
              background: isSuperAdmin ? '#f5f3ff' : '#e0f2fe', 
              color: isSuperAdmin ? '#7c3aed' : '#0284c7', 
              padding: '3px 10px', 
              borderRadius: '12px', 
              fontSize: '11px', 
              fontWeight: 800 
            }}>
              {isSuperAdmin ? 'Full Financial & Operational Control' : 'Operations & Intake'}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Welcome, {user?.name || (isSuperAdmin ? 'Admin23' : 'Staff23')}! {selectedDate ? `Scoped to date: ${selectedDate}` : 'Live real-time operational metrics.'}
          </p>
        </div>

        {/* Superadmin Admin Selector */}
        {isSuperAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '6px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Admin Filter:</span>
            <select
              className="form-control"
              style={{ width: '150px', padding: '6px 10px', border: 'none', background: 'transparent', fontWeight: 700, color: '#0284c7' }}
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
        )}
      </div>

      {/* SUPERADMIN FINANCIAL METRICS SECTION (Visible to Superadmin only) */}
      {isSuperAdmin && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <DollarSign size={18} color="#059669" />
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              Financial & Profit Performance ({selectedAdmin})
            </h2>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card" onClick={() => navigate('/central-ledger')} style={{ cursor: 'pointer' }}>
              <div className="kpi-icon-wrap" style={{ backgroundColor: '#ecfdf5' }}>
                <DollarSign size={24} color="#059669" />
              </div>
              <div className="kpi-info">
                <span className="kpi-title">Gross Profit</span>
                <span className="kpi-value" style={{ color: '#059669' }}>
                  ₹{(financeStats?.kpis?.gross_profit ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="kpi-subtext" style={{ color: '#64748b' }}>
                  Sales: ₹{(financeStats?.kpis?.total_sales ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="kpi-card" onClick={() => navigate('/expenses')} style={{ cursor: 'pointer' }}>
              <div className="kpi-icon-wrap" style={{ backgroundColor: '#fee2e2' }}>
                <Briefcase size={24} color="#dc2626" />
              </div>
              <div className="kpi-info">
                <span className="kpi-title">Total Expenses</span>
                <span className="kpi-value" style={{ color: '#dc2626' }}>
                  ₹{(financeStats?.kpis?.total_expenses ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="kpi-subtext" style={{ color: '#64748b' }}>
                  Ratio: {financeStats?.kpis?.expense_ratio ?? 0}%
                </span>
              </div>
            </div>

            <div className="kpi-card" onClick={() => navigate('/central-ledger')} style={{ cursor: 'pointer' }}>
              <div className="kpi-icon-wrap" style={{ backgroundColor: (financeStats?.kpis?.net_profit ?? 0) < 0 ? '#fee2e2' : '#e0f2fe' }}>
                <PieChart size={24} color={(financeStats?.kpis?.net_profit ?? 0) < 0 ? '#dc2626' : '#0284c7'} />
              </div>
              <div className="kpi-info">
                <span className="kpi-title">Net Profit</span>
                <span className="kpi-value" style={{ color: (financeStats?.kpis?.net_profit ?? 0) < 0 ? '#dc2626' : '#0284c7' }}>
                  {(financeStats?.kpis?.net_profit ?? 0) < 0 
                    ? `-₹${Math.abs(financeStats?.kpis?.net_profit ?? 0).toLocaleString('en-IN')}` 
                    : `₹${(financeStats?.kpis?.net_profit ?? 0).toLocaleString('en-IN')}`}
                </span>
                <span className="kpi-subtext" style={{ color: (financeStats?.kpis?.net_profit ?? 0) < 0 ? '#dc2626' : '#10b981', fontWeight: 'bold' }}>
                  {(financeStats?.kpis?.net_profit ?? 0) < 0 ? 'Net Loss (Expenses exceed gross profit)' : `Margin: ${financeStats?.kpis?.profit_margin ?? 0}%`}
                </span>
              </div>
            </div>

            <div className="kpi-card" onClick={() => navigate('/investments')} style={{ cursor: 'pointer' }}>
              <div className="kpi-icon-wrap" style={{ backgroundColor: (financeStats?.kpis?.roi ?? 0) < 0 ? '#fee2e2' : '#f5f3ff' }}>
                <TrendingUp size={24} color={(financeStats?.kpis?.roi ?? 0) < 0 ? '#dc2626' : '#7c3aed'} />
              </div>
              <div className="kpi-info">
                <span className="kpi-title">Capital ROI</span>
                <span className="kpi-value" style={{ color: (financeStats?.kpis?.roi ?? 0) < 0 ? '#dc2626' : '#7c3aed' }}>
                  {(financeStats?.kpis?.roi ?? 0) > 0 ? `+${financeStats?.kpis?.roi}%` : `${financeStats?.kpis?.roi ?? 0}%`}
                </span>
                <span className="kpi-subtext" style={{ color: '#64748b' }}>
                  Invested: ₹{(financeStats?.kpis?.total_investment ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPERATIONAL INVENTORY KPI CARDS (Clickable to open inventory per PRD) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Smartphone size={18} color="#0284c7" />
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Live Inventory Stock</h2>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => navigate('/old-inventory')} style={{ cursor: 'pointer' }} title="Click to open Old Inventory">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#e0f2fe' }}>
            <Smartphone size={24} color="#0284c7" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Total Mobiles</span>
            <span className="kpi-value">{(stats?.kpis?.total_mobiles ?? 0).toLocaleString()}</span>
            <span className="kpi-subtext" style={{ color: '#0284c7', fontWeight: 600 }}>Click to View Master</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/old-inventory')} style={{ cursor: 'pointer' }} title="Click to open Old Inventory">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#e0f2fe' }}>
            <Layers size={24} color="#0284c7" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Old Inventory</span>
            <span className="kpi-value">{(stats?.kpis?.old_inventory ?? 0).toLocaleString()}</span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>Pending processing</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/old-in-hand')} style={{ cursor: 'pointer' }} title="Click to open Old In-hand Stock">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#ecfdf5' }}>
            <ShoppingBag size={24} color="#059669" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Old In-hand</span>
            <span className="kpi-value" style={{ color: '#059669' }}>{(stats?.kpis?.old_in_hand ?? 0).toLocaleString()}</span>
            <span className="kpi-subtext" style={{ color: '#059669', fontWeight: 600 }}>Ready for sale</span>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="kpi-card" onClick={() => navigate('/new-in-hand')} style={{ cursor: 'pointer' }} title="Click to open New In-hand Stock">
            <div className="kpi-icon-wrap" style={{ backgroundColor: '#f5f3ff' }}>
              <Sparkles size={24} color="#7c3aed" />
            </div>
            <div className="kpi-info">
              <span className="kpi-title">New In-hand</span>
              <span className="kpi-value" style={{ color: '#7c3aed' }}>{(stats?.kpis?.new_in_hand ?? 0).toLocaleString()}</span>
              <span className="kpi-subtext" style={{ color: '#7c3aed', fontWeight: 600 }}>Fresh arrivals</span>
            </div>
          </div>
        )}

        <div className="kpi-card" onClick={() => navigate('/repair-stock')} style={{ cursor: 'pointer' }} title="Click to open Repair Stock">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#fffbeb' }}>
            <Wrench size={24} color="#d97706" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Repair Stock</span>
            <span className="kpi-value" style={{ color: '#d97706' }}>{(stats?.kpis?.repair_stock ?? 0).toLocaleString()}</span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>Under technician care</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/rejected-stocks')} style={{ cursor: 'pointer' }} title="Click to open Rejected Stock">
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#fee2e2' }}>
            <Trash2 size={24} color="#dc2626" />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Rejected Stock</span>
            <span className="kpi-value" style={{ color: '#dc2626' }}>{(stats?.kpis?.rejected_stock ?? 0).toLocaleString()}</span>
            <span className="kpi-subtext" style={{ color: '#64748b' }}>Defects with reason</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts: Inventory Distribution + Trend */}
      <div className="charts-grid">
        <div className="card-container">
          <div className="card-header-flex">
            <h2 className="card-title">Inventory Distribution</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '180px', height: '180px', flexShrink: 0 }}>
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0284c7' }} />
                  Old Inventory
                </span>
                <span>{(stats?.distribution?.old_inventory?.count ?? 0).toLocaleString()} ({(stats?.distribution?.old_inventory?.percentage ?? 0)}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  In-hand Stock
                </span>
                <span>{(stats?.distribution?.in_hand?.count ?? 0).toLocaleString()} ({(stats?.distribution?.in_hand?.percentage ?? 0)}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  Repair Stock
                </span>
                <span>{(stats?.distribution?.repair?.count ?? 0).toLocaleString()} ({(stats?.distribution?.repair?.percentage ?? 0)}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  Rejected Stock
                </span>
                <span>{stats?.distribution?.rejected?.count ?? 0} ({stats?.distribution?.rejected?.percentage ?? 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-container">
          <div className="card-header-flex">
            <h2 className="card-title">Inventory Trend (Time Series)</h2>
          </div>
          <div style={{ height: '200px' }}>
            <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      {/* Superadmin Admin-Wise Breakdown Table */}
      {isSuperAdmin && financeStats?.admin_performance && (
        <div className="card-container" style={{ marginBottom: '28px' }}>
          <div className="card-header-flex">
            <h2 className="card-title">Admin-Wise Partner Attribution Table</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Combined Partners: Jeet Khubchandani & Sonal Wadwani</span>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Partner / Admin</th>
                  <th style={{ textAlign: 'right' }}>Total Sales Attributed</th>
                  <th style={{ textAlign: 'right' }}>Operating Expenses</th>
                  <th style={{ textAlign: 'right' }}>Net Profit</th>
                  <th style={{ textAlign: 'right' }}>Capital Invested</th>
                  <th style={{ textAlign: 'right' }}>Admin ROI</th>
                </tr>
              </thead>
              <tbody>
                {financeStats.admin_performance.map((ap, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>{ap.admin}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{parseFloat(ap.sales).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>₹{parseFloat(ap.expenses).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: '#059669', fontWeight: 700 }}>₹{parseFloat(ap.net_profit).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹{parseFloat(ap.investment).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#7c3aed' }}>+{ap.roi}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recently Added Mobiles (Strictly NO IMEI per PRD) */}
      <div className="card-container">
        <div className="card-header-flex">
          <h2 className="card-title">Recently Added Mobiles (Latest 5)</h2>
          <Link to="/old-inventory" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0284c7', fontWeight: 700 }}>
            View All in Old Inventory <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Brand & Model</th>
                <th>Storage</th>
                <th>RAM</th>
                <th>Color</th>
                <th>Condition</th>
                <th>Date Added</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recently_added?.map((d) => (
                <tr key={d.id}>
                  <td>
                    <img 
                      src={d.image_url || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'} 
                      alt={d.model} 
                      className="device-thumb" 
                    />
                  </td>
                  <td style={{ fontWeight: 700 }}>{d.brand} {d.model}</td>
                  <td>{d.storage} GB</td>
                  <td>{d.ram} GB</td>
                  <td>{d.colour}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: 700,
                      background: d.condition === 'Fresh' ? '#ecfdf5' : '#fffbeb',
                      color: d.condition === 'Fresh' ? '#047857' : '#b45309'
                    }}>
                      {d.condition || 'Fair'}
                    </span>
                  </td>
                  <td>{d.intake_date ? String(d.intake_date).slice(0, 10) : 'Today'}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

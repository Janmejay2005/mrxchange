import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Smartphone, 
  ShoppingBag, 
  Wrench, 
  XCircle, 
  IndianRupee, 
  Home,
  FileSpreadsheet,
  FileText,
  Calendar
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { statsService, deviceService } from '../services/api';
import { KPICard } from '../components/common/UIComponents';
import { useAuth } from '../context/AuthContext';
import { exportToXls, exportToPdf } from '../utils/pdfGenerator';
import PdfExportModal from '../components/common/PdfExportModal';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

export default function Reports() {
  const { isSuperAdmin } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Export PDF Dialogue Modal state
  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Filter selections: From Date & To Date Calendar Selection
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  // Chart view state: 'date' or 'brand'
  const [chartView, setChartView] = useState('date');

  // Export selection
  const [exportTarget, setExportTarget] = useState('all_inventory');
  const [exportFormat, setExportFormat] = useState('XLS'); // XLS or PDF

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await statsService.getDashboardStats();
      let rawDevices = [];
      try {
        const devRes = await deviceService.getDevices({
          brand: selectedBrand === 'All Brands' ? '' : selectedBrand,
          status: selectedStatus === 'All Status' ? '' : selectedStatus
        });
        rawDevices = Array.isArray(devRes) ? devRes : (devRes?.data || []);
      } catch (e) {
        rawDevices = [];
      }

      // Apply local filters (Brand, Status, Date Range)
      if (selectedBrand !== 'All Brands') {
        rawDevices = rawDevices.filter(d => d.brand === selectedBrand);
      }
      if (selectedStatus !== 'All Status') {
        rawDevices = rawDevices.filter(d => d.status === selectedStatus);
      }
      if (fromDate) {
        rawDevices = rawDevices.filter(d => (d.intake_date || '') >= fromDate);
      }
      if (toDate) {
        rawDevices = rawDevices.filter(d => (d.intake_date || '') <= toDate);
      }

      const totalVal = rawDevices.reduce((sum, d) => sum + (Number(d.purchase_amount) || 0), 0);

      // Compute Brand distribution dynamically
      const brandCounts = {};
      rawDevices.forEach(d => {
        if (d.brand) {
          brandCounts[d.brand] = (brandCounts[d.brand] || 0) + 1;
        }
      });
      const brandDist = Object.keys(brandCounts).map(b => ({ brand: b, count: brandCounts[b] }));

      // Compute Date distribution dynamically
      const dateCounts = {};
      rawDevices.forEach(d => {
        const dt = d.intake_date || 'Recent';
        dateCounts[dt] = (dateCounts[dt] || 0) + 1;
      });
      const dateDist = Object.keys(dateCounts).map(dt => ({ date: dt, count: dateCounts[dt] }));

      setReportData({
        kpis: {
          total_mobiles: rawDevices.length,
          in_hand_count: rawDevices.filter(d => d.status === 'OLD_IN_HAND' || d.status === 'IN_HAND' || d.status === 'NEW_IN_HAND').length,
          repair_count: rawDevices.filter(d => d.status === 'IN_REPAIR').length,
          rejected_count: rawDevices.filter(d => d.status === 'REJECTED').length,
          old_inventory_count: rawDevices.filter(d => d.status === 'OLD_INVENTORY').length,
          total_valuation: totalVal
        },
        brand_distribution: brandDist,
        date_distribution: dateDist
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    const handleSync = () => fetchReports();
    window.addEventListener('storage', handleSync);
    window.addEventListener('mrx_inventory_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mrx_inventory_updated', handleSync);
    };
  }, [fromDate, toDate, selectedBrand, selectedStatus]);

  const handleExport = async () => {
    try {
      let rawDevices = [];
      if (exportTarget === 'pending_payments') {
        const localStr = localStorage.getItem('mrx_pending_payments');
        const payments = localStr ? JSON.parse(localStr) : [];
        const headers = ['ID', 'Date', 'Customer', 'Brand', 'Model', 'Total Amount', 'Paid Amount', 'Pending Amount', 'Status', 'Mode'];
        const rows = payments.map(p => [
          p.id || '-',
          p.date || '-',
          p.customerName || '-',
          p.brand || '-',
          p.model || '-',
          `Rs. ${Number(p.totalAmount || 0).toLocaleString()}`,
          `Rs. ${Number(p.paidAmount || 0).toLocaleString()}`,
          `Rs. ${Number(p.pendingAmount || 0).toLocaleString()}`,
          p.status || 'Pending',
          p.mode || 'Cash'
        ]);
        const totalVal = payments.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
        if (exportFormat === 'XLS') {
          exportToXls(`Report: Pending & Received Payments`, headers, rows, `Report_Payments_${new Date().toISOString().slice(0, 10)}.xls`);
        } else {
          setExportModalConfig({
            isOpen: true,
            title: `Report: Pending and Receiving Payments`,
            headers,
            rows,
            filename: `Report_Payments_${new Date().toISOString().slice(0, 10)}.pdf`,
            summaryInfo: [
              { label: 'Total Payment Value', value: `Rs. ${totalVal.toLocaleString()}`, color: '#0284c7' }
            ]
          });
        }
        return;
      }

      const res = await deviceService.getDevices({});
      rawDevices = Array.isArray(res) ? res : (res?.data || []);

      if (exportTarget === 'old_inventory') {
        rawDevices = rawDevices.filter(d => d.status === 'OLD_INVENTORY');
      } else if (exportTarget === 'old_in_hand') {
        rawDevices = rawDevices.filter(d => d.status === 'OLD_IN_HAND' || d.status === 'IN_HAND');
      } else if (exportTarget === 'new_in_hand') {
        rawDevices = rawDevices.filter(d => d.status === 'NEW_IN_HAND');
      } else if (exportTarget === 'repair') {
        rawDevices = rawDevices.filter(d => d.status === 'IN_REPAIR');
      } else if (exportTarget === 'rejected') {
        rawDevices = rawDevices.filter(d => d.status === 'REJECTED');
      }

      // Apply date and brand filters if specified
      if (selectedBrand !== 'All Brands') {
        rawDevices = rawDevices.filter(d => d.brand === selectedBrand);
      }
      if (fromDate) {
        rawDevices = rawDevices.filter(d => (d.intake_date || '') >= fromDate);
      }
      if (toDate) {
        rawDevices = rawDevices.filter(d => (d.intake_date || '') <= toDate);
      }

      if (exportFormat === 'XLS') {
        const headers = ['ID', 'Device Code', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Purchase Amount', 'Paid By', 'Date', 'Status'];
        const rows = rawDevices.map(d => [
          d.id,
          d.device_code || d.id,
          d.brand,
          d.model,
          d.storage,
          d.ram,
          d.colour || d.color || '-',
          d.purchase_amount || d.amount || 0,
          d.paid_by || d.purchasedBy || '-',
          d.intake_date || d.date || '-',
          d.status || 'OLD_INVENTORY'
        ]);
        exportToXls(`Report: ${exportTarget.toUpperCase().replace(/_/g, ' ')}`, headers, rows, `Report_${exportTarget}_${new Date().toISOString().slice(0,10)}.xls`);
      } else {
        const headers = ['Code', 'Brand', 'Model', 'Storage', 'Color', 'Amount', 'Status'];
        const rows = rawDevices.map(d => [
          d.device_code || d.id,
          d.brand,
          d.model,
          `${d.storage}GB`,
          d.colour || d.color || '-',
          `Rs. ${Number(d.purchase_amount || d.amount || 0).toLocaleString()}`,
          d.status || 'OLD_INVENTORY'
        ]);
        const totalAmount = rawDevices.reduce((sum, d) => sum + (Number(d.purchase_amount || d.amount) || 0), 0);
        setExportModalConfig({
          isOpen: true,
          title: `Report: ${exportTarget.toUpperCase().replace(/_/g, ' ')}`,
          headers,
          rows,
          filename: `Report_${exportTarget}_${new Date().toISOString().slice(0,10)}.pdf`,
          summaryInfo: [
            { label: 'Total Value', value: `Rs. ${totalAmount.toLocaleString()}`, color: '#0284c7' }
          ]
        });
      }
    } catch (err) {
      alert('Failed to generate export download file.');
    }
  };

  const doughnutData = {
    labels: ['In-hand Stock', 'Repair Stock', 'Rejected Stock', 'Old Inventory'],
    datasets: [
      {
        data: [
          reportData?.kpis?.in_hand_count ?? 0,
          reportData?.kpis?.repair_count ?? 0,
          reportData?.kpis?.rejected_count ?? 0,
          reportData?.kpis?.old_inventory_count ?? 0
        ],
        backgroundColor: ['#0284c7', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 0,
      }
    ]
  };

  const barChartData = {
    labels: chartView === 'date' 
      ? (reportData?.date_distribution?.map(d => d.date) || [])
      : (reportData?.brand_distribution?.map(b => b.brand) || []),
    datasets: [
      {
        label: chartView === 'date' ? 'Mobiles Intake (By Date)' : 'Mobiles Count (By Brand)',
        data: chartView === 'date'
          ? (reportData?.date_distribution?.map(d => d.count) || [])
          : (reportData?.brand_distribution?.map(b => b.count) || []),
        backgroundColor: chartView === 'date' ? '#0284c7' : '#3b82f6',
        borderRadius: 6,
      }
    ]
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Reports & Analytics</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Inventory performance metrics and official XLS/PDF export generation.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
          <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Reports</span>
        </div>
      </div>

      {/* Top Filter Bar with Calendar Date Selection (From Date to To Date) */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#0284c7" />
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>From Date:</label>
          <input 
            type="date" 
            className="form-control" 
            style={{ width: '150px', padding: '6px 10px' }}
            value={fromDate} 
            onChange={(e) => setFromDate(e.target.value)} 
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#0284c7" />
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>To Date:</label>
          <input 
            type="date" 
            className="form-control" 
            style={{ width: '150px', padding: '6px 10px' }}
            value={toDate} 
            onChange={(e) => setToDate(e.target.value)} 
          />
        </div>

        {(fromDate || toDate) && (
          <button 
            type="button" 
            onClick={() => { setFromDate(''); setToDate(''); }} 
            style={{ fontSize: '12px', color: '#ef4444', background: '#fee2e2', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
          >
            Clear Dates
          </button>
        )}

        <select 
          className="form-control" 
          style={{ width: '160px', padding: '8px 12px' }}
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
        >
          <option>All Brands</option>
          <option>Google Pixel</option>
          <option>Apple</option>
          <option>Samsung</option>
          <option>OnePlus</option>
          <option>Xiaomi</option>
          <option>Vivo</option>
          <option>Oppo</option>
          <option>Realme</option>
          <option>Nothing</option>
          <option>Motorola</option>
        </select>

        <select 
          className="form-control" 
          style={{ width: '160px', padding: '8px 12px' }}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option>All Status</option>
          <option>OLD_INVENTORY</option>
          <option>OLD_IN_HAND</option>
          <option>IN_REPAIR</option>
          <option>REJECTED</option>
        </select>

        <button onClick={fetchReports} className="btn-primary" style={{ background: '#0b132b', marginLeft: 'auto' }}>
          <Filter size={16} /> Refresh Metrics
        </button>
      </div>

      {/* 5 Live KPI Cards in Reports with enlarged container for Total Value */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KPICard 
          title="Total Mobiles" 
          value={(reportData?.kpis?.total_mobiles ?? 0).toLocaleString()} 
          icon={Smartphone}
          iconBg="#e0f2fe"
          iconColor="#0284c7"
        />
        <KPICard 
          title="In-hand Stock" 
          value={(reportData?.kpis?.in_hand_count ?? 0).toLocaleString()} 
          icon={ShoppingBag}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <KPICard 
          title="Repair Stock" 
          value={(reportData?.kpis?.repair_count ?? 0).toLocaleString()} 
          icon={Wrench}
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
        <KPICard 
          title="Rejected Stock" 
          value={(reportData?.kpis?.rejected_count ?? 0).toLocaleString()} 
          icon={XCircle}
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
        {/* Enlarged Total Value Container */}
        <div className="kpi-card" style={{ minWidth: '260px', flex: '1 1 260px', padding: '20px' }}>
          <div className="kpi-icon-wrap" style={{ backgroundColor: '#dcfce7' }}>
            <IndianRupee size={26} color="#16a34a" />
          </div>
          <div className="kpi-info" style={{ overflow: 'hidden' }}>
            <span className="kpi-title" style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Total Value</span>
            <span className="kpi-value" style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', whiteSpace: 'nowrap' }}>
              ₹{(reportData?.kpis?.total_valuation ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Stock Distribution & Date-wise/Brand-wise charts */}
      <div className="charts-grid">
        <div className="card-container">
          <div className="card-header-flex">
            <h2 className="card-title">Stock Distribution</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '180px', height: '180px' }}>
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0284c7' }} />
                  In-hand Stock
                </span>
                <span>{reportData?.kpis?.in_hand_count ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  Repair Stock
                </span>
                <span>{reportData?.kpis?.repair_count ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  Rejected Stock
                </span>
                <span>{reportData?.kpis?.rejected_count ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                  Old Inventory
                </span>
                <span>{reportData?.kpis?.old_inventory_count ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-container">
          <div className="card-header-flex">
            <h2 className="card-title">
              {chartView === 'date' ? 'Stock Intake (By Date)' : 'Brand-wise Stock'}
            </h2>
            {/* Dropdown with option "By Date" and "By Brand" */}
            <select 
              className="form-control" 
              style={{ width: '130px', padding: '6px 10px', fontSize: '12px', fontWeight: 700 }}
              value={chartView}
              onChange={(e) => setChartView(e.target.value)}
            >
              <option value="date">By Date</option>
              <option value="brand">By Brand</option>
            </select>
          </div>
          <div style={{ height: '220px' }}>
            <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Export Reports Section */}
      <div className="card-container" style={{ marginTop: '24px' }}>
        <h2 className="card-title" style={{ marginBottom: '6px' }}>Export Reports</h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Select the dataset scope and export format (XLS or PDF).</p>

        {/* Dataset Selection */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>1. Select Report Dataset</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px' }}>
            {[
              { id: 'all_inventory', label: 'All Inventory Stock', desc: 'Combined devices registry' },
              { id: 'old_inventory', label: 'Old Inventory', desc: 'Historic stock items' },
              { id: 'old_in_hand', label: 'Old In-hand Stock', desc: 'Available for immediate sale' },
              { id: 'new_in_hand', label: 'New In-hand Stock', desc: 'Fresh acquisition stock' },
              { id: 'repair', label: 'Repair Stock', desc: 'Under active repair' },
              { id: 'rejected', label: 'Rejected Stock', desc: 'Damaged / defective units' },
              { id: 'pending_payments', label: 'Pending and Receiving Payments', desc: 'Customer payments & dues journal' },
              { id: 'profit_expense_statistic', label: 'Profit, Expense and Statistic', desc: 'Financial profitability & expenses report' },
              { id: 'booked_exchange', label: 'Exchange', desc: 'Pre-booked & exchanged devices registry' },
            ].map(target => (
              <label 
                key={target.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: exportTarget === target.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: exportTarget === target.id ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input 
                  type="radio" 
                  name="export_target"
                  checked={exportTarget === target.id}
                  onChange={() => setExportTarget(target.id)}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: exportTarget === target.id ? '#0284c7' : '#0f172a' }}>
                    {target.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{target.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Format Selection - XLS & PDF */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>2. Select Export Format</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <button
                type="button"
                onClick={() => setExportFormat('XLS')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: exportFormat === 'XLS' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: exportFormat === 'XLS' ? '#e0f2fe' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: exportFormat === 'XLS' ? '#0284c7' : '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <FileSpreadsheet size={18} color={exportFormat === 'XLS' ? '#0284c7' : '#64748b'} />
                Excel Spreadsheet (.xls)
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('PDF')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: exportFormat === 'PDF' ? '2px solid #dc2626' : '1px solid #e2e8f0',
                  background: exportFormat === 'PDF' ? '#fee2e2' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: exportFormat === 'PDF' ? '#dc2626' : '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <FileText size={18} color={exportFormat === 'PDF' ? '#dc2626' : '#64748b'} />
                Printable PDF Report (.pdf)
              </button>
            </div>

            <button 
              onClick={handleExport}
              className="btn-primary" 
              style={{ background: '#0b132b', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
            >
              <Download size={16} /> Download {exportFormat} Report
            </button>
          </div>
        </div>
      </div>

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

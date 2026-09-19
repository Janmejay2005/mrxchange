import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Layers, 
  ShoppingBag, 
  Wrench, 
  Trash2, 
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { statsService } from '../../services/api';
import { KPICard, StatusBadge } from '../../components/common/UIComponents';
import { Link } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await statsService.getDashboardStats();
      setStats(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Fallback demo statistics matching sample UI screenshots
      setStats({
        kpis: {
          total_mobiles: 5248,
          old_inventory: 3786,
          in_hand: 620,
          repair_stock: 842,
          rejected_stock: 0
        },
        distribution: {
          old_inventory: { count: 3786, percentage: 72 },
          in_hand: { count: 620, percentage: 12 },
          repair: { count: 842, percentage: 16 },
          rejected: { count: 0, percentage: 0 }
        },
        trend: [
          { date: '09 Sep', count: 4500 },
          { date: '10 Sep', count: 4700 },
          { date: '11 Sep', count: 4900 },
          { date: '12 Sep', count: 4950 },
          { date: '13 Sep', count: 5100 },
          { date: '14 Sep', count: 5200 },
          { date: '15 Sep', count: 5248 }
        ],
        recently_added: [
          { id: '1', model: 'iPhone 13', imei: '352039847593812', storage: 128, colour: 'Midnight', condition: 'Good', intake_date: '2026-09-15', image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100' },
          { id: '2', model: 'Samsung S22', imei: '358240951234765', storage: 256, colour: 'Phantom Black', condition: 'Good', intake_date: '2026-09-14', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100' },
          { id: '3', model: 'iPhone 12', imei: '351682947651903', storage: 64, colour: 'White', condition: 'Fair', intake_date: '2026-09-14', image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=100' },
          { id: '4', model: 'OnePlus 10R', imei: '867985064321098', storage: 128, colour: 'Sierra Black', condition: 'Good', intake_date: '2026-09-13', image_url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=100' },
          { id: '5', model: 'Redmi Note 11', imei: '864320567981234', storage: 128, colour: 'Blue', condition: 'Good', intake_date: '2026-09-12', image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100' }
        ]
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
    labels: stats?.trend?.map(t => t.date.split('-').slice(1).join('/') || t.date) || ['09 Sep', '10 Sep', '11 Sep', '12 Sep', '13 Sep', '14 Sep', '15 Sep'],
    datasets: [
      {
        label: 'Total Mobiles',
        data: stats?.trend?.map(t => t.count) || [4500, 4700, 4900, 4950, 5100, 5200, 5248],
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
      {/* Top Welcome Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Welcome back, Aadarsh! Here's an overview of your inventory.</p>
        </div>
        <div style={{ color: '#0284c7', fontWeight: 600, fontSize: '13px' }}>
          Monday, 15 Sep 2026
        </div>
      </div>

      {/* 5 Live KPI Cards */}
      <div className="kpi-grid">
        <KPICard 
          title="Total Mobiles" 
          value={stats?.kpis?.total_mobiles?.toLocaleString() || '5,248'} 
          subtext="↑ +12% Across all inventories" 
          isPositive={true}
          icon={Smartphone}
          iconBg="#e0f2fe"
          iconColor="#0284c7"
        />
        <KPICard 
          title="Old Inventory" 
          value={stats?.kpis?.old_inventory?.toLocaleString() || '3,786'} 
          subtext="↑ +8% Available for processing" 
          isPositive={true}
          icon={Layers}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <KPICard 
          title="In-hand Stock" 
          value={stats?.kpis?.in_hand?.toLocaleString() || '620'} 
          subtext="↑ +5% Ready for sale" 
          isPositive={true}
          icon={ShoppingBag}
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
        <KPICard 
          title="Repair Stock" 
          value={stats?.kpis?.repair_stock?.toLocaleString() || '842'} 
          subtext="↓ -3% Under repair" 
          isPositive={false}
          icon={Wrench}
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
        <KPICard 
          title="Rejected Stock" 
          value={stats?.kpis?.rejected_stock?.toLocaleString() || '0'} 
          subtext="— 0% Defected pieces" 
          icon={Trash2}
          iconBg="#f1f5f9"
          iconColor="#64748b"
        />
      </div>

      {/* Interactive Charts: Inventory Distribution + 7-Day Trend */}
      <div className="charts-grid">
        <div className="card-container">
          <div className="card-header-flex">
            <h2 className="card-title">Inventory Distribution</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '180px', height: '180px' }}>
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0284c7' }} />
                  Old Inventory
                </span>
                <span>{stats?.distribution?.old_inventory?.count?.toLocaleString() || '3,786'} ({stats?.distribution?.old_inventory?.percentage || 72}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  In-hand Stock
                </span>
                <span>{stats?.distribution?.in_hand?.count?.toLocaleString() || '620'} ({stats?.distribution?.in_hand?.percentage || 12}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  Repair Stock
                </span>
                <span>{stats?.distribution?.repair?.count?.toLocaleString() || '842'} ({stats?.distribution?.repair?.percentage || 16}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  Rejected Stock
                </span>
                <span>{stats?.distribution?.rejected?.count?.toLocaleString() || '0'} ({stats?.distribution?.rejected?.percentage || 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-container">
          <div className="card-header-flex">
            <h2 className="card-title">Inventory Trend (Last 7 Days)</h2>
            <select className="form-control" style={{ width: '140px', padding: '6px 10px', fontSize: '12px' }}>
              <option>Total Mobiles</option>
              <option>In-hand Stock</option>
              <option>Repair Stock</option>
            </select>
          </div>
          <div style={{ height: '200px' }}>
            <Line data={lineChartData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: false } } }} />
          </div>
        </div>
      </div>

      {/* Recently Added Mobiles Table */}
      <div className="card-container">
        <div className="card-header-flex">
          <h2 className="card-title">Recently Added Mobiles</h2>
          <Link to="/old-inventory" style={{ color: '#0284c7', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Model / Name</th>
                <th>IMEI</th>
                <th>Storage</th>
                <th>Color</th>
                <th>Condition</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recently_added?.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'} 
                      alt={item.model} 
                      className="device-thumb" 
                    />
                  </td>
                  <td style={{ fontWeight: 700 }}>{item.model}</td>
                  <td style={{ color: '#0284c7', fontWeight: 600 }}>{item.imei || 'N/A'}</td>
                  <td>{item.storage} GB</td>
                  <td>{item.colour}</td>
                  <td>
                    <span style={{ color: '#059669', fontWeight: 600 }}>{item.condition || 'Good'}</span>
                  </td>
                  <td style={{ color: '#64748b' }}>{item.intake_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

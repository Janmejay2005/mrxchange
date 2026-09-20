import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  Smartphone, 
  Wrench, 
  Trash2, 
  FileText, 
  RefreshCw,
  Package,
  CircleDollarSign,
  BarChart2,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, isCollapsed, onClose }) {
  const { logout, isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Full 10-module Navigation structure matching reference screenshots
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Old Inventory', path: '/old-inventory', icon: Layers },
    { label: 'Old In-hand Inventory', path: '/old-in-hand', icon: Smartphone },
    { label: 'Repair Inventory', path: '/repair-stock', icon: Wrench },
    { label: 'Rejected Inventory', path: '/rejected-stocks', icon: Trash2 },
    { label: 'Report', path: '/reports', icon: FileText },
    { label: 'Booked and Exchange', path: '/booked-exchange', icon: RefreshCw },
    { label: 'New In-hand Stock', path: '/new-in-hand', icon: Package },
    { label: 'Pending and Receiving Payments', path: '/pending-payments', icon: CircleDollarSign },
    { label: 'Profit, Expense and Statistic', path: '/profit-expense-statistic', icon: BarChart2 },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

      <div className="brand-logo-container">
        <div className="brand-logo">
          <Smartphone size={28} color="#38bdf8" />
          <div>
            <div className="brand-title">MR.X.Change</div>
            <div className="brand-sub">Mobile Exchange & Inventory</div>
          </div>
        </div>
        <button 
          className="sidebar-close-btn" 
          onClick={onClose}
          aria-label="Close sidebar"
          type="button"
        >
          <X size={20} />
        </button>
      </div>

      <ul className="nav-list">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={idx} className="nav-item">
              <NavLink 
                to={item.path} 
                onClick={onClose}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '8px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
            {user?.auth_identifier ? String(user.auth_identifier).substring(0, 2).toUpperCase() : 'AS'}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              {user?.name || user?.auth_identifier || 'Aadarsh Sharma'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Staff</div>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

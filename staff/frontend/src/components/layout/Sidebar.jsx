import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  Smartphone, 
  Sparkles,
  Wrench, 
  Trash2, 
  BarChart3, 
  BookOpen,
  Receipt,
  TrendingUp,
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

  // Dynamic Navigation based on Staff vs Superadmin Role
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, role: 'ALL' },
    { label: 'Old Inventory', path: '/old-inventory', icon: Layers, role: 'ALL' },
    { label: 'Old In-hand', path: '/old-in-hand', icon: Smartphone, role: 'ALL' },
    // New In-hand is visible to Superadmin only
    { label: 'New In-hand', path: '/new-in-hand', icon: Sparkles, role: 'SUPERADMIN' },
    { label: 'Repair Stock', path: '/repair-stock', icon: Wrench, role: 'ALL' },
    { label: 'Rejected Stock', path: '/rejected-stocks', icon: Trash2, role: 'ALL' },
    // Financial & Ledger modules for Superadmin
    { label: 'Central Ledger', path: '/central-ledger', icon: BookOpen, role: 'SUPERADMIN' },
    { label: 'Expenses', path: '/expenses', icon: Receipt, role: 'SUPERADMIN' },
    { label: 'Investments & ROI', path: '/investments', icon: TrendingUp, role: 'SUPERADMIN' },
    { label: 'Reports', path: '/reports', icon: BarChart3, role: 'ALL' },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.role === 'ALL') return true;
    if (item.role === 'SUPERADMIN') return isSuperAdmin;
    return true;
  });

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

      <div className="brand-logo-container">
        <div className="brand-logo">
          <Smartphone size={28} color="#38bdf8" />
          <div>
            <div className="brand-title">MR.X.Change</div>
            <div className="brand-sub">
              {isSuperAdmin ? 'Superadmin Portal' : 'Staff Portal'}
            </div>
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
        {filteredNavItems.map((item, idx) => {
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
        <div style={{ padding: '4px 12px 12px 12px', fontSize: '11px', color: '#64748b' }}>
          Logged in as: <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>{user?.auth_identifier || 'User'}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

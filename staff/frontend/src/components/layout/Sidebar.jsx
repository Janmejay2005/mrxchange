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
  X,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, isCollapsed, onClose }) {
  const { logout, isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav items with strict Role separation
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, role: 'ALL' },
    { label: 'Old Inventory', path: '/old-inventory', icon: Layers, role: 'ALL' },
    { label: 'Old In-hand Inventory', path: '/old-in-hand', icon: Smartphone, role: 'ALL' },
    { label: 'Repair Inventory', path: '/repair-stock', icon: Wrench, role: 'ALL' },
    { label: 'Rejected Inventory', path: '/rejected-stocks', icon: Trash2, role: 'ALL' },
    { label: 'Book and Exchange', path: '/booked-exchange', icon: RefreshCw, role: 'ALL' },
    { label: 'New In-hand Inventory', path: '/new-in-hand', icon: Package, role: 'ALL' },
    { label: 'Pending and Receiving Payments', path: '/pending-payments', icon: CircleDollarSign, role: 'ALL' },
    { label: 'Profit, Expense and Statistic', path: '/profit-expense-statistic', icon: BarChart2, role: 'ALL' },
    { label: 'Report', path: '/reports', icon: FileText, role: 'ALL' },
    { label: 'Members in Super Admin', path: '/members-super-admin', icon: Users, role: 'ALL' },
  ];

  // Filter items based on logged-in user role
  const filteredNavItems = navItems.filter(item => {
    if (item.role === 'ALL') return true;
    if (item.role === 'SUPERADMIN') return isSuperAdmin;
    return false;
  });

  return (
    <aside 
      className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
      style={{ overflowY: 'auto', maxHeight: '100vh', scrollbarWidth: 'thin' }}
    >

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

      <ul className="nav-list" style={{ overflowY: 'auto', flex: 1 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '8px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: isSuperAdmin ? '#8b5cf6' : '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
            {user?.auth_identifier ? String(user.auth_identifier).substring(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              {user?.name || user?.auth_identifier || 'User'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {isSuperAdmin ? 'Superadmin' : 'Staff'}
            </div>
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

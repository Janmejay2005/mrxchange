import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  Smartphone, 
  ShoppingBag, 
  Wrench, 
  Trash2, 
  BarChart3, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Old Inventory', path: '/old-inventory', icon: Layers },
    { label: 'In-hand Stock', path: '/in-hand-stock', icon: Smartphone },
    { label: 'Repair Stock', path: '/repair-stock', icon: Wrench },
    { label: 'Rejected Stock', path: '/rejected-stocks', icon: Trash2 },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="brand-logo">
        <Smartphone size={28} color="#38bdf8" />
        <div>
          <div className="brand-title">MR.X.Change</div>
          <div className="brand-sub">Mobile Exchange & Inventory</div>
        </div>
      </div>

      <ul className="nav-list">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={idx} className="nav-item">
              <NavLink 
                to={item.path} 
                onClick={onClose}
                className={({ isActive }) => (isActive && !item.isAlias ? 'active' : '')}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-bottom">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

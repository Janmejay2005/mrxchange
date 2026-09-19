import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onToggleSidebar, onSearch, searchQuery }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onToggleSidebar}
          style={{ display: 'none' }}
          className="mobile-menu-btn"
        >
          <Menu size={22} />
        </button>

        <div className="search-box">
          <Search size={18} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search by model, IMEI, color, or inventory ID..." 
            value={searchQuery || ''}
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="topbar-actions">
        <button style={{ position: 'relative', padding: '8px', color: '#64748b' }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#ef4444'
          }} />
        </button>

        <div className="user-pill">
          <div className="avatar-circle">
            {user?.auth_identifier || 'AS'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Aadarsh Sharma'}</span>
            <span className="user-role">{user?.role === 'ADMIN' ? 'Administrator' : 'Staff'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

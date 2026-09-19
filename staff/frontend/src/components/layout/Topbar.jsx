import React from 'react';
import { Search, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GlobalCalendar from '../common/GlobalCalendar';

export default function Topbar({ onToggleSidebar, onSearch, searchQuery, selectedDate, onDateChange }) {
  const { user, isSuperAdmin } = useAuth();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Hamburger Menu - Available on Laptop, Desktop and Mobile */}
        <button 
          onClick={onToggleSidebar}
          className="menu-toggle-btn"
          aria-label="Toggle navigation menu"
          title="Toggle Navigation Menu"
          type="button"
        >
          <Menu size={22} />
        </button>

        <div className="search-box">
          <Search size={18} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search model, color, device ID..." 
            value={searchQuery || ''}
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Global Calendar - Available on Every Page per PRD */}
        <GlobalCalendar 
          selectedDate={selectedDate} 
          onDateChange={onDateChange} 
        />

        {/* User Profile Info (Role switch removed per request for clean mobile compatibility) */}
        <div className="user-pill">
          <div 
            className="avatar-circle"
            style={{
              backgroundColor: isSuperAdmin ? '#7c3aed' : '#0284c7'
            }}
          >
            {user?.auth_identifier ? user.auth_identifier.slice(0, 2).toUpperCase() : (isSuperAdmin ? 'AD' : 'ST')}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.auth_identifier || user?.name || (isSuperAdmin ? 'Admin23' : 'Staff23')}</span>
            <span className="user-role" style={{ color: isSuperAdmin ? '#7c3aed' : '#0284c7', fontWeight: 700 }}>
              {isSuperAdmin ? 'Superadmin' : 'Staff'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}


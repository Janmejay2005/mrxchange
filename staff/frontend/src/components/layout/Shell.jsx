import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        // If a modal overlay is currently active, do not navigate away
        const activeModal = document.querySelector('.modal-overlay');
        if (activeModal) {
          return;
        }
        if (location.pathname !== '/dashboard' && location.pathname !== '/') {
          e.preventDefault();
          navigate(-1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setDesktopCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar 
        isOpen={mobileDrawerOpen} 
        isCollapsed={desktopCollapsed} 
        onClose={() => setMobileDrawerOpen(false)} 
      />
      <div className="main-content">
        <Topbar 
          onToggleSidebar={handleToggleSidebar} 
          searchQuery={globalSearch}
          onSearch={setGlobalSearch}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        <main className="page-body">
          <Outlet context={{ globalSearch, selectedDate, setSelectedDate }} />
        </main>
      </div>
    </div>
  );
}



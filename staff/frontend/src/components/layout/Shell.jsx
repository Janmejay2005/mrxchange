import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SplashScreen from '../common/SplashScreen';

export default function Shell() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem('mrx_splash_seen');
    return !seen;
  });

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

  const handleSplashFinish = () => {
    sessionStorage.setItem('mrx_splash_seen', 'true');
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

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
    </>
  );
}


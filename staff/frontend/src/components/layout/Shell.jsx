import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          searchQuery={globalSearch}
          onSearch={setGlobalSearch}
        />
        <main className="page-body">
          <Outlet context={{ globalSearch }} />
        </main>
      </div>
    </div>
  );
}

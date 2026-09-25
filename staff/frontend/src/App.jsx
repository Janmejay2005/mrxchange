import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import OldInventory from './pages/OldInventory';
import OldInHandStock from './pages/OldInHandStock';
import NewInHandStock from './pages/NewInHandStock';
import CentralLedger from './pages/CentralLedger';
import Expenses from './pages/Expenses';
import Investments from './pages/Investments';
import RepairStock from './pages/RepairStock';
import RejectedStock from './pages/RejectedStock';
import Reports from './pages/Reports';
import BookedAndExchange from './pages/BookedAndExchange';
import Booked from './pages/Booked';
import PendingAndReceivingPayments from './pages/PendingAndReceivingPayments';
import ProfitExpenseAndStatistic from './pages/ProfitExpenseAndStatistic';
import MembersSuperAdmin from './pages/MembersSuperAdmin';
import Login from './pages/Login';
import SplashScreen from './components/common/SplashScreen';

import { useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, canAccessTab } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const currentPath = location.pathname;
  const allowed = user.allowedTabs || [];
  const isSuper = user.isSuperAdmin || user.role === 'SUPERADMIN' || allowed.includes('*');

  if (!isSuper) {
    const firstAllowed = allowed.find(t => t !== '*') || '/dashboard';

    if (currentPath === '/' || !canAccessTab(currentPath)) {
      if (currentPath !== firstAllowed) {
        return <Navigate to={firstAllowed} replace />;
      }
    }
  }

  return children;
}

function SuperAdminRoute({ children }) {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem('mrx_splash_shown');
    return !seen;
  });

  // Automatically reset legacy browser storage on any device loading the updated build
  React.useEffect(() => {
    const DATA_VERSION = 'v2_clean_zero_state_2026';
    if (localStorage.getItem('mrx_data_version') !== DATA_VERSION) {
      localStorage.setItem('mrx_old_inventory', JSON.stringify([]));
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify([]));
      localStorage.setItem('mrx_new_in_hand_stock', JSON.stringify([]));
      localStorage.setItem('mrx_repair_stock', JSON.stringify([]));
      localStorage.setItem('mrx_rejected_stock', JSON.stringify([]));
      localStorage.setItem('mrx_exchanges', JSON.stringify([]));
      localStorage.setItem('mrx_exchange_pool', JSON.stringify([]));
      localStorage.setItem('mrx_pending_payments', JSON.stringify([]));
      localStorage.setItem('mrx_sales', JSON.stringify([]));
      localStorage.setItem('mrx_expenses', JSON.stringify([]));
      localStorage.setItem('mrx_devices', JSON.stringify([]));
      localStorage.setItem('mrx_inventory_cleared', 'true');
      localStorage.setItem('mrx_data_version', DATA_VERSION);

      window.dispatchEvent(new Event('mrx_inventory_updated'));
      window.dispatchEvent(new Event('mrx_exchanges_updated'));
      window.dispatchEvent(new Event('mrx_pending_payments_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  }, []);

  const handleSplashFinish = () => {
    sessionStorage.setItem('mrx_splash_shown', 'true');
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Shell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Operational & Navigable Application Pages */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="old-inventory" element={<OldInventory />} />
              <Route path="old-in-hand" element={<OldInHandStock />} />
              <Route path="repair-stock" element={<RepairStock />} />
              <Route path="rejected-stocks" element={<RejectedStock />} />
              <Route path="booked-exchange" element={<BookedAndExchange />} />
              <Route path="booked" element={<Booked />} />
              <Route path="new-in-hand" element={<NewInHandStock />} />
              <Route path="pending-payments" element={<PendingAndReceivingPayments />} />
              <Route path="profit-expense-statistic" element={<ProfitExpenseAndStatistic />} />
              <Route path="reports" element={<Reports />} />
              <Route path="members-super-admin" element={<MembersSuperAdmin />} />

              <Route path="in-hand-stock" element={<Navigate to="/old-in-hand" replace />} />
              <Route path="resell-stock" element={<Navigate to="/old-in-hand" replace />} />
              <Route path="central-ledger" element={<SuperAdminRoute><CentralLedger /></SuperAdminRoute>} />
              <Route path="expenses" element={<SuperAdminRoute><Expenses /></SuperAdminRoute>} />
              <Route path="investments" element={<SuperAdminRoute><Investments /></SuperAdminRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

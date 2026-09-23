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

import React from 'react';
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
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
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
  return (
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
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="old-inventory" element={<OldInventory />} />
            
            {/* In-Hand Stock Separation */}
            <Route path="old-in-hand" element={<OldInHandStock />} />
            <Route path="in-hand-stock" element={<Navigate to="/old-in-hand" replace />} />
            <Route path="resell-stock" element={<Navigate to="/old-in-hand" replace />} />
            
            {/* Superadmin Restricted Modules */}
            <Route 
              path="new-in-hand" 
              element={
                <SuperAdminRoute>
                  <NewInHandStock />
                </SuperAdminRoute>
              } 
            />
            <Route 
              path="central-ledger" 
              element={
                <SuperAdminRoute>
                  <CentralLedger />
                </SuperAdminRoute>
              } 
            />
            <Route 
              path="expenses" 
              element={
                <SuperAdminRoute>
                  <Expenses />
                </SuperAdminRoute>
              } 
            />
            <Route 
              path="investments" 
              element={
                <SuperAdminRoute>
                  <Investments />
                </SuperAdminRoute>
              } 
            />

            {/* Repair, Rejected and Reports */}
            <Route path="repair-stock" element={<RepairStock />} />
            <Route path="rejected-stocks" element={<RejectedStock />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


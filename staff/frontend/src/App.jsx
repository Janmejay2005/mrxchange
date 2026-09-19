import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import OldInventory from './pages/OldInventory';
import InHandStock from './pages/InHandStock';
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
            <Route path="in-hand-stock" element={<InHandStock />} />
            {/* Legacy Resell Stock alias redirects directly to In-hand Stock */}
            <Route path="resell-stock" element={<Navigate to="/in-hand-stock" replace />} />
            <Route path="repair-stock" element={<RepairStock />} />
            <Route path="rejected-stocks" element={<RejectedStock />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

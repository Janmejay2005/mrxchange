import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Default to Superadmin for full immediate inspection capability, with toggle to Staff
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mrx_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'admin-user-1',
      name: 'System Superadmin',
      email: 'admin23@mrx.com',
      auth_identifier: 'Admin23',
      role: 'SUPERADMIN'
    };
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mrx_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mrx_user');
    }
  }, [user]);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      // Try backend API login
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });
      if (res.token) {
        localStorage.setItem('mrx_token', res.token);
      }
      setUser(res.user);
      setLoading(false);
      return true;
    } catch (err) {
      // Fallback local auth for testing
      const idLower = (identifier || '').toLowerCase();
      const isAdmin = idLower.includes('admin') || identifier === 'Admin23';

      const mockUser = {
        id: isAdmin ? 'admin-user-1' : 'staff-user-1',
        name: isAdmin ? 'System Superadmin' : 'Staff User',
        email: isAdmin ? 'admin23@mrx.com' : 'staff23@mrx.com',
        auth_identifier: isAdmin ? 'Admin23' : 'Staff23',
        role: isAdmin ? 'SUPERADMIN' : 'STAFF'
      };
      setUser(mockUser);
      setLoading(false);
      return true;
    }
  };

  const switchRole = (newRole) => {
    if (newRole === 'SUPERADMIN') {
      setUser({
        id: 'admin-user-1',
        name: 'System Superadmin',
        email: 'admin23@mrx.com',
        auth_identifier: 'Admin23',
        role: 'SUPERADMIN'
      });
    } else {
      setUser({
        id: 'staff-user-1',
        name: 'Staff User',
        email: 'staff23@mrx.com',
        auth_identifier: 'Staff23',
        role: 'STAFF'
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('mrx_token');
    localStorage.removeItem('mrx_user');
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, isSuperAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

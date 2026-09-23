import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Always require explicit login when opening application
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mrx_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null; // Force user to see Login page first
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
      // Offline / Local Authentication
      const idTrim = (identifier || '').trim();
      const passTrim = (password || '').trim();

      // Default Super Admins: Jeet Khubchandani & Sonal Wadwani
      if (idTrim === 'Jeet@1' && passTrim === 'jeetxchange') {
        const superAdminUser = {
          id: 'jeet-superadmin-1',
          name: 'Jeet Khubchandani',
          username: 'Jeet@1',
          email: 'jeet@mrxchange.com',
          role: 'SUPERADMIN',
          isSuperAdmin: true,
          allowedTabs: ['*']
        };
        setUser(superAdminUser);
        setLoading(false);
        return true;
      }

      if (idTrim === 'Sonal@1' && passTrim === 'sonalxchange') {
        const superAdminUser = {
          id: 'sonal-superadmin-2',
          name: 'Sonal Wadwani',
          username: 'Sonal@1',
          email: 'sonal@mrxchange.com',
          role: 'SUPERADMIN',
          isSuperAdmin: true,
          allowedTabs: ['*']
        };
        setUser(superAdminUser);
        setLoading(false);
        return true;
      }

      // Check custom added users in localStorage
      try {
        const customMembers = JSON.parse(localStorage.getItem('mrx_team_members') || '[]');
        const match = customMembers.find(m => 
          (m.username === idTrim || m.email === idTrim) && (m.password === passTrim || !m.password)
        );
        if (match && match.status === 'ACTIVE') {
          const isSuper = match.role === 'SUPERADMIN';
          const customUser = {
            id: match.id,
            name: match.name,
            username: match.username || match.email,
            email: match.email,
            role: match.role,
            isSuperAdmin: isSuper,
            allowedTabs: isSuper ? ['*'] : (match.allowedTabs || ['/dashboard'])
          };
          setUser(customUser);
          setLoading(false);
          return true;
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
      throw new Error('Invalid Username or Password');
    }
  };

  const logout = () => {
    localStorage.removeItem('mrx_token');
    localStorage.removeItem('mrx_user');
    setUser(null);
  };

  const isSuperAdmin = Boolean(user?.isSuperAdmin || user?.role === 'SUPERADMIN');

  const canAccessTab = (path) => {
    if (!user) return false;
    if (isSuperAdmin || (user.allowedTabs && user.allowedTabs.includes('*'))) return true;
    if (!user.allowedTabs) return false;
    return user.allowedTabs.includes(path);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isSuperAdmin, canAccessTab, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

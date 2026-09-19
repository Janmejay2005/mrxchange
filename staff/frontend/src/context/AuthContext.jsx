import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'staff-user-1',
    name: 'Aadarsh Sharma',
    email: 'staff@mrx.com',
    role: 'STAFF',
    auth_identifier: 'AS'
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    // Demo login implementation
    setUser({
      id: 'staff-user-1',
      name: email.includes('admin') ? 'System Admin' : 'Aadarsh Sharma',
      email: email,
      role: email.includes('admin') ? 'ADMIN' : 'STAFF',
      auth_identifier: 'AS'
    });
    return true;
  };

  const logout = () => {
    localStorage.removeItem('mrx_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

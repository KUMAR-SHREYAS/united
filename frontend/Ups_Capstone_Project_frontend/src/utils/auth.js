import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('ups_auth_token'));

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('ups_auth_token');
      setIsAuthenticated(!!token);
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const login = (username, password) => {
    // For demo, accept any non-empty credentials
    if (username && password) {
      localStorage.setItem('ups_auth_token', 'demo-token');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('ups_auth_token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 
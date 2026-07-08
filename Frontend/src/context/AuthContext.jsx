import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('es_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData, token) => {
    localStorage.setItem('es_user', JSON.stringify(userData));
    localStorage.setItem('es_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('es_user');
    localStorage.removeItem('es_token');
    setUser(null);
  };

  const getToken = () => localStorage.getItem('es_token');

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

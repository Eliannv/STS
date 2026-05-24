import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  function login(tokenValue, usuarioData) {
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    setToken(tokenValue);
    setUsuario(usuarioData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }

  const isAdmin = usuario?.rol === 'ADMINISTRADOR';

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

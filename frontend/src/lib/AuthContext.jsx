import { createContext, useContext, useState, useCallback } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user ? { token, user: JSON.parse(user) } : null;
  });

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.login(email, password);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setSession({ token, user });
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSession(null);
  }, []);

  // Merges a patch into session.user without a fresh login — used by the
  // forced setup wizard so must_complete_setup flips to false in the
  // client's session the moment the server confirms it, instead of
  // requiring the user to log out and back in.
  const updateUser = useCallback(patch => {
    setSession(prev => {
      if (!prev) return prev;
      const nextUser = { ...prev.user, ...patch };
      localStorage.setItem('user', JSON.stringify(nextUser));
      return { ...prev, user: nextUser };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

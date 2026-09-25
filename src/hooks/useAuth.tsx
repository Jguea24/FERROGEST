import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/db';

interface AuthContextType {
  user: User | null;
  login: (correo: string, contrasena: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (role: 'ADMINISTRADOR' | 'VENDEDOR') => void;
  isAdmin: boolean;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ferrogest_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default to Admin for immediate exploration if not logged in
    const users = db.getUsers();
    return users.find((u) => u.rol === 'ADMINISTRADOR') || null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('ferrogest_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ferrogest_current_user');
    }
  }, [user]);

  const login = async (correo: string, contrasena: string): Promise<boolean> => {
    const users = db.getUsers();
    const found = users.find(
      (u) => u.correo.toLowerCase() === correo.trim().toLowerCase() && u.estado === 'ACTIVO'
    );

    // Simple password check for demo purposes (admin123 / vendedor123 or matches email prefix)
    if (found && (contrasena === 'admin123' || contrasena === 'vendedor123' || contrasena === '123456')) {
      setUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const switchUser = (role: 'ADMINISTRADOR' | 'VENDEDOR') => {
    const users = db.getUsers();
    const target = users.find((u) => u.rol === role && u.estado === 'ACTIVO');
    if (target) {
      setUser(target);
    }
  };

  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const isSeller = user?.rol === 'VENDEDOR';

  return (
    <AuthContext.Provider value={{ user, login, logout, switchUser, isAdmin, isSeller }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/mockDb';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginHR: (email: string, pass: string) => Promise<boolean>;
  loginStaff: (uan: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session via ID lookup to ensure data is fresh from DB
  useEffect(() => {
    const initSession = async () => {
      const storedUid = localStorage.getItem('konark_uid');
      if (storedUid) {
        try {
          const fetchedUser = await db.getUserById(storedUid);
          if (fetchedUser) {
            setUser(fetchedUser);
          } else {
            // Invalid ID or user deleted
            localStorage.removeItem('konark_uid');
          }
        } catch (e) {
          console.error("Session restore failed", e);
        }
      }
      setLoading(false);
    };
    initSession();
  }, []);

  const loginHR = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (pass !== 'admin123') throw new Error('Invalid Credentials');
      const user = await db.loginHR(email);
      if (user) {
        setUser(user);
        localStorage.setItem('konark_uid', user.id);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginStaff = async (uan: string) => {
    setLoading(true);
    try {
      const user = await db.loginUAN(uan);
      if (user) {
        setUser(user);
        localStorage.setItem('konark_uid', user.id);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('konark_uid');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginHR, loginStaff, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
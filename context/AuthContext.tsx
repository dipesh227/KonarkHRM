import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/mockDb';
import { authenticateHR } from '../services/auth';

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

  const loginHR = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Use the new database authentication service
      const result = await authenticateHR(email, password);

      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('konark_uid', result.user.id);
        return true;
      }

      // Login failed - error message already logged by authenticateHR
      console.error('Login failed:', result.error);
      return false;
    } catch (e) {
      console.error('Login exception:', e);
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
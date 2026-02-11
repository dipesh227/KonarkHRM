import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/mockDb';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginHR: (email: string, pass: string) => Promise<boolean>;
  loginStaff: (uan: string) => Promise<boolean>;
  logout: () => void;
  hardResetSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const hardResetSession = () => {
    setUser(null);
    localStorage.removeItem('konark_uid');
  };

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
            hardResetSession();
          }
        } catch (e) {
          console.error('Session restore failed', e);
          hardResetSession();
        }
      }
      setLoading(false);
    };
    initSession();
  }, []);

  const loginHR = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const signedInUser = await db.loginHR(email, pass);
      if (signedInUser) {
        setUser(signedInUser);
        localStorage.setItem('konark_uid', signedInUser.id);
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
      const signedInUser = await db.loginUAN(uan);
      if (signedInUser) {
        setUser(signedInUser);
        localStorage.setItem('konark_uid', signedInUser.id);
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
    hardResetSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginHR, loginStaff, logout, hardResetSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

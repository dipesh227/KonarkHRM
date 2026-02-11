import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../services/mockDb';
import { Company } from '../types';

interface CompanyContextType {
  company: Company | null;
  refreshCompany: () => Promise<void>;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const CACHE_KEY = 'konark_company_profile_cache_v1';

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [company, setCompany] = useState<Company | null>(() => {
    // 1. Instant Load: Check LocalStorage first (Optimizes First Contentful Paint)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.warn("Failed to parse cached company profile", e);
      return null;
    }
  });
  
  const [loading, setLoading] = useState(!company);

  const refreshCompany = async () => {
    try {
      // 2. Network Load: Fetch fresh data from DB
      const data = await db.getCompanyProfile();
      if (data) {
        setCompany(data);
        
        // 3. Update Cache safely
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (storageErr) {
          console.warn("Local storage quota exceeded. Switching to text-only cache.");
          // Fallback: Clear cache and store only lightweight metadata (Name, Address) to ensure basic branding loads instantly next time.
          try {
            localStorage.removeItem(CACHE_KEY);
            const lightData = { 
              ...data, 
              logoUrl: undefined, 
              faviconUrl: undefined, 
              stampUrl: undefined, 
              signatureUrl: undefined 
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(lightData));
          } catch (e) {
            console.error("Local storage is completely full.", e);
          }
        }
        
        // Dynamic Favicon Update
        if (data.faviconUrl) {
          const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (link) {
            link.href = data.faviconUrl;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = data.faviconUrl;
            document.head.appendChild(newLink);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load company profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCompany();
  }, []);

  return (
    <CompanyContext.Provider value={{ company, refreshCompany, loading }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) throw new Error('useCompany must be used within CompanyProvider');
  return context;
};
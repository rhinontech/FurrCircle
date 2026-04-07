"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type AdminSession = {
  name: string;
  email: string;
  role: "admin";
  title: string;
};

type AdminAuthContextValue = {
  admin: AdminSession | null;
  isReady: boolean;
  loginAsAdmin: () => void;
  logout: () => void;
};

const STORAGE_KEY = "pawshub_admin_session";

const defaultAdmin: AdminSession = {
  name: "PawsHub Admin",
  email: "admin@pawshub.app",
  role: "admin",
  title: "Super Admin",
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setAdmin(JSON.parse(raw) as AdminSession);
      }
    } catch (error) {
      console.error("Failed to restore admin session", error);
    } finally {
      setIsReady(true);
    }
  }, []);

  const loginAsAdmin = () => {
    setAdmin(defaultAdmin);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAdmin));
  };

  const logout = () => {
    setAdmin(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isReady, loginAsAdmin, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

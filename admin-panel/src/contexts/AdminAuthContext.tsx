"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/api';
const SESSION_KEY = "pawshub_admin_session";
const TOKEN_KEY = "pawshub_admin_token";

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: "admin";
  token: string;
  title?: string;
};

type AdminAuthContextValue = {
  admin: AdminSession | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) setAdmin(JSON.parse(raw) as AdminSession);
    } catch {
      // ignore
    } finally {
      setIsReady(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Login failed");
    if (data.role !== "admin") throw new Error("Access denied: not an admin account");

    const session: AdminSession = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: "admin",
      token: data.token,
      title: data.title,
    };

    setAdmin(session);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.localStorage.setItem(TOKEN_KEY, data.token);
  };

  const logout = () => {
    setAdmin(null);
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isReady, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
}

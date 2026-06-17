"use client";
import React from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import AdminLoginScreen from './AdminLoginScreen';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { admin, isReady, dangerMode } = useAdminAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary-900 animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <AdminLoginScreen />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden selection:bg-primary-100 selection:text-primary-900 font-sans antialiased">
      {/* Sidebar - Fixed/Sticky via component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Fixed/Sticky Top */}
        <AdminHeader />

        {/* Status Banner */}
        {dangerMode ? (
          <div className="bg-rose-600 text-white text-[11px] font-bold py-2 px-8 flex items-center justify-center gap-2 border-b border-rose-700 shadow-sm shrink-0 uppercase tracking-wider select-none">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>🚨 Danger Mode Active: You can create, edit and delete live data. Use caution.</span>
          </div>
        ) : (
          <div className="bg-amber-500 text-white text-[11px] font-bold py-2 px-8 flex items-center justify-center gap-2 border-b border-amber-600 shadow-sm shrink-0 uppercase tracking-wider select-none">
            <span>🔒 Read-Only Mode: Toggle "Danger Mode" in the top header to enable editing and deleting.</span>
          </div>
        )}

        {/* Dynamic Page Content - Scrollable Main */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

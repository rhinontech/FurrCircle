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
  const { admin, isReady } = useAdminAuth();

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

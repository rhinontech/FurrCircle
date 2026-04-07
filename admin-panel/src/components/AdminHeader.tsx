import React from 'react';
import { Search, Bell, ChevronRight } from "lucide-react";
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminHeader = () => {
  const pathname = usePathname();
  const { admin } = useAdminAuth();
  
  // Dynamic breadcrumbs based on route
  const getBreadcrumb = () => {
    if (pathname === '/') return 'Dashboard';
    const parts = pathname?.split('/').filter(Boolean);
    if (!parts) return 'Dashboard';
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ');
  };

  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 flex-none sticky top-0 z-10 shadow-sm/5 glassmorphism backdrop-blur-md bg-white/80">
      <div className="flex items-center gap-2 text-slate-500 text-sm overflow-hidden">
        <span className="text-slate-400">PawsHub</span>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="font-semibold text-slate-950 truncate whitespace-nowrap">{getBreadcrumb()}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Header Search - Visible on Desktop */}
        <div className="relative hidden md:block w-72 lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Pets, Vets, Clinics..." 
            className="w-full bg-slate-100 border-none rounded-input pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary-900/10 placeholder:text-slate-400/70"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-slate-100 text-slate-600 rounded-control hover:bg-slate-200 transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-200 group cursor-pointer">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-950 leading-none">{admin?.name || "Admin User"}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{admin?.title || "Super Admin"}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 text-primary-900 rounded-full flex items-center justify-center font-bold text-sm ring-1 ring-primary-900/5 group-hover:ring-primary-900/20 transition-all duration-200 shadow-sm">
              {(admin?.name || "Admin User")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

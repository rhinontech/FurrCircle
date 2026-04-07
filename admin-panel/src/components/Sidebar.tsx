import React from 'react';
import { 
  Users, 
  LayoutDashboard, 
  PawPrint, 
  Stethoscope, 
  Bell, 
  Settings, 
  LogOut,
  Calendar,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const Sidebar = () => {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Manage Users", icon: Users, href: "/users" },
    { label: "Pet Listings", icon: PawPrint, href: "/pets" },
    { label: "Vet Verification", icon: Stethoscope, href: "/vets" },
    { label: "Community", icon: MessageSquare, href: "/community" },
    { label: "Adoptions", icon: ShieldCheck, href: "/adoptions" },
    { label: "Manage Events", icon: Bell, href: "/events" },
  ];

  return (
    <aside className="w-64 bg-primary-900 text-white flex flex-col p-6 flex-none h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-white p-2 rounded-xl">
          <PawPrint className="text-primary-900" size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight">PawsHub Admin</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-white" : "text-white/40 group-hover:text-white/70"} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/10 space-y-2 mt-auto">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Signed In As</p>
          <p className="mt-2 text-sm font-semibold text-white">{admin?.name || "Admin User"}</p>
          <p className="text-xs text-white/50 mt-1">{admin?.title || "Super Admin"}</p>
        </div>
        <Link 
          href="/settings"
          className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${
            pathname === "/settings" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
          }`}
        >
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </Link>
        <button onClick={logout} className="flex items-center gap-3 w-full p-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

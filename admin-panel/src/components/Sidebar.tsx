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
  ShieldCheck,
  ClipboardList,
  Star,
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
    { label: "Vet Management", icon: Stethoscope, href: "/vets" },
    { label: "Vet Reviews", icon: Star, href: "/vet-reviews" },
    { label: "Appointments", icon: Calendar, href: "/appointments" },
    { label: "Community", icon: MessageSquare, href: "/community" },
  ];
  const eventItem = { label: "Manage Events", icon: Bell, href: "/events" };
  const adoptionItems = [
    { label: "Listings", icon: ShieldCheck, href: "/adoptions" },
    { label: "Applications", icon: ClipboardList, href: "/adoptions/applications" },
  ];
  const isAdoptionActive = pathname === "/adoptions" || pathname?.startsWith("/adoptions/");

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
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname?.startsWith(item.href + "/");
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
        <div className={`rounded-xl transition-all duration-200 ${isAdoptionActive ? "bg-white/10" : "hover:bg-white/5"}`}>
          <Link
            href="/adoptions"
            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors group ${
              isAdoptionActive ? "text-white" : "text-white/60 hover:text-white"
            }`}
          >
            <ShieldCheck size={20} className={isAdoptionActive ? "text-white" : "text-white/40 group-hover:text-white/70"} />
            <span className="font-medium">Adoptions</span>
          </Link>
          <div className="pb-2 pl-5 pr-2 space-y-1">
            {adoptionItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  }`}
                >
                  <item.icon size={15} className={isActive ? "text-white" : "text-white/35"} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        {(() => {
          const isActive = pathname === eventItem.href || pathname?.startsWith(eventItem.href + "/");
          return (
            <Link
              href={eventItem.href}
              className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <eventItem.icon size={20} className={isActive ? "text-white" : "text-white/40 group-hover:text-white/70"} />
              <span className="font-medium">{eventItem.label}</span>
            </Link>
          );
        })()}
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

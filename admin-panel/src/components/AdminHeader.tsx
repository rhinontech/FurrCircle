import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Bell, ChevronRight, ChevronDown, LogOut, Settings } from "lucide-react";
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminHeader = () => {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [pathname]);

  const getBreadcrumb = () => {
    if (pathname === '/') return 'Dashboard';
    const parts = pathname?.split('/').filter(Boolean);
    if (!parts) return 'Dashboard';
    return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' / ');
  };

  const adminName = admin?.name || "Admin User";
  const adminTitle = admin?.title || "Super Admin";
  const adminEmail = admin?.email || "admin@furrcircle.com";
  const adminInitials = adminName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 flex-none sticky top-0 z-10 shadow-sm/5 glassmorphism backdrop-blur-md bg-white/80">
      <div className="flex items-center gap-3 text-slate-500 text-sm overflow-hidden">
        <Image
          src="/furrcircle_light_logo.png"
          alt="FurrCircle"
          width={128}
          height={44}
          priority
          className="hidden h-12 w-auto shrink-0 sm:block"
        />
        <span className="shrink-0 font-semibold text-slate-400 sm:hidden">FurrCircle</span>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="font-semibold text-slate-950 truncate whitespace-nowrap">{getBreadcrumb()}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block w-72 lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search Pets, Vets, Clinics..."
            className="w-full bg-slate-100 border-none rounded-input pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary-900/10 placeholder:text-slate-400/70"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-slate-100 text-slate-600 rounded-control hover:bg-slate-200 transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>

          <div ref={profileMenuRef} className="relative ml-2 pl-4 border-l border-slate-200">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-slate-100"
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-950 leading-none">{adminName}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{adminTitle}</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 text-primary-900 rounded-full flex items-center justify-center font-bold text-sm ring-1 ring-primary-900/5 transition-all duration-200 shadow-sm">
                {adminInitials}
              </div>
              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform sm:block ${isProfileMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[19rem] rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Signed In As</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{adminName}</p>
                  <p className="mt-1 text-xs text-slate-500">{adminTitle}</p>
                  <p className="mt-3 text-xs text-slate-400">{adminEmail}</p>
                </div>

                <div className="mt-3 space-y-1">
                  <Link
                    href="/settings"
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                      pathname === "/settings"
                        ? "bg-primary-50 text-primary-900"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

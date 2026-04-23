import React from 'react';
import Image from 'next/image';
import {
  Users,
  LayoutDashboard,
  PawPrint,
  Stethoscope,
  Bell,
  Calendar,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  ClipboardList,
  Star,
  Mail,
} from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Manage Users", icon: Users, href: "/users" },
    { label: "Pet Listings", icon: PawPrint, href: "/pets" },
    { label: "Vet Management", icon: Stethoscope, href: "/vets" },
    { label: "Vet Reviews", icon: Star, href: "/vet-reviews" },
    { label: "Appointments", icon: Calendar, href: "/appointments" },
    { label: "Campaigns", icon: Megaphone, href: "/campaigns" },
    { label: "Contact Leads", icon: Mail, href: "/contact-leads" },
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
      <div className="mb-5">
        <Image
          src="/furrcircle_dark_logo.png"
          alt="FurrCircle"
          width={168}
          height={55}
          priority
          className="h-16 w-auto"
        />
      </div>

      <nav className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex min-h-full flex-col gap-1">
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
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

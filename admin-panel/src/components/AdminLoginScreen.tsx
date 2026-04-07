"use client";

import React from "react";
import { Lock, ShieldCheck, PawPrint } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const AdminLoginScreen = () => {
  const { loginAsAdmin } = useAdminAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
        <div className="rounded-[32px] bg-primary-900 text-white p-10 lg:p-12 shadow-xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold tracking-wide">
              <PawPrint size={18} />
              PawsHub Internal Console
            </div>
            <h1 className="mt-8 text-4xl lg:text-5xl font-bold leading-tight">
              Manage users, vets, community, pets, events, and approvals in one place.
            </h1>
            <p className="mt-6 text-white/70 max-w-xl text-base leading-7">
              This panel is for platform administrators only. Customer-facing mobile apps stay separate, while
              the admin console gives you complete operational visibility across the system.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {[
              "Review vet verification requests",
              "Moderate community posts and listings",
              "Monitor users, pets, events, and adoption activity",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] bg-white border border-slate-200 shadow-sm p-8 lg:p-10 flex flex-col justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-900 flex items-center justify-center">
            <ShieldCheck size={28} />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-950">Admin Access</h2>
          <p className="mt-3 text-slate-500 leading-7">
            Sign in as platform admin to open the internal management console.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Role</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">Super Admin</p>
            <p className="mt-1 text-sm text-slate-500">admin@pawshub.app</p>
          </div>

          <button
            onClick={loginAsAdmin}
            className="mt-8 w-full rounded-2xl bg-primary-900 px-5 py-4 text-white font-bold text-base hover:bg-primary-800 transition-colors shadow-sm flex items-center justify-center gap-3"
          >
            <Lock size={18} />
            Continue as Admin
          </button>

          <p className="mt-4 text-xs text-slate-400 leading-6">
            This session is separate from the mobile app roles. Owners, vets, and shelters use the app, while
            admins manage everything from this console.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginScreen;

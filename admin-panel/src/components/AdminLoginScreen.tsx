"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck, PawPrint, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const AdminLoginScreen = () => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
        {/* Left panel */}
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
              This panel is for platform administrators only. Customer-facing mobile apps stay separate,
              while the admin console gives you complete operational visibility across the system.
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

        {/* Right panel — login form */}
        <div className="rounded-[32px] bg-white border border-slate-200 shadow-sm p-8 lg:p-10 flex flex-col justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-900 flex items-center justify-center">
            <ShieldCheck size={28} />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-950">Admin Access</h2>
          <p className="mt-3 text-slate-500 leading-7">
            Sign in with your admin credentials to open the management console.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pawshub.app"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary-900 px-5 py-4 text-white font-bold text-base hover:bg-primary-800 disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-3"
            >
              <Lock size={18} />
              {loading ? "Signing in..." : "Sign In as Admin"}
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-400 leading-6">
            This session is separate from the mobile app roles. Only accounts with the admin role can access this console.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginScreen;

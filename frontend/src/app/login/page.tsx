"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Store, Eye, EyeOff, LogIn, User, ShieldCheck, Briefcase } from "lucide-react";
import { useAuthStore, UserRole } from "@/stores/authStore";

const roleInfo: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  ADMIN: { label: "แอดมิน", icon: ShieldCheck, color: "#6366f1" },
  CASHIER: { label: "แคชเชียร์", icon: User, color: "#22c55e" },
  MANAGER: { label: "ผู้จัดการ", icon: Briefcase, color: "#f59e0b" },
};

const quickAccess = [
  { email: "admin@pos.com", password: "admin123", label: "Admin", role: "ADMIN" as UserRole },
  { email: "cashier@pos.com", password: "cashier123", label: "Cashier", role: "CASHIER" as UserRole },
  { email: "manager@pos.com", password: "manager123", label: "Manager", role: "MANAGER" as UserRole },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    clearError();

    // Simulate network delay
    await new Promise((res) => setTimeout(res, 500));

    const success = await login(email, password);
    setIsLoading(false);
    if (success) {
      router.replace("/");
    }
  };

  const handleQuickLogin = async (acc: (typeof quickAccess)[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setIsLoading(true);
    clearError();
    await new Promise((res) => setTimeout(res, 400));
    const success = await login(acc.email, acc.password);
    setIsLoading(false);
    if (success) {
      router.replace("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary glow-primary mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">POS Online</h1>
          <p className="text-muted mt-2">ระบบขายหน้าร้าน</p>
        </div>

        {/* Login Card */}
        <div className="glass-strong rounded-2xl p-8">
          <h2 className="text-xl font-bold text-foreground mb-1">เข้าสู่ระบบ</h2>
          <p className="text-sm text-muted mb-6">กรุณาใส่อีเมลและรหัสผ่านเพื่อเข้าใช้งาน</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder-muted/50 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-surface border border-border text-foreground placeholder-muted/50 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-scale-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)" }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </form>

          {/* Quick Access */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3 text-center">
              ทดลองเข้าใช้งาน (Demo)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {quickAccess.map((acc) => {
                const info = roleInfo[acc.role];
                const Icon = info.icon;
                return (
                  <button
                    key={acc.role}
                    onClick={() => handleQuickLogin(acc)}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-surface-hover transition-all group disabled:opacity-50"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
                      style={{ background: `${info.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: info.color }} />
                    </div>
                    <span className="text-xs font-medium text-foreground">{info.label}</span>
                    <span className="text-[10px] text-muted">{acc.email}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted/50 mt-6">
          © 2026 POS Online — Demo Version
        </p>
      </div>
    </div>
  );
}

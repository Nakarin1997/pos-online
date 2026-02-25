"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid,
  Package,
  History,
  BarChart3,
  Store,
  ChefHat,
  LogOut,
  ShieldCheck,
  User,
  Users,
  Contact,
  Tag,
  Briefcase,
  Moon,
  Sun,
  Settings,
} from "lucide-react";
import { useAuthStore, UserRole } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useLanguageStore } from "@/stores/languageStore";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[]; // if undefined, all roles can see it
}

const navItems: NavItem[] = [
  { href: "/", label: "POS", icon: LayoutGrid },
  { href: "/products", label: "สินค้า", icon: Package, roles: ["ADMIN", "MANAGER"] },
  { href: "/cost-calculator", label: "ต้นทุน", icon: ChefHat, roles: ["ADMIN", "MANAGER"] },
  { href: "/members", label: "สมาชิก", icon: Contact },
  { href: "/promotions", label: "โปรโมชั่น", icon: Tag, roles: ["ADMIN", "MANAGER"] },
  { href: "/history", label: "ประวัติ", icon: History },
  { href: "/dashboard", label: "แดชบอร์ด", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
  { href: "/users", label: "ผู้ใช้", icon: Users, roles: ["ADMIN"] },
  { href: "/settings", label: "ตั้งค่า", icon: Settings, roles: ["ADMIN"] },
];

const roleDisplay: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  ADMIN: { label: "แอดมิน", icon: ShieldCheck, color: "#6366f1" },
  CASHIER: { label: "แคชเชียร์", icon: User, color: "#22c55e" },
  MANAGER: { label: "ผู้จัดการ", icon: Briefcase, color: "#f59e0b" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage, t } = useLanguageStore();

  // Don't show sidebar on login page or when not authenticated
  if (!isAuthenticated || pathname === "/login") return null;

  const userRole = user?.role || "CASHIER";
  const role = roleDisplay[userRole];
  const RoleIcon = role.icon;
  const translatedRoleLabel = t(`role.${userRole.toLowerCase()}`);

  const visibleNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-[72px] glass-strong flex flex-col items-center pt-6 pb-20 z-50 overflow-y-auto no-scrollbar">
      {/* Logo */}
      <div className="mb-6 flex items-center justify-center w-11 h-11 rounded-xl bg-primary glow-primary">
        <Store className="w-6 h-6 text-white" />
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-2 flex-1">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl
                transition-all duration-200 relative
                ${
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label === "POS" ? "POS" : t(`nav.${item.href === "/" ? "pos" : item.href.slice(1).replace("-", "")}`)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Tools & User */}
      <div className="flex flex-col items-center gap-3 pt-4 border-t border-border/50">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover text-muted hover:text-foreground transition-all"
          title={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover text-muted hover:text-foreground transition-all font-bold text-xs"
          title={t('nav.language')}
        >
          {language.toUpperCase()}
        </button>

        {/* User Role Badge */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center mt-2"
          style={{ background: `${role.color}20` }}
          title={`${user?.name} (${translatedRoleLabel})`}
        >
          <RoleIcon className="w-4.5 h-4.5" style={{ color: role.color }} />
        </div>
        <span className="text-[9px] font-medium text-muted leading-tight text-center max-w-[60px] truncate">
          {user?.name}
        </span>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-muted hover:text-danger hover:bg-danger/10 transition-all"
          title={t('nav.logout')}
        >
          <LogOut className="w-4.5 h-4.5" />
          <span className="text-[9px] font-medium">{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
}

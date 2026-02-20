"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthGuard>
      {!isLoginPage && <Sidebar />}
      <main className={isLoginPage ? "min-h-screen" : "ml-[72px] min-h-screen"}>
        {children}
      </main>
    </AuthGuard>
  );
}

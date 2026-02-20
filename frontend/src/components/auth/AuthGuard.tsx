"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

const publicRoutes = ["/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!isPublicRoute && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isPublicRoute, isAuthenticated, router]);

  const isReady = isPublicRoute || isAuthenticated;

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

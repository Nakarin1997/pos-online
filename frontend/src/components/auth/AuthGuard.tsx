"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

const publicRoutes = ["/login"];
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const isPublicRoute = publicRoutes.includes(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTimeout = useCallback(() => {
    if (isAuthenticated) {
      logout();
      alert("เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบใหม่");
      router.replace("/login");
    }
  }, [isAuthenticated, logout, router]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (isAuthenticated && !isPublicRoute) {
      timeoutRef.current = setTimeout(handleTimeout, IDLE_TIMEOUT_MS);
    }
  }, [handleTimeout, isAuthenticated, isPublicRoute]);

  // Handle active session redirection
  useEffect(() => {
    if (!isPublicRoute && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isPublicRoute, isAuthenticated, router]);

  // Handle idle timeout event listeners
  useEffect(() => {
    if (isPublicRoute || !isAuthenticated) return;

    resetTimer();

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer, isPublicRoute, isAuthenticated]);

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

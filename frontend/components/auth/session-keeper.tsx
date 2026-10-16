"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * SessionKeeper: Silent client-side background token refresher
 * - Pings /api/auth/refresh every 10 minutes (before the 15m access token expires)
 * - Also refreshes when user returns to the tab after being away
 */
export function SessionKeeper() {
  const pathname = usePathname();
  const lastRefreshTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Skip on auth pages (login, register, etc.)
    const isAuthRoute =
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/verify-otp" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password";

    if (isAuthRoute) return;

    const silentRefresh = async () => {
      try {
        const now = Date.now();
        // Throttle to at most once every 3 minutes
        if (now - lastRefreshTimeRef.current < 3 * 60 * 1000) {
          return;
        }

        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          lastRefreshTimeRef.current = Date.now();
        }
      } catch (err) {
        // Silently ignore network failures; server actions have fallback
      }
    };

    // 1. Refresh every 10 minutes
    const interval = setInterval(silentRefresh, 10 * 60 * 1000);

    // 2. Refresh when user focuses the tab after being away for > 5 minutes
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRefreshTimeRef.current > 5 * 60 * 1000
      ) {
        silentRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}


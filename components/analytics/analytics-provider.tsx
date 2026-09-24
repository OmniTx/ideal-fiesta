"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { startPresenceTracking, trackVisit } from "@/lib/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const lastTracked = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Skip tracking for admin pages to keep public visitor analytics clean
    if (pathname.startsWith("/admin")) return;

    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    // Small delay after hydration to avoid blocking page paint
    const timer = setTimeout(() => {
      void trackVisit(pathname);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Presence is global rather than per route: one heartbeat and one leave
  // handler for the whole session, so a customer browsing the menu keeps
  // showing as live in the admin.
  React.useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    return startPresenceTracking();
  }, []);

  return null;
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { fetchSetting } from "@/lib/settings";
import {
  DEFAULT_THEME,
  applyTheme,
  mergeWithDefaultTheme,
} from "@/lib/theme";
import type { ThemeSettings } from "@/lib/types/database";
import { createClient } from "@/utils/supabase/client";

function ShellSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-1" aria-hidden="true">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-11 w-full animate-pulse rounded-full bg-muted" />
      <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    let isActive = true;

    const bootstrap = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      if (isActive) setIsReady(true);

      // Load custom theme asynchronously in the background without blocking the UI
      fetchSetting<Partial<ThemeSettings>>("theme")
        .then((saved) => {
          if (isActive) applyTheme(mergeWithDefaultTheme(saved));
        })
        .catch(() => {
          if (isActive) applyTheme(DEFAULT_THEME);
        });
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/admin/login");
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 sm:px-6">
        {isReady ? children : <ShellSkeleton />}
      </main>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
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

/**
 * Admin shell: a fixed sidebar from `lg` up, and a top bar with a drawer below
 * it. The navigation itself is shared (`AdminNav`) so both forms stay in step.
 *
 * The session check is a UX gate only — RLS is what actually enforces access,
 * and every admin policy now requires `app_metadata.role = 'admin'`.
 */
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-card lg:block">
        <AdminSidebar />
      </aside>

      <div className="lg:pl-60">
        <AdminHeader />
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 sm:px-6">
          {isReady ? children : <ShellSkeleton />}
        </main>
      </div>
    </div>
  );
}

"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * App-wide toast host. The admin uses this for save confirmations and for
 * optimistic-update rollbacks.
 */
export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-border bg-card text-card-foreground shadow-lg",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-foreground",
        },
      }}
      {...props}
    />
  );
}

import * as React from "react";

import { ActiveOrderBar } from "@/components/shop/active-order-bar";
import { CartProvider } from "@/components/shop/cart-provider";
import { CartSheet } from "@/components/shop/cart-sheet";
import { OrderProvider } from "@/components/shop/order-provider";
import { OrderTrackerDialog } from "@/components/shop/order-tracker-dialog";
import { RewardsDialog } from "@/components/shop/rewards-dialog";
import { RewardsProvider } from "@/components/shop/rewards-provider";
import { ShopFooter } from "@/components/shop/shop-footer";
import { ShopHeader } from "@/components/shop/shop-header";
import { VipPerkBanner } from "@/components/shop/vip-perk-banner";

/**
 * Storefront shell.
 *
 * Three pieces of per-device state live here — the rewards membership, the
 * device's order tickets, and the basket. Each provider is declared above the
 * components that consume it, and each panel is rendered as a sibling rather
 * than imported by its provider, so no provider module has to import the panel
 * back (which would be a cycle).
 */
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RewardsProvider>
      <OrderProvider>
        <CartProvider>
          <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-background">
            <ShopHeader />
            <main className="min-h-[calc(100vh-16rem)]">{children}</main>
            <ShopFooter />
            <VipPerkBanner />
            <ActiveOrderBar />
            <CartSheet />
            <RewardsDialog />
            <OrderTrackerDialog />
          </div>
        </CartProvider>
      </OrderProvider>
    </RewardsProvider>
  );
}

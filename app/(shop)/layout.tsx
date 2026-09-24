import * as React from "react";

import { ActiveOrderBar } from "@/components/shop/active-order-bar";
import { BasketBar } from "@/components/shop/basket-bar";
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

            {/* One slot at the bottom of the screen, shared. Every component in
                here is a plain bar; the stacking is done once, here, so they
                cannot overlap each other or the rewards nudge. */}
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 p-3 sm:p-4">
              <ActiveOrderBar />
              <BasketBar />
            </div>

            <CartSheet />
            <RewardsDialog />
            <OrderTrackerDialog />
          </div>
        </CartProvider>
      </OrderProvider>
    </RewardsProvider>
  );
}

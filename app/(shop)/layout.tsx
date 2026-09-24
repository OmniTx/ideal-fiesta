import * as React from "react";

import { CartProvider } from "@/components/shop/cart-provider";
import { CartSheet } from "@/components/shop/cart-sheet";
import { RewardsDialog } from "@/components/shop/rewards-dialog";
import { RewardsProvider } from "@/components/shop/rewards-provider";
import { ShopFooter } from "@/components/shop/shop-footer";
import { ShopHeader } from "@/components/shop/shop-header";
import { VipPerkBanner } from "@/components/shop/vip-perk-banner";

/**
 * Storefront shell. The rewards membership and the basket are per-device state
 * shared by the header, the product sheet and the panels, so both providers sit
 * above everything and their panels render as siblings — that keeps the provider
 * modules free of imports back into the panel components.
 */
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RewardsProvider>
      <CartProvider>
        <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-background">
          <ShopHeader />
          <main className="min-h-[calc(100vh-16rem)]">{children}</main>
          <ShopFooter />
          <VipPerkBanner />
          <CartSheet />
          <RewardsDialog />
        </div>
      </CartProvider>
    </RewardsProvider>
  );
}

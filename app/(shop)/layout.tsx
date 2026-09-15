import * as React from "react";
import { ShopHeader } from "@/components/shop/shop-header";
import { ShopFooter } from "@/components/shop/shop-footer";
import { VipPerkBanner } from "@/components/shop/vip-perk-banner";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-background">
      <ShopHeader />
      <main className="min-h-[calc(100vh-16rem)]">{children}</main>
      <ShopFooter />
      <VipPerkBanner />
    </div>
  );
}

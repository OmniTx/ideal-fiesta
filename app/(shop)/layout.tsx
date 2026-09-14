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
    <div className="min-h-screen bg-[#f3f0e1] text-[#1b1915] selection:bg-[#46543a] selection:text-[#f3f0e1]">
      <ShopHeader />
      <main className="min-h-[calc(100vh-16rem)]">{children}</main>
      <ShopFooter />
      <VipPerkBanner />
    </div>
  );
}

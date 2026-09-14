"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Coffee, Utensils, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { MenuItem } from "@/lib/types/database";
import { DEFAULT_MENU_ITEMS } from "@/lib/data/default-menu";
import { ProductSheet } from "@/components/shop/product-sheet";

const PAIRINGS: Record<string, { drink: string; note: string }> = {
  "Feta Salad": {
    drink: "Iced Long Black",
    note: "The bright acidity of cold black coffee cuts through the rich smashed avocado and salty Persian feta.",
  },
  "Smashed Avo and Feta on Toast": {
    drink: "Double Ristretto Flat White",
    note: "Silky microfoam pairs naturally with the creamy feta and fresh lemon squeeze.",
  },
  "Pesto and Fried Eggs": {
    drink: "Hot Long Black",
    note: "Crisp fried egg edges and aromatic basil pesto contrast beautifully with a clean espresso extraction.",
  },
  "Smoked Salmon and Avo": {
    drink: "Cold Brew or Iced Sencha",
    note: "Chilled clean notes elevate the delicate Tasmanian smoked salmon and fresh baby spinach.",
  },
  "Salmon, Cream Cheese and Capers": {
    drink: "Batch Brew or Latte",
    note: "Tangy capers and rich cream cheese balanced by a smooth, rounded roast profile.",
  },
  "Hummus, Feta and Sundried Tomato": {
    drink: "Dirty Chai",
    note: "Warm masala spices complement the savory sundried tomatoes and house hummus.",
  },
};

import { subscribeToMenuChanges } from "@/lib/realtime";
import { trackItemClick } from "@/lib/analytics";

export default function ShopSpecialsPage() {
  const [items, setItems] = React.useState<MenuItem[]>(() => {
    return DEFAULT_MENU_ITEMS.filter((it) => it.is_special);
  });

  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null);

  // Live Supabase revalidation & realtime sync in the background
  React.useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadSpecials() {
      try {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .eq("is_special", true)
          .order("display_order", { ascending: true });

        if (!error && data && data.length > 0 && isMounted) {
          setItems(data as MenuItem[]);

          setSelectedItem((current) => {
            if (!current) return null;
            const updated = (data as MenuItem[]).find((i) => i.id === current.id);
            return updated || current;
          });
        }
      } catch {
        // Safe fallback
      }
    }

    void loadSpecials();

    // Subscribe to live realtime updates
    const unsubscribe = subscribeToMenuChanges(() => {
      void loadSpecials();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="bg-[#f3f0e1] pb-24">
      {/* Hero Spotlight Section */}
      <section className="border-b border-[#dbd5c0] bg-[#46543a] px-4 py-16 text-[#f2f1e4] sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#cfd8bd] transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Full Menu Catalog</span>
          </Link>

          <div className="mt-6 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#cfd8bd]">
            <Sparkles className="h-4 w-4" />
            <span>Chef&apos;s Counter Selection</span>
          </div>

          <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-white sm:text-6xl">
            Foundry Specials
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#e3e5d4]">
            Seasonal rotations and signature plates. Every dish is 100% gluten
            free, prepared to order on Level 3 of Indooroopilly Shopping Centre.
          </p>
        </div>
      </section>

      {/* Notice Ribbon */}
      <div className="border-b border-[#dbd5c0] bg-[#eae5d2] px-4 py-2 text-center text-xs font-medium text-[#6e6a5a]">
        <span>
          Made to order daily · Ask our barista for today&apos;s seasonal baker
          rotation
        </span>
      </div>

      {/* Specials Grid */}
      <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2">
          {items.map((item) => {
            const pairing = PAIRINGS[item.name] || {
              drink: "Double Ristretto Flat White",
              note: "Pairs wonderfully with our signature house roast.",
            };

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-[#dbd5c0] bg-white/70 p-6 shadow-xs transition hover:border-[#1b1915]/40 hover:bg-white"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-display text-2xl font-bold text-[#1b1915]">
                      {item.name}
                    </h2>
                    <span className="shrink-0 font-display text-xl font-bold text-[#1b1915]">
                      ${(item.price_single ?? item.price_medium ?? 0).toFixed(2)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-3 text-sm leading-relaxed text-[#6e6a5a]">
                      {item.description}
                    </p>
                  )}

                  {/* Barista Pairing Callout */}
                  <div className="mt-6 rounded-xl border border-[#dbd5c0] bg-[#f3f0e1]/70 p-4 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-[#46543a] uppercase tracking-wider">
                      <Coffee className="h-3.5 w-3.5" />
                      <span>Barista Pairing</span>
                    </div>
                    <p className="mt-1 font-medium text-[#1b1915]">
                      {pairing.drink}
                    </p>
                    <p className="mt-1 text-[#6e6a5a] leading-normal">
                      {pairing.note}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-[#dbd5c0] pt-4">
                  <span className="flex items-center gap-1.5 text-xs text-[#46543a]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>100% Gluten Free</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                      void trackItemClick(item.name, "specials");
                    }}
                    className="rounded-full bg-[#1b1915] px-4 py-2 text-xs font-semibold text-[#f3f0e1] transition hover:bg-[#3b2a1e]"
                  >
                    View Options & Sides
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to Full Menu CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/menu"
            className="inline-block rounded-full border border-[#1b1915] px-8 py-3 text-sm font-semibold tracking-wider text-[#1b1915] uppercase transition hover:bg-[#1b1915] hover:text-[#f3f0e1]"
          >
            Explore all 58 menu items
          </Link>
        </div>
      </div>

      {/* Product Customizer Sheet */}
      <ProductSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MenuItem, MenuCategory } from "@/lib/types/database";
import { DEFAULT_MENU_ITEMS } from "@/lib/data/default-menu";
import { ProductSheet } from "@/components/shop/product-sheet";

interface CategoryMeta {
  id: MenuCategory;
  title: string;
  type: "drinks" | "food";
  cols?: Array<"S" | "M" | "L">;
  note?: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: "hot_coffee", title: "Hot Coffee", type: "drinks", cols: ["S", "M", "L"] },
  { id: "iced_coffee", title: "Iced Coffee", type: "drinks", cols: ["M", "L"] },
  { id: "hot_drinks", title: "Hot Drinks", type: "drinks", cols: ["S", "M", "L"] },
  { id: "tea", title: "Tea Lovers", type: "drinks" },
  { id: "sweet_tooth", title: "Sweet Tooth", type: "drinks", cols: ["M", "L"] },
  { id: "shakes_frappes", title: "Shakes and Frappes", type: "drinks" },
  {
    id: "breakfast",
    title: "Classic Breakfasts",
    type: "food",
    note: "All served on 100% gluten-free bread. Swap toast for a bagel +$1.",
  },
  { id: "toasties", title: "Artisan Toasties", type: "food" },
  {
    id: "specials",
    title: "Foundry Specials",
    type: "food",
    note: "Chef's signature brunch plates, made fresh to order.",
  },
  { id: "spreads", title: "Spreads on Toast or Bagel", type: "food" },
];

const CACHE_KEY = "foundry_public_menu_cache";

export default function ShopMenuPage() {
  const [items, setItems] = React.useState<MenuItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {
        // Fall back to default
      }
    }
    return DEFAULT_MENU_ITEMS;
  });

  const [activeTab, setActiveTab] = React.useState<"all" | "drinks" | "food">("all");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null);

  // Background SWR revalidation from live Supabase
  React.useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchLiveMenu() {
      try {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .order("display_order", { ascending: true });

        if (!error && data && data.length > 0 && isMounted) {
          setItems(data as MenuItem[]);
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
      } catch {
        // Keep default/cached items safely
      }
    }

    void fetchLiveMenu();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatPrice = (val: number | null | undefined) => {
    if (val == null) return "—";
    return `$${val.toFixed(2)}`;
  };

  // Filter categories based on active tab and category filter
  const visibleCategories = CATEGORIES.filter((cat) => {
    if (activeTab !== "all" && cat.type !== activeTab) return false;
    if (activeCategory !== "all" && cat.id !== activeCategory) return false;
    return true;
  });

  return (
    <div className="bg-[#f3f0e1] pb-24">
      {/* Notice Banner */}
      <div className="border-b border-[#dbd5c0] bg-[#eae5d2] px-4 py-2.5 text-center text-xs font-medium text-[#6e6a5a] sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <span className="flex items-center gap-1.5 font-semibold text-[#1b1915]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#46543a]" />
            100% Gluten Free Kitchen
          </span>
          <span>Open Mon–Wed, Fri from 6:30am · Thu to 9pm · Weekends from 7am</span>
          <span className="text-[#8e8979]">
            10% surcharge on Sundays & QLD Public Holidays
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 sm:pt-14">
        {/* Page Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#6e6a5a] uppercase transition hover:text-[#1b1915]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Foundry Home</span>
          </Link>

          <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-[#1b1915] sm:text-6xl">
            Menu
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[#6e6a5a]">
            Coffee, tea, brunch and bagels at Foundry Artisan Coffee,
            Indooroopilly Shopping Centre. Tap any item for cup sizes, milk
            options, and additions.
          </p>
        </div>

        {/* Filter Tabs (All / Drinks / Food) */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-[#dbd5c0] pb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setActiveCategory("all");
            }}
            className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wider uppercase transition ${
              activeTab === "all" && activeCategory === "all"
                ? "bg-[#1b1915] text-[#f3f0e1]"
                : "border border-[#dbd5c0] bg-transparent text-[#1b1915] hover:bg-[#eae5d2]"
            }`}
          >
            All Menu
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("drinks");
              setActiveCategory("all");
            }}
            className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wider uppercase transition ${
              activeTab === "drinks"
                ? "bg-[#1b1915] text-[#f3f0e1]"
                : "border border-[#dbd5c0] bg-transparent text-[#1b1915] hover:bg-[#eae5d2]"
            }`}
          >
            Coffee & Drinks
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("food");
              setActiveCategory("all");
            }}
            className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wider uppercase transition ${
              activeTab === "food"
                ? "bg-[#1b1915] text-[#f3f0e1]"
                : "border border-[#dbd5c0] bg-transparent text-[#1b1915] hover:bg-[#eae5d2]"
            }`}
          >
            Kitchen & Food
          </button>

          <Link
            href="/specials"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#46543a] px-4 py-2 text-xs font-semibold text-[#f0efe2] transition hover:bg-[#3b2a1e]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>View Specials</span>
          </Link>
        </div>

        {/* Sticky Horizontal Category Pill Selector (Starbucks style) */}
        <div className="sticky top-16 z-30 -mx-4 overflow-x-auto bg-[#f3f0e1]/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                activeCategory === "all"
                  ? "bg-[#1b1915] text-[#f3f0e1]"
                  : "bg-[#eae5d2] text-[#1b1915] hover:bg-[#dbd5c0]"
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setActiveTab(cat.type);
                }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  activeCategory === cat.id
                    ? "bg-[#1b1915] text-[#f3f0e1]"
                    : "bg-[#eae5d2] text-[#1b1915] hover:bg-[#dbd5c0]"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Sections List */}
        <div className="mt-8 space-y-12">
          {visibleCategories.map((category) => {
            const categoryItems = items.filter(
              (it) => it.category === category.id,
            );

            if (categoryItems.length === 0) return null;

            return (
              <section key={category.id} className="scroll-mt-32">
                {/* Category Header */}
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-bold tracking-[0.2em] text-[#6e6a5a] uppercase">
                    {category.title}
                  </h2>
                  <div className="h-px flex-1 bg-[#dbd5c0]" />
                </div>

                {category.note && (
                  <p className="mt-1 text-xs text-[#6e6a5a]">{category.note}</p>
                )}

                {/* S / M / L Size Column Indicators */}
                {category.cols && category.cols.length > 0 && (
                  <div className="mt-2 flex justify-end gap-0 py-1 text-right text-xs font-bold tracking-wider text-[#6e6a5a]">
                    {category.cols.map((col) => (
                      <span key={col} className="w-14">
                        {col}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dot-leader Rows */}
                <div className="mt-1 divide-y divide-[#dbd5c0] border-t border-[#dbd5c0]">
                  {categoryItems.map((item) => {
                    const isSoldOut = !item.is_available;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className={`group flex w-full items-baseline gap-2 py-3.5 text-left transition focus:outline-none ${
                          isSoldOut
                            ? "opacity-50 hover:opacity-75"
                            : "hover:text-[#3b2a1e]"
                        }`}
                      >
                        {/* Item Name */}
                        <span className="shrink-0 font-medium text-[#1b1915] group-hover:text-[#3b2a1e] sm:text-base">
                          {item.name}
                        </span>

                        {isSoldOut && (
                          <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 uppercase">
                            Sold Out
                          </span>
                        )}

                        {item.is_special && (
                          <span className="shrink-0 rounded bg-[#eae5d2] px-1.5 py-0.5 text-[10px] font-semibold text-[#46543a] uppercase">
                            Special
                          </span>
                        )}

                        {/* Dotted Leader */}
                        <span className="leader" />

                        {/* Prices */}
                        <div className="flex shrink-0 font-semibold tabular-nums text-[#1b1915]">
                          {category.cols && category.cols.length > 0 ? (
                            <>
                              {category.cols.includes("S") && (
                                <span className="w-14 text-right text-sm">
                                  {formatPrice(item.price_small)}
                                </span>
                              )}
                              {category.cols.includes("M") && (
                                <span className="w-14 text-right text-sm">
                                  {formatPrice(item.price_medium)}
                                </span>
                              )}
                              {category.cols.includes("L") && (
                                <span className="w-14 text-right text-sm">
                                  {formatPrice(item.price_large)}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-right text-sm sm:text-base">
                              {formatPrice(item.price_single)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Counter Ordering Footer Notice */}
        <div className="mt-16 rounded-2xl border border-[#dbd5c0] bg-white/70 p-6 text-center text-sm text-[#6e6a5a]">
          <p className="font-semibold text-[#1b1915]">
            Counter Service Only · Made to Order
          </p>
          <p className="mt-1 text-xs">
            We do not take online payments or phone-ahead orders. Please visit
            our counter at Level 3, Indooroopilly Shopping Centre.
          </p>
        </div>
      </div>

      {/* Interactive Starbucks-style Cup Sizing & Modifiers Sheet */}
      <ProductSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

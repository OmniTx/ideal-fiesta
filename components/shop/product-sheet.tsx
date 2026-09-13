"use client";

import * as React from "react";
import { X, ArrowLeft } from "lucide-react";
import type { MenuItem } from "@/lib/types/database";
import { CupArt, getCupType, type CupType } from "./cup-art";

const VOLUMES: Record<string, string> = {
  S: "8oz · 240ml",
  M: "12oz · 350ml",
  L: "16oz · 470ml",
};

const MILK_OPTIONS = [
  { label: "Full Cream", price: 0 },
  { label: "Skim", price: 0 },
  { label: "Oat Milk", price: 1.0 },
  { label: "Almond Milk", price: 1.0 },
  { label: "Soy Milk", price: 1.0 },
  { label: "Lactose Free", price: 1.0 },
];

const SYRUP_OPTIONS = [
  { label: "None", price: 0 },
  { label: "Vanilla", price: 1.0 },
  { label: "Caramel", price: 1.0 },
  { label: "Hazelnut", price: 1.0 },
];

const SHOT_OPTIONS = [
  { label: "Standard Shot", price: 0 },
  { label: "Extra Shot", price: 1.0 },
  { label: "Decaf", price: 1.0 },
];

const FOOD_SIDES = [
  { label: "Avocado", price: 4.5 },
  { label: "Bacon", price: 4.5 },
  { label: "Ham", price: 4.5 },
  { label: "Smoked Salmon", price: 5.5 },
  { label: "Poached Egg", price: 2.0 },
  { label: "Fried Egg", price: 2.0 },
  { label: "Feta", price: 2.0 },
  { label: "Tomato Relish", price: 2.0 },
  { label: "House Hollandaise", price: 2.0 },
];

const BREAD_OPTIONS = [
  { label: "White Gluten-Free Toast", price: 0 },
  { label: "Gluten-Free Bagel", price: 1.0 },
];

interface ProductSheetProps {
  item: MenuItem | null;
  onClose: () => void;
}

export function ProductSheet({ item, onClose }: ProductSheetProps) {
  const [selectedSize, setSelectedSize] = React.useState<"S" | "M" | "L">("M");
  const [selectedMilk, setSelectedMilk] = React.useState<string>("Full Cream");
  const [selectedSyrup, setSelectedSyrup] = React.useState<string>("None");
  const [selectedShot, setSelectedShot] = React.useState<string>("Standard Shot");
  const [selectedBread, setSelectedBread] = React.useState<string>(
    "White Gluten-Free Toast",
  );
  const [selectedSides, setSelectedSides] = React.useState<string[]>([]);

  // Reset modifiers when opening a new item
  React.useEffect(() => {
    if (!item) return;

    if (item.price_small != null) {
      setSelectedSize("S");
    } else if (item.price_medium != null) {
      setSelectedSize("M");
    } else {
      setSelectedSize("L");
    }

    setSelectedMilk("Full Cream");
    setSelectedSyrup("None");
    setSelectedShot("Standard Shot");
    setSelectedBread("White Gluten-Free Toast");
    setSelectedSides([]);
  }, [item]);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll
  React.useEffect(() => {
    if (item) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  const isDrink = [
    "hot_coffee",
    "iced_coffee",
    "hot_drinks",
    "tea",
    "sweet_tooth",
    "shakes_frappes",
  ].includes(item.category);

  const isFood = [
    "breakfast",
    "toasties",
    "specials",
    "spreads",
  ].includes(item.category);

  // Available sizes
  const sizesAvailable: Array<{ label: "S" | "M" | "L"; price: number }> = [];
  if (item.price_small != null) sizesAvailable.push({ label: "S", price: item.price_small });
  if (item.price_medium != null) sizesAvailable.push({ label: "M", price: item.price_medium });
  if (item.price_large != null) sizesAvailable.push({ label: "L", price: item.price_large });

  // Base price
  let basePrice = item.price_single ?? (sizesAvailable[0]?.price ?? 0);
  if (sizesAvailable.length > 0) {
    const found = sizesAvailable.find((s) => s.label === selectedSize);
    basePrice = found ? found.price : (sizesAvailable[0]?.price ?? (item.price_single ?? 0));
  }

  // Calculate total modifiers
  let extrasTotal = 0;
  if (isDrink) {
    const m = MILK_OPTIONS.find((o) => o.label === selectedMilk);
    if (m) extrasTotal += m.price;
    const s = SYRUP_OPTIONS.find((o) => o.label === selectedSyrup);
    if (s) extrasTotal += s.price;
    const sh = SHOT_OPTIONS.find((o) => o.label === selectedShot);
    if (sh) extrasTotal += sh.price;
  }

  if (isFood) {
    const b = BREAD_OPTIONS.find((o) => o.label === selectedBread);
    if (b) extrasTotal += b.price;
    selectedSides.forEach((sideLabel) => {
      const side = FOOD_SIDES.find((o) => o.label === sideLabel);
      if (side) extrasTotal += side.price;
    });
  }

  const finalTotal = basePrice + extrasTotal;
  const cupType = getCupType(item.name, item.category);

  const toggleSide = (label: string) => {
    setSelectedSides((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label],
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#f3f0e1] animate-in fade-in slide-in-from-bottom-6 duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Top sticky bar */}
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[#dbd5c0] bg-[#f3f0e1]/95 px-4 backdrop-blur-sm sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-full py-1.5 pr-4 pl-2 text-xs font-semibold tracking-wider text-[#1b1915] uppercase transition hover:bg-[#eae5d2]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to menu</span>
        </button>

        <span className="max-w-[200px] truncate text-xs font-medium tracking-wider text-[#6e6a5a] uppercase sm:max-w-xs">
          {item.category.replace("_", " ")} › {item.name}
        </span>

        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full text-[#1b1915] transition hover:bg-[#eae5d2]"
          aria-label="Close sheet"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:grid md:grid-cols-2 md:gap-12 md:py-12">
        {/* Left Column: Artwork & Cup Drawing */}
        <div className="md:sticky md:top-24">
          <div
            className="art-cup grid min-h-[220px] place-items-center rounded-2xl border border-[#dbd5c0] bg-[#eae5d2]/60 p-8 sm:min-h-[280px] md:min-h-[380px]"
            data-sz={
              selectedSize === "S" ? "0" : selectedSize === "M" ? "1" : "2"
            }
          >
            {item.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.image_url}
                alt={item.name}
                className="max-h-[260px] w-auto rounded-xl object-contain shadow-sm"
              />
            ) : (
              <CupArt type={cupType} className="text-[#1b1915]" />
            )}
          </div>

          <p className="mt-3 text-center text-xs text-[#6e6a5a]">
            {item.image_url
              ? "Artisan kitchen photo"
              : "Hand-crafted line drawing · Made to order at the bench"}
          </p>
        </div>

        {/* Right Column: Title, Sizing, Options */}
        <div className="mt-6 md:mt-0">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#1b1915] sm:text-4xl">
                {item.name}
              </h1>
              {!item.is_available && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                  Sold Out Today
                </span>
              )}
            </div>

            {item.description && (
              <p className="mt-3 text-base leading-relaxed text-[#6e6a5a]">
                {item.description}
              </p>
            )}
          </div>

          {/* Size Selector (Starbucks style cup row) */}
          {sizesAvailable.length > 0 && (
            <div className="mt-8 border-t border-[#dbd5c0] pt-6">
              <h2 className="text-xs font-semibold tracking-wider text-[#6e6a5a] uppercase">
                Select Size
              </h2>
              <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
                {sizesAvailable.map((s) => {
                  const isSelected = selectedSize === s.label;
                  const iconHeight =
                    s.label === "S" ? 28 : s.label === "M" ? 36 : 44;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setSelectedSize(s.label)}
                      className={`flex flex-1 min-w-[84px] flex-col items-center justify-end rounded-xl border p-3 transition ${
                        isSelected
                          ? "border-[#1b1915] bg-[#eae5d2] text-[#1b1915] shadow-xs"
                          : "border-[#dbd5c0] bg-white/60 text-[#6e6a5a] hover:bg-[#eae5d2]/50"
                      }`}
                    >
                      <CupArt
                        type={cupType}
                        height={iconHeight}
                        className={isSelected ? "text-[#1b1915]" : "text-[#6e6a5a] opacity-70"}
                      />
                      <span className="mt-2 text-sm font-bold text-[#1b1915]">
                        {s.label}
                      </span>
                      <span className="text-[11px] text-[#6e6a5a]">
                        {VOLUMES[s.label]}
                      </span>
                      <span className="mt-1 text-xs font-semibold text-[#1b1915]">
                        ${s.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Drink Modifiers */}
          {isDrink && (
            <>
              {/* Milk Option */}
              <div className="mt-6 border-t border-[#dbd5c0] pt-6">
                <h2 className="text-xs font-semibold tracking-wider text-[#6e6a5a] uppercase">
                  Milk Selection
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MILK_OPTIONS.map((milk) => {
                    const isSelected = selectedMilk === milk.label;
                    return (
                      <button
                        key={milk.label}
                        type="button"
                        onClick={() => setSelectedMilk(milk.label)}
                        className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                          isSelected
                            ? "border-[#1b1915] bg-[#1b1915] text-[#f3f0e1]"
                            : "border-[#dbd5c0] bg-white/70 text-[#1b1915] hover:bg-[#eae5d2]"
                        }`}
                      >
                        {milk.label}
                        {milk.price > 0 && ` (+$${milk.price.toFixed(2)})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Syrup Flavours */}
              <div className="mt-6 border-t border-[#dbd5c0] pt-6">
                <h2 className="text-xs font-semibold tracking-wider text-[#6e6a5a] uppercase">
                  Flavour & Syrups
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SYRUP_OPTIONS.map((syrup) => {
                    const isSelected = selectedSyrup === syrup.label;
                    return (
                      <button
                        key={syrup.label}
                        type="button"
                        onClick={() => setSelectedSyrup(syrup.label)}
                        className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                          isSelected
                            ? "border-[#1b1915] bg-[#1b1915] text-[#f3f0e1]"
                            : "border-[#dbd5c0] bg-white/70 text-[#1b1915] hover:bg-[#eae5d2]"
                        }`}
                      >
                        {syrup.label}
                        {syrup.price > 0 && ` (+$${syrup.price.toFixed(2)})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shot / Caffeine */}
              <div className="mt-6 border-t border-[#dbd5c0] pt-6">
                <h2 className="text-xs font-semibold tracking-wider text-[#6e6a5a] uppercase">
                  Espresso Shot
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SHOT_OPTIONS.map((shot) => {
                    const isSelected = selectedShot === shot.label;
                    return (
                      <button
                        key={shot.label}
                        type="button"
                        onClick={() => setSelectedShot(shot.label)}
                        className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                          isSelected
                            ? "border-[#1b1915] bg-[#1b1915] text-[#f3f0e1]"
                            : "border-[#dbd5c0] bg-white/70 text-[#1b1915] hover:bg-[#eae5d2]"
                        }`}
                      >
                        {shot.label}
                        {shot.price > 0 && ` (+$${shot.price.toFixed(2)})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Food Modifiers */}
          {isFood && (
            <>
              {/* Bread Selection */}
              <div className="mt-6 border-t border-[#dbd5c0] pt-6">
                <h2 className="text-xs font-semibold tracking-wider text-[#6e6a5a] uppercase">
                  Bread Choice (100% Gluten Free)
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {BREAD_OPTIONS.map((bread) => {
                    const isSelected = selectedBread === bread.label;
                    return (
                      <button
                        key={bread.label}
                        type="button"
                        onClick={() => setSelectedBread(bread.label)}
                        className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                          isSelected
                            ? "border-[#1b1915] bg-[#1b1915] text-[#f3f0e1]"
                            : "border-[#dbd5c0] bg-white/70 text-[#1b1915] hover:bg-[#eae5d2]"
                        }`}
                      >
                        {bread.label}
                        {bread.price > 0 && ` (+$${bread.price.toFixed(2)})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sides / Extras */}
              <div className="mt-6 border-t border-[#dbd5c0] pt-6">
                <h2 className="text-xs font-semibold tracking-wider text-[#6e6a5a] uppercase">
                  Add Fresh Sides
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FOOD_SIDES.map((side) => {
                    const isSelected = selectedSides.includes(side.label);
                    return (
                      <button
                        key={side.label}
                        type="button"
                        onClick={() => toggleSide(side.label)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                          isSelected
                            ? "border-[#1b1915] bg-[#1b1915] text-[#f3f0e1]"
                            : "border-[#dbd5c0] bg-white/70 text-[#1b1915] hover:bg-[#eae5d2]"
                        }`}
                      >
                        {side.label}
                        <span className="ml-1 opacity-70">
                          +${side.price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Allergen & Dietary note */}
          <p className="mt-8 text-xs leading-relaxed text-[#6e6a5a]">
            Every item is made to order in our dedicated 100% gluten-free
            kitchen. Full dietary and allergen details are available at the
            counter.
          </p>

          {/* Total & Counter Ordering Bar */}
          <div className="mt-8 rounded-2xl border border-[#dbd5c0] bg-[#eae5d2]/60 p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-[#6e6a5a] uppercase">
                  Your customized {item.name}
                </span>
                <p className="font-display text-3xl font-bold text-[#1b1915]">
                  ${finalTotal.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-[#6e6a5a]">AUD</span>
                </p>
              </div>

              <div className="text-right">
                <span className="inline-flex rounded-full bg-[#46543a] px-3 py-1 text-xs font-semibold text-[#f0efe2]">
                  Order at Counter
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#6e6a5a]">
              Please quote this order to our barista at Level 3, Indooroopilly
              Shopping Centre. We do not accept online payments yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

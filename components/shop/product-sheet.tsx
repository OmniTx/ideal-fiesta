"use client";

import * as React from "react";
import { X, ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/shop/cart-provider";
import { formatAUD } from "@/lib/money";
import type { MenuItem, OrderModifier } from "@/lib/types/database";
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
  const [quantity, setQuantity] = React.useState(1);

  const { addLine, openCart } = useCart();

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
    setQuantity(1);
  }, [item]);

  const isPushedRef = React.useRef(false);

  // Push history state so mobile swipe-back gesture closes the product sheet instead of leaving the menu page
  React.useEffect(() => {
    if (!item) {
      isPushedRef.current = false;
      return;
    }

    if (!isPushedRef.current) {
      window.history.pushState({ productSheetOpen: true }, "", window.location.href);
      isPushedRef.current = true;
    }

    const handlePopState = () => {
      isPushedRef.current = false;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPushedRef.current && window.history.state?.productSheetOpen) {
          isPushedRef.current = false;
          window.history.back();
        } else {
          isPushedRef.current = false;
          onClose();
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  const handleClose = React.useCallback(() => {
    if (isPushedRef.current && window.history.state?.productSheetOpen) {
      isPushedRef.current = false;
      window.history.back();
    } else {
      isPushedRef.current = false;
      onClose();
    }
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

  if (!item) return null;

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

  // Only options that differ from the default are worth printing on a ticket.
  const chosenModifiers: OrderModifier[] = [];
  if (isDrink) {
    const milk = MILK_OPTIONS.find((option) => option.label === selectedMilk);
    if (milk && selectedMilk !== "Full Cream") {
      chosenModifiers.push({ label: milk.label, price: milk.price });
    }
    const syrup = SYRUP_OPTIONS.find((option) => option.label === selectedSyrup);
    if (syrup && selectedSyrup !== "None") {
      chosenModifiers.push({ label: syrup.label, price: syrup.price });
    }
    const shot = SHOT_OPTIONS.find((option) => option.label === selectedShot);
    if (shot && selectedShot !== "Standard Shot") {
      chosenModifiers.push({ label: shot.label, price: shot.price });
    }
  }
  if (isFood) {
    const bread = BREAD_OPTIONS.find((option) => option.label === selectedBread);
    if (bread && selectedBread !== "White Gluten-Free Toast") {
      chosenModifiers.push({ label: bread.label, price: bread.price });
    }
    selectedSides.forEach((sideLabel) => {
      const side = FOOD_SIDES.find((option) => option.label === sideLabel);
      if (side) chosenModifiers.push({ label: side.label, price: side.price });
    });
  }

  const addToBasket = () => {
    addLine(
      {
        menuItemId: item.id,
        name: item.name,
        category: item.category,
        size: sizesAvailable.length > 0 ? selectedSize : null,
        modifiers: chosenModifiers,
        unitPrice: finalTotal,
      },
      quantity,
    );

    toast.success(`${quantity} × ${item.name} added to your basket`, {
      action: { label: "View basket", onClick: () => openCart() },
    });
    handleClose();
  };

  const toggleSide = (label: string) => {
    setSelectedSides((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label],
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-background animate-slide-up"
      role="dialog"
      aria-modal="true"
    >
      {/* Top sticky bar */}
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center gap-2 rounded-full py-1.5 pr-4 pl-2 text-xs font-semibold tracking-wider text-foreground uppercase transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to menu</span>
        </button>

        <span className="max-w-[200px] truncate text-xs font-medium tracking-wider text-muted-foreground uppercase sm:max-w-xs">
          {item.category.replace("_", " ")} › {item.name}
        </span>

        <button
          type="button"
          onClick={handleClose}
          className="grid h-9 w-9 place-items-center rounded-full text-foreground transition hover:bg-muted"
          aria-label="Close sheet"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-6 sm:pb-32 md:grid md:grid-cols-2 md:gap-12 md:py-12 md:pb-32">
        {/* Left Column: Artwork & Cup Drawing */}
        <div className="md:sticky md:top-24">
          <div
            className="art-cup grid min-h-[220px] place-items-center rounded-2xl border border-border bg-muted/60 p-8 sm:min-h-[280px] md:min-h-[380px]"
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
              <CupArt type={cupType} className="text-foreground" />
            )}
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {item.image_url
              ? "Artisan kitchen photo"
              : "Hand-crafted line drawing · Made to order at the bench"}
          </p>
        </div>

        {/* Right Column: Title, Sizing, Options */}
        <div className="mt-6 md:mt-0">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {item.name}
              </h1>
              {!item.is_available && (
                <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                  Sold Out Today
                </span>
              )}
            </div>

            {item.description && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>

          {/* Size Selector (Starbucks style cup row) */}
          {sizesAvailable.length > 0 && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                          ? "border-foreground bg-muted text-foreground shadow-sm"
                          : "border-border bg-card/60 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <CupArt
                        type={cupType}
                        height={iconHeight}
                        className={isSelected ? "text-foreground" : "text-muted-foreground opacity-70"}
                      />
                      <span className="mt-2 text-sm font-bold text-foreground">
                        {s.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {VOLUMES[s.label]}
                      </span>
                      <span className="mt-1 text-xs font-semibold text-foreground">
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
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card/70 text-foreground hover:bg-muted"
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
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card/70 text-foreground hover:bg-muted"
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
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card/70 text-foreground hover:bg-muted"
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
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card/70 text-foreground hover:bg-muted"
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
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card/70 text-foreground hover:bg-muted"
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
          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            Every item is made to order in our dedicated 100% gluten-free
            kitchen. Full dietary and allergen details are available at the
            counter. Add it to your basket for a counter ticket — you pay at the
            bench, nothing is charged here.
          </p>
        </div>
      </div>

      {/* Floating Fixed Bottom Total Card */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 p-3 sm:p-5">
        <div className="pointer-events-auto mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 px-5 py-3.5 shadow-2xl backdrop-blur-md sm:flex-nowrap">
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {quantity} × {selectedSize ? `${selectedSize} ` : ""}
              {item.name}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                {formatAUD(finalTotal * quantity)}
              </span>
              <span className="text-xs font-medium text-muted-foreground">AUD</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground transition hover:bg-muted disabled:opacity-40"
                aria-label="Reduce quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-bold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(20, current + 1))}
                disabled={quantity >= 20}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground transition hover:bg-muted disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={addToBasket}
              disabled={!item.is_available}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-sm transition hover:bg-foreground/85 disabled:opacity-50"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{item.is_available ? "Add to basket" : "Sold out today"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Sparkles, X, CheckCircle2, Phone, Mail, User } from "lucide-react";
import { captureCustomerLead } from "@/lib/analytics";

const PERK_DISMISSED_KEY = "foundry_perk_dismissed";

export function VipPerkBanner() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(true);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    try {
      const dismissed = localStorage.getItem(PERK_DISMISSED_KEY);
      if (!dismissed) {
        // Show after 3 seconds of browsing
        const timer = setTimeout(() => {
          setIsDismissed(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(PERK_DISMISSED_KEY, "true");
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) return;

    setLoading(true);
    await captureCustomerLead({
      name,
      phone,
      email,
      source: "vip_perk_banner",
    });
    setLoading(false);
    setSubmitted(true);
    try {
      localStorage.setItem(PERK_DISMISSED_KEY, "true");
    } catch {}
  };

  if (isDismissed) return null;

  return (
    <>
      {/* Floating Bottom Ribbon */}
      {!isOpen && !submitted && (
        <div className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbd5c0] bg-[#1b1915] p-3.5 text-[#f3f0e1] shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#46543a] text-[#f0efe2]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold">10% Welcome Perk</p>
                <p className="text-[11px] text-[#cfc9b4]">Join Foundry Regulars for secret specials</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="rounded-full bg-[#f3f0e1] px-3.5 py-1.5 text-xs font-semibold text-[#1b1915] transition hover:bg-white"
              >
                Claim
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 text-[#85806f] hover:text-[#f3f0e1]"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop and Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#dbd5c0] bg-[#f3f0e1] p-6 shadow-2xl text-[#1b1915]">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#6e6a5a] hover:bg-[#eae5d2]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {submitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#46543a] text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold">You&apos;re in!</h3>
                <p className="text-xs text-[#6e6a5a]">
                  Show this screen at the Level 3 counter for 10% off your order. Welcome to the Foundry family!
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 w-full rounded-full bg-[#1b1915] py-2.5 text-xs font-semibold text-[#f3f0e1]"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#46543a]/10 px-3 py-1 text-xs font-semibold uppercase text-[#46543a]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Foundry Perks</span>
                </div>

                <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">
                  10% off your coffee
                </h3>
                <p className="mt-1 text-xs text-[#6e6a5a] leading-relaxed">
                  Join the regulars. Enter your details to claim your welcome discount and receive secret brunch specials.
                </p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                  <div>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-3.5 w-3.5 text-[#6e6a5a]" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full rounded-xl border border-[#dbd5c0] bg-white py-2.5 pl-9 pr-3 text-xs text-[#1b1915] placeholder:text-[#6e6a5a] focus:border-[#46543a] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-3.5 w-3.5 text-[#6e6a5a]" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Mobile Number (e.g. 0400 123 456)"
                        className="w-full rounded-xl border border-[#dbd5c0] bg-white py-2.5 pl-9 pr-3 text-xs text-[#1b1915] placeholder:text-[#6e6a5a] focus:border-[#46543a] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-3.5 w-3.5 text-[#6e6a5a]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full rounded-xl border border-[#dbd5c0] bg-white py-2.5 pl-9 pr-3 text-xs text-[#1b1915] placeholder:text-[#6e6a5a] focus:border-[#46543a] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full rounded-full bg-[#1b1915] py-3 text-xs font-semibold text-[#f3f0e1] transition hover:bg-[#3b2a1e] disabled:opacity-50"
                  >
                    {loading ? "Claiming..." : "Get My 10% Perk"}
                  </button>
                </form>

                <p className="mt-3 text-center text-[10px] text-[#8e8979]">
                  100% gluten-free kitchen · Indooroopilly Shopping Centre
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

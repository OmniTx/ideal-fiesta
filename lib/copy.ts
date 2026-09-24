/**
 * Storefront copy that appears in more than one place.
 *
 * The gluten-free wording previously drifted between the hero, the header
 * ribbon, the assurances section and the footer — and it made absolute claims
 * ("no cross-contamination", "zero flour floating in the air") that read as a
 * guarantee. The client asked for wording about *ingredients* instead, so it
 * lives here and cannot drift again.
 */

export const GLUTEN_FREE_HEADLINE = "Dedicated 100% gluten-free kitchen";

export const GLUTEN_FREE_CLAIM = "No wheat ingredients used on premises.";

export const GLUTEN_FREE_FULL =
  "Every item is prepared in our dedicated 100% gluten-free kitchen. No wheat ingredients are used on premises.";

/** Banner-strip length. Kept short so the ribbon stays one line on mobile. */
export const GLUTEN_FREE_RIBBON = `${GLUTEN_FREE_HEADLINE}. ${GLUTEN_FREE_CLAIM}`;

/** Footer blurb. */
export const GLUTEN_FREE_FOOTER =
  "A dedicated 100% gluten-free kitchen in Indooroopilly. No wheat ingredients used on premises, so you never have to ask.";

/**
 * Replaces the old "we do not take online payments or phone-ahead orders" copy.
 * The basket is a ticket, not an order-ahead: the customer still pays at the
 * counter, which is why the wording never promises anything will be waiting.
 */
export const COUNTER_ORDER_NOTE =
  "Build your basket on your phone, then show your order number at the counter. We ring it up there — this isn't a phone-ahead order, and payment is always at the bench.";

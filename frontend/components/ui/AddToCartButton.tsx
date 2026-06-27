'use client';

import { showToast } from '@/lib/toast';

// The "Add to Cart" affordance. Rendered per the Oren design but NOT wired —
// the cart arrives in Epic 3 (Stories 3.1/3.2). For now it surfaces a gentle
// "coming soon" toast. Swap the handler for the real cart dispatch in 3.2.
//
// Visibility: persistent on mobile; on desktop it fades in on card hover OR
// keyboard focus (group-hover / group-focus-within), and on its own focus —
// never hover-only, so keyboard and screen-reader users can reach it.
export default function AddToCartButton({
  productName,
}: {
  productName: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Add ${productName} to cart`}
      onClick={() => showToast.info('Add to Cart is coming soon')}
      className="w-full rounded-full bg-blush px-4 py-2.5 text-label-sm text-brown shadow-hover transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
    >
      Add to Cart
    </button>
  );
}

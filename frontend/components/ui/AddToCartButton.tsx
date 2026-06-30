'use client';

import { useAddToCart } from '@/hooks/useAddToCart';

// The "Add to Cart" affordance on the ProductCard. Wired to the cart API
// (Story 3.2) via the shared useAddToCart hook: logged-out → login redirect;
// logged-in → dispatch + success toast + a brief "✓ Added to Cart" label.
//
// Visibility: persistent on mobile; on desktop it fades in on card hover OR
// keyboard focus (group-hover / group-focus-within), and on its own focus —
// never hover-only, so keyboard and screen-reader users can reach it.
export default function AddToCartButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const { addToCart, status } = useAddToCart();
  const label = status === 'added' ? '✓ Added to Cart' : 'Add to Cart';

  return (
    <button
      type="button"
      aria-label={`Add ${productName} to cart`}
      disabled={status === 'adding'}
      onClick={() => addToCart(productId)}
      className="w-full rounded-full bg-blush px-4 py-2.5 text-label-sm text-brown shadow-hover transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
    >
      {label}
    </button>
  );
}

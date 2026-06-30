'use client';

import Button from '@/components/Button';
import { useAddToCart } from '@/hooks/useAddToCart';

// PDP "Add to Shopping Bag" — persistent, full-width, prominent (Stitch PDP).
// Wired to the cart API (Story 3.2) via the shared useAddToCart hook.
// Out of stock → a disabled "Out of Stock" control (bg-sand + text-brown so it
// passes WCAG AA, matching the shipped ProductCard).
export default function PdpAddToCart({
  productId,
  productName,
  inStock,
}: {
  productId: number;
  productName: string;
  inStock: boolean;
}) {
  const { addToCart, status } = useAddToCart();

  if (!inStock) {
    return (
      <button
        type="button"
        disabled
        aria-label={`Out of Stock: ${productName}`}
        className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-sand px-6 py-4 text-label-sm tracking-widest text-brown"
      >
        Out of Stock
      </button>
    );
  }

  const label = status === 'added' ? '✓ Added to Cart' : 'Add to Shopping Bag';

  return (
    <Button
      variant="primary"
      disabled={status === 'adding'}
      aria-label={`Add to Shopping Bag: ${productName}`}
      onClick={() => addToCart(productId)}
      className="w-full py-4 tracking-widest"
    >
      {label}
    </Button>
  );
}

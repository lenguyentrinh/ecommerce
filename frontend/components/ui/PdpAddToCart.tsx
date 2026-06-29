'use client';

import Button from '@/components/Button';
import { showToast } from '@/lib/toast';

// PDP "Add to Shopping Bag" — persistent, full-width, prominent (Stitch PDP).
// Wired to a "coming soon" toast; the real cart dispatch lands in Epic 3.
// Out of stock → a disabled "Out of Stock" control (bg-sand + text-brown so it
// passes WCAG AA, matching the shipped ProductCard).
export default function PdpAddToCart({
  productName,
  inStock,
}: {
  productName: string;
  inStock: boolean;
}) {
  if (!inStock) {
    return (
      <span className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-sand px-6 py-4 text-label-sm tracking-widest text-brown">
        Out of Stock
      </span>
    );
  }

  return (
    <Button
      variant="primary"
      aria-label={`Add to Shopping Bag: ${productName}`}
      onClick={() => showToast.info('Add to Cart is coming soon')}
      className="w-full py-4 tracking-widest"
    >
      Add to Shopping Bag
    </Button>
  );
}

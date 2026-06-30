'use client';

import Link from 'next/link';
import Button from '@/components/Button';
import { formatPrice } from '@/lib/helpers';
import { SHIPPING_FEE, TAX_RATE, calcTax, calcTotal } from '@/lib/constants';

interface Props {
  subtotal: number;
  hasOutOfStock?: boolean;
}

export default function CartSummary({ subtotal, hasOutOfStock = false }: Props) {
  const tax = calcTax(subtotal);
  const total = calcTotal(subtotal);
  const taxPercent = Math.round(TAX_RATE * 100);
  const checkoutDisabled = true;
  const checkoutTitle = hasOutOfStock
    ? 'Remove out-of-stock items before checking out.'
    : 'Checkout coming soon';

  return (
    <aside className="glass-panel soft-shadow flex h-fit flex-col gap-4 rounded-lg p-6">
      <h2 className="text-headline-md text-brown">Order Summary</h2>

      <dl className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <dt className="text-body-md text-warm-gray">Subtotal</dt>
          <dd className="text-body-md text-brown">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-body-md text-warm-gray">Shipping</dt>
          <dd className="text-body-md text-brown">
            {formatPrice(SHIPPING_FEE)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-body-md text-warm-gray">Tax ({taxPercent}%)</dt>
          <dd className="text-body-md text-brown">{formatPrice(tax)}</dd>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-hairline/50 pt-4">
          <dt className="text-[16px] font-semibold text-brown">Total</dt>
          <dd className="text-[16px] font-semibold text-brown">
            {formatPrice(total)}
          </dd>
        </div>
      </dl>

      <Button
        variant="primary"
        disabled={checkoutDisabled}
        title={checkoutTitle}
        className="mt-2 w-full"
      >
        Proceed to Checkout
      </Button>
      <Link
        href="/"
        className="inline-flex w-full items-center justify-center rounded-full border border-sand px-6 py-2.5 text-label-sm text-brown transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-clay hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
      >
        Continue Shopping
      </Link>
    </aside>
  );
}

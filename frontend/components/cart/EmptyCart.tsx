import Link from 'next/link';
import { FiShoppingBag } from 'react-icons/fi';

// Empty cart state (AC7): centered icon + message + primary "Continue shopping"
// link back to home. A Link styled as a primary pill (matching the home hero
// CTA) — no <button> nested in an <a>.
export default function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <FiShoppingBag size={48} className="text-warm-gray" aria-hidden="true" />
      <h2 className="text-headline-md text-brown">Your cart is empty</h2>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full bg-brown px-8 py-4 text-label-sm text-ivory transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
      >
        Continue shopping
      </Link>
    </div>
  );
}

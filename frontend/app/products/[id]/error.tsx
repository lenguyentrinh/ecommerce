'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// PDP route error boundary (AC #6) — a real backend/render failure shows a
// retry, not a crash. A genuine 404 is handled by notFound() (not-found.tsx),
// so it never reaches here.
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-5 text-center">
      <h1 className="text-headline-md text-brown">
        We couldn’t load this product
      </h1>
      <p className="text-body-md text-warm-gray">Please try again in a moment.</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-brown px-6 py-2.5 text-label-sm text-ivory transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-sand px-6 py-2.5 text-label-sm text-brown transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-clay hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

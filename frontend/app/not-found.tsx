import Link from 'next/link';

// Branded 404 — used for unknown routes and `notFound()` calls (e.g. unknown category).
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-5 text-center">
      <span className="text-label-sm uppercase tracking-[0.3em] text-warm-gray">
        404
      </span>
      <h1 className="text-headline-md text-brown">We couldn’t find that page</h1>
      <p className="text-body-md text-warm-gray">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full bg-brown px-6 py-2.5 text-label-sm text-ivory transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
      >
        Back to home
      </Link>
    </div>
  );
}

import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton';

// Suspense fallback shown during a client navigation to a new query / filter
// (Story 2.4 AC #5) — a skeleton grid plus a "Searching…" status line.
export default function Loading() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-5 py-12 md:px-16">
      <div className="mb-8 border-b border-hairline pb-4">
        <div className="mb-2 h-3 w-20 rounded-full bg-warm-beige motion-safe:animate-pulse" />
        <div className="h-6 w-48 rounded-full bg-warm-beige motion-safe:animate-pulse" />
      </div>
      <p role="status" className="mb-6 text-label-sm tracking-widest text-warm-gray">
        Searching…
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton';

// Suspense fallback for client-side navigation into a category (AC #3).
export default function Loading() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-5 py-12 md:px-16">
      <div className="mb-12 border-b border-hairline pb-4">
        <div className="mb-2 h-3 w-24 rounded-full bg-warm-beige motion-safe:animate-pulse" />
        <div className="h-6 w-40 rounded-full bg-warm-beige motion-safe:animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

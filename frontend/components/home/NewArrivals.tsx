import Link from 'next/link';
import type { Product } from '@/types/product';
import ProductCard from '@/components/ui/ProductCard';

// "New Arrivals" — the 4-up grid from the Stitch "Collection-Focused Homepage".
// Reuses the shared, tested ProductCard (contained card + hover-reveal CTA) so
// the home grid stays consistent with the category pages. Distinct from the
// Featured Curations strip above by column count, background, and card chrome.
//
// Server Component: ProductCard isolates its only client piece (Add to Cart).
export default function NewArrivals({
  products,
  viewAllHref,
}: {
  products: Product[];
  viewAllHref: string | null;
}) {
  return (
    <section
      aria-labelledby="new-arrivals-heading"
      className="mx-auto w-full max-w-[1400px] px-5 pb-13 pt-13 md:px-16"
    >
      <div className="mb-12 flex items-end justify-between border-b border-hairline/40 pb-4">
        <div>
          <span className="mb-1 block text-label-sm tracking-[0.3em] text-warm-gray">
            Just Dropped
          </span>
          <h2
            id="new-arrivals-heading"
            className="text-headline-md uppercase tracking-widest text-brown"
          >
            New Arrivals
          </h2>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-label-sm text-brown underline-offset-4 transition-colors duration-300 hover:text-clay hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
          >
            View All
          </Link>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-body-md text-warm-gray">
          Our collection is being curated. Please check back soon.
        </p>
      )}
    </section>
  );
}

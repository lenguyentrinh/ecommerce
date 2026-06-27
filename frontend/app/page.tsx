import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getCategories,
  getProducts,
} from '@/features/product/services/productApi';
import ProductCard from '@/components/ui/ProductCard';
import type { Product } from '@/types/product';

// ISR: cache the rendered page and revalidate periodically. The fetches below
// are wrapped in try/catch so `next build` succeeds even if the backend is
// unreachable at build time (degraded-but-valid page).
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Oren — Soft Minimal Luxury Fashion',
  description:
    'Discover Oren — a curated collection of premium women’s fashion. Editorial, calm, and quietly luxurious.',
  openGraph: {
    title: 'Oren — Soft Minimal Luxury Fashion',
    description:
      'Discover Oren — a curated collection of premium women’s fashion.',
    type: 'website',
  },
};

export default async function HomePage() {
  let products: Product[] = [];
  let categories: string[] = [];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      getProducts({ limit: 8, sort: 'newest' }),
      getCategories(),
    ]);
    products = productsRes.data;
    categories = categoriesRes;
  } catch {
    // Degrade gracefully — render the page shell without catalogue data.
    products = [];
    categories = [];
  }

  const heroHref = categories[0]
    ? `/categories/${encodeURIComponent(categories[0])}`
    : null;

  return (
    <>
      {/* Hero / banner */}
      <section className="relative h-[80vh] min-h-[520px] w-full overflow-hidden">
        <Image
          src="/images/bg-signup.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brown/30" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center text-warm-white">
          <span className="mb-6 text-label-sm uppercase tracking-[0.4em] opacity-90">
            The Oren Collection
          </span>
          <h1 className="text-display-lg italic">The Art of Dressing</h1>
          {heroHref && (
            <Link
              href={heroHref}
              className="mt-12 inline-flex items-center justify-center rounded-full bg-warm-white px-8 py-4 text-label-sm text-brown transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
            >
              Shop the Collection
            </Link>
          )}
        </div>
      </section>

      {/* Category navigation row */}
      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-[1400px] px-5 py-12 md:px-16">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/categories/${encodeURIComponent(category)}`}
                className="inline-flex items-center rounded-full border border-transparent bg-warm-beige px-4 py-1.5 text-label-sm text-warm-gray transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-clay hover:text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
              >
                {category}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="mx-auto w-full max-w-[1400px] px-5 pb-20 md:px-16">
        <div className="mb-12 flex items-end justify-between border-b border-hairline pb-4">
          <div>
            <span className="mb-1 block text-label-sm uppercase tracking-[0.3em] text-warm-gray">
              Just In
            </span>
            <h2 className="text-headline-md uppercase text-brown">Featured</h2>
          </div>
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
    </>
  );
}

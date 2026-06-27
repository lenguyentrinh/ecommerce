import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getCategories,
  getProducts,
} from '@/features/product/services/productApi';
import type { Product } from '@/types/product';
import FeaturedCurations from '@/components/home/FeaturedCurations';
import NewArrivals from '@/components/home/NewArrivals';

// ISR: cache the rendered page and revalidate periodically. The fetches below
// are wrapped in try/catch so `next build` succeeds even if the backend is
// unreachable at build time (degraded-but-valid page).
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Oren',
  description:
    'Discover Oren — a curated collection of premium women’s fashion. Editorial, calm, and quietly luxurious.',
  openGraph: {
    title: 'Oren',
    description:
      'Discover Oren — a curated collection of premium women’s fashion.',
    type: 'website',
  },
};

export default async function HomePage() {
  let featured: Product[] = [];
  let newArrivals: Product[] = [];
  let categories: string[] = [];

  try {
    const [featuredRes, newestRes, categoriesRes] = await Promise.all([
      // Featured Curations = best sellers; New Arrivals = newest. Fetched with
      // distinct sorts so each strip means what its heading says.
      getProducts({ limit: 3, sort: 'popularity' }),
      getProducts({ limit: 11, sort: 'newest' }),
      getCategories(),
    ]);
    featured = featuredRes.data;
    // Don't repeat a featured product in the New Arrivals grid below.
    const featuredIds = new Set(featured.map((p) => p.id));
    newArrivals = newestRes.data
      .filter((p) => !featuredIds.has(p.id))
      .slice(0, 8);
    categories = categoriesRes;
  } catch {
    // Degrade gracefully — render the page shell without catalogue data.
    featured = [];
    newArrivals = [];
    categories = [];
  }

  const primaryCategoryHref = categories[0]
    ? `/categories/${encodeURIComponent(categories[0])}`
    : null;

  return (
    <>
      {/* Hero / banner — full-bleed editorial, LCP-prioritised */}
      <section className="relative h-[86svh] min-h-[600px] w-full overflow-hidden">
        <Image
          src="/images/bg-signup.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Warm scrim — keeps the white headline legible over the bright image */}
        <div className="absolute inset-0 bg-gradient-to-t from-brown/60 via-brown/25 to-brown/20" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-5 text-center text-warm-white">
          <span className="mb-5 text-label-sm tracking-[0.4em] text-warm-white/90">
            The Oren Collection
          </span>
          <h1 className="font-display-serif pb-1 text-[clamp(40px,7vw,76px)] italic leading-[1.15] drop-shadow-sm">
            The Art of Dressing
          </h1>
          <p className="mt-6 max-w-[36ch] text-body-lg text-warm-white/85">
            A curated edit of quietly luxurious pieces, made to be worn and worn
            again.
          </p>
          {primaryCategoryHref && (
            <Link
              href={primaryCategoryHref}
              className="mt-10 inline-flex items-center justify-center rounded-full bg-warm-white px-8 py-4 text-label-sm text-brown transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
            >
              Shop the Collection
            </Link>
          )}
        </div>
      </section>

      <FeaturedCurations products={featured} />

      <NewArrivals products={newArrivals} viewAllHref={primaryCategoryHref} />
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import ProductGrid from '@/components/ui/ProductGrid';
import FilterSortPanel from '@/components/ui/FilterSortPanel';
import {
  getCategories,
  getProducts,
} from '@/features/product/services/productApi';
import {
  parseProductFilters,
  type RawSearchParams,
} from '@/features/product/productFilters';

// No route-level `revalidate`: /search reads searchParams and is dynamically
// rendered per request. The getProducts fetch keeps its own ISR cache hint.
const PAGE_LIMIT = 12;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const title = q ? `Search: ${q} — Oren` : 'Search — Oren';
  const description = q
    ? `Search results for “${q}” at Oren.`
    : 'Search the Oren collection.';
  return { title, description, openGraph: { title, description } };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const { current, query } = parseProductFilters(sp);

  // Category options for the filter panel — supplementary, so degrade to none
  // on failure rather than breaking the page.
  const categories = await getCategories().catch(() => []);

  // NOT wrapped in try/catch: a real failure should surface via error.tsx.
  const res = await getProducts({ ...query, page: 1, limit: PAGE_LIMIT });

  return (
    <section className="mx-auto w-full max-w-[1400px] px-5 py-12 md:px-16">
      <header className="mb-8 border-b border-hairline pb-4">
        <span className="mb-1 block text-label-sm tracking-[0.3em] text-warm-gray">
          Search
        </span>
        <h1 className="text-headline-md text-brown">
          {current.q ? `Results for “${current.q}”` : 'All products'}
        </h1>
        <p className="mt-2 text-label-sm tracking-widest text-warm-gray">
          Showing {res.data.length} of {res.total} results
        </p>
      </header>

      <FilterSortPanel
        key={`${current.q ?? ''}|${current.category ?? ''}|${current.minPrice ?? ''}|${current.maxPrice ?? ''}|${current.inStock}|${current.sort ?? ''}`}
        categories={categories}
        current={current}
        showCategory
      />

      {res.total === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-body-md text-warm-gray">
            No results found. Try a different search or browse categories.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-sand px-6 py-2.5 text-label-sm text-brown transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-clay hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
          >
            Back to home
          </Link>
        </div>
      ) : (
        <ProductGrid
          initialProducts={res.data}
          total={res.total}
          queryParams={{ ...query, limit: PAGE_LIMIT }}
        />
      )}
    </section>
  );
}

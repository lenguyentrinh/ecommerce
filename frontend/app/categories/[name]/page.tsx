import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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

export const revalidate = 60;

const PAGE_LIMIT = 12;

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null; // malformed percent-encoding
  }
}

// Prerender the known categories at build. Guarded so a build still succeeds
// when the backend is unreachable (returns [] → pages render on demand).
// Return raw (decoded) names — Next.js URL-encodes the segment itself.
export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((name) => ({ name }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const category = safeDecode(name) ?? name;
  const title = `${category} — Oren`;
  const description = `Shop the ${category} collection at Oren — premium women’s fashion, curated.`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { name } = await params;

  const decoded = safeDecode(name);
  if (!decoded) notFound(); // malformed URL → branded 404, not a crash

  // Resolve to the canonical category name (case-insensitive), so /categories/fashion
  // matches the seeded "Fashion". A fetch failure here bubbles to error.tsx;
  // a genuinely unknown category 404s instead of rendering a fake "empty" page.
  const categories = await getCategories();
  const category = categories.find(
    (c) => c.toLowerCase() === decoded.toLowerCase(),
  );
  if (!category) notFound();

  // Filter/sort come from query params (Story 2.4). The route fixes the
  // category, so it overrides any `category`/`q` carried in the query.
  const { current, query } = parseProductFilters(await searchParams);
  const gridQuery = {
    ...query,
    search: undefined,
    category,
    limit: PAGE_LIMIT,
  };

  // NOT wrapped in try/catch: a fetch failure should surface via error.tsx,
  // not masquerade as an empty category.
  const res = await getProducts({ ...gridQuery, page: 1 });

  return (
    <section className="mx-auto w-full max-w-[1400px] px-5 py-12 md:px-16">
      <header className="mb-12 border-b border-hairline pb-4">
        <span className="mb-1 block text-label-sm uppercase tracking-[0.3em] text-warm-gray">
          Collection
        </span>
        <h1 className="text-headline-md uppercase text-brown">{category}</h1>
      </header>

      {/* Category is fixed by the route → no Category control here, and drop
          q/category from the panel so they aren't echoed onto category URLs. */}
      <FilterSortPanel
        key={`${current.minPrice ?? ''}|${current.maxPrice ?? ''}|${current.inStock}|${current.sort ?? ''}`}
        categories={categories}
        current={{ ...current, q: undefined, category: undefined }}
      />

      <ProductGrid
        initialProducts={res.data}
        total={res.total}
        queryParams={gridQuery}
      />
    </section>
  );
}

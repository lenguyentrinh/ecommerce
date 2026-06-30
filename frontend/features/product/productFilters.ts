import type { ProductQuery } from '@/features/product/services/productApi';
import type { ProductSort } from '@/types/product';

// The four sort options the UI offers (Story 2.4). `popularity` is a
// createdAt-DESC proxy server-side until sales data exists (Story 2.1).
export const PRODUCT_SORTS: ProductSort[] = [
  'price_asc',
  'price_desc',
  'newest',
  'popularity',
];

export const SORT_LABELS: Record<ProductSort, string> = {
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  newest: 'Newest',
  popularity: 'Most Popular',
};

// Bounds for the sidebar price-range slider (Stitch "Collection with Price
// Slider"). The seeded catalog tops out ~245, so 500 is a comfortable ceiling;
// a thumb at PRICE_FLOOR/PRICE_CEILING is treated as "no bound" and omitted
// from the URL so the default full range produces a clean, param-free link.
export const PRICE_FLOOR = 0;
export const PRICE_CEILING = 500;
export const PRICE_STEP = 10;

// Raw Next.js searchParams shape (every value is string | string[] | undefined).
export type RawSearchParams = Record<string, string | string[] | undefined>;

// Display-facing view of the active filters (strings, for inputs/chips).
export interface CurrentFilters {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock: boolean;
  sort?: ProductSort;
}

function firstString(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function nonNegativeNumber(
  value: string | string[] | undefined,
): number | undefined {
  const str = firstString(value);
  if (str === undefined) return undefined;
  const n = Number(str);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

// Parse raw searchParams into a display view (`current`) and the API query
// (`query`). Pure + defensive so it can be unit-tested and reused by both the
// /search page and the /categories/[name] page.
export function parseProductFilters(sp: RawSearchParams): {
  current: CurrentFilters;
  query: ProductQuery;
} {
  const q = firstString(sp.q);
  const category = firstString(sp.category);
  const minPrice = nonNegativeNumber(sp.minPrice);
  let maxPrice = nonNegativeNumber(sp.maxPrice);

  // Drop an inverted upper bound rather than send min>max (the backend 400s on
  // it). Guards a hand-edited URL from tripping the error boundary.
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    maxPrice = undefined;
  }

  const inStock = firstString(sp.inStock) === 'true';

  const sortRaw = firstString(sp.sort);
  const sort = PRODUCT_SORTS.includes(sortRaw as ProductSort)
    ? (sortRaw as ProductSort)
    : undefined;

  const current: CurrentFilters = {
    q,
    category,
    minPrice: minPrice?.toString(),
    maxPrice: maxPrice?.toString(),
    inStock,
    sort,
  };

  const query: ProductQuery = {
    search: q,
    category,
    minPrice,
    maxPrice,
    inStock: inStock || undefined,
    sort,
  };

  return { current, query };
}

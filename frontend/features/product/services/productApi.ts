import type {
  Product,
  ProductListResponse,
  ProductSort,
} from '@/types/product';

// Public read API base. Resolves the same server-side and client-side in dev.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// RequestInit augmented with Next's fetch cache hint. Declared locally so the
// service type-checks under ts-jest without depending on Next's global fetch
// augmentation. The `next` property is read by the Next.js server and ignored
// by the browser, so the same function is safe on both sides.
type FetchInit = RequestInit & { next?: { revalidate?: number } };

export interface ProductQuery {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

// Build a `?a=1&b=2` query string, omitting undefined/null/empty values.
export function buildProductQueryString(query: ProductQuery = {}): string {
  const params = new URLSearchParams();
  (Object.keys(query) as (keyof ProductQuery)[]).forEach((key) => {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// Fetch a paginated product list. Throws on a non-OK response so callers can
// catch and degrade gracefully (Server Components) or stop loading (client).
export async function getProducts(
  query: ProductQuery = {},
  options: { revalidate?: number } = {},
): Promise<ProductListResponse> {
  const url = `${API_BASE_URL}/api/products${buildProductQueryString(query)}`;
  const res = await fetch(url, {
    next: { revalidate: options.revalidate ?? 60 },
  } as FetchInit);
  if (!res.ok) {
    throw new Error(`Failed to load products (${res.status})`);
  }
  return res.json() as Promise<ProductListResponse>;
}

// Fetch the distinct active category names.
export async function getCategories(
  options: { revalidate?: number } = {},
): Promise<string[]> {
  const url = `${API_BASE_URL}/api/products/categories`;
  const res = await fetch(url, {
    next: { revalidate: options.revalidate ?? 300 },
  } as FetchInit);
  if (!res.ok) {
    throw new Error(`Failed to load categories (${res.status})`);
  }
  // Tolerate both the documented `{ data: string[] }` shape and a bare array,
  // so a contract drift can't crash the home page / generateStaticParams.
  const json = (await res.json()) as { data?: string[] } | string[];
  if (Array.isArray(json)) return json;
  return json.data ?? [];
}

// Fetch a single product by id (Story 2.3 PDP). Returns `null` on a 404 so the
// page can render notFound() (branded 404); throws on any other non-OK status
// so the route error boundary catches a real backend failure. The detail
// endpoint returns `{ data: Product }` and 404s for inactive/soft-deleted rows.
export async function getProduct(
  id: number | string,
  options: { revalidate?: number } = {},
): Promise<Product | null> {
  const url = `${API_BASE_URL}/api/products/${id}`;
  const res = await fetch(url, {
    next: { revalidate: options.revalidate ?? 60 },
  } as FetchInit);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load product (${res.status})`);
  }
  const json = (await res.json()) as { data: Product };
  return json.data;
}

// Re-export so consumers can import the type alongside the functions.
export type { Product };

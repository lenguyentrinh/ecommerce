// Public (no auth) product fetch for guest cart hydration.
// Unlike the SSR productApi (which uses Next fetch + revalidate),
// this uses a plain fetch for client-side reads from localStorage-backed carts.
// The backend GET /api/products/:id is unguarded (no JWT).

import type { CartLineProduct } from '@/types/cart';

export async function getProductById(id: number): Promise<CartLineProduct> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch product ${id}`);
  }
  const json = await res.json();
  // The backend wraps single-product responses in { data: Product }.
  return json.data as CartLineProduct;
}

export async function getProductsByIds(ids: number[]): Promise<CartLineProduct[]> {
  const unique = [...new Set(ids)];
  const results = await Promise.allSettled(
    unique.map((id) => getProductById(id)),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<CartLineProduct> => r.status === 'fulfilled',
    )
    .map((r) => r.value);
}

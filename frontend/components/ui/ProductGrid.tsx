'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '@/types/product';
import {
  getProducts,
  type ProductQuery,
} from '@/features/product/services/productApi';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

interface ProductGridProps {
  initialProducts: Product[];
  total: number;
  queryParams: ProductQuery;
}

// Responsive uniform grid with client-side infinite scroll (AC #3, #4, #6).
// SSR seeds the first page; subsequent pages load as a sentinel scrolls into view.
export default function ProductGrid({
  initialProducts,
  total,
  queryParams,
}: ProductGridProps) {
  const limit = queryParams.limit ?? 12;
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState<number>(queryParams.page ?? 1);
  const [knownTotal, setKnownTotal] = useState<number>(total);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false); // backend signalled no more pages
  const loadingRef = useRef<boolean>(false); // synchronous in-flight guard (beats the render cycle)
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = !isDone && products.length < knownTotal;

  // Re-seed when the SSR inputs change (e.g. navigating between categories).
  useEffect(() => {
    setProducts(initialProducts);
    setPage(queryParams.page ?? 1);
    setKnownTotal(total);
    setHasError(false);
    setIsDone(false);
    setIsLoading(false);
    loadingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProducts]);

  const loadMore = useCallback(async () => {
    // Synchronous guard: a second intersection in the same frame (before React
    // re-renders and rebinds the observer) must not fire a duplicate fetch.
    if (loadingRef.current || isDone) return;
    if (products.length >= knownTotal) return;
    loadingRef.current = true;
    setIsLoading(true);
    setHasError(false);
    try {
      const nextPage = page + 1;
      const res = await getProducts({ ...queryParams, page: nextPage, limit });
      setKnownTotal(res.total); // trust the latest count, not the frozen SSR value
      if (res.data.length === 0) {
        setIsDone(true); // empty page → stop (guards against an infinite empty-fetch loop)
      } else {
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const fresh = res.data.filter((p) => !seen.has(p.id)); // dedupe overlapping rows
          return [...prev, ...fresh];
        });
        setPage(nextPage);
        if (res.data.length < limit) setIsDone(true); // short page = last page
      }
    } catch {
      setHasError(true);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [isDone, products.length, knownTotal, page, queryParams, limit]);

  useEffect(() => {
    const node = sentinelRef.current;
    // Pause automatic loading while an error is shown — wait for an explicit retry.
    if (!node || !hasMore || hasError) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, hasMore, hasError]);

  if (products.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-body-md text-warm-gray">
          No products in this category yet
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {hasMore && !hasError && (
        <div ref={sentinelRef} aria-hidden="true" className="h-12 w-full" />
      )}

      {isLoading && (
        <p
          role="status"
          className="mt-6 text-center text-label-sm text-warm-gray"
        >
          Loading more…
        </p>
      )}

      {hasError && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            className="text-label-sm text-brown underline underline-offset-4 transition-colors duration-300 hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
          >
            Couldn’t load more — retry
          </button>
        </div>
      )}
    </div>
  );
}

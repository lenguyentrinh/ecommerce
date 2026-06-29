'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FiX } from 'react-icons/fi';
import Chip from '@/components/Chip';
import { formatPrice } from '@/lib/helpers';
import {
  PRODUCT_SORTS,
  SORT_LABELS,
  type CurrentFilters,
} from '@/features/product/productFilters';
import type { ProductSort } from '@/types/product';

interface FilterSortPanelProps {
  categories: string[];
  current: CurrentFilters;
  // Show the Category control. False on /categories/[name] (the route fixes it).
  showCategory?: boolean;
}

// Shared filter/sort UI (Story 2.4 AC #3, #4). URL is the single source of
// truth: it reads current filters from props (parsed server-side) and writes
// changes via router.push so results are shareable, bookmarkable, and survive a
// refresh. Uses usePathname so the same component works on /search and
// /categories/[name]; no useSearchParams (keeps prerendered pages static).
export default function FilterSortPanel({
  categories,
  current,
  showCategory = false,
}: FilterSortPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Local state seeded from the URL. The parent passes a `key` derived from the
  // active filters, so this component remounts (and re-seeds) on every URL
  // change — keeping the inputs in sync without an effect, and preventing a
  // stale value from being re-pushed on blur to resurrect a removed filter.
  const [minPrice, setMinPrice] = useState(current.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(current.maxPrice ?? '');
  const [priceError, setPriceError] = useState('');

  // Compose the next URL from current filters + overrides (undefined removes a
  // param). Always drops `page` so a filter change restarts at page 1.
  const pushWith = (overrides: Record<string, string | undefined>) => {
    const base: Record<string, string | undefined> = {
      q: current.q,
      category: current.category,
      minPrice: current.minPrice,
      maxPrice: current.maxPrice,
      inStock: current.inStock ? 'true' : undefined,
      sort: current.sort,
      ...overrides,
    };
    const params = new URLSearchParams();
    Object.entries(base).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, value);
    });
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const applyPriceRange = () => {
    const min = minPrice.trim();
    const max = maxPrice.trim();
    const minNum = min === '' ? undefined : Number(min);
    const maxNum = max === '' ? undefined : Number(max);
    // Reject non-numeric input (paste/locale) before it reaches the backend,
    // which would 400 on a NaN price and trip the error boundary.
    if (
      (minNum !== undefined && (!Number.isFinite(minNum) || minNum < 0)) ||
      (maxNum !== undefined && (!Number.isFinite(maxNum) || maxNum < 0))
    ) {
      setPriceError('Enter a valid price.');
      return;
    }
    // Block (with feedback, not silently) an inverted range — backend 400s on it.
    if (minNum !== undefined && maxNum !== undefined && minNum > maxNum) {
      setPriceError('Min price must be below max.');
      return;
    }
    setPriceError('');
    pushWith({ minPrice: min || undefined, maxPrice: max || undefined });
  };

  const clearAll = () => {
    setMinPrice('');
    setMaxPrice('');
    setPriceError('');
    // Keep the search term (/search); drop every filter. On /categories/[name]
    // current.q is unset, so this returns to the bare category path.
    router.push(
      current.q ? `${pathname}?q=${encodeURIComponent(current.q)}` : pathname,
    );
  };

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (showCategory && current.category) {
    activeChips.push({
      key: 'category',
      label: current.category,
      clear: () => pushWith({ category: undefined }),
    });
  }
  if (current.minPrice) {
    activeChips.push({
      key: 'minPrice',
      label: `From ${formatPrice(Number(current.minPrice))}`,
      clear: () => pushWith({ minPrice: undefined }),
    });
  }
  if (current.maxPrice) {
    activeChips.push({
      key: 'maxPrice',
      label: `Up to ${formatPrice(Number(current.maxPrice))}`,
      clear: () => pushWith({ maxPrice: undefined }),
    });
  }
  if (current.inStock) {
    activeChips.push({
      key: 'inStock',
      label: 'In Stock',
      clear: () => pushWith({ inStock: undefined }),
    });
  }
  if (current.sort) {
    activeChips.push({
      key: 'sort',
      label: SORT_LABELS[current.sort],
      clear: () => pushWith({ sort: undefined }),
    });
  }

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm text-warm-gray">Sort</span>
          <select
            value={current.sort ?? ''}
            onChange={(event) =>
              pushWith({
                sort: (event.target.value as ProductSort) || undefined,
              })
            }
            className="h-11 rounded-full border border-hairline bg-warm-white px-4 text-body-md text-brown focus:border-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          >
            <option value="">Featured</option>
            {PRODUCT_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-label-sm text-warm-gray">Min price</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                aria-invalid={priceError !== ''}
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                onBlur={applyPriceRange}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyPriceRange();
                }}
                className="h-11 w-28 rounded-full border border-hairline bg-warm-white px-4 text-body-md text-brown focus:border-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-sm text-warm-gray">Max price</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                aria-invalid={priceError !== ''}
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                onBlur={applyPriceRange}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyPriceRange();
                }}
                className="h-11 w-28 rounded-full border border-hairline bg-warm-white px-4 text-body-md text-brown focus:border-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
              />
            </label>
          </div>
          {priceError && (
            <p role="alert" className="text-label-sm text-error">
              {priceError}
            </p>
          )}
        </div>

        <Chip
          label="In Stock"
          selected={current.inStock}
          onClick={() =>
            pushWith({ inStock: current.inStock ? undefined : 'true' })
          }
        />
      </div>

      {showCategory && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              selected={current.category === category}
              onClick={() =>
                pushWith({
                  category: current.category === category ? undefined : category,
                })
              }
            />
          ))}
        </div>
      )}

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              aria-label={`Remove ${chip.label} filter`}
              className="inline-flex items-center gap-1 rounded-full bg-blush px-3 py-1.5 text-label-sm text-brown transition-colors duration-300 hover:bg-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
            >
              {chip.label}
              <FiX size={14} aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-label-sm text-warm-gray underline underline-offset-4 transition-colors duration-300 hover:text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

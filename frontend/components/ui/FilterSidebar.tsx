'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import PriceRangeSlider from './PriceRangeSlider';
import { formatPrice } from '@/lib/helpers';
import {
  PRICE_CEILING,
  PRICE_FLOOR,
  PRICE_STEP,
  PRODUCT_SORTS,
  SORT_LABELS,
  type CurrentFilters,
} from '@/features/product/productFilters';
import type { ProductSort } from '@/types/product';

interface FilterSidebarProps {
  categories: string[];
  current: CurrentFilters;
  // Show the Categories section. False on /categories/[name] (route fixes it).
  showCategory?: boolean;
}

// Sidebar "Refine" panel (Stitch "Shop | Collection with Price Slider"). Unlike
// the instant-apply horizontal panel, this batches: every control mutates local
// *draft* state and nothing touches the URL until "Update Results". The URL is
// still the single source of truth — the parent passes a `key` derived from the
// active filters so this remounts (re-seeds the draft) whenever the URL changes.
// Category is single-select (the backend query takes one category) rendered as
// checkboxes to match the design.
export default function FilterSidebar({
  categories,
  current,
  showCategory = false,
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [sort, setSort] = useState<ProductSort | ''>(current.sort ?? '');
  const [inStock, setInStock] = useState(current.inStock);
  const [category, setCategory] = useState<string | undefined>(
    current.category,
  );
  const [priceMin, setPriceMin] = useState(
    current.minPrice ? Number(current.minPrice) : PRICE_FLOOR,
  );
  const [priceMax, setPriceMax] = useState(
    current.maxPrice ? Number(current.maxPrice) : PRICE_CEILING,
  );

  // Apply the draft to the URL. A thumb left at the floor/ceiling is "no bound"
  // and omitted so the default full range yields a clean, param-free link.
  const apply = () => {
    const params = new URLSearchParams();
    if (current.q) params.set('q', current.q);
    if (showCategory && category) params.set('category', category);
    if (priceMin > PRICE_FLOOR) params.set('minPrice', String(priceMin));
    if (priceMax < PRICE_CEILING) params.set('maxPrice', String(priceMax));
    if (inStock) params.set('inStock', 'true');
    if (sort) params.set('sort', sort);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const clearAll = () => {
    setSort('');
    setInStock(false);
    setCategory(undefined);
    setPriceMin(PRICE_FLOOR);
    setPriceMax(PRICE_CEILING);
    // Keep the search term (/search); drop everything else.
    router.push(
      current.q ? `${pathname}?q=${encodeURIComponent(current.q)}` : pathname,
    );
  };

  return (
    <aside className="w-full md:w-64 md:flex-shrink-0 md:sticky md:top-24">
      <div className="glass-panel soft-shadow flex flex-col gap-md rounded-lg p-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-headline-md text-brown">Refine</h3>
          <button
            type="button"
            onClick={clearAll}
            className="border-b border-clay/40 pb-0.5 text-label-sm text-warm-gray transition-colors hover:text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
          >
            Clear All
          </button>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-2">
          <h4 className="text-label-sm text-warm-gray">Sort By</h4>
          <select
            aria-label="Sort by"
            value={sort}
            onChange={(e) => setSort((e.target.value as ProductSort) || '')}
            className="h-11 w-full rounded-md border border-hairline bg-warm-white px-4 text-body-md text-brown focus:border-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          >
            <option value="">Newest Arrivals</option>
            {PRODUCT_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Price range */}
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between">
            <h4 className="text-label-sm text-warm-gray">Price Range</h4>
            <span className="text-body-md text-sm text-brown">
              {formatPrice(priceMin)} — {formatPrice(priceMax)}
            </span>
          </div>
          <div className="px-1 pt-1">
            <PriceRangeSlider
              min={PRICE_FLOOR}
              max={PRICE_CEILING}
              step={PRICE_STEP}
              valueMin={priceMin}
              valueMax={priceMax}
              onChange={({ min, max }) => {
                setPriceMin(min);
                setPriceMax(max);
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <h4 className="text-label-sm text-warm-gray">Status</h4>
          <label className="group flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="h-4 w-4 rounded border-hairline text-brown accent-brown focus-visible:ring-2 focus-visible:ring-clay"
            />
            <span className="text-body-md text-warm-gray transition-colors group-hover:text-brown">
              In Stock Only
            </span>
          </label>
        </div>

        {/* Categories (single-select to match the backend query) */}
        {showCategory && categories.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-label-sm text-warm-gray">Categories</h4>
            <div className="flex flex-col gap-2.5">
              {categories.map((c) => {
                const selected = category === c;
                return (
                  <label
                    key={c}
                    className="group flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => setCategory(selected ? undefined : c)}
                      className="h-4 w-4 rounded border-hairline text-brown accent-brown focus-visible:ring-2 focus-visible:ring-clay"
                    />
                    <span
                      className={`text-body-md transition-colors ${
                        selected
                          ? 'font-semibold text-brown'
                          : 'text-warm-gray group-hover:text-brown'
                      }`}
                    >
                      {c}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Apply */}
        <button
          type="button"
          onClick={apply}
          className="mt-1 w-full rounded-md bg-brown py-3.5 text-label-sm text-warm-white transition-all hover:bg-warm-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          Update Results
        </button>
      </div>
    </aside>
  );
}

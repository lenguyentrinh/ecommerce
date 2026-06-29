'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiX } from 'react-icons/fi';

// Sticky search field (Story 2.4 AC #1). Lives in the already-sticky Header, so
// it stays visible on mobile while scrolling. Submitting navigates to
// /search?q=<query>. Uses only useRouter (no useSearchParams) so it never
// de-opts the statically-prerendered pages the global Header renders on.
export default function SearchBar({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = value.trim();
    if (!query) return; // empty submit is a no-op
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`relative ${className}`}
    >
      <button
        type="submit"
        aria-label="Search"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray transition-colors duration-300 hover:text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
      >
        <FiSearch size={18} aria-hidden="true" />
      </button>
      <input
        type="search"
        aria-label="Search products"
        placeholder="Search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-11 w-full rounded-full border border-hairline bg-warm-white pl-10 pr-10 text-body-md text-brown placeholder:text-warm-gray transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-clay [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray transition-colors duration-300 hover:text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
        >
          <FiX size={18} />
        </button>
      )}
    </form>
  );
}

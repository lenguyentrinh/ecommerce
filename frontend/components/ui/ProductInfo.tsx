import { FaChevronDown } from 'react-icons/fa';
import type { Product } from '@/types/product';
import { formatPrice } from '@/lib/helpers';
import PdpAddToCart from './PdpAddToCart';

// Split the description into editorial paragraphs on blank lines (DESIGN.md →
// "Styling Notes" — magazine paragraphs, never a bullet list).
function toParagraphs(text: string): string[] {
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text.trim()].filter(Boolean);
}

// Variant selector source (AC #4): the Product model has NO size/color fields
// today, so this returns [] and the chip selector below renders nothing — the
// correct, AC-satisfying behaviour. When a real variant model lands, source it
// here and the selector activates without a rewrite. Do NOT fabricate variants.
function getVariants(): string[] {
  return [];
}

// PDP info panel (Stitch PDP → right column): a frosted glass card floating on
// the pastel mesh. Server Component; the only interactive piece is the
// PdpAddToCart subcomponent. The page wraps this in a sticky desktop column.
export default function ProductInfo({ product }: { product: Product }) {
  const inStock = product.stockQuantity > 0;
  const paragraphs = toParagraphs(product.description);
  const variants = getVariants();

  return (
    <div className="glass-panel soft-shadow flex flex-col gap-6 rounded-lg p-8">
      <div className="flex flex-col gap-2">
        <span className="text-label-sm tracking-[0.2em] text-warm-gray">
          {product.category}
        </span>
        <h1 className="text-[32px] font-bold leading-[1.1] tracking-tight text-brown">
          {product.name}
        </h1>
        <p className="text-headline-md font-normal text-warm-gray">
          {formatPrice(product.price)}
        </p>
      </div>

      <p
        className={`text-label-sm tracking-widest ${
          inStock ? 'text-brown' : 'text-warm-gray'
        }`}
      >
        {inStock ? 'In stock' : 'Out of stock'}
      </p>

      {variants.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="variant-selector">
          {variants.map((variant) => (
            <span
              key={variant}
              className="rounded-full border border-clay bg-blush px-4 py-1.5 text-label-sm tracking-wide text-brown"
            >
              {variant}
            </span>
          ))}
        </div>
      )}

      <PdpAddToCart productName={product.name} inStock={inStock} />

      <details open className="group border-t border-hairline/50 pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-label-sm tracking-widest text-brown [&::-webkit-details-marker]:hidden">
          Product Description
          <FaChevronDown
            className="text-warm-gray transition-transform duration-300 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="flex flex-col gap-4 pt-3">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-body-lg text-brown">
              {paragraph}
            </p>
          ))}
        </div>
      </details>

      <p className="text-label-sm tracking-widest text-warm-gray">
        Free shipping over $150 • 30-day returns
      </p>
    </div>
  );
}

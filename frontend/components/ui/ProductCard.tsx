import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types/product';
import { formatPrice } from '@/lib/helpers';
import AddToCartButton from './AddToCartButton';

// Oren product card (DESIGN.md → Product Card). Server Component; the only
// interactive piece (Add to Cart) is the AddToCartButton client subcomponent,
// kept separate so the card body stays server-rendered.
export default function ProductCard({ product }: { product: Product }) {
  const inStock = product.stockQuantity > 0;
  const imageSrc = product.imageUrls?.[0] ?? '/images/placeholders/fashion-1.svg';
  const href = `/products/${product.id}`;

  return (
    <article className="group relative flex flex-col rounded-lg bg-warm-white shadow-ambient transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-lg bg-warm-beige">
        <Link
          href={href}
          className="block h-full w-full rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
        >
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-safe:group-hover:scale-[1.02] motion-safe:group-focus-within:scale-[1.02]"
          />
        </Link>

        {/* CTA / stock state — overlaid on the image, sibling of the link (no nested interactives) */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          {inStock ? (
            <AddToCartButton productId={product.id} productName={product.name} />
          ) : (
            <span className="block w-full rounded-full bg-sand px-4 py-2.5 text-center text-label-sm text-brown">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 p-4">
        <span className="text-label-sm text-warm-gray">{product.category}</span>
        <Link
          href={href}
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
        >
          <h3 className="text-[16px] font-semibold leading-snug text-brown">
            {product.name}
          </h3>
        </Link>
        <p className="text-[16px] font-normal text-warm-gray">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
}

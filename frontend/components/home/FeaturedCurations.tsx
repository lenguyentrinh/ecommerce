import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types/product';
import { formatPrice } from '@/lib/helpers';

const FALLBACK_IMAGE = '/images/placeholders/fashion-1.svg';

// "Featured Curations" — the editorial best-seller strip from the Stitch
// "Collection-Focused Homepage". Three large, image-led cards on a warm tonal
// gradient. Intentionally distinct from the contained New Arrivals grid below
// (3 vs 4 cols, gradient vs ivory, naked editorial image vs shadowed card) so
// the two product sections never read as the same layout family.
//
// Server Component: hover is CSS-only, so no client boundary is needed.
export default function FeaturedCurations({
  products,
}: {
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="bg-[linear-gradient(135deg,#fdebdc_0%,#faf7f2_48%,#f1dfd1_100%)] py-13">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-16">
        <div className="mb-12 border-b border-hairline/40 pb-4">
          <h2 className="text-headline-md uppercase tracking-widest text-brown">
            Featured Curations
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-8">
          {products.map((product, index) => {
            const href = `/products/${product.id}`;
            const src = product.imageUrls?.[0] ?? FALLBACK_IMAGE;

            return (
              <Link
                key={product.id}
                href={href}
                className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
              >
                <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-lg bg-warm-beige">
                  <Image
                    src={src}
                    alt={product.name}
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-safe:group-hover:scale-[1.03]"
                  />
                  {/* Semantic badge — the lead curation is the top-ranked seller */}
                  {index === 0 && (
                    <span className="absolute left-4 top-4 rounded-full bg-warm-white/85 px-3 py-1 text-label-sm text-brown backdrop-blur-md">
                      Best Seller
                    </span>
                  )}
                </div>

                <p className="mb-1 text-label-sm text-warm-gray">
                  {product.category}
                </p>
                <h3 className="text-body-lg text-brown">{product.name}</h3>
                <p className="mt-1 text-body-md text-warm-gray">
                  {formatPrice(product.price)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

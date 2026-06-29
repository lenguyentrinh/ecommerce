import Image from 'next/image';

// Existing, confirmed-present placeholder used when a product has no images.
// (Do NOT copy ProductCard's `fashion-1.svg` fallback — that file does not exist.)
const FALLBACK_IMAGE = '/images/placeholders/dresses-1.svg';

// PDP editorial image gallery (Stitch PDP → bento tiles over the pastel mesh).
// The first image is a full-width hero; further images tile as half-width
// detail shots, all visible at once. Frosted tiles (bg-white/20 + soft-shadow)
// match the Stitch glass treatment. Server Component — no client state.
// Handles 1..N images gracefully (1 image → just the hero).
export default function ProductGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const gallery = images.length > 0 ? images : [FALLBACK_IMAGE];
  const [hero, ...details] = gallery;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="group relative col-span-1 aspect-[4/5] overflow-hidden rounded-lg bg-white/20 soft-shadow md:col-span-2">
        <Image
          src={hero}
          alt={productName}
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 58vw"
          className="object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-safe:group-hover:scale-[1.01]"
        />
      </div>

      {details.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className="group relative aspect-square overflow-hidden rounded-lg bg-white/20 soft-shadow"
        >
          <Image
            src={src}
            alt={`${productName}, view ${index + 2}`}
            fill
            sizes="(max-width: 1023px) 50vw, 29vw"
            className="object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-safe:group-hover:scale-[1.01]"
          />
        </div>
      ))}
    </div>
  );
}

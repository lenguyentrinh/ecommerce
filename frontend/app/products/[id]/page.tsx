import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import ProductGallery from '@/components/ui/ProductGallery';
import ProductInfo from '@/components/ui/ProductInfo';
import {
  getProduct,
  getProducts,
} from '@/features/product/services/productApi';
import type { Product } from '@/types/product';

export const revalidate = 60;

// The backend `:id` is ParseIntPipe (MySQL INT). Accept only a canonical
// positive id: no leading zeros (`/products/007` would otherwise resolve to a
// non-canonical duplicate URL) and within signed-INT range (a huge id would
// otherwise overflow → a backend 500 instead of a branded 404). Anything else
// → notFound(), keeping the 404-vs-error discipline consistent.
const isNumericId = (id: string) =>
  /^[1-9]\d{0,9}$/.test(id) && Number(id) <= 2147483647;

// "Complete the Look" — same-category products (excluding the current one).
// Supplementary: a fetch failure here must NOT break the PDP, so it's wrapped
// in try/catch and degrades to an empty list (the section then renders nothing).
async function getRelatedProducts(product: Product): Promise<Product[]> {
  try {
    const res = await getProducts({ category: product.category, limit: 5 });
    return res.data.filter((p) => p.id !== product.id).slice(0, 4);
  } catch {
    return [];
  }
}

// Prerender known product pages at build. Guarded so the build still succeeds
// when the backend is unreachable (returns [] → pages render on demand).
export async function generateStaticParams() {
  try {
    const res = await getProducts({ limit: 100 });
    return res.data.map((product) => ({ id: String(product.id) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // Never call notFound() here — only the page decides 404. Return safe,
  // generic metadata when the product can't be loaded.
  if (!isNumericId(id)) return { title: 'Product — Oren' };

  const product = await getProduct(id);
  if (!product) return { title: 'Product — Oren' };

  const description = (product.description ?? '').trim().slice(0, 200);
  const title = `${product.name} — Oren`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isNumericId(id)) notFound();

  // getProduct returns null on 404 (→ branded not-found) and throws on a real
  // backend failure (→ error.tsx). Do not swallow the throw.
  const product = await getProduct(id);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <div className="account-mesh">
      <section className="mx-auto w-full max-w-[1400px] px-5 py-12 md:px-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="w-full lg:w-[58%]">
            <ProductGallery
              images={product.imageUrls}
              productName={product.name}
            />
          </div>
          <div className="w-full lg:sticky lg:top-24 lg:w-[42%]">
            <ProductInfo product={product} />
          </div>
        </div>

        {related.length > 0 && (
          <section
            className="glass-panel soft-shadow mt-16 rounded-xl p-6 md:p-8"
            aria-labelledby="complete-the-look"
          >
            <h2
              id="complete-the-look"
              className="mb-8 text-label-sm tracking-[0.2em] text-warm-gray"
            >
              Complete the Look
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

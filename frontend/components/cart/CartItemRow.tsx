'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FiMinus, FiPlus, FiX } from 'react-icons/fi';
import type { CartLine } from '@/types/cart';
import { formatPrice } from '@/lib/helpers';
import { showToast } from '@/lib/toast';

interface Props {
  line: CartLine;
  // Resolve on success; REJECT on failure (so the row can toast + recover).
  onUpdateQuantity: (itemId: number, quantity: number) => Promise<unknown>;
  onRemove: (itemId: number) => Promise<unknown>;
}

// A single cart line (AC4/5/6): image thumb, name, price, +/- quantity controls
// and a remove (×). The controls disable while a request is in flight; – is
// disabled at qty 1 (× removes), + is disabled at available stock. Removal fades
// the row out (300ms) while the DELETE is in flight; on success the slice update
// unmounts it, on failure it recovers.
export default function CartItemRow({
  line,
  onUpdateQuantity,
  onRemove,
}: Props) {
  const { id, product, quantity } = line;
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);

  const imageSrc = product.imageUrl ?? '/images/placeholders/fashion-1.svg';
  const atMin = quantity <= 1;
  const atMax = quantity >= product.stockQuantity;

  const changeQuantity = async (next: number) => {
    setBusy(true);
    try {
      await onUpdateQuantity(id, next);
    } catch (err) {
      showToast.error(
        /stock/i.test(String(err))
          ? 'Not enough stock available.'
          : "Couldn't update the cart. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      await onRemove(id); // success → slice removes the line → this unmounts
    } catch {
      showToast.error("Couldn't remove the item. Please try again.");
      setRemoving(false);
    }
  };

  return (
    <div
      className={`flex gap-4 rounded-lg bg-warm-white p-4 shadow-ambient transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        removing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-warm-beige">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-[16px] font-semibold leading-snug text-brown">
              {product.name}
            </h3>
            <p className="text-[16px] font-normal text-warm-gray">
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={removing}
            aria-label={`Remove ${product.name} from cart`}
            className="text-warm-gray transition-colors duration-300 hover:text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => changeQuantity(quantity - 1)}
            disabled={busy || atMin}
            aria-label={`Decrease quantity of ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-brown transition-colors duration-300 hover:border-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiMinus size={14} />
          </button>
          <span
            className="min-w-[2ch] text-center text-body-md text-brown"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => changeQuantity(quantity + 1)}
            disabled={busy || atMax}
            aria-label={`Increase quantity of ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-brown transition-colors duration-300 hover:border-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiPlus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

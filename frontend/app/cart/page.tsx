'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import {
  fetchCartThunk,
  updateCartItemThunk,
  removeCartItemThunk,
} from '@/store/cartThunk';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartLoading,
  selectCartLoaded,
  selectCartError,
} from '@/store/cartSlice';
import { useGuestCart } from '@/hooks/useGuestCart';
import { updateGuestCartQuantity, removeFromGuestCart } from '@/lib/guestCart';
import CartItemRow from '@/components/cart/CartItemRow';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';

export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, authChecked } = useSelector(
    (s: { auth: { isAuthenticated: boolean; authChecked: boolean } }) => s.auth,
  );
  const authItems = useSelector(selectCartItems);
  const authSubtotal = useSelector(selectCartSubtotal);
  const authLoading = useSelector(selectCartLoading);
  const authLoaded = useSelector(selectCartLoaded);
  const authError = useSelector(selectCartError);

  const guest = useGuestCart();

  const hasOutOfStock = (authItems.some((i) => i.product.stockQuantity === 0));

  useEffect(() => {
    if (authChecked && isAuthenticated && !authLoaded) {
      dispatch(fetchCartThunk());
    }
  }, [authChecked, isAuthenticated, authLoaded, dispatch]);

  const handleUpdateQuantity = (itemId: number, quantity: number) =>
    dispatch(updateCartItemThunk({ itemId, quantity })).unwrap();
  const handleRemove = (itemId: number) =>
    dispatch(removeCartItemThunk({ itemId })).unwrap();

  const guestHandleUpdateQuantity = (itemId: number, quantity: number) => {
    updateGuestCartQuantity(Math.abs(itemId), quantity);
    guest.refresh();
    return Promise.resolve();
  };
  const guestHandleRemove = (itemId: number) => {
    removeFromGuestCart(Math.abs(itemId));
    guest.refresh();
    return Promise.resolve();
  };

  if (!authChecked) {
    return (
      <div className="account-mesh">
        <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-16">
          <p className="text-center text-body-md text-warm-gray">Loading…</p>
        </section>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="account-mesh">
        <section className="mx-auto max-w-[1400px] px-5 py-12 md:px-16">
          <h1 className="mb-8 text-[32px] font-bold tracking-tight text-brown">
            Your Cart
          </h1>

          {authError && !authLoaded ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-body-md text-warm-gray">
                We couldn&apos;t load your cart.
              </p>
              <button
                type="button"
                onClick={() => dispatch(fetchCartThunk())}
                className="rounded-full bg-brown px-6 py-2.5 text-label-sm text-ivory transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
              >
                Try again
              </button>
            </div>
          ) : authLoading && !authLoaded ? (
            <p className="py-16 text-center text-body-md text-warm-gray">
              Loading…
            </p>
          ) : authItems.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="flex flex-col gap-4">
                {authItems.map((line) => (
                  <CartItemRow
                    key={line.id}
                    line={line}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
              <CartSummary subtotal={authSubtotal} hasOutOfStock={hasOutOfStock} />
            </div>
          )}
        </section>
      </div>
    );
  }

  if (guest.loading) {
    return (
      <div className="account-mesh">
        <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-16">
          <p className="text-center text-body-md text-warm-gray">Loading…</p>
        </section>
      </div>
    );
  }

  if (guest.error) {
    return (
      <div className="account-mesh">
        <section className="mx-auto max-w-[1400px] px-5 py-12 md:px-16">
          <h1 className="mb-8 text-[32px] font-bold tracking-tight text-brown">
            Your Cart
          </h1>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-body-md text-warm-gray">
              We couldn&apos;t load your cart.
            </p>
            <button
              type="button"
              onClick={guest.refresh}
              className="rounded-full bg-brown px-6 py-2.5 text-label-sm text-ivory transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        </section>
      </div>
    );
  }

  const guestHasOOS = guest.items.some((i) => i.product.stockQuantity === 0);

  return (
    <div className="account-mesh">
      <section className="mx-auto max-w-[1400px] px-5 py-12 md:px-16">
        <h1 className="mb-8 text-[32px] font-bold tracking-tight text-brown">
          Your Cart
        </h1>

        {guest.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              {guest.items.map((line) => (
                <CartItemRow
                  key={line.id}
                  line={line}
                  onUpdateQuantity={guestHandleUpdateQuantity}
                  onRemove={guestHandleRemove}
                />
              ))}
            </div>
            <CartSummary subtotal={guest.subtotal} hasOutOfStock={guestHasOOS} />
          </div>
        )}
      </section>
    </div>
  );
}

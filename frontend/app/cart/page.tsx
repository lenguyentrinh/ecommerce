'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import { useRequireAuth } from '@/hooks/useRequireAuth';
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
import CartItemRow from '@/components/cart/CartItemRow';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';

// /cart — authenticated-only in Story 3.2 (guest cart is 3.3). useRequireAuth
// waits for session hydration and redirects logged-out users to login.
export default function CartPage() {
  const { isAuthenticated, authChecked } = useRequireAuth();
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const loading = useSelector(selectCartLoading);
  const loaded = useSelector(selectCartLoaded);
  const error = useSelector(selectCartError);

  useEffect(() => {
    if (authChecked && isAuthenticated && !loaded) {
      dispatch(fetchCartThunk());
    }
  }, [authChecked, isAuthenticated, loaded, dispatch]);

  // unwrap() so a rejection propagates to the row (toast + recover there).
  const handleUpdateQuantity = (itemId: number, quantity: number) =>
    dispatch(updateCartItemThunk({ itemId, quantity })).unwrap();
  const handleRemove = (itemId: number) =>
    dispatch(removeCartItemThunk({ itemId })).unwrap();

  // Still hydrating, or about to be redirected by useRequireAuth.
  if (!authChecked || !isAuthenticated) {
    return (
      <div className="account-mesh">
        <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-16">
          <p className="text-center text-body-md text-warm-gray">Loading…</p>
        </section>
      </div>
    );
  }

  return (
    <div className="account-mesh">
      <section className="mx-auto max-w-[1400px] px-5 py-12 md:px-16">
        <h1 className="mb-8 text-[32px] font-bold tracking-tight text-brown">
          Your Cart
        </h1>

        {error && !loaded ? (
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
        ) : loading && !loaded ? (
          <p className="py-16 text-center text-body-md text-warm-gray">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              {items.map((line) => (
                <CartItemRow
                  key={line.id}
                  line={line}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemove}
                />
              ))}
            </div>
            <CartSummary subtotal={subtotal} />
          </div>
        )}
      </section>
    </div>
  );
}

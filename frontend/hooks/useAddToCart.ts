"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store/store";
import { addCartItemThunk } from "@/store/cartThunk";
import { showToast } from "@/lib/toast";

type AddStatus = "idle" | "adding" | "added";

/**
 * Shared "Add to Cart" behaviour for the ProductCard and PDP buttons.
 *
 * - Logged out (cart API is JWT-only in 3.2): toast + redirect to
 *   /login?return=<path> (guest cart is Story 3.3).
 * - Logged in: dispatch addCartItemThunk, show the success toast, and surface a
 *   transient "added" status (~1.5s) so the button can flash "✓ Added to Cart".
 * - On failure: a non-silent error toast; status returns to idle.
 *
 * The Header badge increment is NOT handled here — it falls out of the slice
 * update from the thunk's authoritative CartView response.
 */
export function useAddToCart() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSelector(
    (s: RootState) => s.auth.isAuthenticated,
  );
  const [status, setStatus] = useState<AddStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the reset timer on unmount (avoid state update after unmount).
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const addToCart = useCallback(
    async (productId: number, quantity = 1) => {
      if (!isAuthenticated) {
        showToast.info("Please sign in to add items to your cart.");
        router.push(`/login?return=${encodeURIComponent(pathname)}`);
        return;
      }

      setStatus("adding");
      try {
        await dispatch(addCartItemThunk({ productId, quantity })).unwrap();
        showToast.success("Added to cart! View cart or keep shopping.");
        setStatus("added");
        timer.current = setTimeout(() => setStatus("idle"), 1500);
      } catch (err) {
        // .unwrap() throws the rejectWithValue payload (the server message).
        const msg = typeof err === "string" ? err : "";
        showToast.error(
          /stock/i.test(msg)
            ? "Not enough stock available."
            : "Failed to add to cart. Please try again.",
        );
        setStatus("idle");
      }
    },
    [dispatch, isAuthenticated, pathname, router],
  );

  return { addToCart, status };
}

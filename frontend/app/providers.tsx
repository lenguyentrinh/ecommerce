"use client";

import { Provider, useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { store, type AppDispatch, type RootState } from "@/store/store";
import { Toaster } from "react-hot-toast";
import { fetchMeThunk } from "@/store/authThunk";
import { fetchCartThunk } from "@/store/cartThunk";
import { clearCart } from "@/store/cartSlice";
import { getGuestCart, clearGuestCart } from "@/lib/guestCart";
import { mergeCartAPI } from "@/services/cartAPI";

function AuthBootstrap() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, authChecked } = useSelector(
    (s: RootState) => s.auth,
  );
  const prevAuth = useRef(false);

  // Hydrate the session once on mount.
  useEffect(() => {
    dispatch(fetchMeThunk());
  }, [dispatch]);

  useEffect(() => {
    if (!authChecked) return;

    const was = prevAuth.current;
    prevAuth.current = isAuthenticated;

    if (isAuthenticated) {
      if (!was) {
        const guestItems = getGuestCart();
        if (guestItems.length > 0) {
          mergeCartAPI(guestItems)
            .then(() => {
              clearGuestCart();
              dispatch(fetchCartThunk());
            })
            .catch(() => {
              dispatch(fetchCartThunk());
            });
        } else {
          dispatch(fetchCartThunk());
        }
      }
    } else {
      dispatch(clearCart());
    }
  }, [authChecked, isAuthenticated, dispatch]);
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthBootstrap />
      {children}
      <Toaster
        position="bottom-left"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </Provider>
  );
}

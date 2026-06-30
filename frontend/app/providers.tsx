"use client";

import { Provider, useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { store, type AppDispatch, type RootState } from "@/store/store";
import { Toaster } from "react-hot-toast";
import { fetchMeThunk } from "@/store/authThunk";
import { fetchCartThunk } from "@/store/cartThunk";
import { clearCart } from "@/store/cartSlice";

function AuthBootstrap() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, authChecked } = useSelector(
    (s: RootState) => s.auth,
  );

  // Hydrate the session once on mount.
  useEffect(() => {
    dispatch(fetchMeThunk());
  }, [dispatch]);

  // Once auth is known: fetch the server cart when authenticated (so the Header
  // badge + /cart are populated app-wide), or clear it on logout so the next
  // user never sees the previous cart. Guest carts are Story 3.3.
  useEffect(() => {
    if (!authChecked) return;
    if (isAuthenticated) {
      dispatch(fetchCartThunk());
    } else {
      dispatch(clearCart());
    }
  }, [authChecked, isAuthenticated, dispatch]);

  return null;
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

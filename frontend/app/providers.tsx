"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import { store } from "@/store/store";
import { Toaster } from "react-hot-toast";
import { fetchMeThunk } from "@/store/authThunk";

function AuthBootstrap() {
  useEffect(() => {
    store.dispatch(fetchMeThunk());
  }, []);

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
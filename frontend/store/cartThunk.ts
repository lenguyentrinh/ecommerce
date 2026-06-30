import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCartAPI,
  addCartItemAPI,
  updateCartItemAPI,
  removeCartItemAPI,
} from "@/services/cartAPI";
import type { CartView } from "@/types/cart";

// Extract the backend's `{ message }` from an axios-style error without `any`.
function apiErrorMessage(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } })
      .response;
    return response?.data?.message;
  }
  return undefined;
}

// Each thunk resolves to the authoritative CartView from the server so the
// slice can REPLACE its state (no client-side recomputation of subtotal/qty).
// Mirrors the auth thunk pattern: try/catch → rejectWithValue(server message).

export const fetchCartThunk = createAsyncThunk<CartView>(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await getCartAPI();
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err) || "Failed to load cart");
    }
  },
);

export const addCartItemThunk = createAsyncThunk<
  CartView,
  { productId: number; quantity: number }
>("cart/add", async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    return await addCartItemAPI(productId, quantity);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to add to cart",
    );
  }
});

export const updateCartItemThunk = createAsyncThunk<
  CartView,
  { itemId: number; quantity: number }
>("cart/update", async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    return await updateCartItemAPI(itemId, quantity);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to update cart",
    );
  }
});

export const removeCartItemThunk = createAsyncThunk<
  CartView,
  { itemId: number }
>("cart/remove", async ({ itemId }, { rejectWithValue }) => {
  try {
    return await removeCartItemAPI(itemId);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to remove item",
    );
  }
});

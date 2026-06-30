import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import {
  fetchCartThunk,
  addCartItemThunk,
  updateCartItemThunk,
  removeCartItemThunk,
} from './cartThunk';
import * as cartAPI from '@/services/cartAPI';
import type { CartView } from '@/types/cart';

jest.mock('@/services/cartAPI');

const view: CartView = {
  items: [
    {
      id: 10,
      product: {
        id: 1,
        name: 'Linen Shirt',
        price: 189000,
        imageUrl: null,
        stockQuantity: 5,
        isActive: true,
      },
      quantity: 2,
    },
  ],
  subtotal: 378000,
};

const makeStore = () => configureStore({ reducer: { cart: cartReducer } });

describe('cart thunks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetchCartThunk populates state from getCartAPI', async () => {
    (cartAPI.getCartAPI as jest.Mock).mockResolvedValue(view);
    const store = makeStore();
    await store.dispatch(fetchCartThunk());
    expect(cartAPI.getCartAPI).toHaveBeenCalled();
    expect(store.getState().cart.items).toHaveLength(1);
    expect(store.getState().cart.subtotal).toBe(378000);
    expect(store.getState().cart.loaded).toBe(true);
  });

  it('addCartItemThunk calls addCartItemAPI(productId, quantity)', async () => {
    (cartAPI.addCartItemAPI as jest.Mock).mockResolvedValue(view);
    const store = makeStore();
    await store.dispatch(addCartItemThunk({ productId: 1, quantity: 2 }));
    expect(cartAPI.addCartItemAPI).toHaveBeenCalledWith(1, 2);
    expect(store.getState().cart.subtotal).toBe(378000);
  });

  it('updateCartItemThunk calls updateCartItemAPI(itemId, quantity)', async () => {
    (cartAPI.updateCartItemAPI as jest.Mock).mockResolvedValue(view);
    const store = makeStore();
    await store.dispatch(updateCartItemThunk({ itemId: 10, quantity: 3 }));
    expect(cartAPI.updateCartItemAPI).toHaveBeenCalledWith(10, 3);
  });

  it('removeCartItemThunk calls removeCartItemAPI(itemId)', async () => {
    (cartAPI.removeCartItemAPI as jest.Mock).mockResolvedValue({
      items: [],
      subtotal: 0,
    });
    const store = makeStore();
    await store.dispatch(removeCartItemThunk({ itemId: 10 }));
    expect(cartAPI.removeCartItemAPI).toHaveBeenCalledWith(10);
    expect(store.getState().cart.items).toHaveLength(0);
  });

  it('rejects with the server message on failure', async () => {
    (cartAPI.getCartAPI as jest.Mock).mockRejectedValue({
      response: { data: { message: 'boom' } },
    });
    const store = makeStore();
    await store.dispatch(fetchCartThunk());
    expect(store.getState().cart.error).toBe('boom');
  });
});

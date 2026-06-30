import cartReducer, { clearCart, selectCartCount } from './cartSlice';
import { fetchCartThunk, addCartItemThunk } from './cartThunk';
import type { CartView } from '@/types/cart';

const line = (id: number, quantity: number) => ({
  id,
  product: {
    id: 1,
    name: 'Linen Shirt',
    price: 189000,
    imageUrl: null,
    stockQuantity: 5,
    isActive: true,
  },
  quantity,
});

const view: CartView = { items: [line(10, 2)], subtotal: 378000 };

const initial = {
  items: [],
  subtotal: 0,
  loading: false,
  error: null,
  loaded: false,
};

describe('cartSlice', () => {
  it('starts empty and not loaded', () => {
    const s = cartReducer(undefined, { type: '@@INIT' });
    expect(s.items).toEqual([]);
    expect(s.subtotal).toBe(0);
    expect(s.loaded).toBe(false);
  });

  it('pending sets loading', () => {
    const s = cartReducer(
      initial,
      addCartItemThunk.pending('', { productId: 1, quantity: 1 }),
    );
    expect(s.loading).toBe(true);
  });

  it('fulfilled replaces items + subtotal and marks loaded', () => {
    const s = cartReducer(initial, fetchCartThunk.fulfilled(view, '', undefined));
    expect(s.items).toHaveLength(1);
    expect(s.items[0].id).toBe(10);
    expect(s.subtotal).toBe(378000);
    expect(s.loading).toBe(false);
    expect(s.loaded).toBe(true);
  });

  it('rejected stores the error message', () => {
    const s = cartReducer(
      initial,
      fetchCartThunk.rejected(new Error('x'), '', undefined, 'Insufficient stock'),
    );
    expect(s.loading).toBe(false);
    expect(s.error).toBe('Insufficient stock');
  });

  it('clearCart empties the cart (logout)', () => {
    const populated = { ...initial, items: view.items, subtotal: 378000, loaded: true };
    const s = cartReducer(populated, clearCart());
    expect(s.items).toEqual([]);
    expect(s.subtotal).toBe(0);
    expect(s.loaded).toBe(false);
  });

  it('selectCartCount sums quantities across lines', () => {
    const state = { cart: { ...initial, items: [line(10, 2), line(11, 3)] } };
    expect(selectCartCount(state)).toBe(5);
  });
});

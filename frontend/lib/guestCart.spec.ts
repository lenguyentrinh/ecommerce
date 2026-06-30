/**
 * @jest-environment jsdom
 */
import {
  getGuestCart,
  addToGuestCart,
  removeFromGuestCart,
  updateGuestCartQuantity,
  clearGuestCart,
  getGuestCartCount,
} from './guestCart';

const KEY = 'oren_cart';

beforeEach(() => {
  window.localStorage.clear();
});

describe('guestCart', () => {
  describe('getGuestCart', () => {
    it('returns empty array when nothing stored', () => {
      expect(getGuestCart()).toEqual([]);
    });

    it('returns empty array for invalid JSON', () => {
      window.localStorage.setItem(KEY, 'not-json');
      expect(getGuestCart()).toEqual([]);
    });

    it('returns empty array for non-array JSON', () => {
      window.localStorage.setItem(KEY, '{"foo":"bar"}');
      expect(getGuestCart()).toEqual([]);
    });

    it('filters out malformed items', () => {
      window.localStorage.setItem(
        KEY,
        JSON.stringify([{ productId: 1, quantity: 2 }, { foo: 'bar' }]),
      );
      expect(getGuestCart()).toEqual([{ productId: 1, quantity: 2 }]);
    });

    it('returns parsed cart items', () => {
      const items = [{ productId: 1, quantity: 2 }];
      window.localStorage.setItem(KEY, JSON.stringify(items));
      expect(getGuestCart()).toEqual(items);
    });
  });

  describe('addToGuestCart', () => {
    it('adds a new product', () => {
      addToGuestCart(1, 2);
      expect(getGuestCart()).toEqual([{ productId: 1, quantity: 2 }]);
    });

    it('increments quantity for existing product', () => {
      addToGuestCart(1, 2);
      addToGuestCart(1, 3);
      expect(getGuestCart()).toEqual([{ productId: 1, quantity: 5 }]);
    });

    it('adds multiple products', () => {
      addToGuestCart(1, 1);
      addToGuestCart(2, 3);
      expect(getGuestCart()).toEqual([
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 3 },
      ]);
    });
  });

  describe('removeFromGuestCart', () => {
    it('removes an existing product', () => {
      addToGuestCart(1, 2);
      addToGuestCart(2, 1);
      removeFromGuestCart(1);
      expect(getGuestCart()).toEqual([{ productId: 2, quantity: 1 }]);
    });

    it('does nothing for non-existing product', () => {
      addToGuestCart(1, 2);
      removeFromGuestCart(99);
      expect(getGuestCart()).toEqual([{ productId: 1, quantity: 2 }]);
    });
  });

  describe('updateGuestCartQuantity', () => {
    it('updates quantity for existing product', () => {
      addToGuestCart(1, 2);
      updateGuestCartQuantity(1, 5);
      expect(getGuestCart()).toEqual([{ productId: 1, quantity: 5 }]);
    });

    it('adds product if not existing', () => {
      updateGuestCartQuantity(1, 3);
      expect(getGuestCart()).toEqual([{ productId: 1, quantity: 3 }]);
    });

    it('removes product when quantity is 0', () => {
      addToGuestCart(1, 2);
      updateGuestCartQuantity(1, 0);
      expect(getGuestCart()).toEqual([]);
    });

    it('removes product when quantity is negative', () => {
      addToGuestCart(1, 2);
      updateGuestCartQuantity(1, -1);
      expect(getGuestCart()).toEqual([]);
    });
  });

  describe('clearGuestCart', () => {
    it('removes the localStorage key', () => {
      addToGuestCart(1, 2);
      clearGuestCart();
      expect(window.localStorage.getItem(KEY)).toBeNull();
    });
  });

  describe('getGuestCartCount', () => {
    it('returns 0 for empty cart', () => {
      expect(getGuestCartCount()).toBe(0);
    });

    it('sums all quantities', () => {
      addToGuestCart(1, 2);
      addToGuestCart(2, 3);
      expect(getGuestCartCount()).toBe(5);
    });
  });
});

export interface GuestCartItem {
  productId: number;
  quantity: number;
}

const GUEST_CART_KEY = 'oren_cart';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getGuestCart(): GuestCartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: unknown): item is GuestCartItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as GuestCartItem).productId === 'number' &&
        typeof (item as GuestCartItem).quantity === 'number',
    );
  } catch {
    return [];
  }
}

function setGuestCart(items: GuestCartItem[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function addToGuestCart(productId: number, quantity: number): void {
  const items = getGuestCart();
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }
  setGuestCart(items);
}

export function removeFromGuestCart(productId: number): void {
  const items = getGuestCart().filter((i) => i.productId !== productId);
  setGuestCart(items);
}

export function updateGuestCartQuantity(productId: number, quantity: number): void {
  if (quantity <= 0) {
    removeFromGuestCart(productId);
    return;
  }
  const items = getGuestCart();
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity = quantity;
  } else {
    items.push({ productId, quantity });
  }
  setGuestCart(items);
}

export function clearGuestCart(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // silently ignore
  }
}

export function getGuestCartCount(): number {
  return getGuestCart().reduce((sum, item) => sum + item.quantity, 0);
}

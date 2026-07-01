import { render, screen } from '@testing-library/react';
import CartPage from './page';

// Mutable across tests (names MUST start with `mock` for jest factory hoisting).
let mockAuth = { isAuthenticated: true, authChecked: true };
const mockProduct = (id: number) => ({
  id,
  name: `Product ${id}`,
  price: 100000,
  imageUrl: '/test.jpg',
  stockQuantity: 5,
  isActive: true,
});
let mockCartState = {
  items: [] as Array<{ id: number; product: ReturnType<typeof mockProduct>; quantity: number }>,
  subtotal: 0,
  loading: false,
  error: null as string | null,
  loaded: true,
};
const mockDispatch = jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue(undefined) }));
const mockFetchCartThunk = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (sel: (s: unknown) => unknown) =>
    sel({ auth: mockAuth, cart: mockCartState }),
}));
jest.mock('@/store/cartThunk', () => ({
  fetchCartThunk: () => mockFetchCartThunk,
}));
jest.mock('@/components/cart/CartItemRow', () => ({
  __esModule: true,
  default: ({ line }: { line: { id: number } }) => <div>row-{line.id}</div>,
}));
jest.mock('@/components/cart/CartSummary', () => ({
  __esModule: true,
  default: ({ subtotal }: { subtotal: number }) => <div>summary-{subtotal}</div>,
}));
jest.mock('@/components/cart/EmptyCart', () => ({
  __esModule: true,
  default: () => <div>empty-cart</div>,
}));

describe('CartPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = { isAuthenticated: true, authChecked: true };
  });

  it('renders item rows and the summary for a populated cart', () => {
    mockCartState = {
      items: [{ id: 10, product: mockProduct(10), quantity: 2 }],
      subtotal: 378000,
      loading: false,
      error: null,
      loaded: true,
    };
    render(<CartPage />);
    expect(screen.getByText('row-10')).toBeInTheDocument();
    expect(screen.getByText('summary-378000')).toBeInTheDocument();
  });

  it('renders EmptyCart for an empty, loaded cart', () => {
    mockCartState = {
      items: [],
      subtotal: 0,
      loading: false,
      error: null,
      loaded: true,
    };
    render(<CartPage />);
    expect(screen.getByText('empty-cart')).toBeInTheDocument();
  });

  it('shows a loading state while the session is not yet hydrated', () => {
    mockAuth = { isAuthenticated: false, authChecked: false };
    render(<CartPage />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});

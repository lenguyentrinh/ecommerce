import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddToCartButton from './AddToCartButton';
import { showToast } from '@/lib/toast';

// Mutable across tests (names MUST start with `mock` for jest factory hoisting).
let mockAuthState = { isAuthenticated: true };
const mockPush = jest.fn();
const mockUnwrap = jest.fn();
const mockDispatch = jest.fn(() => ({ unwrap: mockUnwrap }));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (sel: (s: unknown) => unknown) => sel({ auth: mockAuthState }),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/products/1',
}));
jest.mock('@/lib/toast', () => ({
  showToast: { info: jest.fn(), success: jest.fn(), error: jest.fn() },
}));

describe('AddToCartButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { isAuthenticated: true };
    mockUnwrap.mockResolvedValue(undefined);
  });

  it('renders an enabled, labelled button', () => {
    render(<AddToCartButton productId={1} productName="Dress" />);
    expect(
      screen.getByRole('button', { name: /add dress to cart/i }),
    ).toBeEnabled();
  });

  it('logged-out click warns and routes to login (no dispatch)', () => {
    mockAuthState = { isAuthenticated: false };
    render(<AddToCartButton productId={1} productName="Dress" />);
    fireEvent.click(screen.getByRole('button'));
    expect(showToast.info).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login?return=%2Fproducts%2F1');
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('logged-in click dispatches and flashes "✓ Added to Cart"', async () => {
    render(<AddToCartButton productId={7} productName="Dress" />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockDispatch).toHaveBeenCalled();
    expect(await screen.findByText('✓ Added to Cart')).toBeInTheDocument();
    expect(showToast.success).toHaveBeenCalled();
  });

  it('shows an error toast and resets on failure', async () => {
    mockUnwrap.mockRejectedValue('Insufficient stock');
    render(<AddToCartButton productId={7} productName="Dress" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(showToast.error).toHaveBeenCalled());
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });
});

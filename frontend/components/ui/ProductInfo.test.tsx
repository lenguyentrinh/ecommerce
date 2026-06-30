import { render, screen } from '@testing-library/react';
import ProductInfo from './ProductInfo';
import type { Product } from '@/types/product';

// ProductInfo embeds the wired PdpAddToCart (useAddToCart → react-redux +
// next/navigation). Mock both so the panel renders without a real store/router.
jest.mock('react-redux', () => ({
  useSelector: () => false, // isAuthenticated
  useDispatch: () => jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/products/1',
}));

const base: Product = {
  id: 1,
  name: 'Silk Wrap Midi Dress',
  description: 'A fluid silk midi cut on the bias.\n\nWears day to night.',
  price: 189000,
  stockQuantity: 10,
  category: 'Dresses',
  imageKeys: ['dresses-1.svg'],
  imageUrls: ['/images/placeholders/dresses-1.svg'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

describe('ProductInfo', () => {
  it('renders the name, VND price and the description as paragraphs', () => {
    render(<ProductInfo product={base} />);
    expect(
      screen.getByRole('heading', { name: 'Silk Wrap Midi Dress' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/189[.,\s ]000/)).toBeInTheDocument();
    expect(screen.getByText(/cut on the bias/)).toBeInTheDocument();
    expect(screen.getByText(/wears day to night/i)).toBeInTheDocument();
  });

  it('renders the trust line', () => {
    render(<ProductInfo product={base} />);
    expect(screen.getByText(/free shipping/i)).toBeInTheDocument();
  });

  it('shows an enabled Add to Shopping Bag when in stock', () => {
    render(<ProductInfo product={base} />);
    expect(
      screen.getByRole('button', { name: /add to shopping bag/i }),
    ).toBeEnabled();
  });

  it('shows Out of Stock and no Add to Shopping Bag button when stock is 0', () => {
    render(<ProductInfo product={{ ...base, stockQuantity: 0 }} />);
    expect(screen.getAllByText(/out of stock/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /add to shopping bag/i }),
    ).not.toBeInTheDocument();
  });

  it('renders no variant selector when the product has no variant data', () => {
    render(<ProductInfo product={base} />);
    expect(screen.queryByTestId('variant-selector')).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import ProductCard from './ProductCard';
import type { Product } from '@/types/product';

// ProductCard now embeds the wired AddToCartButton (useAddToCart → react-redux
// + next/navigation). Mock both so the card renders without a real store/router.
jest.mock('react-redux', () => ({
  useSelector: () => false, // isAuthenticated
  useDispatch: () => jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

// Render next/image as a plain <img> so jsdom assertions are deterministic.
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, ...rest } = props as {
      fill?: boolean;
      priority?: boolean;
      sizes?: string;
      [key: string]: unknown;
    };
    void fill;
    void priority;
    void sizes;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(rest as Record<string, unknown>)} />;
  },
}));

const baseProduct: Product = {
  id: 1,
  name: 'Silk Wrap Midi Dress',
  description: 'A fluid silk midi cut on the bias.',
  price: 189000,
  stockQuantity: 10,
  category: 'Fashion',
  imageKeys: ['fashion-1.svg'],
  imageUrls: ['/images/placeholders/fashion-1.svg'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

describe('ProductCard', () => {
  it('renders the name, formatted price and an image with non-empty alt', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('Silk Wrap Midi Dress')).toBeInTheDocument();
    expect(screen.getByText(/189[.,\s ]000/)).toBeInTheDocument();
    expect(screen.getByAltText('Silk Wrap Midi Dress')).toBeInTheDocument();
  });

  it('links to the product detail page', () => {
    render(<ProductCard product={baseProduct} />);
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/products/1')).toBe(
      true,
    );
  });

  it('shows an enabled, keyboard-reachable Add to Cart when in stock', () => {
    render(<ProductCard product={baseProduct} />);
    const cta = screen.getByRole('button', { name: /add .* to cart/i });
    expect(cta).toBeEnabled();
  });

  it('shows Out of Stock and hides the CTA when stockQuantity is 0', () => {
    render(<ProductCard product={{ ...baseProduct, stockQuantity: 0 }} />);
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add .* to cart/i }),
    ).not.toBeInTheDocument();
  });
});

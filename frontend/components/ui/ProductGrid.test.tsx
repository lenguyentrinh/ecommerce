import { render, screen } from '@testing-library/react';
import ProductGrid from './ProductGrid';
import type { Product } from '@/types/product';

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

const makeProduct = (id: number): Product => ({
  id,
  name: `Product ${id}`,
  description: 'desc',
  price: 100000 + id,
  stockQuantity: 5,
  category: 'Fashion',
  imageKeys: ['fashion-1.svg'],
  imageUrls: ['/images/placeholders/fashion-1.svg'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
});

describe('ProductGrid', () => {
  it('renders the initial products', () => {
    render(
      <ProductGrid
        initialProducts={[makeProduct(1), makeProduct(2)]}
        total={2}
        queryParams={{ category: 'Fashion' }}
      />,
    );
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('renders the empty state when there are no products', () => {
    render(
      <ProductGrid
        initialProducts={[]}
        total={0}
        queryParams={{ category: 'Fashion' }}
      />,
    );
    expect(
      screen.getByText(/no products in this category yet/i),
    ).toBeInTheDocument();
  });
});

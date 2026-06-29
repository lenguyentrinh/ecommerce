import { render, screen } from '@testing-library/react';
import ProductGallery from './ProductGallery';

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

const multi = [
  '/images/placeholders/dresses-1.svg',
  '/images/placeholders/dresses-2.svg',
];

describe('ProductGallery', () => {
  it('renders the hero image with a non-empty alt', () => {
    render(<ProductGallery images={multi} productName="Silk Dress" />);
    expect(screen.getByAltText('Silk Dress')).toHaveAttribute('src', multi[0]);
  });

  it('tiles every provided image (bento layout)', () => {
    render(<ProductGallery images={multi} productName="Silk Dress" />);
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('renders a single hero when given one image', () => {
    render(<ProductGallery images={[multi[0]]} productName="Silk Dress" />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('falls back to a placeholder when given no images', () => {
    render(<ProductGallery images={[]} productName="Silk Dress" />);
    expect(screen.getByAltText('Silk Dress')).toHaveAttribute(
      'src',
      '/images/placeholders/dresses-1.svg',
    );
  });
});

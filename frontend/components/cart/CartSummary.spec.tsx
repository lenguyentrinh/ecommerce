import { render, screen } from '@testing-library/react';
import CartSummary from './CartSummary';

jest.mock('next/link', () => {
  const MockLink = ({ children, ...rest }: { children: React.ReactNode; href: string }) => (
    <a {...rest}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('CartSummary', () => {
  it('renders subtotal, shipping, tax, total labels', () => {
    render(<CartSummary subtotal={100000} />);
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Tax (10%)')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows formatted subtotal and total', () => {
    render(<CartSummary subtotal={100000} />);
    expect(screen.getByText('100.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('140.000 ₫')).toBeInTheDocument();
  });

  it('disables checkout with OOS tooltip when hasOutOfStock is true', () => {
    render(<CartSummary subtotal={100000} hasOutOfStock />);
    const btn = screen.getByRole('button', { name: /proceed to checkout/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Remove out-of-stock items before checking out.');
  });

  it('disables checkout with coming-soon tooltip when hasOutOfStock is false', () => {
    render(<CartSummary subtotal={100000} hasOutOfStock={false} />);
    const btn = screen.getByRole('button', { name: /proceed to checkout/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Checkout coming soon');
  });

  it('renders Continue Shopping link', () => {
    render(<CartSummary subtotal={100000} />);
    expect(screen.getByText(/continue shopping/i)).toBeInTheDocument();
  });
});

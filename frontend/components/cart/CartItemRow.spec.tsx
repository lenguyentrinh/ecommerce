import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CartItemRow from './CartItemRow';
import type { CartLine } from '@/types/cart';

const baseLine: CartLine = {
  id: 1,
  product: {
    id: 10,
    name: 'Test Product',
    price: 50000,
    imageUrl: '/test.jpg',
    stockQuantity: 10,
    isActive: true,
  },
  quantity: 2,
};

describe('CartItemRow', () => {
  it('renders product name, price, and quantity', () => {
    render(
      <CartItemRow
        line={baseLine}
        onUpdateQuantity={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('50.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows +/- controls when in stock', () => {
    render(
      <CartItemRow
        line={baseLine}
        onUpdateQuantity={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /decrease quantity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /increase quantity/i }),
    ).toBeInTheDocument();
  });

  it('shows Out of stock badge and hides +/- when stock is 0', () => {
    const oosLine: CartLine = {
      ...baseLine,
      product: { ...baseLine.product, stockQuantity: 0 },
    };
    render(
      <CartItemRow
        line={oosLine}
        onUpdateQuantity={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /decrease quantity/i }),
    ).not.toBeInTheDocument();
  });

  it('shows low stock note when stock < quantity', () => {
    const lowLine: CartLine = {
      ...baseLine,
      quantity: 8,
      product: { ...baseLine.product, stockQuantity: 5 },
    };
    render(
      <CartItemRow
        line={lowLine}
        onUpdateQuantity={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(screen.getByText('Only 5 left in stock')).toBeInTheDocument();
  });

  it('displays the capped quantity instead of cart quantity when low stock', () => {
    const lowLine: CartLine = {
      ...baseLine,
      quantity: 8,
      product: { ...baseLine.product, stockQuantity: 5 },
    };
    render(
      <CartItemRow
        line={lowLine}
        onUpdateQuantity={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const onRemove = jest.fn().mockResolvedValue(undefined);
    render(
      <CartItemRow
        line={baseLine}
        onUpdateQuantity={jest.fn()}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /remove test product/i }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith(1));
  });

  it('calls onUpdateQuantity on decrement', async () => {
    const onUpdateQuantity = jest.fn().mockResolvedValue(undefined);
    render(
      <CartItemRow
        line={{ ...baseLine, quantity: 3 }}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /decrease quantity/i }));
    await waitFor(() => expect(onUpdateQuantity).toHaveBeenCalledWith(1, 2));
  });

  it('calls onUpdateQuantity on increment', async () => {
    const onUpdateQuantity = jest.fn().mockResolvedValue(undefined);
    render(
      <CartItemRow
        line={{ ...baseLine, quantity: 3 }}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }));
    await waitFor(() => expect(onUpdateQuantity).toHaveBeenCalledWith(1, 4));
  });

  it('disables decrement at min quantity', () => {
    render(
      <CartItemRow
        line={{ ...baseLine, quantity: 1 }}
        onUpdateQuantity={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /decrease quantity/i }),
    ).toBeDisabled();
  });

  it('disables increment at max quantity', () => {
    render(
      <CartItemRow
        line={{
          ...baseLine,
          quantity: 10,
          product: { ...baseLine.product, stockQuantity: 10 },
        }}
        onUpdateQuantity={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /increase quantity/i }),
    ).toBeDisabled();
  });
});

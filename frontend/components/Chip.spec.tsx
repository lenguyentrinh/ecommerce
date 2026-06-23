import { render, screen, fireEvent } from '@testing-library/react';
import Chip from './Chip';

describe('Chip', () => {
  it('renders label text', () => {
    render(<Chip label="Dresses" />);
    expect(screen.getByText('Dresses')).toBeInTheDocument();
  });

  it('applies unselected styles by default', () => {
    render(<Chip label="Tops" />);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-warm-beige/);
    expect(btn.className).not.toMatch(/bg-blush/);
  });

  it('applies selected styles when selected=true', () => {
    render(<Chip label="Skirts" selected />);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-blush/);
    expect(btn.className).toMatch(/border-clay/);
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Chip label="Jackets" onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with additional className', () => {
    render(<Chip label="Shoes" className="mt-2" />);
    expect(screen.getByRole('button').className).toMatch(/mt-2/);
  });
});

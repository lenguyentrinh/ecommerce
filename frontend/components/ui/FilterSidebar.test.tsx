import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterSidebar from './FilterSidebar';
import type { CurrentFilters } from '@/features/product/productFilters';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/search',
}));

const emptyCurrent: CurrentFilters = { inStock: false };

describe('FilterSidebar', () => {
  beforeEach(() => push.mockClear());

  it('renders every Refine section', () => {
    render(
      <FilterSidebar
        categories={['Dresses']}
        current={emptyCurrent}
        showCategory
      />,
    );
    expect(screen.getByRole('heading', { name: /refine/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /sort/i })).toBeInTheDocument();
    expect(screen.getByText(/price range/i)).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /in stock/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /dresses/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /update results/i }),
    ).toBeInTheDocument();
  });

  it('stages changes locally and only writes the URL on Update Results', async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar
        categories={['Dresses']}
        current={emptyCurrent}
        showCategory
      />,
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: /sort/i }),
      'price_asc',
    );
    await user.click(screen.getByRole('checkbox', { name: /in stock/i }));
    await user.click(screen.getByRole('checkbox', { name: /dresses/i }));

    expect(push).not.toHaveBeenCalled(); // batched — nothing applied yet

    await user.click(screen.getByRole('button', { name: /update results/i }));
    expect(push).toHaveBeenCalledWith(
      '/search?category=Dresses&inStock=true&sort=price_asc',
    );
  });

  it('preserves the search term q when applying', async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar categories={[]} current={{ q: 'linen', inStock: false }} />,
    );
    await user.click(screen.getByRole('checkbox', { name: /in stock/i }));
    await user.click(screen.getByRole('button', { name: /update results/i }));
    expect(push).toHaveBeenCalledWith('/search?q=linen&inStock=true');
  });

  it('applies a staged price range into the URL', async () => {
    const user = userEvent.setup();
    render(<FilterSidebar categories={[]} current={emptyCurrent} />);
    fireEvent.change(screen.getByLabelText(/minimum price/i), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText(/maximum price/i), {
      target: { value: '300' },
    });
    await user.click(screen.getByRole('button', { name: /update results/i }));
    expect(push).toHaveBeenCalledWith('/search?minPrice=100&maxPrice=300');
  });

  it('clear all keeps q and drops every filter', async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar
        categories={[]}
        current={{ q: 'linen', inStock: true, sort: 'newest' }}
      />,
    );
    await user.click(screen.getByRole('button', { name: /clear all/i }));
    expect(push).toHaveBeenCalledWith('/search?q=linen');
  });

  it('hides the Categories section when showCategory is false', () => {
    render(<FilterSidebar categories={['Dresses']} current={emptyCurrent} />);
    expect(
      screen.queryByRole('checkbox', { name: /dresses/i }),
    ).not.toBeInTheDocument();
  });
});

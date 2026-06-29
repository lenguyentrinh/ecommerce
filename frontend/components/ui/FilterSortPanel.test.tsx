import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterSortPanel from './FilterSortPanel';
import type { CurrentFilters } from '@/features/product/productFilters';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/search',
}));

const emptyCurrent: CurrentFilters = { inStock: false };

describe('FilterSortPanel', () => {
  beforeEach(() => push.mockClear());

  it('pushes a sort change to the URL', async () => {
    const user = userEvent.setup();
    render(
      <FilterSortPanel
        categories={['Dresses']}
        current={emptyCurrent}
        showCategory
      />,
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: /sort/i }),
      'price_asc',
    );
    expect(push).toHaveBeenCalledWith('/search?sort=price_asc');
  });

  it('toggles In Stock into the URL', async () => {
    const user = userEvent.setup();
    render(<FilterSortPanel categories={[]} current={emptyCurrent} />);
    await user.click(screen.getByRole('button', { name: /in stock/i }));
    expect(push).toHaveBeenCalledWith('/search?inStock=true');
  });

  it('removes only the dismissed filter and preserves q', async () => {
    const user = userEvent.setup();
    const current: CurrentFilters = { q: 'linen', inStock: true };
    render(<FilterSortPanel categories={[]} current={current} />);
    await user.click(
      screen.getByRole('button', { name: /remove in stock filter/i }),
    );
    expect(push).toHaveBeenCalledWith('/search?q=linen');
  });

  it('clear all keeps q and drops every filter', async () => {
    const user = userEvent.setup();
    const current: CurrentFilters = {
      q: 'linen',
      inStock: true,
      sort: 'newest',
    };
    render(<FilterSortPanel categories={[]} current={current} />);
    await user.click(screen.getByRole('button', { name: /clear all/i }));
    expect(push).toHaveBeenCalledWith('/search?q=linen');
  });
});

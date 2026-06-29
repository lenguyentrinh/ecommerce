import { parseProductFilters } from './productFilters';

describe('parseProductFilters', () => {
  it('returns empty defaults when there are no params', () => {
    const { current, query } = parseProductFilters({});
    expect(current.inStock).toBe(false);
    expect(current.q).toBeUndefined();
    expect(query.search).toBeUndefined();
    expect(query.sort).toBeUndefined();
  });

  it('parses search, category, prices, inStock and sort', () => {
    const { current, query } = parseProductFilters({
      q: 'linen',
      category: 'Dresses',
      minPrice: '100',
      maxPrice: '500',
      inStock: 'true',
      sort: 'price_asc',
    });
    expect(current).toEqual({
      q: 'linen',
      category: 'Dresses',
      minPrice: '100',
      maxPrice: '500',
      inStock: true,
      sort: 'price_asc',
    });
    expect(query).toEqual({
      search: 'linen',
      category: 'Dresses',
      minPrice: 100,
      maxPrice: 500,
      inStock: true,
      sort: 'price_asc',
    });
  });

  it('drops an inverted max price (min > max) to avoid a backend 400', () => {
    const { current, query } = parseProductFilters({
      minPrice: '500',
      maxPrice: '100',
    });
    expect(current.minPrice).toBe('500');
    expect(current.maxPrice).toBeUndefined();
    expect(query.maxPrice).toBeUndefined();
  });

  it('ignores an invalid sort value', () => {
    expect(parseProductFilters({ sort: 'bogus' }).query.sort).toBeUndefined();
  });

  it('ignores negative and non-numeric prices', () => {
    const { query } = parseProductFilters({ minPrice: '-5', maxPrice: 'abc' });
    expect(query.minPrice).toBeUndefined();
    expect(query.maxPrice).toBeUndefined();
  });

  it('treats only inStock=true as true', () => {
    expect(parseProductFilters({ inStock: 'false' }).current.inStock).toBe(
      false,
    );
    expect(parseProductFilters({ inStock: 'true' }).current.inStock).toBe(true);
  });
});

import {
  buildProductQueryString,
  getProducts,
  getCategories,
  getProduct,
} from './productApi';

describe('buildProductQueryString', () => {
  it('returns an empty string when there are no params', () => {
    expect(buildProductQueryString({})).toBe('');
  });

  it('omits undefined and empty values', () => {
    expect(
      buildProductQueryString({ category: '', search: undefined, page: 1 }),
    ).toBe('?page=1');
  });

  it('serializes multiple params', () => {
    const qs = buildProductQueryString({
      category: 'Fashion',
      sort: 'price_asc',
      inStock: true,
    });
    expect(qs).toContain('category=Fashion');
    expect(qs).toContain('sort=price_asc');
    expect(qs).toContain('inStock=true');
  });
});

describe('getProducts', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fetches the list endpoint and returns parsed JSON', async () => {
    const payload = { data: [], total: 0, page: 1, limit: 12 };
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => payload }) as unknown as typeof fetch;

    const res = await getProducts({ category: 'Fashion' });

    expect(res).toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products?category=Fashion'),
      expect.any(Object),
    );
  });

  it('throws on a non-OK response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    await expect(getProducts()).rejects.toThrow();
  });
});

describe('getCategories', () => {
  afterEach(() => jest.restoreAllMocks());

  it('unwraps the data array', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: ['Fashion', 'Electronics'] }),
    }) as unknown as typeof fetch;

    await expect(getCategories()).resolves.toEqual(['Fashion', 'Electronics']);
  });
});

describe('getProduct', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the unwrapped product data on a 200', async () => {
    const product = { id: 1, name: 'Silk Wrap Midi Dress' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: product }),
    }) as unknown as typeof fetch;

    await expect(getProduct(1)).resolves.toEqual(product);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products/1'),
      expect.any(Object),
    );
  });

  it('returns null on a 404 (so the caller can render notFound)', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;

    await expect(getProduct(999)).resolves.toBeNull();
  });

  it('throws on a non-404 error (so the error boundary catches it)', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    await expect(getProduct(1)).rejects.toThrow();
  });
});

import { formatPrice } from './helpers';

describe('formatPrice', () => {
  it('formats a value as VND with no decimals', () => {
    const result = formatPrice(189000);
    expect(result).toMatch(/189[.,\s ]000/);
    expect(result).toContain('₫');
  });

  it('groups thousands', () => {
    const result = formatPrice(1250000);
    expect(result).toMatch(/1[.,\s ]250[.,\s ]000/);
  });

  it('drops fractional minor units', () => {
    expect(formatPrice(1000.6)).not.toMatch(/[.,]\d{2}\s*₫/);
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toMatch(/0\s*₫|₫\s*0/);
  });
});

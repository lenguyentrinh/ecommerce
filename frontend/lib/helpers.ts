// Format a numeric price as Vietnamese đồng (VND), e.g. 189000 -> "189.000 ₫".
// VND has no minor units, so the value is rounded to a whole đồng (e.g. 189.5 -> "190 ₫").
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

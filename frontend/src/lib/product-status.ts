export function getProductStatus(stock: number | string | undefined | null): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  const numericStock = Number(stock ?? 0);
  if (numericStock <= 0) return 'Out of Stock';
  if (numericStock < 10) return 'Low Stock';
  return 'In Stock';
}

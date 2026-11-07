/**
 * Client-side K-Means Price Clustering Logic
 * Groups digital watches into Low, Mid, and High price tiers.
 */

export type ClusteredProduct<T = any> = T & {
  priceTier: 'Low' | 'Mid' | 'High';
  priceTierBg: string;
  priceTierFg: string;
  priceTierBorder: string;
};

export const PRICE_TIER_COLORS = {
  Low: {
    bg: '#ECFDF5',
    fg: '#047857',
    border: '#A7F3D0',
    label: '🟢 Low Tier (ประหยัด)',
    shortLabel: 'Low Tier',
  },
  Mid: {
    bg: '#FFFBEB',
    fg: '#B45309',
    border: '#FDE68A',
    label: '🟡 Mid Tier (มาตรฐาน)',
    shortLabel: 'Mid Tier',
  },
  High: {
    bg: '#FFF1F2',
    fg: '#BE123C',
    border: '#FECDD3',
    label: '🔴 High Tier (พรีเมียม)',
    shortLabel: 'High Tier',
  },
};

export function clusterPricesLocally<T extends { price: number | string }>(data: T[]): ClusteredProduct<T>[] {
  if (!data || data.length === 0) return [];
  if (data.length === 1) {
    return [
      {
        ...data[0],
        priceTier: 'Mid',
        priceTierBg: PRICE_TIER_COLORS.Mid.bg,
        priceTierFg: PRICE_TIER_COLORS.Mid.fg,
        priceTierBorder: PRICE_TIER_COLORS.Mid.border,
      },
    ];
  }

  const prices = data.map((item) => parseFloat(String(item.price)) || 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return data.map((item) => ({
      ...item,
      priceTier: 'Mid',
      priceTierBg: PRICE_TIER_COLORS.Mid.bg,
      priceTierFg: PRICE_TIER_COLORS.Mid.fg,
      priceTierBorder: PRICE_TIER_COLORS.Mid.border,
    }));
  }

  let centroids = [minPrice, (minPrice + maxPrice) / 2, maxPrice];
  let assignments: number[] = [];
  let changed = true;
  let iterations = 0;
  const maxIterations = 50;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    assignments = prices.map((price) => {
      const diffs = centroids.map((c) => Math.abs(price - c));
      return diffs.indexOf(Math.min(...diffs));
    });

    const newCentroids = [0, 1, 2].map((i) => {
      const clusterPrices = prices.filter((_, index) => assignments[index] === i);
      return clusterPrices.length
        ? clusterPrices.reduce((a, b) => a + b, 0) / clusterPrices.length
        : centroids[i];
    });

    if (JSON.stringify(centroids) !== JSON.stringify(newCentroids)) {
      centroids = newCentroids;
      changed = true;
    }
  }

  const sortedCentroids = [...centroids].sort((a, b) => a - b);
  const labels: ('Low' | 'Mid' | 'High')[] = ['Low', 'Mid', 'High'];

  return data.map((item, index) => {
    const myCentroid = centroids[assignments[index]];
    const tierIndex = sortedCentroids.indexOf(myCentroid);
    const validTierIndex = tierIndex >= 0 && tierIndex < 3 ? tierIndex : 0;
    const priceTier = labels[validTierIndex];
    const conf = PRICE_TIER_COLORS[priceTier];
    return {
      ...item,
      priceTier,
      priceTierBg: conf.bg,
      priceTierFg: conf.fg,
      priceTierBorder: conf.border,
    };
  });
}

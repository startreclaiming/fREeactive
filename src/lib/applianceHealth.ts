// Heuristic Health Index Score: age vs. typical lifespan by category.
// Illustrative, not a manufacturer-verified figure.
const TYPICAL_LIFESPAN_YEARS: Record<string, number> = {
  Appliance: 12,
  Electronics: 7,
  HVAC: 15,
  Plumbing: 20,
  Furniture: 15,
  Other: 10,
};

export function typicalLifespanFor(category: string): number {
  return TYPICAL_LIFESPAN_YEARS[category] ?? TYPICAL_LIFESPAN_YEARS.Other;
}

/** 100 = brand new, 0 = at/past typical end-of-life. Null if there's no purchase date to work from. */
export function healthIndexScore(category: string, purchaseDate: string): number | null {
  if (!purchaseDate) return null;
  const purchased = new Date(purchaseDate).getTime();
  if (Number.isNaN(purchased)) return null;
  const years = (Date.now() - purchased) / (1000 * 60 * 60 * 24 * 365.25);
  const typical = typicalLifespanFor(category);
  const ratio = Math.max(0, 1 - years / typical);
  return Math.round(ratio * 100);
}

export function healthTone(score: number | null): 'green' | 'gold' | 'gray' {
  if (score === null) return 'gray';
  return score >= 50 ? 'green' : 'gold';
}

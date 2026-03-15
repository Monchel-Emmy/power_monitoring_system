/**
 * Rwanda electricity tariffs (RURA, as of Oct 2025).
 * All amounts in Rwandan Francs (Frw).
 * Residential: tiered per kWh. Non-residential available for reference.
 */

// Residential (per kWh): 0–20 @ 89, 21–50 @ 310, above 50 @ 369 Frw
const RESIDENTIAL_TIERS = [
  { upTo: 20, rateFrw: 89 },
  { upTo: 50, rateFrw: 310 },
  { upTo: Infinity, rateFrw: 369 },
];

/**
 * Compute cost in Frw for a given consumption (kWh) using residential tiered pricing.
 * Tiers apply to the block: first 20 kWh @ 89, next 30 (21–50) @ 310, remainder @ 369.
 * @param {number} kwh - Consumption in kWh (>= 0)
 * @returns {number} Cost in Rwandan Francs (rounded to integer)
 */
function costFrwResidential(kwh) {
  if (kwh == null || Number.isNaN(kwh) || kwh < 0) return 0;
  let remaining = kwh;
  let cost = 0;
  let prevUpTo = 0;
  for (const tier of RESIDENTIAL_TIERS) {
    const block = Math.min(remaining, tier.upTo - prevUpTo);
    if (block <= 0) break;
    cost += block * tier.rateFrw;
    remaining -= block;
    prevUpTo = tier.upTo;
    if (remaining <= 0) break;
  }
  return Math.round(cost);
}

/**
 * Non-residential (per kWh): 0–100 @ 355, above 100 @ 376 Frw.
 * Use when needed for commercial/small business contexts.
 */
function costFrwNonResidential(kwh) {
  if (kwh == null || Number.isNaN(kwh) || kwh < 0) return 0;
  const low = Math.min(kwh, 100);
  const high = Math.max(0, kwh - 100);
  return Math.round(low * 355 + high * 376);
}

module.exports = {
  costFrwResidential,
  costFrwNonResidential,
  CURRENCY_LABEL: 'Frw',
  CURRENCY_NAME: 'Rwandan Francs',
};

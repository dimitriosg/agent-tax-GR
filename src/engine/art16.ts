import type { TaxConfig } from '../config/types.js';

/**
 * Art.16 N.4172/2013 — Tax reduction for employment & pension income.
 *
 * Base reduction: €777 (0 deps) to €1,780 (5+ deps)
 * Phaseout: reduction decreases by €0.04 per €1 of income above €12,000
 * Formula: max(0, baseReduction − (income − 12000) × 0.04)
 *
 * Only applies to employment and pension income.
 */

export interface Art16Result {
  baseReduction: number;
  phaseoutAmount: number;
  finalReduction: number;
}

/**
 * Calculate the Art.16 tax reduction.
 *
 * @param employmentAndPensionIncome - Combined employment + pension income
 * @param dependents - Number of dependent children
 * @param config - Tax configuration for the fiscal year
 */
export function calculateArt16Reduction(
  employmentAndPensionIncome: number,
  dependents: number,
  config: TaxConfig,
): Art16Result {
  if (employmentAndPensionIncome <= 0) {
    return { baseReduction: 0, phaseoutAmount: 0, finalReduction: 0 };
  }

  // Find the base reduction for this number of dependents
  const tier = findReductionTier(dependents, config);
  const baseReduction = tier.baseReduction;

  // Calculate phaseout
  const excessIncome = Math.max(0, employmentAndPensionIncome - config.art16PhaseoutStart);
  const phaseoutAmount = round2(excessIncome * config.art16PhaseoutRate);

  // Final reduction cannot go below 0
  const finalReduction = Math.max(0, round2(baseReduction - phaseoutAmount));

  return {
    baseReduction,
    phaseoutAmount,
    finalReduction,
  };
}

function findReductionTier(dependents: number, config: TaxConfig) {
  // Clamp to max tier (5+ dependents)
  const clamped = Math.min(dependents, config.art16Reductions.length - 1);
  return config.art16Reductions[clamped];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

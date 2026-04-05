import type { TaxBracket } from '../config/types.js';
import type { BracketResult, IncomeDeclaration, TaxBreakdown } from './types.js';
import type { TaxConfig } from '../config/types.js';

/**
 * Bracket tax engine — calculates progressive tax for any bracket scale.
 * Implements Art.15 N.4172/2013 for employment/pensions and
 * the separate real estate scale.
 *
 * All functions are pure — no side effects, no mutation.
 */

/**
 * Calculate progressive tax through a bracket scale.
 * Returns the total tax and a breakdown per bracket.
 */
export function calculateBracketTax(
  income: number,
  brackets: readonly TaxBracket[],
): { total: number; breakdown: BracketResult[] } {
  if (income <= 0) {
    return { total: 0, breakdown: [] };
  }

  let remaining = income;
  let total = 0;
  const breakdown: BracketResult[] = [];

  for (const bracket of brackets) {
    if (remaining <= 0) break;

    const bracketWidth = bracket.to === Infinity
      ? remaining
      : bracket.to - bracket.from;

    const taxableInBracket = Math.min(remaining, bracketWidth);
    const taxInBracket = round2(taxableInBracket * bracket.rate);

    breakdown.push({
      bracket: { from: bracket.from, to: bracket.to, rate: bracket.rate },
      taxableInBracket,
      taxInBracket,
    });

    total += taxInBracket;
    remaining -= taxableInBracket;
  }

  return { total: round2(total), breakdown };
}

/**
 * Calculate flat-rate tax (for capital income: dividends, interest, royalties, capital gains).
 */
export function calculateFlatTax(income: number, rate: number): number {
  if (income <= 0) return 0;
  return round2(income * rate);
}

/**
 * Calculate tax for all income types (R14–R22 of ΕΚΚΑΘΑΡΙΣΗ).
 * Returns individual tax amounts per income type and total (R23).
 */
export function calculateAllIncomeTax(
  income: IncomeDeclaration,
  config: TaxConfig,
): { byType: TaxBreakdown; total: number } {
  // Employment + pensions use the same bracket scale
  const employmentTax = calculateBracketTax(
    income.employment + income.pension,
    config.employmentBrackets,
  ).total;

  // Merchant navy uses employment brackets
  const merchantNavyTax = calculateBracketTax(
    income.merchantNavy,
    config.employmentBrackets,
  ).total;

  // Agricultural business uses employment brackets
  const agriculturalTax = calculateBracketTax(
    income.agricultural,
    config.employmentBrackets,
  ).total;

  // Business income uses employment brackets
  const businessTax = calculateBracketTax(
    income.business,
    config.employmentBrackets,
  ).total;

  // Imputed property (par.4 art.21) uses employment brackets
  const imputedPropertyTax = calculateBracketTax(
    income.imputedProperty,
    config.employmentBrackets,
  ).total;

  // Real estate uses its own separate scale
  const realEstateTax = calculateBracketTax(
    income.realEstate,
    config.realEstateBrackets,
  ).total;

  // Capital income — flat rates, separately taxed
  const capitalTax =
    calculateFlatTax(income.dividends, config.dividendRate) +
    calculateFlatTax(income.interest, config.interestRate) +
    calculateFlatTax(income.royalties, config.royaltyRate);

  const capitalGainsTax = calculateFlatTax(
    income.capitalGains,
    config.capitalGainsRate,
  );

  // Foreign compensation uses employment brackets
  const foreignTax = calculateBracketTax(
    income.foreign,
    config.employmentBrackets,
  ).total;

  const byType: TaxBreakdown = {
    employment: employmentTax,
    pension: 0,  // Combined with employment above
    merchantNavy: merchantNavyTax,
    agricultural: agriculturalTax,
    business: businessTax,
    imputedProperty: imputedPropertyTax,
    realEstate: realEstateTax,
    capital: capitalTax,
    capitalGains: capitalGainsTax,
    foreign: foreignTax,
  };

  const total = round2(
    employmentTax + merchantNavyTax + agriculturalTax +
    businessTax + imputedPropertyTax + realEstateTax +
    capitalTax + capitalGainsTax + foreignTax,
  );

  return { byType, total };
}

/**
 * Sum all declared income from all sources.
 */
export function sumDeclaredIncome(income: IncomeDeclaration): number {
  return (
    income.employment +
    income.pension +
    income.merchantNavy +
    income.agricultural +
    income.business +
    income.imputedProperty +
    income.realEstate +
    income.dividends +
    income.interest +
    income.royalties +
    income.capitalGains +
    income.foreign
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

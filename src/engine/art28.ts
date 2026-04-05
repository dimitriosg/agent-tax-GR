import type { TaxConfig } from '../config/types.js';
import type { SelfEmployedInputs } from './types.js';

/**
 * Art.28A–28D N.4172/2013 — Self-Employed Minimum Income Engine
 *
 * Determines the minimum net income a self-employed person must declare.
 * If declared < minimum, the difference is presumed income and taxed.
 *
 * Flow: Exemption gate → α+β+γ formula → Reductions → Proration → Special cases
 */

export interface Art28Result {
  isExempt: boolean;
  exemptReason?: string;
  alpha: number;              // α component
  beta: number;               // β component
  gamma: number;              // γ component
  rawMinimum: number;         // min(α+β+γ, 50000)
  reductions: {
    yearReduction: number;    // Art.28Γ par.1 (4th/5th year)
    disabilityReduction: number; // i) Art.28Γ par.2-3 — 50% for disabled children
    categoryReduction: number;   // FY2025: new 30% reduction category
    incomeAbsorption: number; // ii) Art.28Β (salary + agricultural)
    smallMunicipality: number;// Art.6 N.5162/2024 (FY2025+)
  };
  activeDays: number;         // Computed active days (inclusive count)
  proratedMinimum: number;    // After operating days proration
  art5GReduction: number;     // Art.5Γ flat-tax halving
  finalMinimum: number;       // The binding minimum income
}

/**
 * Calculate the Art.28A minimum income for a self-employed taxpayer.
 */
export function calculateArt28Minimum(
  inputs: SelfEmployedInputs,
  config: TaxConfig,
): Art28Result {
  // Layer 1 — Exemption gate
  if (inputs.isExempt) {
    return createExemptResult(inputs.exemptReason);
  }

  // Layer 2+3 — The α+β+γ formula
  const alpha = calculateAlpha(inputs, config);
  const beta = calculateBeta(inputs, config);
  const gamma = calculateGamma(inputs, config);

  const rawMinimum = Math.min(alpha + beta + gamma, config.art28.hardCap);

  // Layer 4 — Reductions applied in sequence (FY2025 labels: i, ii, iii)
  // Art.28Γ par.1: 4th/5th year reduction (computed from post-cap amount)
  const yearReduction = calculateYearReduction(rawMinimum, inputs.yearOfOperation);
  const afterYearReduction = rawMinimum - yearReduction;

  // i) Art.28Γ par.2-3: 50% reduction for disabled children
  const disabilityReduction = inputs.hasDisabledChildren
    ? round2(afterYearReduction * 0.5)
    : 0;
  const afterDisability = afterYearReduction - disabilityReduction;

  // FY2025 NEW: 30% reduction for qualifying categories (Row 39)
  // This is separate from the 50% disability reduction.
  // Per Excel: IF(J37=ΝΑΙ, AC23/2, IF(J39=ΝΑΙ, AC23*0.3, 0))
  // The 30% only applies if the 50% disability reduction was NOT applied.
  const categoryReduction = (!inputs.hasDisabledChildren && inputs.qualifiesFor30Reduction)
    ? round2(afterYearReduction * 0.3)
    : 0;
  const afterCategoryReduction = afterDisability - categoryReduction;

  // ii) Art.28Β: subtract salary + agricultural income (they absorb the minimum)
  const incomeAbsorption = Math.min(
    inputs.salaryIncome + inputs.agriculturalIncome,
    afterCategoryReduction,
  );
  const afterAbsorption = afterCategoryReduction - incomeAbsorption;

  // FY2025+: 50% reduction for small municipalities (Art.6 N.5162/2024)
  const smallMunicipality = inputs.isSmallMunicipality
    ? round2(afterAbsorption * 0.5)
    : 0;
  const afterSmallMunicipality = afterAbsorption - smallMunicipality;

  // iii) Proration by operating days — inclusive count with zero-start guard
  const activeDays = calculateActiveDays(inputs);
  const proratedMinimum = round2(afterSmallMunicipality * (Math.max(0, activeDays) / 365));

  // Layer 5 — Art.5Γ flat-tax regime: halve the minimum
  const art5GReduction = inputs.art5GFlatTax
    ? round2(proratedMinimum * 0.5)
    : 0;
  const finalMinimum = round2(proratedMinimum - art5GReduction);

  return {
    isExempt: false,
    alpha: round2(alpha),
    beta: round2(beta),
    gamma: round2(gamma),
    rawMinimum: round2(rawMinimum),
    reductions: {
      yearReduction: round2(yearReduction),
      disabilityReduction: round2(disabilityReduction),
      categoryReduction: round2(categoryReduction),
      incomeAbsorption: round2(incomeAbsorption),
      smallMunicipality: round2(smallMunicipality),
    },
    activeDays,
    proratedMinimum: round2(proratedMinimum),
    art5GReduction: round2(art5GReduction),
    finalMinimum: Math.max(0, finalMinimum),
  };
}

// ─── α component ──────────────────────────────────────────────────────────

function calculateAlpha(inputs: SelfEmployedInputs, config: TaxConfig): number {
  const annualBase = config.minimumWage * 14;
  const multiplier = getTriennialMultiplier(inputs.yearsOfOperation, config);
  const employeeComponent = Math.min(
    inputs.highestEmployeeGross,
    config.art28.maxEmployeeGrossForAlpha,
  );
  return annualBase * multiplier + employeeComponent;
}

// ─── β component ──────────────────────────────────────────────────────────

function calculateBeta(inputs: SelfEmployedInputs, config: TaxConfig): number {
  return Math.min(
    inputs.annualPayrollCost * config.art28.betaPayrollPercent,
    config.art28.maxBetaAmount,
  );
}

// ─── γ component ──────────────────────────────────────────────────────────

function calculateGamma(inputs: SelfEmployedInputs, config: TaxConfig): number {
  if (inputs.annualTurnover <= config.art28.gammaTurnoverThreshold) {
    return 0;
  }

  const kadAverage = lookupKadAverage(inputs.kadCode, config);
  if (kadAverage === 0) return 0;

  const excess = inputs.annualTurnover - kadAverage;
  if (excess <= 0) return 0;

  return excess * config.art28.gammaPercent;
}

// ─── Layer 4 — Year reduction (Art.28Γ par.1) ─────────────────────────────

function calculateYearReduction(rawMinimum: number, yearOfOperation: number): number {
  if (yearOfOperation === 4) return round2(rawMinimum * (2 / 3));
  if (yearOfOperation === 5) return round2(rawMinimum * (1 / 3));
  return 0;
}

// ─── Operating days (FY2025: inclusive count + zero guard) ────────────────

/**
 * Calculate active operating days.
 * FY2025 fix: uses inclusive day count (end - start + 1) with guard for zero start.
 * Formula: IF(start=0, 0, IF(end-start+1<0, 0, end-start+1))
 */
export function calculateActiveDays(inputs: SelfEmployedInputs): number {
  let totalSuspensionDays = 0;
  for (const period of inputs.suspensionPeriods) {
    totalSuspensionDays += inclusiveDayCount(period.startDay, period.endDay);
  }

  let totalRestrictedDays = 0;
  for (const period of inputs.restrictedOperationPeriods) {
    totalRestrictedDays += inclusiveDayCount(period.startDay, period.endDay);
  }

  return Math.max(0, inputs.operatingDays - totalSuspensionDays - totalRestrictedDays);
}

function inclusiveDayCount(startDay: number, endDay: number): number {
  if (startDay === 0) return 0;
  const count = endDay - startDay + 1;
  return count < 0 ? 0 : count;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getTriennialMultiplier(years: number, config: TaxConfig): number {
  for (const tier of config.art28.triennialMultipliers) {
    if (years <= tier.maxYears) {
      return tier.multiplier;
    }
  }
  // Last tier
  return config.art28.triennialMultipliers[config.art28.triennialMultipliers.length - 1].multiplier;
}

function lookupKadAverage(kadCode: string, config: TaxConfig): number {
  const entry = config.art28.kadAverages.find(k => k.code === kadCode);
  return entry?.averageTurnover ?? 0;
}

function createExemptResult(reason?: string): Art28Result {
  return {
    isExempt: true,
    exemptReason: reason,
    alpha: 0,
    beta: 0,
    gamma: 0,
    rawMinimum: 0,
    reductions: {
      yearReduction: 0,
      disabilityReduction: 0,
      categoryReduction: 0,
      incomeAbsorption: 0,
      smallMunicipality: 0,
    },
    activeDays: 0,
    proratedMinimum: 0,
    art5GReduction: 0,
    finalMinimum: 0,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

import { describe, it, expect } from 'vitest';
import { calculateArt28Minimum, calculateActiveDays } from './art28.js';
import { FY2024 } from '../config/fy2024.js';
import { FY2025 } from '../config/fy2025.js';
import type { SelfEmployedInputs } from './types.js';

// ─── Helper: default self-employed inputs ─────────────────────────────────

function defaultInputs(): SelfEmployedInputs {
  return {
    isExempt: false,
    yearsOfOperation: 5,
    highestEmployeeGross: 0,
    annualPayrollCost: 0,
    annualTurnover: 0,
    kadCode: '47',
    operatingDays: 365,
    suspensionPeriods: [],
    restrictedOperationPeriods: [],
    yearOfOperation: 5,
    hasDisabledChildren: false,
    qualifiesFor30Reduction: false,
    art5GFlatTax: false,
    salaryIncome: 0,
    agriculturalIncome: 0,
    isSmallMunicipality: false,
    isSchoolCafeteriaOperator: false,
  };
}

// ─── Exemption Gate ───────────────────────────────────────────────────────

describe('Art.28A — exemptions', () => {
  it('returns 0 for exempt taxpayer (farmer)', () => {
    const inputs: SelfEmployedInputs = {
      ...defaultInputs(),
      isExempt: true,
      exemptReason: 'farmer',
    };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.isExempt).toBe(true);
    expect(result.finalMinimum).toBe(0);
  });

  it('returns 0 for first 3 years of operation', () => {
    const inputs: SelfEmployedInputs = {
      ...defaultInputs(),
      isExempt: true,
      exemptReason: 'firstThreeYears',
    };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.finalMinimum).toBe(0);
  });
});

// ─── α Component (Base + Triennial) ───────��──────────────────────────────

describe('Art.28A — α component', () => {
  it('calculates base for 1–3 years (multiplier 1.0)', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 2 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.alpha).toBe(11_620);
  });

  it('calculates base for 4–6 years (multiplier 1.1)', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 5 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.alpha).toBe(12_782);
  });

  it('calculates base for 7–9 years (multiplier 1.2)', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 8 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.alpha).toBe(13_944);
  });

  it('calculates base for 10–13 years (multiplier 1.3)', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 12 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.alpha).toBe(15_106);
  });

  it('calculates base for 13+ years (multiplier 1.4)', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 20 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.alpha).toBe(16_268);
  });

  it('includes highest employee gross (capped at €30,000)', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 2, highestEmployeeGross: 25_000 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.alpha).toBe(36_620);
  });

  it('caps highest employee gross at €30,000', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 2, highestEmployeeGross: 50_000 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.alpha).toBe(41_620);
  });

  it('uses FY2025 minimum wage (€950) correctly', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 2 };
    const result = calculateArt28Minimum(inputs, FY2025);
    expect(result.alpha).toBe(13_300);
  });
});

// ─── �� Component (Payroll) ────────────────────────────────────────────────

describe('Art.28A — β component', () => {
  it('calculates β as 10% of payroll', () => {
    const inputs = { ...defaultInputs(), annualPayrollCost: 50_000 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.beta).toBe(5_000);
  });

  it('caps β at €15,000', () => {
    const inputs = { ...defaultInputs(), annualPayrollCost: 200_000 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.beta).toBe(15_000);
  });

  it('returns 0 for no employees', () => {
    const result = calculateArt28Minimum(defaultInputs(), FY2024);
    expect(result.beta).toBe(0);
  });
});

// ─���─ γ Component (KAD Turnover) ────────────────��─────────────────────────

describe('Art.28A — γ component', () => {
  it('returns 0 when turnover ≤ threshold (€10,000)', () => {
    const inputs = { ...defaultInputs(), annualTurnover: 8_000 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.gamma).toBe(0);
  });

  it('returns 0 when KAD average not found', () => {
    const inputs = { ...defaultInputs(), annualTurnover: 50_000, kadCode: '99' };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.gamma).toBe(0);
  });

  it('calculates γ with FY2025 KAD data', () => {
    // KAD 11.01 (spirits): avg turnover = 17,642
    const inputs = { ...defaultInputs(), annualTurnover: 30_000, kadCode: '11.01' };
    const result = calculateArt28Minimum(inputs, FY2025);
    // γ = (30,000 - 17,642) × 5% = 12,358 × 0.05 = 617.90
    expect(result.gamma).toBeCloseTo(617.9, 1);
  });
});

// ─── Hard Cap ─────────────────────────────────────────────────────────────

describe('Art.28A — hard cap', () => {
  it('caps raw minimum at €50,000', () => {
    const inputs = {
      ...defaultInputs(),
      yearsOfOperation: 20,
      highestEmployeeGross: 30_000,
      annualPayrollCost: 200_000,
    };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.rawMinimum).toBe(50_000);
  });
});

// ─── Reductions ───────────────────────────────────────────────────────────

describe('Art.28A — reductions', () => {
  it('applies 2/3 reduction for 4th year of operation', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 5, yearOfOperation: 4 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.reductions.yearReduction).toBeCloseTo(8_521.33, 0);
  });

  it('applies 1/3 reduction for 5th year of operation', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 5, yearOfOperation: 5 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.reductions.yearReduction).toBeCloseTo(4_260.67, 0);
  });

  it('applies 50% reduction for disabled children (i)', () => {
    const inputs = { ...defaultInputs(), hasDisabledChildren: true };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.reductions.disabilityReduction).toBeGreaterThan(0);
    expect(result.reductions.disabilityReduction).toBeCloseTo(
      (result.rawMinimum - result.reductions.yearReduction) / 2, 0,
    );
  });

  it('applies NEW 30% category reduction (FY2025)', () => {
    const inputs = { ...defaultInputs(), qualifiesFor30Reduction: true };
    const result = calculateArt28Minimum(inputs, FY2025);
    // 30% of (rawMinimum - yearReduction)
    const afterYear = result.rawMinimum - result.reductions.yearReduction;
    expect(result.reductions.categoryReduction).toBeCloseTo(afterYear * 0.3, 0);
  });

  it('30% reduction NOT applied if 50% disability already applies', () => {
    const inputs = {
      ...defaultInputs(),
      hasDisabledChildren: true,
      qualifiesFor30Reduction: true,
    };
    const result = calculateArt28Minimum(inputs, FY2025);
    // Per Excel formula: IF(J37=ΝΑΙ, /2, IF(J39=ΝΑΙ, *0.3, 0))
    // Disability takes precedence, 30% should be 0
    expect(result.reductions.categoryReduction).toBe(0);
    expect(result.reductions.disabilityReduction).toBeGreaterThan(0);
  });

  it('subtracts salary + agricultural income (Art.28Β)', () => {
    const inputs = { ...defaultInputs(), salaryIncome: 5_000, agriculturalIncome: 3_000 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.reductions.incomeAbsorption).toBe(8_000);
  });

  it('income absorption cannot exceed remaining minimum', () => {
    const inputs = { ...defaultInputs(), yearsOfOperation: 2, salaryIncome: 50_000 };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.finalMinimum).toBe(0);
  });

  it('applies FY2025 small municipality 50% reduction', () => {
    const inputs = { ...defaultInputs(), isSmallMunicipality: true };
    const result = calculateArt28Minimum(inputs, FY2025);
    expect(result.reductions.smallMunicipality).toBeGreaterThan(0);
  });
});

// ─── Operating Days (inclusive count + zero guard) ────────────────────────

describe('calculateActiveDays', () => {
  it('returns full year with no suspensions', () => {
    const inputs = defaultInputs();
    expect(calculateActiveDays(inputs)).toBe(365);
  });

  it('uses inclusive day count for suspension period', () => {
    const inputs = {
      ...defaultInputs(),
      suspensionPeriods: [{ startDay: 100, endDay: 200 }],
    };
    // 200 - 100 + 1 = 101 days
    expect(calculateActiveDays(inputs)).toBe(365 - 101);
  });

  it('handles multiple suspension periods', () => {
    const inputs = {
      ...defaultInputs(),
      suspensionPeriods: [
        { startDay: 50, endDay: 80 },   // 31 days
        { startDay: 200, endDay: 250 },  // 51 days
      ],
    };
    expect(calculateActiveDays(inputs)).toBe(365 - 31 - 51);
  });

  it('returns 0 days for zero start (guard)', () => {
    const inputs = {
      ...defaultInputs(),
      suspensionPeriods: [{ startDay: 0, endDay: 100 }],
    };
    // startDay=0 → period ignored
    expect(calculateActiveDays(inputs)).toBe(365);
  });

  it('handles restricted operation periods', () => {
    const inputs = {
      ...defaultInputs(),
      restrictedOperationPeriods: [{ startDay: 1, endDay: 30 }],
    };
    // 30 - 1 + 1 = 30 days
    expect(calculateActiveDays(inputs)).toBe(365 - 30);
  });

  it('clamps to 0 for over-suspended year', () => {
    const inputs = {
      ...defaultInputs(),
      suspensionPeriods: [{ startDay: 1, endDay: 365 }],
    };
    expect(calculateActiveDays(inputs)).toBe(0);
  });

  it('handles negative day range (end < start)', () => {
    const inputs = {
      ...defaultInputs(),
      suspensionPeriods: [{ startDay: 200, endDay: 100 }],
    };
    // end < start → 0 days counted
    expect(calculateActiveDays(inputs)).toBe(365);
  });
});

// ─── Proration ─────���──────────────────────────────────────────────────────

describe('Art.28A — operating days proration', () => {
  it('prorates for partial year (suspension period)', () => {
    const inputs = {
      ...defaultInputs(),
      suspensionPeriods: [{ startDay: 1, endDay: 185 }],
    };
    const result = calculateArt28Minimum(inputs, FY2024);
    // Active days = 365 - 185 = 180
    expect(result.activeDays).toBe(180);

    const fullYearResult = calculateArt28Minimum(defaultInputs(), FY2024);
    expect(result.proratedMinimum).toBeCloseTo(
      fullYearResult.proratedMinimum * (180 / 365), 0,
    );
  });

  it('returns 0 for fully suspended year', () => {
    const inputs = {
      ...defaultInputs(),
      suspensionPeriods: [{ startDay: 1, endDay: 365 }],
    };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.proratedMinimum).toBe(0);
    expect(result.finalMinimum).toBe(0);
  });
});

// ─��─ Art.5Γ Flat Tax ──────────────────────────────────────────────────────

describe('Art.28A — Art.5Γ flat-tax halving', () => {
  it('halves minimum when flat-tax elected', () => {
    const inputs = { ...defaultInputs(), art5GFlatTax: true };
    const result = calculateArt28Minimum(inputs, FY2024);
    expect(result.art5GReduction).toBeCloseTo(result.proratedMinimum / 2, 0);
    expect(result.finalMinimum).toBeCloseTo(result.proratedMinimum / 2, 0);
  });

  it('does not halve when not elected', () => {
    const result = calculateArt28Minimum(defaultInputs(), FY2024);
    expect(result.art5GReduction).toBe(0);
  });
});

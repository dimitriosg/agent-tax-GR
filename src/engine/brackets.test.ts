import { describe, it, expect } from 'vitest';
import { calculateBracketTax, calculateFlatTax, calculateAllIncomeTax, sumDeclaredIncome } from './brackets.js';
import { FY2024 } from '../config/fy2024.js';
import { FY2025 } from '../config/fy2025.js';
import type { IncomeDeclaration } from './types.js';

// ─── Helper: zero income declaration ──────────────────────────────────────

function zeroIncome(): IncomeDeclaration {
  return {
    employment: 0, pension: 0, merchantNavy: 0, agricultural: 0,
    business: 0, imputedProperty: 0, realEstate: 0,
    dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
  };
}

// ─── Employment/Pension Bracket Tax ───────────────────────────────────────

describe('calculateBracketTax — employment brackets', () => {
  const brackets = FY2024.employmentBrackets;

  it('returns 0 for zero income', () => {
    const result = calculateBracketTax(0, brackets);
    expect(result.total).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });

  it('returns 0 for negative income', () => {
    const result = calculateBracketTax(-5000, brackets);
    expect(result.total).toBe(0);
  });

  it('calculates tax for income within first bracket (€5,000)', () => {
    // €5,000 × 9% = €450
    const result = calculateBracketTax(5_000, brackets);
    expect(result.total).toBe(450);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].taxableInBracket).toBe(5_000);
  });

  it('calculates tax at first bracket boundary (€10,000)', () => {
    // €10,000 × 9% = €900
    const result = calculateBracketTax(10_000, brackets);
    expect(result.total).toBe(900);
  });

  it('calculates tax spanning two brackets (€15,000)', () => {
    // €10,000 × 9% = €900
    // €5,000 × 22% = €1,100
    // Total = €2,000
    const result = calculateBracketTax(15_000, brackets);
    expect(result.total).toBe(2_000);
    expect(result.breakdown).toHaveLength(2);
  });

  it('calculates tax at €20,000 boundary', () => {
    // €10,000 × 9% = €900
    // €10,000 × 22% = €2,200
    // Total = €3,100
    const result = calculateBracketTax(20_000, brackets);
    expect(result.total).toBe(3_100);
  });

  it('calculates tax spanning three brackets (€25,000)', () => {
    // €10,000 × 9%  = €900
    // €10,000 × 22% = €2,200
    // €5,000 × 28%  = €1,400
    // Total = €4,500
    const result = calculateBracketTax(25_000, brackets);
    expect(result.total).toBe(4_500);
  });

  it('calculates tax spanning four brackets (€35,000)', () => {
    // €10,000 × 9%  = €900
    // €10,000 × 22% = €2,200
    // €10,000 × 28% = €2,800
    // €5,000 × 36%  = €1,800
    // Total = €7,700
    const result = calculateBracketTax(35_000, brackets);
    expect(result.total).toBe(7_700);
  });

  it('calculates tax spanning all five brackets (€50,000)', () => {
    // €10,000 × 9%  = €900
    // €10,000 × 22% = €2,200
    // €10,000 × 28% = €2,800
    // €10,000 × 36% = €3,600
    // €10,000 × 44% = €4,400
    // Total = €13,900
    const result = calculateBracketTax(50_000, brackets);
    expect(result.total).toBe(13_900);
    expect(result.breakdown).toHaveLength(5);
  });

  it('calculates high income (€100,000)', () => {
    // €10,000 × 9%  = €900
    // €10,000 × 22% = €2,200
    // €10,000 × 28% = €2,800
    // €10,000 × 36% = €3,600
    // €60,000 × 44% = €26,400
    // Total = €35,900
    const result = calculateBracketTax(100_000, brackets);
    expect(result.total).toBe(35_900);
  });

  it('FY2024 and FY2025 brackets produce same result (unchanged)', () => {
    const fy24 = calculateBracketTax(50_000, FY2024.employmentBrackets);
    const fy25 = calculateBracketTax(50_000, FY2025.employmentBrackets);
    expect(fy24.total).toBe(fy25.total);
  });
});

// ─── Real Estate Bracket Tax ──────────────────────────────────────────────

describe('calculateBracketTax — real estate brackets', () => {
  const brackets = FY2024.realEstateBrackets;

  it('calculates tax within first bracket (€8,000)', () => {
    // €8,000 × 15% = €1,200
    const result = calculateBracketTax(8_000, brackets);
    expect(result.total).toBe(1_200);
  });

  it('calculates tax at boundary (€12,000)', () => {
    // €12,000 × 15% = €1,800
    const result = calculateBracketTax(12_000, brackets);
    expect(result.total).toBe(1_800);
  });

  it('calculates tax spanning both brackets (€20,000)', () => {
    // €12,000 × 15% = €1,800
    // €8,000 × 35%  = €2,800
    // Total = €4,600
    const result = calculateBracketTax(20_000, brackets);
    expect(result.total).toBe(4_600);
  });
});

// ─── Flat Tax ─────────────────────────────────────────────────────────────

describe('calculateFlatTax', () => {
  it('calculates dividend tax at 5%', () => {
    expect(calculateFlatTax(10_000, 0.05)).toBe(500);
  });

  it('calculates interest tax at 15%', () => {
    expect(calculateFlatTax(1_000, 0.15)).toBe(150);
  });

  it('calculates royalty tax at 20%', () => {
    expect(calculateFlatTax(5_000, 0.20)).toBe(1_000);
  });

  it('returns 0 for zero income', () => {
    expect(calculateFlatTax(0, 0.15)).toBe(0);
  });

  it('returns 0 for negative income', () => {
    expect(calculateFlatTax(-1_000, 0.15)).toBe(0);
  });
});

// ─── All Income Tax (R14–R22) ─────────────────────────────────────────────

describe('calculateAllIncomeTax', () => {
  it('calculates combined employment + pension on single scale', () => {
    const income: IncomeDeclaration = {
      ...zeroIncome(),
      employment: 15_000,
      pension: 5_000,
    };
    const result = calculateAllIncomeTax(income, FY2024);
    // Combined €20,000: €10,000×9% + €10,000×22% = €3,100
    expect(result.byType.employment).toBe(3_100);
    expect(result.total).toBe(3_100);
  });

  it('calculates real estate on separate scale', () => {
    const income: IncomeDeclaration = {
      ...zeroIncome(),
      realEstate: 15_000,
    };
    const result = calculateAllIncomeTax(income, FY2024);
    // €12,000×15% + €3,000×35% = €1,800 + €1,050 = €2,850
    expect(result.byType.realEstate).toBe(2_850);
  });

  it('calculates capital income at flat rates', () => {
    const income: IncomeDeclaration = {
      ...zeroIncome(),
      dividends: 10_000,
      interest: 5_000,
      royalties: 2_000,
    };
    const result = calculateAllIncomeTax(income, FY2024);
    // Dividends: €500, Interest: €750, Royalties: €400
    expect(result.byType.capital).toBe(1_650);
  });

  it('handles all income types simultaneously', () => {
    const income: IncomeDeclaration = {
      employment: 20_000,
      pension: 0,
      merchantNavy: 0,
      agricultural: 5_000,
      business: 10_000,
      imputedProperty: 0,
      realEstate: 8_000,
      dividends: 2_000,
      interest: 1_000,
      royalties: 0,
      capitalGains: 5_000,
      foreign: 0,
    };
    const result = calculateAllIncomeTax(income, FY2024);
    expect(result.total).toBeGreaterThan(0);
    // Employment: €3,100, Agricultural: €450, Business: €900
    // Real estate: €1,200, Dividends: €100, Interest: €150, CapGains: €750
    expect(result.byType.employment).toBe(3_100);
    expect(result.byType.agricultural).toBe(450);
    expect(result.byType.business).toBe(900);
    expect(result.byType.realEstate).toBe(1_200);
  });
});

// ─── sumDeclaredIncome ────────────────────────────────────────────────────

describe('sumDeclaredIncome', () => {
  it('sums all income sources', () => {
    const income: IncomeDeclaration = {
      employment: 10_000,
      pension: 5_000,
      merchantNavy: 0,
      agricultural: 3_000,
      business: 0,
      imputedProperty: 0,
      realEstate: 6_000,
      dividends: 1_000,
      interest: 500,
      royalties: 200,
      capitalGains: 0,
      foreign: 0,
    };
    expect(sumDeclaredIncome(income)).toBe(25_700);
  });

  it('returns 0 for zero income', () => {
    expect(sumDeclaredIncome(zeroIncome())).toBe(0);
  });
});

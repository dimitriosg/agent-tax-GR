import { describe, it, expect } from 'vitest';
import { calculateSettlement } from './settlement.js';
import { FY2024 } from '../config/fy2024.js';
import type { E1Declaration } from './types.js';

// ─── Helper: build a declaration ──────────────────────────────────────────

function buildDeclaration(overrides: Partial<E1Declaration> = {}): E1Declaration {
  return {
    fiscalYear: 2024,
    taxpayer: {
      afm: '090000045',
      maritalStatus: 'single',
      jointFiling: false,
      dependents: 0,
      isDisabled: false,
    },
    income: {
      employment: 0, pension: 0, merchantNavy: 0, agricultural: 0,
      business: 0, imputedProperty: 0, realEstate: 0,
      dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
    },
    withholding: { taxWithheld: 0, priorYearPrepayment: 0 },
    deductions: {
      donations: 0, medicalExpenses: 0, disabilityReduction: 0,
      energyUpgrade: 0, investmentLaw: 0, rentalExemption: 0, tipsExemption: 0,
    },
    electronicPayments: { totalElectronic: 0 },
    tekmiria: {
      housing: { primaryResidence: { sqm: 0, owned: false }, secondaryResidences: [] },
      cars: [],
      domesticStaff: 0,
      privateSchoolFees: 0,
      swimmingPool: 'none',
      acquisitions: {},
    },
    ...overrides,
  };
}

// ─── Basic Settlement Scenarios ───────────────────────────────────────────

describe('calculateSettlement', () => {
  it('returns all zeros for zero declaration', () => {
    const result = calculateSettlement(buildDeclaration(), FY2024);
    expect(result.declaredIncome).toBe(0);
    expect(result.totalScaleTax).toBe(0);
    expect(result.finalPaymentOrRefund).toBe(0);
  });

  it('calculates simple employment income scenario', () => {
    const decl = buildDeclaration({
      income: {
        employment: 25_000, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 0, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      electronicPayments: { totalElectronic: 10_000 },
    });

    const result = calculateSettlement(decl, FY2024);

    // Declared income = €25,000
    expect(result.declaredIncome).toBe(25_000);

    // Tax: €10,000×9% + €10,000×22% + €5,000×28% = €900+€2,200+€1,400 = €4,500
    expect(result.totalScaleTax).toBe(4_500);

    // Art.16 reduction: income €25,000, 0 deps
    // excess = €13,000, phaseout = €520, reduction = €777-€520 = €257
    expect(result.art16Reduction).toBe(257);

    // Remaining: €4,500 - €257 = €4,243
    expect(result.remainingScaleTax).toBe(4_243);
  });

  it('calculates scenario with withheld tax (refund)', () => {
    const decl = buildDeclaration({
      income: {
        employment: 20_000, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 0, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      withholding: { taxWithheld: 5_000, priorYearPrepayment: 0 },
      electronicPayments: { totalElectronic: 8_000 },
    });

    const result = calculateSettlement(decl, FY2024);

    // Tax: €10,000×9% + €10,000×22% = €900+€2,200 = €3,100
    // Art.16: income €20,000, excess €8,000, phaseout €320, reduction €457
    // Remaining: €3,100 - €457 = €2,643
    expect(result.remainingScaleTax).toBe(2_643);

    // After withholding: €2,643 - €5,000 = -€2,357 (refund area)
    expect(result.totalTaxForPayment).toBeLessThan(0);
  });

  it('calculates rental income correctly', () => {
    const decl = buildDeclaration({
      income: {
        employment: 0, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 0, imputedProperty: 0, realEstate: 18_000,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
    });

    const result = calculateSettlement(decl, FY2024);

    // Real estate tax: €12,000×15% + €6,000×35% = €1,800+€2,100 = €3,900
    expect(result.taxByType.realEstate).toBe(3_900);

    // No Art.16 for rental income (no employment/pension)
    expect(result.art16Reduction).toBe(0);

    // Digital transaction fee: €18,000 × 3.6% = €648
    expect(result.digitalTransactionFee).toBe(648);
  });

  it('calculates mixed income scenario', () => {
    const decl = buildDeclaration({
      income: {
        employment: 15_000, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 0, imputedProperty: 0, realEstate: 10_000,
        dividends: 5_000, interest: 2_000, royalties: 0, capitalGains: 0, foreign: 0,
      },
      withholding: { taxWithheld: 2_000, priorYearPrepayment: 500 },
      electronicPayments: { totalElectronic: 6_000 },
      taxpayer: {
        afm: '090000045',
        maritalStatus: 'married',
        jointFiling: true,
        dependents: 2,
        isDisabled: false,
      },
    });

    const result = calculateSettlement(decl, FY2024);

    expect(result.declaredIncome).toBe(32_000);

    // Employment tax: €10,000×9% + €5,000×22% = €2,000
    expect(result.taxByType.employment).toBe(2_000);

    // Real estate: €10,000×15% = €1,500
    expect(result.taxByType.realEstate).toBe(1_500);

    // Capital: dividends €5,000×5% + interest €2,000×15% = €250+€300 = €550
    expect(result.taxByType.capital).toBe(550);

    // Art.16: income €15,000, 2 deps, base €900
    // excess = €3,000, phaseout = €120, reduction = €780
    expect(result.art16Reduction).toBe(780);
  });

  it('applies electronic payment surcharge when short', () => {
    const decl = buildDeclaration({
      income: {
        employment: 30_000, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 0, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      electronicPayments: { totalElectronic: 5_000 },
    });

    const result = calculateSettlement(decl, FY2024);
    // Required: €30,000 × 25% = €7,500. Actual: €5,000. Shortfall: €2,500
    // Penalty: €2,500 × 20% = €500
    expect(result.electronicPaymentSurcharge).toBe(500);
  });

  it('adjusts taxable base when Art.28A minimum > declared business income', () => {
    const decl = buildDeclaration({
      income: {
        employment: 0, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 5_000, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      selfEmployed: {
        isExempt: false,
        yearsOfOperation: 5,
        highestEmployeeGross: 0,
        annualPayrollCost: 0,
        annualTurnover: 0,
        kadCode: '47',
        operatingDays: 365,
        suspensionPeriods: [],
        restrictedOperationPeriods: [],
        yearOfOperation: 6,
        hasDisabledChildren: false,
        qualifiesFor30Reduction: false,
        art5GFlatTax: false,
        salaryIncome: 0,
        agriculturalIncome: 0,
        isSmallMunicipality: false,
        isSchoolCafeteriaOperator: false,
      },
    });

    const result = calculateSettlement(decl, FY2024);
    // Art.28A minimum (α = 830×14×1.1 = 12,782) > declared business (5,000)
    // Excess = 12,782 - 5,000 = 7,782
    expect(result.art28AdjustedIncome).toBe(5_000 + 7_782);
    expect(result.art28AdjustedIncome).toBeGreaterThan(result.declaredIncome);
  });

  it('includes tekmiria excess in taxable income', () => {
    const decl = buildDeclaration({
      income: {
        employment: 5_000, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 0, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      tekmiria: {
        housing: {
          primaryResidence: { sqm: 200, owned: true },
          secondaryResidences: [],
        },
        cars: [{ cc: 2_500, registeredAfterNov2010: false }],
        domesticStaff: 0,
        privateSchoolFees: 0,
        swimmingPool: 'none',
        acquisitions: {},
      },
      electronicPayments: { totalElectronic: 2_000 },
    });

    const result = calculateSettlement(decl, FY2024);

    // Housing: 80×40 + 120×65 = 3,200 + 7,800 = 11,000
    // Car: 4,200
    // Total tekmiria: 15,200
    // Declared: 5,000
    // Excess: 10,200
    expect(result.tekmiriaExcess).toBe(10_200);
    expect(result.totalTaxableIncome).toBe(15_200);
  });

  it('calculates luxury living tax for large car', () => {
    const decl = buildDeclaration({
      income: {
        employment: 50_000, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 0, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      tekmiria: {
        housing: { primaryResidence: { sqm: 0, owned: false }, secondaryResidences: [] },
        cars: [{ cc: 3_500, registeredAfterNov2010: false }],
        domesticStaff: 0,
        privateSchoolFees: 0,
        swimmingPool: 'none',
        acquisitions: {},
      },
      electronicPayments: { totalElectronic: 20_000 },
    });

    const result = calculateSettlement(decl, FY2024);
    // Car > 2500cc: 7,200 × 5% = 360
    expect(result.luxuryLivingTax).toBe(360);
  });
});

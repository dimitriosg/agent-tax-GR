import { describe, it, expect } from 'vitest';
import { evaluateAlerts, isValidAfm } from './alerts.js';
import { FY2024 } from '../config/fy2024.js';
import { FY2025 } from '../config/fy2025.js';
import type { E1Declaration } from './types.js';

// ─── Helper: minimal declaration ──────────────────────────────────────────

function minimalDeclaration(overrides: Partial<E1Declaration> = {}): E1Declaration {
  return {
    fiscalYear: 2024,
    taxpayer: {
      afm: '090000045',  // Valid test AFM
      maritalStatus: 'single',
      jointFiling: false,
      dependents: 0,
      isDisabled: false,
    },
    income: {
      employment: 20_000, pension: 0, merchantNavy: 0, agricultural: 0,
      business: 0, imputedProperty: 0, realEstate: 0,
      dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
    },
    withholding: { taxWithheld: 0, priorYearPrepayment: 0 },
    deductions: {
      donations: 0, medicalExpenses: 0, disabilityReduction: 0,
      energyUpgrade: 0, investmentLaw: 0, rentalExemption: 0, tipsExemption: 0,
    },
    electronicPayments: { totalElectronic: 10_000 },
    tekmiria: {
      housing: { primaryResidence: { sqm: 80, owned: true }, secondaryResidences: [] },
      cars: [],
      domesticStaff: 0,
      privateSchoolFees: 0,
      swimmingPool: 'none',
      acquisitions: {},
    },
    ...overrides,
  };
}

// ─── AFM Validation ───────────────────────────────────────────────────────

describe('isValidAfm', () => {
  it('validates correct AFM', () => {
    // Known valid test AFM
    expect(isValidAfm('090000045')).toBe(true);
  });

  it('rejects incorrect check digit', () => {
    expect(isValidAfm('090000046')).toBe(false);
  });

  it('rejects non-9-digit strings', () => {
    expect(isValidAfm('12345678')).toBe(false);  // 8 digits
    expect(isValidAfm('1234567890')).toBe(false); // 10 digits
    expect(isValidAfm('abcdefghi')).toBe(false);  // letters
    expect(isValidAfm('')).toBe(false);
  });

  it('validates 000000000', () => {
    // 0×2^8 + 0×2^7 + ... = 0, 0 mod 11 = 0, check digit = 0 ✓
    expect(isValidAfm('000000000')).toBe(true);
  });
});

// ─── Alert Generation ─────────────────────────────────────────────────────

describe('evaluateAlerts', () => {
  it('generates no critical alerts for valid simple declaration', () => {
    const decl = minimalDeclaration();
    const alerts = evaluateAlerts(decl, FY2024);
    const critical = alerts.filter(a => a.severity === 'critical');
    expect(critical).toHaveLength(0);
  });

  it('flags invalid AFM', () => {
    const decl = minimalDeclaration({
      taxpayer: {
        afm: '123456789',  // Invalid check digit
        maritalStatus: 'single',
        jointFiling: false,
        dependents: 0,
        isDisabled: false,
      },
    });
    const alerts = evaluateAlerts(decl, FY2024);
    expect(alerts.some(a => a.code === 'AFM_INVALID')).toBe(true);
  });

  it('flags married couples not filing jointly', () => {
    const decl = minimalDeclaration({
      taxpayer: {
        afm: '090000045',
        maritalStatus: 'married',
        jointFiling: false,
        dependents: 0,
        isDisabled: false,
      },
    });
    const alerts = evaluateAlerts(decl, FY2024);
    expect(alerts.some(a => a.code === 'JOINT_FILING_REQUIRED')).toBe(true);
  });

  it('does not flag married couples filing jointly', () => {
    const decl = minimalDeclaration({
      taxpayer: {
        afm: '090000045',
        maritalStatus: 'married',
        jointFiling: true,
        dependents: 0,
        isDisabled: false,
      },
    });
    const alerts = evaluateAlerts(decl, FY2024);
    expect(alerts.some(a => a.code === 'JOINT_FILING_REQUIRED')).toBe(false);
  });

  it('flags electronic payment shortfall', () => {
    const decl = minimalDeclaration({
      income: {
        employment: 20_000, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 0, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      electronicPayments: { totalElectronic: 2_000 },
    });
    const alerts = evaluateAlerts(decl, FY2024);
    // Required: 20,000 × 25% = 5,000. Actual: 2,000 → shortfall
    expect(alerts.some(a => a.code === 'ELECTRONIC_PAYMENTS_SHORT')).toBe(true);
  });

  it('flags tekmiria excess', () => {
    const decl = minimalDeclaration({
      income: {
        employment: 5_000, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 0, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      tekmiria: {
        housing: { primaryResidence: { sqm: 200, owned: true }, secondaryResidences: [] },
        cars: [{ cc: 3_500, registeredAfterNov2010: false }],
        domesticStaff: 1,
        privateSchoolFees: 0,
        swimmingPool: 'outdoor',
        acquisitions: {},
      },
    });
    const alerts = evaluateAlerts(decl, FY2024);
    expect(alerts.some(a => a.code === 'TEKMIRIA_EXCESS')).toBe(true);
  });

  it('mentions abolished τέλος επιτηδεύματος', () => {
    const alerts = evaluateAlerts(minimalDeclaration(), FY2024);
    expect(alerts.some(a => a.code === 'TELOS_EPITIDEUMATOS_REMOVED')).toBe(true);
  });

  it('flags missing dependent AFMs in FY2025', () => {
    const decl = minimalDeclaration({
      taxpayer: {
        afm: '090000045',
        maritalStatus: 'single',
        jointFiling: false,
        dependents: 2,
        dependentAfms: [],
        isDisabled: false,
      },
    });
    const alerts = evaluateAlerts(decl, FY2025);
    expect(alerts.some(a => a.code === 'MISSING_DEPENDENT_AFM')).toBe(true);
  });

  it('flags unclaimed disability reduction', () => {
    const decl = minimalDeclaration({
      taxpayer: {
        afm: '090000045',
        maritalStatus: 'single',
        jointFiling: false,
        dependents: 0,
        isDisabled: true,
        disabilityPercent: 70,
      },
    });
    const alerts = evaluateAlerts(decl, FY2024);
    expect(alerts.some(a => a.code === 'DISABILITY_REDUCTION_UNCLAIMED')).toBe(true);
  });

  it('detects CO2 data missing for FY2025 cars', () => {
    const decl = minimalDeclaration({
      tekmiria: {
        housing: { primaryResidence: { sqm: 80, owned: true }, secondaryResidences: [] },
        cars: [{ cc: 1_600, registeredAfterNov2010: true }],
        domesticStaff: 0,
        privateSchoolFees: 0,
        swimmingPool: 'none',
        acquisitions: {},
      },
    });
    const alerts = evaluateAlerts(decl, FY2025);
    expect(alerts.some(a => a.code === 'CO2_DATA_MISSING')).toBe(true);
  });

  // ─── FY2025 New Validation Rules ────────────────────────────────────────

  it('flags school cafeteria + rural area conflict', () => {
    const decl = minimalDeclaration({
      income: {
        employment: 10_000, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 15_000, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      selfEmployed: {
        isExempt: false, yearsOfOperation: 5, highestEmployeeGross: 0,
        annualPayrollCost: 0, annualTurnover: 0, kadCode: '47',
        operatingDays: 365, suspensionPeriods: [], restrictedOperationPeriods: [],
        yearOfOperation: 6, hasDisabledChildren: false, qualifiesFor30Reduction: false,
        art5GFlatTax: false, salaryIncome: 0, agriculturalIncome: 0,
        isSmallMunicipality: true, isSchoolCafeteriaOperator: true,
      },
    });
    const alerts = evaluateAlerts(decl, FY2025);
    expect(alerts.some(a => a.code === 'CAFETERIA_RURAL_CONFLICT')).toBe(true);
  });

  it('flags withholding exceeding total income', () => {
    const decl = minimalDeclaration({
      income: {
        employment: 10_000, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 0, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      withholding: { taxWithheld: 15_000, priorYearPrepayment: 0 },
    });
    const alerts = evaluateAlerts(decl, FY2024);
    expect(alerts.some(a => a.code === 'WITHHOLDING_EXCEEDS_INCOME')).toBe(true);
  });

  it('flags rental return missing AFM for FY2025', () => {
    const decl = minimalDeclaration({
      taxpayer: {
        afm: '090000045', maritalStatus: 'single', jointFiling: false,
        dependents: 1, isDisabled: false,
      },
      rentalReturn: {
        leaseDeclarationNumber: '12345',
        // Missing dependentAfm
      },
    });
    const alerts = evaluateAlerts(decl, FY2025);
    expect(alerts.some(a => a.code === 'RENTAL_RETURN_MISSING_AFM')).toBe(true);
  });

  it('flags Art.28A exempt with codes 405-406 filled', () => {
    const decl = minimalDeclaration({
      income: {
        employment: 0, pension: 0, merchantNavy: 0, agricultural: 0,
        business: 5_000, imputedProperty: 0, realEstate: 0,
        dividends: 0, interest: 0, royalties: 0, capitalGains: 0, foreign: 0,
      },
      selfEmployed: {
        isExempt: true, exemptReason: 'farmer', yearsOfOperation: 2,
        highestEmployeeGross: 0, annualPayrollCost: 0, annualTurnover: 0,
        kadCode: '01.61', operatingDays: 365, suspensionPeriods: [],
        restrictedOperationPeriods: [], yearOfOperation: 2,
        hasDisabledChildren: false, qualifiesFor30Reduction: false,
        art5GFlatTax: false, salaryIncome: 0, agriculturalIncome: 0,
        isSmallMunicipality: false, isSchoolCafeteriaOperator: false,
      },
    });
    const alerts = evaluateAlerts(decl, FY2025);
    expect(alerts.some(a => a.code === 'ART28A_EXEMPT_WITH_CODES')).toBe(true);
  });
});

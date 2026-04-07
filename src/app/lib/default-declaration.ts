import type { E1Declaration } from '../../engine/types';

export function createDefaultDeclaration(fiscalYear = 2025): E1Declaration {
  return {
    fiscalYear,
    taxpayer: {
      afm: '',
      maritalStatus: 'single',
      jointFiling: false,
      dependents: 0,
      isDisabled: false,
    },
    income: {
      employment: 0,
      pension: 0,
      merchantNavy: 0,
      agricultural: 0,
      business: 0,
      imputedProperty: 0,
      realEstate: 0,
      dividends: 0,
      interest: 0,
      royalties: 0,
      capitalGains: 0,
      foreign: 0,
    },
    withholding: {
      taxWithheld: 0,
      priorYearPrepayment: 0,
    },
    deductions: {
      donations: 0,
      medicalExpenses: 0,
      disabilityReduction: 0,
      energyUpgrade: 0,
      investmentLaw: 0,
      rentalExemption: 0,
      tipsExemption: 0,
    },
    electronicPayments: {
      totalElectronic: 0,
    },
    tekmiria: {
      housing: {
        primaryResidence: { sqm: 0, owned: false },
        secondaryResidences: [],
      },
      cars: [],
      domesticStaff: 0,
      privateSchoolFees: 0,
      swimmingPool: 'none',
      acquisitions: {},
    },
  };
}

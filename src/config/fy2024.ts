import type { TaxConfig } from './types.js';

/**
 * FY2024 Tax Configuration
 * Filing season: 16/03/2025 – 15/07/2025
 * Base law: N.4172/2013 (ΚΦΕ) as amended by N.5162/2024
 */
export const FY2024: TaxConfig = {
  year: 2024,
  minimumWage: 830,

  // Art.15 — Employment & pension brackets
  employmentBrackets: [
    { from: 0,     to: 10_000, rate: 0.09 },
    { from: 10_000, to: 20_000, rate: 0.22 },
    { from: 20_000, to: 30_000, rate: 0.28 },
    { from: 30_000, to: 40_000, rate: 0.36 },
    { from: 40_000, to: Infinity, rate: 0.44 },
  ],

  // Real estate income brackets
  realEstateBrackets: [
    { from: 0,      to: 12_000, rate: 0.15 },
    { from: 12_000, to: Infinity, rate: 0.35 },
  ],

  // Capital income flat rates
  dividendRate: 0.05,
  interestRate: 0.15,
  royaltyRate: 0.20,
  capitalGainsRate: 0.15,

  // Art.16 reduction
  art16Reductions: [
    { dependents: 0, baseReduction: 777 },
    { dependents: 1, baseReduction: 810 },
    { dependents: 2, baseReduction: 900 },
    { dependents: 3, baseReduction: 1_120 },
    { dependents: 4, baseReduction: 1_340 },
    { dependents: 5, baseReduction: 1_780 },  // 5+
  ],
  art16PhaseoutStart: 12_000,
  art16PhaseoutRate: 0.04,

  // Electronic payments (Art.15 par.6): 25% of income, 20% penalty
  electronicPaymentRequiredPercent: 0.25,
  electronicPaymentPenaltyRate: 0.20,

  // Τεκμήρια tables
  tekmiria: {
    carCC: [
      { maxCC: 1_200,   annualPresumption: 1_000 },
      { maxCC: 1_800,   annualPresumption: 2_350 },
      { maxCC: 2_500,   annualPresumption: 4_200 },
      { maxCC: 3_000,   annualPresumption: 6_300 },
      { maxCC: Infinity, annualPresumption: 7_200 },
    ],
    housing: {
      primaryOwned: {
        firstSqmLimit: 80,
        firstSqmRate: 40,
        aboveRate: 65,
      },
      secondaryOwned: {
        ratePerSqm: 40,
      },
    },
    domesticStaffPerPerson: 6_000,
    poolOutdoor: 16_000,
    poolIndoor: 24_000,
  },

  // Art.28A–28D
  art28: {
    triennialMultipliers: [
      { maxYears: 3,        multiplier: 1.0 },
      { maxYears: 6,        multiplier: 1.1 },
      { maxYears: 9,        multiplier: 1.2 },
      { maxYears: 13,       multiplier: 1.3 },
      { maxYears: Infinity, multiplier: 1.4 },
    ],
    maxEmployeeGrossForAlpha: 30_000,
    maxBetaAmount: 15_000,
    betaPayrollPercent: 0.10,
    gammaPercent: 0.05,
    gammaTurnoverThreshold: 10_000,
    hardCap: 50_000,
    // KAD averages: placeholder — must be refreshed from AADE published data
    kadAverages: [],
  },

  // Prepayment rates (standard)
  prepaymentRate: {
    employment: 0,
    business: 0.55,
    agricultural: 0.55,
    realEstate: 0,
  },

  // Luxury living tax
  luxuryTax: {
    rate5: 0.05,
    rate13: 0.13,
  },

  // N.5162/2024 changes
  newCodes: ['119', '120', '689', '690', '691', '692', '741', '742'],
  removedCodes: ['027', '028'],  // τέλος επιτηδεύματος abolished
};

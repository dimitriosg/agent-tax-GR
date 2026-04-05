import type { TaxConfig } from './types.js';

/**
 * FY2025 Tax Configuration
 * Filing season: 16/03/2026 – 15/07/2026
 * Base law: N.4172/2013 (ΚΦΕ) as amended
 * Key changes: CO2-based car τεκμήριο, 30% housing reduction, min wage €950
 */
export const FY2025: TaxConfig = {
  year: 2025,
  minimumWage: 950,  // ← Updated from €830

  // Art.15 — Employment & pension brackets (unchanged from FY2024)
  employmentBrackets: [
    { from: 0,     to: 10_000, rate: 0.09 },
    { from: 10_000, to: 20_000, rate: 0.22 },
    { from: 20_000, to: 30_000, rate: 0.28 },
    { from: 30_000, to: 40_000, rate: 0.36 },
    { from: 40_000, to: Infinity, rate: 0.44 },
  ],

  // Real estate income brackets (unchanged)
  realEstateBrackets: [
    { from: 0,      to: 12_000, rate: 0.15 },
    { from: 12_000, to: Infinity, rate: 0.35 },
  ],

  // Capital income flat rates (unchanged)
  dividendRate: 0.05,
  interestRate: 0.15,
  royaltyRate: 0.20,
  capitalGainsRate: 0.15,

  // Art.16 reduction (unchanged)
  art16Reductions: [
    { dependents: 0, baseReduction: 777 },
    { dependents: 1, baseReduction: 810 },
    { dependents: 2, baseReduction: 900 },
    { dependents: 3, baseReduction: 1_120 },
    { dependents: 4, baseReduction: 1_340 },
    { dependents: 5, baseReduction: 1_780 },
  ],
  art16PhaseoutStart: 12_000,
  art16PhaseoutRate: 0.04,

  // Electronic payments (Art.15 par.6): 25% of income, 20% penalty — unchanged
  electronicPaymentRequiredPercent: 0.25,
  electronicPaymentPenaltyRate: 0.20,

  // Τεκμήρια tables — FY2025 adds CO2 table + housing discount
  tekmiria: {
    // cc-based table: still applies to cars registered before 1/11/2010
    carCC: [
      { maxCC: 1_200,   annualPresumption: 1_000 },
      { maxCC: 1_800,   annualPresumption: 2_350 },
      { maxCC: 2_500,   annualPresumption: 4_200 },
      { maxCC: 3_000,   annualPresumption: 6_300 },
      { maxCC: Infinity, annualPresumption: 7_200 },
    ],
    // CO2-based table (new for FY2025, codes 789–792)
    // Cars registered after 1/11/2010 use this instead
    // Placeholder tiers — exact thresholds TBD from AADE published table
    carCO2: [
      { maxCO2: 90,      annualPresumption: 500 },
      { maxCO2: 120,     annualPresumption: 800 },
      { maxCO2: 150,     annualPresumption: 1_200 },
      { maxCO2: 180,     annualPresumption: 2_000 },
      { maxCO2: 220,     annualPresumption: 3_500 },
      { maxCO2: Infinity, annualPresumption: 5_000 },
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
      // NEW FY2025: 30% discount for zones with objective value ≤ €2,799/m²
      lowValueZoneDiscount: 0.30,
      lowValueZoneThreshold: 2_799,
    },
    domesticStaffPerPerson: 6_000,
    poolOutdoor: 16_000,
    poolIndoor: 24_000,
  },

  // Art.28A–28D (min wage updated)
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
    // KAD sector averages — FY2024 published figures (ΜΕΣΟΣ ΚΥΚΛΟΣ ΕΡΓΑΣΙΩΝ 2024)
    // Sample confirmed entries; full table to be refreshed from AADE publication
    kadAverages: [
      { code: '01.61', description: 'Υποστηρικτικές δραστηριότητες για καλλιέργειες', businessCount: 3_042, averageTurnover: 23_599 },
      { code: '01.62', description: 'Υποστηρικτικές δραστηριότητες κτηνοτροφίας', businessCount: 65, averageTurnover: 53_913 },
      { code: '01.63', description: 'Δραστηριότητες μετά τη συγκομιδή', businessCount: 286, averageTurnover: 33_106 },
      { code: '10.11', description: 'Επεξεργασία κρέατος', businessCount: 63, averageTurnover: 355_217 },
      { code: '10.71', description: 'Αρτοποιία', businessCount: 5_183, averageTurnover: 115_994 },
      { code: '11.01', description: 'Απόσταξη οινοπνευματωδών ποτών', businessCount: 474, averageTurnover: 17_642 },
      { code: '11.02', description: 'Παραγωγή οίνου', businessCount: 487, averageTurnover: 83_267 },
    ],
  },

  // Prepayment rates
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

  // FY2025 code changes
  newCodes: ['789', '790', '791', '792', '877', '878', '879', '047', '048'],
  removedCodes: ['027', '028'],
};

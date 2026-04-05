/**
 * Tax configuration types — defines the shape of yearly config files.
 * All yearly-changing values live here, not scattered through logic.
 */

export interface TaxBracket {
  readonly from: number;
  readonly to: number;       // Infinity for last bracket
  readonly rate: number;     // Decimal (0.09, 0.22, etc.)
}

export interface Art16ReductionTier {
  readonly dependents: number;   // 0, 1, 2, 3, 4, 5 (5 = 5+)
  readonly baseReduction: number;
}

export interface CarCCTekmirioTier {
  readonly maxCC: number;        // Infinity for last tier
  readonly annualPresumption: number;
}

export interface CarCO2TekmirioTier {
  readonly maxCO2: number;       // Infinity for last tier
  readonly annualPresumption: number;
}

export interface HousingTekmirioConfig {
  readonly primaryOwned: {
    readonly firstSqmLimit: number;
    readonly firstSqmRate: number;
    readonly aboveRate: number;
  };
  readonly secondaryOwned: {
    readonly ratePerSqm: number;
  };
  readonly lowValueZoneDiscount?: number;      // FY2025: 0.30
  readonly lowValueZoneThreshold?: number;     // FY2025: 2799 €/m²
}

export interface TriennialMultiplier {
  readonly maxYears: number;     // Infinity for last tier
  readonly multiplier: number;   // 1.0, 1.1, 1.2, etc.
}

export interface KadSectorAverage {
  readonly code: string;         // 2-digit KAD code
  readonly description: string;
  readonly businessCount: number;
  readonly averageTurnover: number;
}

export interface TaxConfig {
  readonly year: number;
  readonly minimumWage: number;  // κατώτατος μισθός

  // Income tax brackets (Art.15)
  readonly employmentBrackets: readonly TaxBracket[];
  readonly realEstateBrackets: readonly TaxBracket[];

  // Capital income flat rates
  readonly dividendRate: number;
  readonly interestRate: number;
  readonly royaltyRate: number;
  readonly capitalGainsRate: number;

  // Art.16 reduction
  readonly art16Reductions: readonly Art16ReductionTier[];
  readonly art16PhaseoutStart: number;    // €12,000
  readonly art16PhaseoutRate: number;     // 0.04

  // Electronic payments (Art.15 par.6)
  readonly electronicPaymentRequiredPercent: number;
  readonly electronicPaymentPenaltyRate: number;

  // Τεκμήρια
  readonly tekmiria: {
    readonly carCC: readonly CarCCTekmirioTier[];
    readonly carCO2?: readonly CarCO2TekmirioTier[];  // FY2025+
    readonly housing: HousingTekmirioConfig;
    readonly domesticStaffPerPerson: number;
    readonly poolOutdoor: number;
    readonly poolIndoor: number;
  };

  // Art.28A–28D
  readonly art28: {
    readonly triennialMultipliers: readonly TriennialMultiplier[];
    readonly maxEmployeeGrossForAlpha: number;  // €30,000
    readonly maxBetaAmount: number;              // €15,000
    readonly betaPayrollPercent: number;         // 0.10
    readonly gammaPercent: number;               // 0.05
    readonly gammaTurnoverThreshold: number;     // €10,000
    readonly hardCap: number;                    // €50,000
    readonly kadAverages: readonly KadSectorAverage[];
  };

  // Prepayment rates
  readonly prepaymentRate: {
    readonly employment: number;
    readonly business: number;
    readonly agricultural: number;
    readonly realEstate: number;
  };

  // Luxury living tax rates
  readonly luxuryTax: {
    readonly rate5: number;    // 5%
    readonly rate13: number;   // 13%
  };

  // Codes added/removed this year
  readonly newCodes: readonly string[];
  readonly removedCodes: readonly string[];
}

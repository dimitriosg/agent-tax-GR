/**
 * E1 Declaration data types — maps to Sheet 1 (ΔΕΔΟΜΕΝΑ ΔΗΛΩΣΗΣ) structure.
 * Input monetary values are integers (whole euros). Calculated results may
 * include up to 2 decimal places due to rate-based arithmetic (round2).
 */

// ─── Income Types ───────────────────────────────────────────────────────────

export type IncomeType =
  | 'employment'       // Μισθωτές υπηρεσίες
  | 'pension'          // Συντάξεις
  | 'merchantNavy'     // Εμποροναυτικό
  | 'agricultural'     // Αγροτική επιχείρηση
  | 'business'         // Επιχειρηματική δραστηριότητα
  | 'imputedProperty'  // Τεκμαρτό εισόδημα ακινήτων (par.4 art.21)
  | 'realEstate'       // Εισόδημα ακίνητης περιουσίας
  | 'capital'          // Μερίσματα / Τόκοι / Δικαιώματα
  | 'capitalGains'     // Υπεραξία κεφαλαίου
  | 'foreign';         // Αλλοδαπή αμοιβή

export type CapitalSubtype = 'dividends' | 'interest' | 'royalties' | 'securitiesGains';

// ─── Taxpayer Profile ────────────────────────────────────────────────────────

export interface TaxpayerProfile {
  afm: string;                     // ΑΦΜ (9-digit)
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  jointFiling: boolean;            // N.5162/2024: joint is now mandatory default
  dependents: number;              // Number of dependent children
  dependentAfms?: string[];        // κωδ. 877–879 (FY2025+)
  isDisabled: boolean;             // Disability > 67%
  disabilityPercent?: number;      // Exact disability percentage
}

// ─── Income Declaration ──────────────────────────────────────────────────────

export interface IncomeDeclaration {
  employment: number;              // κωδ. 301–302
  pension: number;                 // κωδ. 303–304
  merchantNavy: number;            // κωδ. 305–306
  agricultural: number;            // κωδ. 313–314
  business: number;                // κωδ. 401–402
  imputedProperty: number;         // κωδ. 403–404
  realEstate: number;              // κωδ. 105–110
  dividends: number;               // κωδ. 291–292
  interest: number;                // κωδ. 293–294
  royalties: number;               // κωδ. 295–296
  capitalGains: number;            // κωδ. 297–298
  foreign: number;                 // κωδ. 389–390
}

// ─── Withholding & Prepayment ────────────────────────────────────────────────

export interface WithholdingData {
  taxWithheld: number;             // κωδ. 315–320 (φόρος παρακρατηθείς)
  priorYearPrepayment: number;     // Προκαταβολή φόρου προηγ. έτους
}

// ─── Deductions & Reductions ─────────────────────────────────────────────────

export interface Deductions {
  donations: number;               // Art.19 donations
  medicalExpenses: number;         // Medical expenses
  disabilityReduction: number;     // Art.17 disability reduction
  energyUpgrade: number;           // Art.39B energy upgrade
  investmentLaw: number;           // Investment law reductions
  rentalExemption: number;         // κωδ. 119–120 (FY2024+)
  tipsExemption: number;           // κωδ. 689–692 (FY2024+)
}

// ─── Electronic Payments (Art.15 par.6) ──────────────────────────────────────

export interface ElectronicPayments {
  totalElectronic: number;         // Total electronic payment amount for the year
}

// ─── Τεκμήρια (Presumptive Expenses) ─────────────────────────────────────────

export interface HousingData {
  primaryResidence: {
    sqm: number;
    owned: boolean;
    annualRent?: number;           // If rented
    objectiveValuePerSqm?: number; // For FY2025 30% reduction check
  };
  secondaryResidences: Array<{
    sqm: number;
    owned: boolean;
    annualRent?: number;
    objectiveValuePerSqm?: number;
  }>;
}

export interface CarData {
  cc: number;                      // Engine displacement in cc
  co2?: number;                    // CO2 g/km (for FY2025+)
  registeredAfterNov2010: boolean; // For FY2025 CO2 switch
}

export interface TekmiriaInputs {
  housing: HousingData;
  cars: CarData[];
  domesticStaff: number;          // Number of domestic employees
  privateSchoolFees: number;      // Actual amount
  swimmingPool: 'none' | 'outdoor' | 'indoor';
  acquisitions: {
    vehiclePurchase?: { price: number; cc: number };
    realEstatePurchase?: number;
    businessPurchase?: number;
  };
}

// ─── Art.28A–28D Self-Employed ───────────────────────────────────────────────

export interface SelfEmployedInputs {
  isExempt: boolean;               // Layer 1 exemption gate
  exemptReason?: 'farmer' | 'blockaki' | 'insuranceIntermediary' |
                 'disability80plus' | 'villageCafe' | 'firstThreeYears';
  yearsOfOperation: number;        // For triennial multiplier
  highestEmployeeGross: number;    // Highest-paid employee annual gross
  annualPayrollCost: number;       // Total annual payroll
  annualTurnover: number;          // For γ component
  kadCode: string;                 // 2-digit KAD sector code
  operatingDays: number;           // Active days in year (default 365)
  suspensionPeriods: Array<{       // Up to 2 suspension periods tracked
    startDay: number;              // Day of year (1-365), 0 = not set
    endDay: number;                // Day of year (1-365), 0 = not set
  }>;
  restrictedOperationPeriods: Array<{ // Restricted operation periods
    startDay: number;
    endDay: number;
  }>;
  yearOfOperation: number;         // Actual year (4th, 5th, etc.)
  hasDisabledChildren: boolean;    // Art.28Γ par.2–3
  qualifiesFor30Reduction: boolean; // FY2025: new 30% reduction category (Row 39)
  art5GFlatTax: boolean;           // Art.5Γ flat-tax regime elected
  salaryIncome: number;            // For Art.28Β subtraction
  agriculturalIncome: number;      // For Art.28Β subtraction
  isSmallMunicipality: boolean;    // <500 residents (FY2025, Art.6 N.5162/2024)
  isSchoolCafeteriaOperator: boolean; // κωδ. 045-046 — cannot combine with 047-048
}

// ─── Full Declaration ────────────────────────────────────────────────────────

export interface RentalReturnData {
  dependentAfm?: string;           // κωδ. 877–879
  leaseDeclarationNumber?: string; // Required for rental return
  ownerAfm?: string;               // κωδ. 419–420
  propertySqm?: number;            // FY2025: area in m²
}

export interface E1Declaration {
  fiscalYear: number;
  taxpayer: TaxpayerProfile;
  spouse?: TaxpayerProfile;
  income: IncomeDeclaration;
  spouseIncome?: IncomeDeclaration;
  withholding: WithholdingData;
  deductions: Deductions;
  electronicPayments: ElectronicPayments;
  tekmiria: TekmiriaInputs;
  selfEmployed?: SelfEmployedInputs;
  rentalReturn?: RentalReturnData; // FY2025: student housing rent reimbursement
  newBusinessCodes?: {             // FY2025: new codes 437–440
    code437?: number;
    code438?: number;
    code439?: number;
    code440?: number;
  };
}

// ─── Calculation Results ─────────────────────────────────────────────────────

export interface BracketResult {
  bracket: { from: number; to: number; rate: number };
  taxableInBracket: number;
  taxInBracket: number;
}

export interface TaxBreakdown {
  employment: number;
  pension: number;
  merchantNavy: number;
  agricultural: number;
  business: number;
  imputedProperty: number;
  realEstate: number;
  capital: number;
  capitalGains: number;
  foreign: number;
}

export interface SettlementResult {
  // Row references from ΕΚΚΑΘΑΡΙΣΗ sheet (FY2025 row numbers, shifted +1 from FY2024)
  declaredIncome: number;          // R6 (raw declared)
  art28AdjustedIncome: number;     // R6/R7 conditional: Art.28A-adjusted if minimum > declared
  tekmiriaExcess: number;          // R7/R8
  incomeReductions: number;        // R9
  totalTaxableIncome: number;      // R10
  taxByType: TaxBreakdown;         // R14–R22
  totalScaleTax: number;           // R23
  art16Reduction: number;          // R24
  remainingScaleTax: number;       // R25
  electronicPaymentSurcharge: number; // R26
  totalMainTax: number;            // R27
  taxReductions: number;           // R28
  finalTaxDue: number;             // R29
  priorYearPrepayment: number;     // R30
  withheldTax: number;             // R31
  nextYearPrepayment: number;      // R32
  totalTaxForPayment: number;      // R35
  digitalTransactionFee: number;   // R36
  totalTaxesAndFees: number;       // R38
  luxuryLivingTax: number;         // R39
  lateFilingInterest: number;      // R40
  grandTotal: number;              // R41
  finalPaymentOrRefund: number;    // R43 (negative = refund)
}

// ─── Alert System ────────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  code: string;
  severity: AlertSeverity;
  field?: string;                  // E1 code reference (e.g., '027')
  message: string;
  suggestion?: string;
}

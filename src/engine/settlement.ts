import type { TaxConfig } from '../config/types.js';
import type {
  E1Declaration,
  SettlementResult,
} from './types.js';
import { calculateAllIncomeTax, sumDeclaredIncome } from './brackets.js';
import { calculateArt16Reduction } from './art16.js';
import { calculateTekmiria, calculateTekmiriaExcess } from './tekmiria.js';
import { calculateArt28Minimum } from './art28.js';

/**
 * Full settlement calculation spine — mirrors the ΕΚΚΑΘΑΡΙΣΗ sheet.
 * Takes a complete E1 declaration and returns the final payment/refund amount.
 *
 * Flow (Row references from Section 4 of project summary):
 * R6  → Declared income
 * R7/8 → + Τεκμήρια excess
 * R9  → − Income reductions
 * R10 → Total taxable income
 * R14–R22 → Tax by income type
 * R23 → Total scale tax
 * R24 → − Art.16 reduction
 * R25 → Remaining scale tax
 * R26 → + Electronic payment surcharge
 * R27 → Total main tax
 * R28 → − Tax reductions
 * R29 → Final tax due
 * R30 → − Prior year prepayment
 * R31 → − Withheld tax
 * R32 → + Next year prepayment
 * R35 → Total tax for payment
 * R36 → + Digital transaction fee
 * R38 → Total taxes and fees
 * R39 → + Luxury living tax
 * R40 → + Late filing interest
 * R41 → Grand total
 * R43 → Final payment or refund
 */

export function calculateSettlement(
  declaration: E1Declaration,
  config: TaxConfig,
): SettlementResult {
  // R6 — Declared income
  const declaredIncome = sumDeclaredIncome(declaration.income);

  // FY2025 NEW: Art.28A minimum income check (rows 335–337 of ΕΚΚΑΘΑΡΙΣΗ)
  // If self-employed and Art.28A minimum > declared business income,
  // the minimum replaces the declared business income in the taxable base.
  const art28Adjustment = calculateArt28IncomeAdjustment(declaration, config);
  const art28AdjustedIncome = declaredIncome + art28Adjustment;

  // Tekmiria calculation
  const tekmiriaResult = calculateTekmiria(declaration.tekmiria, config);

  // R7/R8 — Tekmiria excess (compare against adjusted income)
  const tekmiriaExcess = calculateTekmiriaExcess(art28AdjustedIncome, tekmiriaResult.totalPresumptive);

  // R9 — Income reductions (donations, grants, etc.)
  const incomeReductions =
    declaration.deductions.donations +
    declaration.deductions.rentalExemption +
    declaration.deductions.tipsExemption;

  // R10 — Total taxable income
  const totalTaxableIncome = Math.max(0, art28AdjustedIncome + tekmiriaExcess - incomeReductions);

  // For tax calculation, use the income breakdown (not the aggregate)
  // Art.28A excess and tekmiria excess are added to the primary income type
  const adjustedIncome = { ...declaration.income };
  if (art28Adjustment > 0) {
    adjustedIncome.business += art28Adjustment;
  }
  if (tekmiriaExcess > 0) {
    adjustedIncome.employment += tekmiriaExcess;
  }

  // R14–R22 — Tax by income type
  const { byType: taxByType, total: totalScaleTax } = calculateAllIncomeTax(
    adjustedIncome,
    config,
  );

  // R24 — Art.16 reduction (only for employment + pension income)
  const employmentPensionIncome =
    declaration.income.employment + declaration.income.pension;
  const art16 = calculateArt16Reduction(
    employmentPensionIncome,
    declaration.taxpayer.dependents,
    config,
  );
  const art16Reduction = art16.finalReduction;

  // R25 — Remaining scale tax
  const remainingScaleTax = Math.max(0, round2(totalScaleTax - art16Reduction));

  // R26 — Electronic payment surcharge (Art.15 par.6)
  const electronicPaymentSurcharge = calculateElectronicPaymentSurcharge(
    declaration,
    config,
  );

  // R27 — Total main tax
  const totalMainTax = round2(remainingScaleTax + electronicPaymentSurcharge);

  // R28 — Tax reductions
  const taxReductions = round2(
    declaration.deductions.disabilityReduction +
    declaration.deductions.energyUpgrade +
    declaration.deductions.investmentLaw +
    declaration.deductions.medicalExpenses,
  );

  // R29 — Final tax due
  const finalTaxDue = Math.max(0, round2(totalMainTax - taxReductions));

  // R30 — Prior year prepayment
  const priorYearPrepayment = declaration.withholding.priorYearPrepayment;

  // R31 — Withheld tax
  const withheldTax = declaration.withholding.taxWithheld;

  // R32 — Next year prepayment
  const nextYearPrepayment = calculateNextYearPrepayment(
    finalTaxDue,
    declaration,
    config,
  );

  // R35 — Total tax for payment
  const totalTaxForPayment = round2(
    finalTaxDue - priorYearPrepayment - withheldTax + nextYearPrepayment,
  );

  // R36 — Digital transaction fee (N.5135/2024 Art.7)
  const digitalTransactionFee = calculateDigitalTransactionFee(declaration);

  // R38 — Total taxes and fees
  const totalTaxesAndFees = round2(totalTaxForPayment + digitalTransactionFee);

  // R39 — Luxury living tax
  const luxuryLivingTax = calculateLuxuryLivingTax(declaration, config);

  // R40 — Late filing interest (0 if filed on time)
  const lateFilingInterest = 0;

  // R41 — Grand total
  const grandTotal = round2(totalTaxesAndFees + luxuryLivingTax + lateFilingInterest);

  // R43 — Final payment or refund (negative = refund)
  const finalPaymentOrRefund = grandTotal;

  return {
    declaredIncome,
    art28AdjustedIncome,
    tekmiriaExcess,
    incomeReductions,
    totalTaxableIncome,
    taxByType,
    totalScaleTax,
    art16Reduction,
    remainingScaleTax,
    electronicPaymentSurcharge,
    totalMainTax,
    taxReductions,
    finalTaxDue,
    priorYearPrepayment,
    withheldTax,
    nextYearPrepayment,
    totalTaxForPayment,
    digitalTransactionFee,
    totalTaxesAndFees,
    luxuryLivingTax,
    lateFilingInterest,
    grandTotal,
    finalPaymentOrRefund,
  };
}

// ─── Art.28A Income Adjustment (FY2025 rows 335–337) ─────────────────────

function calculateArt28IncomeAdjustment(
  declaration: E1Declaration,
  config: TaxConfig,
): number {
  if (!declaration.selfEmployed) return 0;
  if (declaration.income.business <= 0) return 0;

  const art28Result = calculateArt28Minimum(declaration.selfEmployed, config);
  if (art28Result.isExempt) return 0;

  // If minimum > declared business income, the excess is added to taxable base
  const excess = art28Result.finalMinimum - declaration.income.business;
  return Math.max(0, excess);
}

// ─── Electronic Payment Surcharge (Art.15 par.6) ──────────────────────────

function calculateElectronicPaymentSurcharge(
  declaration: E1Declaration,
  config: TaxConfig,
): number {
  const requiredAmount = round2(
    (declaration.income.employment + declaration.income.pension) *
    config.electronicPaymentRequiredPercent,
  );

  const shortfall = Math.max(0, requiredAmount - declaration.electronicPayments.totalElectronic);

  if (shortfall <= 0) return 0;

  // Penalty: 20% of the shortfall
  return round2(shortfall * config.electronicPaymentPenaltyRate);
}

// ─── Next Year Prepayment (R32) ───────────────────────────────────────────

function calculateNextYearPrepayment(
  finalTaxDue: number,
  declaration: E1Declaration,
  config: TaxConfig,
): number {
  const hasBusiness = declaration.income.business > 0;
  const hasAgricultural = declaration.income.agricultural > 0;
  if (!hasBusiness && !hasAgricultural) return 0;

  // Agricultural-only income uses the agricultural prepayment rate
  const rate = !hasBusiness && hasAgricultural
    ? config.prepaymentRate.agricultural
    : config.prepaymentRate.business;
  return round2(finalTaxDue * rate);
}

// ─── Digital Transaction Fee (N.5135/2024 Art.7) ──────────────────────────

function calculateDigitalTransactionFee(declaration: E1Declaration): number {
  // Applies to rental income — stamp duty replacement
  if (declaration.income.realEstate <= 0) return 0;

  // 3.6% of rental income (standard stamp duty rate replacement)
  return round2(declaration.income.realEstate * 0.036);
}

// ─── Luxury Living Tax (R39) ──────────────────────────────────────────────

function calculateLuxuryLivingTax(
  declaration: E1Declaration,
  config: TaxConfig,
): number {
  let tax = 0;

  // Pool luxury tax
  if (declaration.tekmiria.swimmingPool === 'outdoor') {
    tax += config.tekmiria.poolOutdoor * config.luxuryTax.rate5;
  } else if (declaration.tekmiria.swimmingPool === 'indoor') {
    tax += config.tekmiria.poolIndoor * config.luxuryTax.rate13;
  }

  // High-cc car luxury tax
  for (const car of declaration.tekmiria.cars) {
    if (car.cc > 2_500) {
      // Cars > 2500cc attract luxury living tax
      const carTekmirio = car.cc > 3_000
        ? config.tekmiria.carCC[4].annualPresumption
        : config.tekmiria.carCC[3].annualPresumption;
      tax += carTekmirio * config.luxuryTax.rate5;
    }
  }

  return round2(tax);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

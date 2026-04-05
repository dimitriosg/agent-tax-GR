import type { TaxConfig } from '../config/types.js';
import type { E1Declaration, Alert } from './types.js';
import { sumDeclaredIncome } from './brackets.js';
import { calculateTekmiria } from './tekmiria.js';

/**
 * Alert & validation engine — mirrors Rows 117–121 of ΕΚΚΑΘΑΡΙΣΗ.
 * Generates warnings, errors, and savings suggestions.
 */

/**
 * Run all validations and generate alerts.
 */
export function evaluateAlerts(
  declaration: E1Declaration,
  config: TaxConfig,
): Alert[] {
  const alerts: Alert[] = [];

  alerts.push(...validateAfm(declaration));
  alerts.push(...validateMaritalStatus(declaration));
  alerts.push(...validateElectronicPayments(declaration, config));
  alerts.push(...validateTekmiria(declaration, config));
  alerts.push(...validateRemovedCodes(config));
  alerts.push(...validateMissingCodes(declaration, config));
  alerts.push(...validateBusinessIncomeConsistency(declaration, config));
  alerts.push(...validateArt28Consistency(declaration, config));
  alerts.push(...validateWithholdingLimits(declaration));
  alerts.push(...validateRentalReturn(declaration, config));
  alerts.push(...detectSavingsOpportunities(declaration, config));

  return alerts;
}

// ─── AFM Validation ───────────────────────────────────────────────────────

function validateAfm(declaration: E1Declaration): Alert[] {
  const alerts: Alert[] = [];

  if (!isValidAfm(declaration.taxpayer.afm)) {
    alerts.push({
      code: 'AFM_INVALID',
      severity: 'critical',
      field: 'afm',
      message: 'Μη έγκυρος ΑΦΜ — ο έλεγχος ψηφίου επαλήθευσης απέτυχε.',
      suggestion: 'Ελέγξτε τον ΑΦΜ σας στο TaxisNet.',
    });
  }

  return alerts;
}

/**
 * Validate Greek AFM check digit (modulo 11 algorithm).
 */
export function isValidAfm(afm: string): boolean {
  if (!/^\d{9}$/.test(afm)) return false;

  const digits = afm.split('').map(Number);
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    sum += digits[i] * Math.pow(2, 8 - i);
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 0 : remainder;

  return checkDigit === digits[8];
}

// ─── Marital Status ───────────────────────────────────────────────────────

function validateMaritalStatus(declaration: E1Declaration): Alert[] {
  const alerts: Alert[] = [];

  // N.5162/2024: joint filing is mandatory for married couples
  if (declaration.taxpayer.maritalStatus === 'married' && !declaration.taxpayer.jointFiling) {
    alerts.push({
      code: 'JOINT_FILING_REQUIRED',
      severity: 'high',
      message: 'Από το ΦΕ 2024, η κοινή δήλωση είναι υποχρεωτική για έγγαμους (Ν.5162/2024).',
      suggestion: 'Η χωριστή δήλωση επιτρέπεται μόνο κατ\' εξαίρεση.',
    });
  }

  return alerts;
}

// ─── Electronic Payments ──────────────────────────────────────────────────

function validateElectronicPayments(
  declaration: E1Declaration,
  config: TaxConfig,
): Alert[] {
  const alerts: Alert[] = [];

  const requiredAmount =
    (declaration.income.employment + declaration.income.pension) *
    config.electronicPaymentRequiredPercent;

  if (requiredAmount > 0 &&
      declaration.electronicPayments.totalElectronic < requiredAmount) {
    const shortfall = Math.round(requiredAmount - declaration.electronicPayments.totalElectronic);
    const pct = Math.round(config.electronicPaymentRequiredPercent * 100);
    const penaltyPct = Math.round(config.electronicPaymentPenaltyRate * 100);
    alerts.push({
      code: 'ELECTRONIC_PAYMENTS_SHORT',
      severity: 'high',
      field: 'electronicPayments',
      message: `Δεν καλύπτεται το ελάχιστο ${pct}% ηλεκτρονικών πληρωμών. Υπολείπονται €${shortfall}.`,
      suggestion: `Η υστέρηση θα επιβαρυνθεί με ${penaltyPct}% πρόσθετο φόρο (Άρθ.15 παρ.6).`,
    });
  }

  return alerts;
}

// ─── Tekmiria ─────────────────────────────────────────────────────────────

function validateTekmiria(
  declaration: E1Declaration,
  config: TaxConfig,
): Alert[] {
  const alerts: Alert[] = [];

  const declared = sumDeclaredIncome(declaration.income);
  const tekmiria = calculateTekmiria(declaration.tekmiria, config);

  if (tekmiria.totalPresumptive > declared) {
    const excess = Math.round(tekmiria.totalPresumptive - declared);
    alerts.push({
      code: 'TEKMIRIA_EXCESS',
      severity: 'high',
      message: `Τα τεκμήρια (€${tekmiria.totalPresumptive.toLocaleString('el-GR')}) υπερβαίνουν το δηλωθέν εισόδημα κατά €${excess.toLocaleString('el-GR')}.`,
      suggestion: 'Η διαφορά θα φορολογηθεί. Ελέγξτε αν δικαιούστε εξαίρεση ή αν υπάρχει εισόδημα που δεν δηλώθηκε.',
    });
  }

  return alerts;
}

// ─── Removed Codes ────────────────────────────────────────────────────────

function validateRemovedCodes(config: TaxConfig): Alert[] {
  const alerts: Alert[] = [];

  if (config.removedCodes.includes('027') || config.removedCodes.includes('028')) {
    alerts.push({
      code: 'TELOS_EPITIDEUMATOS_REMOVED',
      severity: 'medium',
      field: '027-028',
      message: 'Το τέλος επιτηδεύματος (κωδ. 027–028) καταργήθηκε από το ΦΕ 2024 (Ν.5162/2024).',
    });
  }

  return alerts;
}

// ─── Missing Codes ────────────────────────────────────────────────────────

function validateMissingCodes(
  declaration: E1Declaration,
  config: TaxConfig,
): Alert[] {
  const alerts: Alert[] = [];

  // Check if dependent AFMs are provided (FY2025+ requirement)
  if (config.newCodes.includes('877') &&
      declaration.taxpayer.dependents > 0 &&
      (!declaration.taxpayer.dependentAfms ||
       declaration.taxpayer.dependentAfms.length < declaration.taxpayer.dependents)) {
    alerts.push({
      code: 'MISSING_DEPENDENT_AFM',
      severity: 'medium',
      field: '877-879',
      message: 'Απαιτείται ΑΦΜ για κάθε προστατευόμενο τέκνο (κωδ. 877–879).',
    });
  }

  return alerts;
}

// ─── Business Income Consistency (FY2025 new rules) ───────────────────────

function validateBusinessIncomeConsistency(
  declaration: E1Declaration,
  config: TaxConfig,
): Alert[] {
  const alerts: Alert[] = [];

  // Rule: κωδ. 307–308 declared without 019–020 selected in Πίν.2
  // (income declared but employment status not selected)
  if ((declaration.income.employment > 0 || declaration.income.pension > 0) &&
      declaration.income.business > 0) {
    // Check for school cafeteria + rural area conflict (κωδ. 045-046 vs 047-048)
    if (declaration.selfEmployed?.isSchoolCafeteriaOperator &&
        declaration.selfEmployed?.isSmallMunicipality) {
      alerts.push({
        code: 'CAFETERIA_RURAL_CONFLICT',
        severity: 'high',
        field: '045-048',
        message: 'Κωδ. 045–046 (σχολικά κυλικεία) δεν μπορεί να συνδυαστεί με κωδ. 047–048 (μείωση 50% μικρών δήμων).',
      });
    }
  }

  // FY2025: new codes 437–440 consistency
  if (config.newCodes.includes('437') && declaration.newBusinessCodes) {
    const { code437, code438, code439, code440 } = declaration.newBusinessCodes;
    const hasNewCodes = (code437 ?? 0) > 0 || (code438 ?? 0) > 0 ||
                        (code439 ?? 0) > 0 || (code440 ?? 0) > 0;
    if (hasNewCodes && declaration.income.business === 0) {
      alerts.push({
        code: 'NEW_BUSINESS_CODES_NO_INCOME',
        severity: 'high',
        field: '437-440',
        message: 'Κωδ. 437–440 συμπληρώθηκαν χωρίς δηλωθέν επιχειρηματικό εισόδημα.',
      });
    }
  }

  return alerts;
}

// ─── Art.28A Consistency (FY2025 new rules) ───────────────────────────────

function validateArt28Consistency(
  declaration: E1Declaration,
  _config: TaxConfig,
): Alert[] {
  const alerts: Alert[] = [];

  // Rule: codes 405–406 should not be filled when Art.28A exemption applies
  if (declaration.selfEmployed?.isExempt && declaration.income.business > 0) {
    alerts.push({
      code: 'ART28A_EXEMPT_WITH_CODES',
      severity: 'medium',
      field: '405-406',
      message: 'Εξαίρεση Άρθ.28Α ισχύει αλλά έχουν συμπληρωθεί κωδ. 405–406. Ελέγξτε αν πρέπει να αφαιρεθούν.',
    });
  }

  return alerts;
}

// ─── Withholding Tax Limits (FY2025 new rules) ────────────────────────────

function validateWithholdingLimits(declaration: E1Declaration): Alert[] {
  const alerts: Alert[] = [];

  // New rule: withholding tax cannot exceed total income by source
  const totalIncome = sumDeclaredIncome(declaration.income);
  if (totalIncome > 0 && declaration.withholding.taxWithheld > totalIncome) {
    alerts.push({
      code: 'WITHHOLDING_EXCEEDS_INCOME',
      severity: 'high',
      field: 'withholding',
      message: `Ο παρακρατηθείς φόρος (€${declaration.withholding.taxWithheld.toLocaleString('el-GR')}) υπερβαίνει το συνολικό εισόδημα (€${totalIncome.toLocaleString('el-GR')}).`,
      suggestion: 'Ελέγξτε τα ποσά παρακράτησης ανά πηγή εισοδήματος.',
    });
  }

  return alerts;
}

// ─── Rental Return Message (FY2025 rows 261–267) ─────────────────────────

function validateRentalReturn(
  declaration: E1Declaration,
  config: TaxConfig,
): Alert[] {
  const alerts: Alert[] = [];

  // Only applies to FY2025+ with dependent children
  if (config.year < 2025) return alerts;
  if (declaration.taxpayer.dependents === 0) return alerts;

  // Check if rental return data is provided
  if (declaration.rentalReturn) {
    if (!declaration.rentalReturn.dependentAfm) {
      alerts.push({
        code: 'RENTAL_RETURN_MISSING_AFM',
        severity: 'medium',
        field: '877-879',
        message: 'Για επιστροφή ενοικίου σπουδών απαιτείται ΑΦΜ τέκνου (κωδ. 877–879).',
      });
    }
    if (!declaration.rentalReturn.leaseDeclarationNumber) {
      alerts.push({
        code: 'RENTAL_RETURN_MISSING_LEASE',
        severity: 'medium',
        field: '419-420',
        message: 'Για επιστροφή ενοικίου σπουδών απαιτείται αριθμός δήλωσης μίσθωσης.',
      });
    }
  }

  return alerts;
}

// ─── Savings Opportunities ────────────────────────────────────────────────

function detectSavingsOpportunities(
  declaration: E1Declaration,
  config: TaxConfig,
): Alert[] {
  const alerts: Alert[] = [];

  // Check for rental income exemption (κωδ. 119-120)
  if (config.newCodes.includes('119') && declaration.income.realEstate > 0) {
    alerts.push({
      code: 'RENTAL_EXEMPTION_CHECK',
      severity: 'low',
      field: '119-120',
      message: 'Νέα απαλλαγή ενοικίων: ακίνητα ≤120τ.μ., μακροχρόνια μίσθωση ≥3 έτη (8/9/2024–31/12/2025).',
      suggestion: 'Ελέγξτε αν πληροίτε τις προϋποθέσεις για απαλλαγή.',
    });
  }

  // Check for tip exemption (κωδ. 689-692)
  if (config.newCodes.includes('689')) {
    alerts.push({
      code: 'TIP_EXEMPTION_CHECK',
      severity: 'low',
      field: '689-692',
      message: 'Φιλοδωρήματα: έως €300/μήνα αφορολόγητα για εργαζόμενους στην εστίαση.',
      suggestion: 'Αν λαμβάνετε φιλοδωρήματα, δηλώστε τα στους κωδ. 689–692 για απαλλαγή.',
    });
  }

  // FY2025: Check car CO2 savings
  if (config.tekmiria.carCO2 && declaration.tekmiria.cars.length > 0) {
    for (const car of declaration.tekmiria.cars) {
      if (car.registeredAfterNov2010 && car.co2 == null) {
        alerts.push({
          code: 'CO2_DATA_MISSING',
          severity: 'medium',
          message: `Αυτοκίνητο ${car.cc}cc: δεν έχουν δηλωθεί εκπομπές CO2. Με CO2 μπορεί να μειωθεί το τεκμήριο έως 73.7%.`,
          suggestion: 'Βρείτε τις εκπομπές CO2 στην άδεια κυκλοφορίας ή στο mytaxisnet.',
        });
      }
    }
  }

  // Check for disability reduction
  if (declaration.taxpayer.isDisabled && declaration.deductions.disabilityReduction === 0) {
    alerts.push({
      code: 'DISABILITY_REDUCTION_UNCLAIMED',
      severity: 'high',
      message: 'Δηλώσατε αναπηρία αλλά δεν αξιοποιήθηκε η μείωση φόρου (Άρθ.17).',
      suggestion: 'Βεβαιωθείτε ότι η πιστοποίηση ΚΕΠΑ είναι ενεργή και δηλωμένη.',
    });
  }

  return alerts;
}

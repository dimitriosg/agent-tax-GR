/**
 * Page scanner — extracts pre-filled values from the TaxisNet E1 form DOM.
 *
 * This module is designed to run inside a Chrome extension content script
 * context where it has access to the host page's DOM. It reads input values
 * from the myAADE E1 form fields and maps them to our internal data model.
 *
 * The mapping is based on the official E1 form field codes (κωδ.) which
 * appear as element IDs, name attributes, or data-code attributes on the
 * TaxisNet portal.
 */

import type { IncomeDeclaration } from '../../engine/types';

// ─── Field Code → Internal Field Mapping ──────────────────────────────────

/**
 * Maps E1 form code numbers to internal IncomeDeclaration field names.
 *
 * Only taxpayer-column codes are included (spouse codes are excluded since
 * we don't scan the spouse column — that would require separate spouseIncome
 * handling which is not yet implemented).
 *
 * Note: Codes 313–314 are agricultural income in the E1 Πίνακα 4Α,
 * while withholding codes (315–320) appear in a separate section.
 */
const INCOME_CODE_MAP: Record<string, keyof IncomeDeclaration> = {
  // Employment & pension (taxpayer column)
  '301': 'employment',
  '303': 'pension',
  '305': 'merchantNavy',
  '313': 'agricultural',
  '401': 'business',
  '403': 'imputedProperty',
  // Real estate — multiple codes for different property types
  '105': 'realEstate',
  '107': 'realEstate',
  '109': 'realEstate',
  // Capital income
  '291': 'dividends',
  '293': 'interest',
  '295': 'royalties',
  '297': 'capitalGains',
  // Foreign
  '389': 'foreign',
};

/**
 * Withholding tax codes (separate from income codes).
 * The E1 form uses codes 315–320 for different withholding sources.
 * We scan all of them and sum the values.
 */
const WITHHOLDING_CODES = ['315', '316', '317', '318', '319', '320'];

// ─── Scan Result Types ────────────────────────────────────────────────────

export interface ScanResult {
  /** Whether the scan completed successfully */
  success: boolean;
  /** Number of fields that had values */
  fieldsFound: number;
  /** Total number of fields scanned */
  fieldsScanned: number;
  /** Extracted income values */
  income: Partial<IncomeDeclaration>;
  /** Extracted withholding tax */
  taxWithheld: number | null;
  /** Human-readable summary for UI feedback */
  summary: string;
}

// ─── DOM Value Extraction ─────────────────────────────────────────────────

/**
 * Attempt to read a numeric value from a DOM element identified by E1 code.
 *
 * The TaxisNet form uses various patterns for field identification:
 *  - id="code_301"
 *  - name="code_301"
 *  - data-code="301"
 *  - id="field301"
 *  - Generic input with adjacent label containing the code number
 */
function readCodeValue(code: string): number | null {
  const selectors = [
    `#code_${code}`,
    `#code${code}`,
    `#field_${code}`,
    `#field${code}`,
    `[name="code_${code}"]`,
    `[name="code${code}"]`,
    `[data-code="${code}"]`,
    `input[id*="${code}"]`,
  ];

  for (const sel of selectors) {
    try {
      const el = document.querySelector<HTMLInputElement>(sel);
      if (el) {
        return parseGreekNumber(el.value);
      }
    } catch {
      // selector parse error or DOM access error
    }
  }

  return null;
}

/**
 * Parse a Greek-locale formatted number string.
 *
 * Greek number format uses dots as thousand separators and comma as decimal:
 *   "12.345,67" → 12345.67
 *   "12345"     → 12345
 *   "1.000"     → 1000
 *
 * Returns the numeric value or null if unparseable.
 */
function parseGreekNumber(raw: string): number | null {
  if (!raw || raw.trim() === '') return null;

  // Remove thousand separators (dots in Greek notation) and replace comma with dot
  const cleaned = raw
    .trim()
    .replace(/\./g, '')       // remove thousand separators
    .replace(',', '.');       // decimal comma → dot

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

// ─── Main Scanner ─────────────────────────────────────────────────────────

/**
 * Scan the current page's DOM for TaxisNet E1 form field values.
 *
 * This function iterates over all known E1 field codes, attempts to read
 * their values from the DOM, and returns a structured result that can be
 * used to pre-fill the sidebar declaration store.
 */
export function scanE1Page(): ScanResult {
  const income: Partial<IncomeDeclaration> = {};
  let fieldsFound = 0;
  let fieldsScanned = 0;
  let taxWithheld: number | null = null;

  // Scan income fields (all codes in the map are taxpayer-column only)
  const incomeCodes = Object.keys(INCOME_CODE_MAP);

  for (const code of incomeCodes) {
    fieldsScanned++;
    const value = readCodeValue(code);
    if (value != null && value > 0) {
      const field = INCOME_CODE_MAP[code];
      // Sum if multiple codes map to the same field (e.g. real estate 105+107+109)
      income[field] = (income[field] ?? 0) + value;
      fieldsFound++;
    }
  }

  // Scan withholding (codes 315–320, summed)
  for (const code of WITHHOLDING_CODES) {
    fieldsScanned++;
    const value = readCodeValue(code);
    if (value != null && value > 0) {
      taxWithheld = (taxWithheld ?? 0) + value;
      fieldsFound++;
    }
  }

  const success = fieldsFound > 0;
  const summary = success
    ? `Βρέθηκαν ${fieldsFound} πεδία από ${fieldsScanned} (${Math.round((fieldsFound / fieldsScanned) * 100)}%)`
    : 'Δεν βρέθηκαν συμπληρωμένα πεδία στη σελίδα.';

  return {
    success,
    fieldsFound,
    fieldsScanned,
    income,
    taxWithheld,
    summary,
  };
}

/**
 * Convenience: detect + scan in one call.
 * Returns the scan result only if the page is a valid TaxisNet E1 form.
 */
export { detectTaxisNetE1Page } from '../lib/taxisnet-detector';

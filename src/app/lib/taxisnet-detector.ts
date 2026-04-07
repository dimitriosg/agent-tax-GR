/**
 * TaxisNet E1 page detector.
 *
 * Determines whether the current browser page is the myAADE / TaxisNet
 * E1 income-tax declaration form so the auto-scan feature only activates
 * in the correct context — avoiding wasted DOM queries on unrelated pages.
 *
 * Detection heuristics (any TWO must match):
 *  1. URL contains a known myAADE / TaxisNet hostname
 *  2. Page title or heading contains "Ε1" or "ΔΗΛΩΣΗ ΦΟΡΟΛΟΓΙΑΣ ΕΙΣΟΔΗΜΑΤΟΣ"
 *  3. The page contains characteristic E1 input field identifiers (e.g. "code_301")
 */

/** Known hostnames for the TaxisNet / myAADE tax portal. */
const TAXISNET_HOSTS = [
  'www1.aade.gr',
  'www1.gsis.gr',
  'myaade.gov.gr',
  'www.aade.gr',
];

/** Characteristic markers found on the E1 form page. */
const E1_PAGE_MARKERS = [
  'Ε1',
  'ΔΗΛΩΣΗ ΦΟΡΟΛΟΓΙΑΣ ΕΙΣΟΔΗΜΑΤΟΣ',
  'ΔΗΛΩΣΗ ΦΟΡΟΛΟΓΙΑΣ',
  'Φορολογική Δήλωση',
];

/** Well-known input element identifiers on the TaxisNet E1 form.
 *
 * TaxisNet uses either `code_NNN` element IDs/names (older portal) or
 * numeric `data-code="NNN"` attributes (newer portal). Signal 3 detection
 * checks for both patterns so the detector stays consistent with what the
 * page-scanner actually reads.
 */
const E1_FIELD_MARKERS_PREFIXED = [
  'code_301', 'code_302',
  'code_303', 'code_304',
  'code_401', 'code_402',
  'code_291', 'code_292',
];

/** Same codes without prefix — used for `data-code="NNN"` style attributes. */
const E1_FIELD_MARKERS_NUMERIC = ['301', '302', '303', '304', '401', '402', '291', '292'];

export interface DetectionResult {
  /** Whether the page is (very likely) the TaxisNet E1 form. */
  isE1Page: boolean;
  /** How many heuristic signals matched (0-3). */
  confidence: number;
  /** Human-readable detection detail for UI feedback. */
  detail: string;
}

/**
 * Detect whether the active browser page is the TaxisNet E1 declaration form.
 *
 * This function is designed to run inside a Chrome extension content script
 * or via `chrome.scripting.executeScript`. It inspects the host page's URL,
 * title, and DOM for characteristic E1 indicators.
 */
export function detectTaxisNetE1Page(): DetectionResult {
  let signals = 0;
  const details: string[] = [];

  // Signal 1 — URL hostname
  try {
    const hostname = window.location.hostname.toLowerCase();
    if (TAXISNET_HOSTS.some((h) => hostname.includes(h))) {
      signals++;
      details.push('URL: myAADE/TaxisNet domain');
    }
  } catch {
    // cross-origin or sandboxed
  }

  // Signal 2 — Page title / heading text
  try {
    const titleText = (document.title || '').toUpperCase();
    const h1Text = document.querySelector('h1, h2, .page-title')?.textContent?.toUpperCase() ?? '';
    const combined = titleText + ' ' + h1Text;
    if (E1_PAGE_MARKERS.some((m) => combined.includes(m.toUpperCase()))) {
      signals++;
      details.push('Title: E1 form heading found');
    }
  } catch {
    // DOM access error
  }

  // Signal 3 — Characteristic E1 input fields in the DOM.
  // Check both prefixed IDs/names (e.g. id="code_301") and numeric data-code
  // attributes (e.g. data-code="301"), matching what page-scanner.ts reads.
  try {
    const foundPrefixed = E1_FIELD_MARKERS_PREFIXED.some(
      (id) =>
        document.getElementById(id) != null ||
        document.querySelector(`[name="${id}"], [data-code="${id}"], [id*="${id}"]`) != null,
    );
    const foundNumeric = E1_FIELD_MARKERS_NUMERIC.some(
      (code) => document.querySelector(`[data-code="${code}"]`) != null,
    );
    if (foundPrefixed || foundNumeric) {
      signals++;
      details.push('DOM: E1 field codes detected');
    }
  } catch {
    // DOM access error
  }

  return {
    isE1Page: signals >= 2,
    confidence: signals,
    detail: details.length > 0 ? details.join('; ') : 'No TaxisNet indicators found',
  };
}

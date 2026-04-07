// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectTaxisNetE1Page } from './taxisnet-detector';

describe('detectTaxisNetE1Page', () => {
  beforeEach(() => {
    // Reset DOM for each test
    document.title = '';
    document.body.innerHTML = '';
  });

  it('returns isE1Page=false when page has no TaxisNet indicators', () => {
    const result = detectTaxisNetE1Page();
    expect(result.isE1Page).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('detects E1 page when title contains Ε1 marker and DOM has field codes', () => {
    document.title = 'ΔΗΛΩΣΗ ΦΟΡΟΛΟΓΙΑΣ ΕΙΣΟΔΗΜΑΤΟΣ - Ε1';
    const input = document.createElement('input');
    input.id = 'code_301';
    document.body.appendChild(input);

    const result = detectTaxisNetE1Page();
    expect(result.confidence).toBeGreaterThanOrEqual(2);
    expect(result.isE1Page).toBe(true);
  });

  it('returns isE1Page=false with only one signal (title only)', () => {
    document.title = 'Ε1 Δήλωση';
    const result = detectTaxisNetE1Page();
    // Title matches but URL and DOM don't → 1 signal → not enough
    expect(result.confidence).toBe(1);
    expect(result.isE1Page).toBe(false);
  });

  it('detects E1 fields by data-code attribute', () => {
    document.title = 'Ε1 Φορολογική Δήλωση';
    const input = document.createElement('input');
    input.setAttribute('data-code', 'code_303');
    document.body.appendChild(input);

    const result = detectTaxisNetE1Page();
    expect(result.confidence).toBeGreaterThanOrEqual(2);
    expect(result.isE1Page).toBe(true);
  });
});

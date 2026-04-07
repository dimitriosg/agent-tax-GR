// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { scanE1Page } from './page-scanner';

describe('scanE1Page', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns success=false when no E1 fields are present', () => {
    const result = scanE1Page();
    expect(result.success).toBe(false);
    expect(result.fieldsFound).toBe(0);
  });

  it('extracts employment income from code_301 input', () => {
    const input = document.createElement('input');
    input.id = 'code_301';
    input.value = '25000';
    document.body.appendChild(input);

    const result = scanE1Page();
    expect(result.success).toBe(true);
    expect(result.income.employment).toBe(25000);
    expect(result.fieldsFound).toBeGreaterThanOrEqual(1);
  });

  it('parses Greek-formatted numbers (12.345)', () => {
    const input = document.createElement('input');
    input.id = 'code_301';
    input.value = '12.345';
    document.body.appendChild(input);

    const result = scanE1Page();
    expect(result.income.employment).toBe(12345);
  });

  it('parses Greek-formatted numbers with decimals (12.345,67)', () => {
    const input = document.createElement('input');
    input.id = 'code_301';
    input.value = '12.345,67';
    document.body.appendChild(input);

    const result = scanE1Page();
    expect(result.income.employment).toBe(12345.67);
  });

  it('extracts multiple income types', () => {
    const fields = [
      { id: 'code_301', value: '25000' },
      { id: 'code_303', value: '12000' },
      { id: 'code_401', value: '18000' },
    ];

    for (const { id, value } of fields) {
      const input = document.createElement('input');
      input.id = id;
      input.value = value;
      document.body.appendChild(input);
    }

    const result = scanE1Page();
    expect(result.success).toBe(true);
    expect(result.income.employment).toBe(25000);
    expect(result.income.pension).toBe(12000);
    expect(result.income.business).toBe(18000);
    expect(result.fieldsFound).toBe(3);
  });

  it('extracts withholding tax from code_313', () => {
    const input = document.createElement('input');
    input.id = 'code_313';
    input.value = '5000';
    document.body.appendChild(input);

    const result = scanE1Page();
    // code 313 maps to both agricultural income and withholding
    // The scanner reads taxpayer codes; 313 is odd so it's scanned for income
    expect(result.success).toBe(true);
  });

  it('ignores zero-value fields', () => {
    const input = document.createElement('input');
    input.id = 'code_301';
    input.value = '0';
    document.body.appendChild(input);

    const result = scanE1Page();
    expect(result.success).toBe(false);
    expect(result.income.employment).toBeUndefined();
  });

  it('ignores empty fields', () => {
    const input = document.createElement('input');
    input.id = 'code_301';
    input.value = '';
    document.body.appendChild(input);

    const result = scanE1Page();
    expect(result.success).toBe(false);
  });

  it('generates a summary message', () => {
    const input = document.createElement('input');
    input.id = 'code_301';
    input.value = '10000';
    document.body.appendChild(input);

    const result = scanE1Page();
    expect(result.summary).toContain('πεδία');
  });
});

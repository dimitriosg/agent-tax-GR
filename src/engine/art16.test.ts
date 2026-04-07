import { describe, it, expect } from 'vitest';
import { calculateArt16Reduction } from './art16.js';
import { FY2024 } from '../config/fy2024.js';

describe('calculateArt16Reduction', () => {
  it('returns 0 for zero income', () => {
    const result = calculateArt16Reduction(0, 0, FY2024);
    expect(result.finalReduction).toBe(0);
  });

  it('gives full base reduction for income ≤ €12,000 (0 dependents)', () => {
    const result = calculateArt16Reduction(10_000, 0, FY2024);
    expect(result.baseReduction).toBe(777);
    expect(result.phaseoutAmount).toBe(0);
    expect(result.finalReduction).toBe(777);
  });

  it('gives full base reduction for income exactly €12,000', () => {
    const result = calculateArt16Reduction(12_000, 0, FY2024);
    expect(result.finalReduction).toBe(777);
  });

  it('applies phaseout for income above €12,000', () => {
    // Income €20,000: excess = €8,000, phaseout = €8,000 × 0.04 = €320
    // Reduction = €777 − €320 = €457
    const result = calculateArt16Reduction(20_000, 0, FY2024);
    expect(result.phaseoutAmount).toBe(320);
    expect(result.finalReduction).toBe(457);
  });

  it('phases out to zero for high income (0 dependents)', () => {
    // Income €40,000: excess = €28,000, phaseout = €28,000 × 0.04 = €1,120
    // Reduction = max(0, €777 − €1,120) = €0
    const result = calculateArt16Reduction(40_000, 0, FY2024);
    expect(result.finalReduction).toBe(0);
  });

  it('calculates exact phaseout zero point (0 dependents)', () => {
    // Zero point: 12,000 + (777 / 0.04) = 12,000 + 19,425 = €31,425
    const result = calculateArt16Reduction(31_425, 0, FY2024);
    expect(result.finalReduction).toBe(0);
  });

  // ─── Dependent tiers ──────────────────────────────────────────────────

  it('uses correct base for 1 dependent (€810)', () => {
    const result = calculateArt16Reduction(10_000, 1, FY2024);
    expect(result.baseReduction).toBe(810);
    expect(result.finalReduction).toBe(810);
  });

  it('uses correct base for 2 dependents (€900)', () => {
    const result = calculateArt16Reduction(10_000, 2, FY2024);
    expect(result.baseReduction).toBe(900);
    expect(result.finalReduction).toBe(900);
  });

  it('uses correct base for 3 dependents (€1,120)', () => {
    const result = calculateArt16Reduction(10_000, 3, FY2024);
    expect(result.baseReduction).toBe(1_120);
  });

  it('uses correct base for 4 dependents (€1,340)', () => {
    const result = calculateArt16Reduction(10_000, 4, FY2024);
    expect(result.baseReduction).toBe(1_340);
  });

  it('uses correct base for 5+ dependents (€1,780)', () => {
    const result = calculateArt16Reduction(10_000, 5, FY2024);
    expect(result.baseReduction).toBe(1_780);
  });

  it('clamps 7 dependents to 5+ tier', () => {
    const result = calculateArt16Reduction(10_000, 7, FY2024);
    expect(result.baseReduction).toBe(1_780);
  });

  it('applies phaseout correctly with dependents', () => {
    // 2 dependents, income €25,000:
    // excess = €13,000, phaseout = €520
    // reduction = €900 − €520 = €380
    const result = calculateArt16Reduction(25_000, 2, FY2024);
    expect(result.phaseoutAmount).toBe(520);
    expect(result.finalReduction).toBe(380);
  });

  it('5+ dependents phases out later than 0 dependents', () => {
    // At €40,000: 0 deps gets 0, 5+ deps should still have something
    // excess = €28,000, phaseout = €1,120
    // 5+ deps: €1,780 − €1,120 = €660
    const result = calculateArt16Reduction(40_000, 5, FY2024);
    expect(result.finalReduction).toBe(660);
  });
});

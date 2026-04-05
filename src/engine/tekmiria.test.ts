import { describe, it, expect } from 'vitest';
import { calculateTekmiria, calculateTekmiriaExcess, calculateSingleCarTekmirio } from './tekmiria.js';
import { FY2024 } from '../config/fy2024.js';
import { FY2025 } from '../config/fy2025.js';
import type { TekmiriaInputs, CarData } from './types.js';

// ─── Helper: minimal tekmiria inputs ──────────────────────────────────────

function emptyTekmiria(): TekmiriaInputs {
  return {
    housing: {
      primaryResidence: { sqm: 0, owned: false },
      secondaryResidences: [],
    },
    cars: [],
    domesticStaff: 0,
    privateSchoolFees: 0,
    swimmingPool: 'none',
    acquisitions: {},
  };
}

// ─── Housing ──────────────────────────────────────────────────────────────

describe('tekmiria — housing', () => {
  it('calculates primary owned residence ≤80m²', () => {
    const inputs: TekmiriaInputs = {
      ...emptyTekmiria(),
      housing: {
        primaryResidence: { sqm: 60, owned: true },
        secondaryResidences: [],
      },
    };
    const result = calculateTekmiria(inputs, FY2024);
    // 60m² × €40 = €2,400
    expect(result.housing).toBe(2_400);
  });

  it('calculates primary owned residence >80m²', () => {
    const inputs: TekmiriaInputs = {
      ...emptyTekmiria(),
      housing: {
        primaryResidence: { sqm: 120, owned: true },
        secondaryResidences: [],
      },
    };
    const result = calculateTekmiria(inputs, FY2024);
    // 80m² × €40 + 40m² × €65 = €3,200 + €2,600 = €5,800
    expect(result.housing).toBe(5_800);
  });

  it('uses actual rent for rented primary residence', () => {
    const inputs: TekmiriaInputs = {
      ...emptyTekmiria(),
      housing: {
        primaryResidence: { sqm: 100, owned: false, annualRent: 7_200 },
        secondaryResidences: [],
      },
    };
    const result = calculateTekmiria(inputs, FY2024);
    expect(result.housing).toBe(7_200);
  });

  it('calculates secondary residences', () => {
    const inputs: TekmiriaInputs = {
      ...emptyTekmiria(),
      housing: {
        primaryResidence: { sqm: 80, owned: true },
        secondaryResidences: [
          { sqm: 50, owned: true },
          { sqm: 30, owned: true },
        ],
      },
    };
    const result = calculateTekmiria(inputs, FY2024);
    // Primary: 80 × €40 = €3,200
    // Sec 1: 50 × €40 = €2,000
    // Sec 2: 30 × €40 = €1,200
    // Total: €6,400
    expect(result.housing).toBe(6_400);
  });

  it('applies FY2025 30% low-value zone discount', () => {
    const inputs: TekmiriaInputs = {
      ...emptyTekmiria(),
      housing: {
        primaryResidence: {
          sqm: 100,
          owned: true,
          objectiveValuePerSqm: 2_000,  // Below €2,799 threshold
        },
        secondaryResidences: [],
      },
    };
    const result = calculateTekmiria(inputs, FY2025);
    // Base: 80×40 + 20×65 = 3200 + 1300 = 4500
    // Discount: 4500 × 30% = 1350
    // Final: 4500 − 1350 = 3150
    expect(result.housing).toBe(3_150);
  });

  it('does NOT apply FY2025 discount if zone value > threshold', () => {
    const inputs: TekmiriaInputs = {
      ...emptyTekmiria(),
      housing: {
        primaryResidence: {
          sqm: 100,
          owned: true,
          objectiveValuePerSqm: 3_500,  // Above €2,799 threshold
        },
        secondaryResidences: [],
      },
    };
    const result = calculateTekmiria(inputs, FY2025);
    // No discount: 80×40 + 20×65 = 4500
    expect(result.housing).toBe(4_500);
  });
});

// ─── Cars ─────────────────────────────────────────────────────────────────

describe('tekmiria — cars (cc-based, FY2024)', () => {
  it('calculates ≤1200cc car', () => {
    const car: CarData = { cc: 1_000, registeredAfterNov2010: false };
    expect(calculateSingleCarTekmirio(car, FY2024)).toBe(1_000);
  });

  it('calculates 1201–1800cc car', () => {
    const car: CarData = { cc: 1_600, registeredAfterNov2010: false };
    expect(calculateSingleCarTekmirio(car, FY2024)).toBe(2_350);
  });

  it('calculates 1801–2500cc car', () => {
    const car: CarData = { cc: 2_000, registeredAfterNov2010: false };
    expect(calculateSingleCarTekmirio(car, FY2024)).toBe(4_200);
  });

  it('calculates 2501–3000cc car', () => {
    const car: CarData = { cc: 2_800, registeredAfterNov2010: false };
    expect(calculateSingleCarTekmirio(car, FY2024)).toBe(6_300);
  });

  it('calculates 3001+cc car', () => {
    const car: CarData = { cc: 4_000, registeredAfterNov2010: false };
    expect(calculateSingleCarTekmirio(car, FY2024)).toBe(7_200);
  });

  it('sums multiple cars', () => {
    const inputs: TekmiriaInputs = {
      ...emptyTekmiria(),
      cars: [
        { cc: 1_400, registeredAfterNov2010: false },
        { cc: 2_200, registeredAfterNov2010: false },
      ],
    };
    const result = calculateTekmiria(inputs, FY2024);
    // €2,350 + €4,200 = €6,550
    expect(result.cars).toBe(6_550);
  });
});

describe('tekmiria — cars (CO2-based, FY2025)', () => {
  it('uses CO2 table for post-2010 car with CO2 data', () => {
    const car: CarData = { cc: 1_600, co2: 110, registeredAfterNov2010: true };
    const result = calculateSingleCarTekmirio(car, FY2025);
    // CO2 110 → ≤120 tier → €800
    expect(result).toBe(800);
  });

  it('falls back to cc table for pre-2010 car even with CO2', () => {
    const car: CarData = { cc: 1_600, co2: 110, registeredAfterNov2010: false };
    const result = calculateSingleCarTekmirio(car, FY2025);
    // Uses cc: 1600 → 1201–1800 tier → €2,350
    expect(result).toBe(2_350);
  });

  it('falls back to cc table when CO2 data missing', () => {
    const car: CarData = { cc: 1_600, registeredAfterNov2010: true };
    const result = calculateSingleCarTekmirio(car, FY2025);
    // No CO2 → falls back to cc: €2,350
    expect(result).toBe(2_350);
  });

  it('CO2 table gives lower result than cc (demonstrates savings)', () => {
    const car: CarData = { cc: 1_600, co2: 110, registeredAfterNov2010: true };
    const co2Result = calculateSingleCarTekmirio(car, FY2025);
    const ccResult = calculateSingleCarTekmirio({ ...car, co2: undefined }, FY2025);
    expect(co2Result).toBeLessThan(ccResult);
  });
});

// ─── Other Tekmiria ───────────────────────────────────────────────────────

describe('tekmiria — other assets', () => {
  it('calculates domestic staff', () => {
    const inputs: TekmiriaInputs = { ...emptyTekmiria(), domesticStaff: 2 };
    const result = calculateTekmiria(inputs, FY2024);
    expect(result.domesticStaff).toBe(12_000);
  });

  it('calculates private school fees', () => {
    const inputs: TekmiriaInputs = { ...emptyTekmiria(), privateSchoolFees: 8_500 };
    const result = calculateTekmiria(inputs, FY2024);
    expect(result.privateSchool).toBe(8_500);
  });

  it('calculates outdoor pool', () => {
    const inputs: TekmiriaInputs = { ...emptyTekmiria(), swimmingPool: 'outdoor' };
    const result = calculateTekmiria(inputs, FY2024);
    expect(result.pool).toBe(16_000);
  });

  it('calculates indoor pool', () => {
    const inputs: TekmiriaInputs = { ...emptyTekmiria(), swimmingPool: 'indoor' };
    const result = calculateTekmiria(inputs, FY2024);
    expect(result.pool).toBe(24_000);
  });

  it('calculates real estate acquisition', () => {
    const inputs: TekmiriaInputs = {
      ...emptyTekmiria(),
      acquisitions: { realEstatePurchase: 150_000 },
    };
    const result = calculateTekmiria(inputs, FY2024);
    expect(result.acquisitions).toBe(150_000);
  });
});

// ─── Tekmiria Excess ──────────────────────────────────────────────────────

describe('calculateTekmiriaExcess', () => {
  it('returns 0 when declared ≥ presumptive', () => {
    expect(calculateTekmiriaExcess(30_000, 20_000)).toBe(0);
  });

  it('returns excess when presumptive > declared', () => {
    expect(calculateTekmiriaExcess(20_000, 30_000)).toBe(10_000);
  });

  it('returns 0 when equal', () => {
    expect(calculateTekmiriaExcess(20_000, 20_000)).toBe(0);
  });
});

// ─── Total Tekmiria ───────────────────────────────────────────────────────

describe('calculateTekmiria — total', () => {
  it('sums all components', () => {
    const inputs: TekmiriaInputs = {
      housing: {
        primaryResidence: { sqm: 100, owned: true },
        secondaryResidences: [],
      },
      cars: [{ cc: 1_600, registeredAfterNov2010: false }],
      domesticStaff: 1,
      privateSchoolFees: 5_000,
      swimmingPool: 'outdoor',
      acquisitions: {},
    };
    const result = calculateTekmiria(inputs, FY2024);
    // Housing: 80×40 + 20×65 = 4500
    // Car: 2350
    // Staff: 6000
    // School: 5000
    // Pool: 16000
    // Total: 33,850
    expect(result.totalPresumptive).toBe(33_850);
    expect(result.housing).toBe(4_500);
    expect(result.cars).toBe(2_350);
    expect(result.domesticStaff).toBe(6_000);
  });
});

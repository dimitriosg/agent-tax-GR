import type { TaxConfig } from '../config/types.js';
import type { TekmiriaInputs, CarData, HousingData } from './types.js';

/**
 * Τεκμήρια (Presumptive Expense) Engine
 * Art.31 — Lifestyle presumptions (housing, cars, staff, pools, schools)
 * Art.32 — Acquisition presumptions (vehicle/property purchases)
 *
 * If total presumptive > declared income, the excess is added to taxable income.
 */

export interface TekmiriaResult {
  housing: number;
  cars: number;
  domesticStaff: number;
  privateSchool: number;
  pool: number;
  acquisitions: number;
  totalPresumptive: number;
}

/**
 * Calculate total presumptive expenses from all sources.
 */
export function calculateTekmiria(
  inputs: TekmiriaInputs,
  config: TaxConfig,
): TekmiriaResult {
  const housing = calculateHousingTekmirio(inputs.housing, config);
  const cars = calculateCarsTekmirio(inputs.cars, config);
  const domesticStaff = inputs.domesticStaff * config.tekmiria.domesticStaffPerPerson;
  const privateSchool = inputs.privateSchoolFees;
  const pool = calculatePoolTekmirio(inputs.swimmingPool, config);
  const acquisitions = calculateAcquisitionTekmiria(inputs, config);

  const totalPresumptive = housing + cars + domesticStaff + privateSchool + pool + acquisitions;

  return {
    housing,
    cars,
    domesticStaff,
    privateSchool,
    pool,
    acquisitions,
    totalPresumptive,
  };
}

/**
 * Calculate excess presumptive income (R7/R8 of ΕΚΚΑΘΑΡΙΣΗ).
 * This is added to declared income when presumptive > declared.
 */
export function calculateTekmiriaExcess(
  declaredIncome: number,
  totalPresumptive: number,
): number {
  return Math.max(0, totalPresumptive - declaredIncome);
}

// ─── Housing (Art.31) ─────────────────────────────────────────────────────

function calculateHousingTekmirio(housing: HousingData, config: TaxConfig): number {
  let total = 0;

  // Primary residence
  const primary = housing.primaryResidence;
  if (primary.owned) {
    total += calculateOwnedPrimaryResidence(primary.sqm, config);
  } else if (primary.annualRent != null) {
    total += primary.annualRent;
  }

  // Secondary residences
  for (const secondary of housing.secondaryResidences) {
    if (secondary.owned) {
      total += secondary.sqm * config.tekmiria.housing.secondaryOwned.ratePerSqm;
    } else if (secondary.annualRent != null) {
      total += secondary.annualRent;
    }
  }

  // FY2025: 30% discount for low-value zones
  if (config.tekmiria.housing.lowValueZoneDiscount != null &&
      config.tekmiria.housing.lowValueZoneThreshold != null) {
    total = applyLowValueZoneDiscount(total, housing, config);
  }

  return total;
}

function calculateOwnedPrimaryResidence(sqm: number, config: TaxConfig): number {
  const h = config.tekmiria.housing.primaryOwned;
  const firstPart = Math.min(sqm, h.firstSqmLimit) * h.firstSqmRate;
  const abovePart = Math.max(0, sqm - h.firstSqmLimit) * h.aboveRate;
  return firstPart + abovePart;
}

function applyLowValueZoneDiscount(
  baseTotal: number,
  housing: HousingData,
  config: TaxConfig,
): number {
  const discount = config.tekmiria.housing.lowValueZoneDiscount!;
  const threshold = config.tekmiria.housing.lowValueZoneThreshold!;

  // Check if primary residence qualifies
  let discountedTotal = baseTotal;

  if (housing.primaryResidence.owned &&
      housing.primaryResidence.objectiveValuePerSqm != null &&
      housing.primaryResidence.objectiveValuePerSqm <= threshold) {
    const primaryPresumption = calculateOwnedPrimaryResidence(
      housing.primaryResidence.sqm,
      config,
    );
    discountedTotal -= primaryPresumption * discount;
  }

  // Check secondary residences
  for (const secondary of housing.secondaryResidences) {
    if (secondary.owned &&
        secondary.objectiveValuePerSqm != null &&
        secondary.objectiveValuePerSqm <= threshold) {
      const secondaryPresumption =
        secondary.sqm * config.tekmiria.housing.secondaryOwned.ratePerSqm;
      discountedTotal -= secondaryPresumption * discount;
    }
  }

  return discountedTotal;
}

// ─── Cars ─────────────────────────────────────────────────────────────────

function calculateCarsTekmirio(cars: readonly CarData[], config: TaxConfig): number {
  let total = 0;
  for (const car of cars) {
    total += calculateSingleCarTekmirio(car, config);
  }
  return total;
}

/**
 * Calculate tekmirio for a single car.
 * FY2025+: cars registered after 1/11/2010 use CO2-based table.
 * FY2024 and pre-2010 cars: use cc-based table.
 */
export function calculateSingleCarTekmirio(car: CarData, config: TaxConfig): number {
  // FY2025+: use CO2 table if car qualifies
  if (config.tekmiria.carCO2 &&
      car.registeredAfterNov2010 &&
      car.co2 != null) {
    return lookupTierValue(car.co2, config.tekmiria.carCO2, 'maxCO2');
  }

  // Fallback: cc-based table
  return lookupTierValue(car.cc, config.tekmiria.carCC, 'maxCC');
}

function lookupTierValue(
  value: number,
  tiers: readonly { annualPresumption: number }[],
  maxField: string,
): number {
  for (const tier of tiers) {
    const threshold = (tier as Record<string, number>)[maxField];
    if (value <= threshold) {
      return tier.annualPresumption;
    }
  }
  return tiers[tiers.length - 1].annualPresumption;
}

// ─── Pool ─────────────────────────────────────────────────────────────────

function calculatePoolTekmirio(
  pool: 'none' | 'outdoor' | 'indoor',
  config: TaxConfig,
): number {
  switch (pool) {
    case 'none': return 0;
    case 'outdoor': return config.tekmiria.poolOutdoor;
    case 'indoor': return config.tekmiria.poolIndoor;
  }
}

// ─── Acquisitions (Art.32) ────────────────────────────────────────────────

function calculateAcquisitionTekmiria(
  inputs: TekmiriaInputs,
  _config: TaxConfig,
): number {
  let total = 0;
  const acq = inputs.acquisitions;

  if (acq.vehiclePurchase) {
    // 25%–65% of purchase price depending on cc
    total += calculateVehicleAcquisition(acq.vehiclePurchase.price, acq.vehiclePurchase.cc);
  }

  if (acq.realEstatePurchase != null) {
    total += acq.realEstatePurchase;
  }

  if (acq.businessPurchase != null) {
    total += acq.businessPurchase;
  }

  return total;
}

function calculateVehicleAcquisition(price: number, cc: number): number {
  // Simplified Art.32 vehicle acquisition presumption
  // Rate varies by cc: smaller engines = lower percentage
  let rate: number;
  if (cc <= 1_200) rate = 0.25;
  else if (cc <= 1_800) rate = 0.30;
  else if (cc <= 2_500) rate = 0.40;
  else if (cc <= 3_000) rate = 0.50;
  else rate = 0.65;

  return Math.round(price * rate);
}

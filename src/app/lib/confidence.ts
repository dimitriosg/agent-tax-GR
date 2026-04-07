import type { E1Declaration } from '../../engine/types';

interface ConfidenceFactors {
  hasAfm: boolean;
  hasAnyIncome: boolean;
  hasHousing: boolean;
  hasElectronicPayments: boolean;
  hasSelfEmployed: boolean;
  selfEmployedComplete: boolean;
}

function scoreFactors(f: ConfidenceFactors): number {
  let score = 0;

  // AFM present: gate check
  if (f.hasAfm) score += 20;

  // At least one income source filled
  if (f.hasAnyIncome) score += 35;

  // Primary residence dimensions present
  if (f.hasHousing) score += 15;

  // Electronic payments declared
  if (f.hasElectronicPayments) score += 15;

  // Self-employed: bonus only if complete
  // NOTE: when hasSelfEmployed=true but selfEmployedComplete=false the user silently loses 15
  // points (kadCode or yearsOfOperation missing). Consider surfacing a hint in the UI so the
  // user knows they need to complete their self-employment details to recover the full score.
  if (f.hasSelfEmployed && f.selfEmployedComplete) score += 15;
  else if (!f.hasSelfEmployed) score += 15; // not applicable → full credit

  return Math.min(100, score);
}

export function calculateConfidence(d: E1Declaration): number {
  const income = d.income;
  const hasAnyIncome =
    income.employment > 0 ||
    income.pension > 0 ||
    income.business > 0 ||
    income.agricultural > 0 ||
    income.realEstate > 0 ||
    income.merchantNavy > 0 ||
    income.dividends > 0 ||
    income.interest > 0 ||
    income.capitalGains > 0;

  const se = d.selfEmployed;
  const selfEmployedComplete =
    !!se &&
    se.kadCode.trim().length > 0 &&
    se.yearsOfOperation > 0;

  const factors: ConfidenceFactors = {
    hasAfm: d.taxpayer.afm.length === 9,
    hasAnyIncome,
    hasHousing: d.tekmiria.housing.primaryResidence.sqm > 0,
    hasElectronicPayments: d.electronicPayments.totalElectronic > 0,
    hasSelfEmployed: !!se,
    selfEmployedComplete,
  };

  return scoreFactors(factors);
}

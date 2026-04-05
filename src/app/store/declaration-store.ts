import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { E1Declaration, SelfEmployedInputs } from '../../engine/types';
import { createDefaultDeclaration } from '../lib/default-declaration';

interface OnboardingState {
  step: 'work-profile' | 'income-input' | 'family-assets' | 'done';
}

interface DeclarationState {
  declaration: E1Declaration;
  onboarding: OnboardingState;
  setFiscalYear: (year: number) => void;
  setAfm: (afm: string) => void;
  setMaritalStatus: (status: E1Declaration['taxpayer']['maritalStatus']) => void;
  setJointFiling: (joint: boolean) => void;
  setDependents: (n: number) => void;
  setIsDisabled: (v: boolean) => void;
  setIncome: (field: keyof E1Declaration['income'], value: number) => void;
  setWithheld: (value: number) => void;
  setPriorYearPrepayment: (value: number) => void;
  setElectronicPayments: (total: number) => void;
  setHousingPrimary: (sqm: number, owned: boolean) => void;
  addCar: (cc: number, co2?: number, registeredAfterNov2010?: boolean) => void;
  removeCar: (index: number) => void;
  setSelfEmployed: (inputs: SelfEmployedInputs | undefined) => void;
  setOnboardingStep: (step: OnboardingState['step']) => void;
  reset: () => void;
}

export const useDeclarationStore = create<DeclarationState>()(
  immer((set) => ({
    declaration: createDefaultDeclaration(2025),
    onboarding: { step: 'work-profile' },

    setFiscalYear: (year) =>
      set((s) => { s.declaration.fiscalYear = year; }),

    setAfm: (afm) =>
      set((s) => { s.declaration.taxpayer.afm = afm; }),

    setMaritalStatus: (status) =>
      set((s) => { s.declaration.taxpayer.maritalStatus = status; }),

    setJointFiling: (joint) =>
      set((s) => { s.declaration.taxpayer.jointFiling = joint; }),

    setDependents: (n) =>
      set((s) => { s.declaration.taxpayer.dependents = n; }),

    setIsDisabled: (v) =>
      set((s) => { s.declaration.taxpayer.isDisabled = v; }),

    setIncome: (field, value) =>
      set((s) => { s.declaration.income[field] = value; }),

    setWithheld: (value) =>
      set((s) => { s.declaration.withholding.taxWithheld = value; }),

    setPriorYearPrepayment: (value) =>
      set((s) => { s.declaration.withholding.priorYearPrepayment = value; }),

    setElectronicPayments: (total) =>
      set((s) => { s.declaration.electronicPayments.totalElectronic = total; }),

    setHousingPrimary: (sqm, owned) =>
      set((s) => {
        s.declaration.tekmiria.housing.primaryResidence.sqm = sqm;
        s.declaration.tekmiria.housing.primaryResidence.owned = owned;
      }),

    addCar: (cc, co2, registeredAfterNov2010 = false) =>
      set((s) => {
        s.declaration.tekmiria.cars.push({ cc, co2, registeredAfterNov2010 });
      }),

    removeCar: (index) =>
      set((s) => {
        s.declaration.tekmiria.cars.splice(index, 1);
      }),

    setSelfEmployed: (inputs) =>
      set((s) => { s.declaration.selfEmployed = inputs; }),

    setOnboardingStep: (step) =>
      set((s) => { s.onboarding.step = step; }),

    reset: () =>
      set((s) => {
        s.declaration = createDefaultDeclaration(s.declaration.fiscalYear);
        s.onboarding = { step: 'work-profile' };
      }),
  }))
);

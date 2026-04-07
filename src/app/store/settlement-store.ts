import { create } from 'zustand';
import { calculateSettlement } from '../../engine/settlement';
import { evaluateAlerts } from '../../engine/alerts';
import type { SettlementResult, Alert } from '../../engine/types';
import type { TaxConfig } from '../../config/types';
import { FY2025 } from '../../config/fy2025';
import { FY2024 } from '../../config/fy2024';
import type { E1Declaration } from '../../engine/types';

const SUPPORTED_CONFIGS: Record<number, TaxConfig> = {
  2024: FY2024,
  2025: FY2025,
};

function getConfig(year: number): TaxConfig {
  const config = SUPPORTED_CONFIGS[year];
  if (!config) throw new Error(`Fiscal year ${year} is not supported. Supported years: ${Object.keys(SUPPORTED_CONFIGS).join(', ')}`);
  return config;
}

interface SettlementState {
  result: SettlementResult | null;
  alerts: Alert[];
  error: string | null;
  compute: (declaration: E1Declaration) => void;
}

export const useSettlementStore = create<SettlementState>()((set) => ({
  result: null,
  alerts: [],
  error: null,

  compute: (declaration) => {
    try {
      const config = getConfig(declaration.fiscalYear);
      const result = calculateSettlement(declaration, config);
      const alerts = evaluateAlerts(declaration, config);
      set({ result, alerts, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Calculation error';
      set({ result: null, alerts: [], error: message });
    }
  },
}));

export type { TaxConfig } from './types.js';
export { FY2024 } from './fy2024.js';
export { FY2025 } from './fy2025.js';

import type { TaxConfig } from './types.js';
import { FY2024 } from './fy2024.js';
import { FY2025 } from './fy2025.js';

const configs: Record<number, TaxConfig> = {
  2024: FY2024,
  2025: FY2025,
};

export function getConfig(fiscalYear: number): TaxConfig {
  const config = configs[fiscalYear];
  if (!config) {
    throw new Error(`No tax configuration for fiscal year ${fiscalYear}. Available: ${Object.keys(configs).join(', ')}`);
  }
  return config;
}

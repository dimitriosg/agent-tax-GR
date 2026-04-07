import { useState, useCallback } from 'react';
import { useDeclarationStore } from '../store/declaration-store';
import { detectTaxisNetE1Page, type DetectionResult } from '../lib/taxisnet-detector';
import { scanE1Page, type ScanResult } from '../lib/page-scanner';
import type { IncomeDeclaration } from '../../engine/types';

export type ScanStatus = 'idle' | 'scanning' | 'success' | 'partial' | 'not-on-page' | 'error';

export interface UseScanReturn {
  status: ScanStatus;
  detection: DetectionResult | null;
  scanResult: ScanResult | null;
  /** Fields that were auto-filled by the last scan */
  autoFilledFields: Set<string>;
  /** Trigger a page scan */
  scan: () => void;
  /** Clear auto-fill state */
  clearScan: () => void;
}

/**
 * Hook that orchestrates the auto-scan workflow:
 * 1. Detect if user is on a TaxisNet E1 page
 * 2. If yes, scan DOM for pre-filled values
 * 3. Apply found values to the declaration store
 */
export function useScan(): UseScanReturn {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  const setIncome = useDeclarationStore((s) => s.setIncome);
  const setWithheld = useDeclarationStore((s) => s.setWithheld);

  // TODO(extension): when running as a Chrome extension, this must become async
  // and delegate DOM access to chrome.scripting.executeScript({ target, func: scanE1Page })
  const scan = useCallback(() => {
    setStatus('scanning');

    try {
      // Step 1: detect page
      const det = detectTaxisNetE1Page();
      setDetection(det);

      if (!det.isE1Page) {
        setStatus('not-on-page');
        setScanResult(null);
        return;
      }

      // Step 2: scan DOM values
      const result = scanE1Page();
      setScanResult(result);

      if (!result.success) {
        setStatus('partial');
        return;
      }

      // Step 3: apply to store
      const filled = new Set<string>();

      for (const [field, value] of Object.entries(result.income)) {
        if (value != null && value > 0) {
          setIncome(field as keyof IncomeDeclaration, value);
          filled.add(field);
        }
      }

      if (result.taxWithheld != null && result.taxWithheld > 0) {
        setWithheld(result.taxWithheld);
        filled.add('taxWithheld');
      }

      setAutoFilledFields(filled);
      setStatus(filled.size > 0 ? 'success' : 'partial');
    } catch {
      setStatus('error');
    }
  }, [setIncome, setWithheld]);

  const clearScan = useCallback(() => {
    setStatus('idle');
    setDetection(null);
    setScanResult(null);
    setAutoFilledFields(new Set());
  }, []);

  return { status, detection, scanResult, autoFilledFields, scan, clearScan };
}

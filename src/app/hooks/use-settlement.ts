import { useEffect } from 'react';
import { useDeclarationStore } from '../store/declaration-store';
import { useSettlementStore } from '../store/settlement-store';
import type { SettlementResult } from '../../engine/types';

export function useSettlement(): { result: SettlementResult | null; error: string | null } {
  const declaration = useDeclarationStore((s) => s.declaration);
  const { result, error, compute } = useSettlementStore();

  useEffect(() => {
    compute(declaration);
  }, [declaration, compute]);

  return { result, error };
}

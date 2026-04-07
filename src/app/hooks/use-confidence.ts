import { useDeclarationStore } from '../store/declaration-store';
import { calculateConfidence } from '../lib/confidence';

export function useConfidence(): number {
  const declaration = useDeclarationStore((s) => s.declaration);
  return calculateConfidence(declaration);
}

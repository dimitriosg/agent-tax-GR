import { useConfidence } from '../../hooks/use-confidence';

export function ConfidenceBadge() {
  const score = useConfidence();

  const color =
    score >= 80 ? 'text-green-700 bg-green-50 border-green-200' :
    score >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-red-700 bg-red-50 border-red-200';

  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${color}`}>
      <span>Πληρότητα</span>
      <span className="tabular-nums font-bold">{score}%</span>
    </div>
  );
}

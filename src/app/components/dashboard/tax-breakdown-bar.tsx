interface BarSegment {
  label: string;
  value: number;
  color: string;
}

interface TaxBreakdownBarProps {
  totalTaxableIncome: number;
  totalScaleTax: number;
  art16Reduction: number;
  electronicSurcharge: number;
}

export function TaxBreakdownBar({
  totalTaxableIncome,
  totalScaleTax,
  art16Reduction,
  electronicSurcharge,
}: TaxBreakdownBarProps) {
  if (totalTaxableIncome <= 0) return null;

  const netTax = totalScaleTax - art16Reduction + electronicSurcharge;
  const effectiveRate = totalTaxableIncome > 0 ? (netTax / totalTaxableIncome) * 100 : 0;

  const segments: BarSegment[] = [
    { label: 'Φόρος κλίμακας', value: totalScaleTax, color: 'bg-blue-500' },
    { label: 'Έκπτωση Art.16', value: -art16Reduction, color: 'bg-green-400' },
    { label: 'Ηλεκτρονικές', value: electronicSurcharge, color: 'bg-amber-400' },
  ].filter((s) => s.value !== 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Ανάλυση φόρου</span>
        <span className="font-medium">Πραγμ. επιβάρυνση {effectiveRate.toFixed(1)}%</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {segments.map((seg, i) => {
          const width = Math.max(0, (Math.abs(seg.value) / totalTaxableIncome) * 100);
          return (
            <div
              key={i}
              className={`${seg.color} ${seg.value < 0 ? 'opacity-50' : ''}`}
              style={{ width: `${width}%` }}
              title={`${seg.label}: ${seg.value.toLocaleString('el-GR')} €`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
            <span className={`h-2 w-2 rounded-full ${seg.color}`} />
            {seg.label}: {seg.value.toLocaleString('el-GR')} €
          </div>
        ))}
      </div>
    </div>
  );
}

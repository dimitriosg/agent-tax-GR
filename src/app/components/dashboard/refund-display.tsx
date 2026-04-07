interface RefundDisplayProps {
  amount: number; // negative = refund, positive = owe
}

export function RefundDisplay({ amount }: RefundDisplayProps) {
  const isRefund = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('el-GR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className={`rounded-2xl p-4 text-center ${isRefund ? 'bg-green-50' : 'bg-red-50'}`}>
      <p className="text-xs font-medium text-gray-500 mb-1">
        {isRefund ? 'Επιστροφή Φόρου' : 'Φόρος Πληρωτέος'}
      </p>
      <p className={`text-3xl font-bold tabular-nums ${isRefund ? 'text-green-700' : 'text-red-700'}`}>
        {isRefund ? '+' : '−'}{formatted} €
      </p>
    </div>
  );
}

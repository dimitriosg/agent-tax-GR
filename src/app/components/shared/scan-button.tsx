import { useScan, type ScanStatus } from '../../hooks/use-scan';

function statusConfig(status: ScanStatus): { icon: string; text: string; color: string; bgColor: string } {
  switch (status) {
    case 'idle':
      return { icon: '📋', text: 'Αυτόματη ανάγνωση σελίδας', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100' };
    case 'scanning':
      return { icon: '⏳', text: 'Σάρωση...', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' };
    case 'success':
      return { icon: '✓', text: '', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' };
    case 'partial':
      return { icon: '⚠', text: 'Μερική ανάγνωση — ελέγξτε τα πεδία', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' };
    case 'not-on-page':
      return { icon: '✕', text: 'Δεν βρίσκεστε στη σελίδα E1 του myAADE', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    case 'error':
      return { icon: '✕', text: 'Σφάλμα ανάγνωσης — δοκιμάστε ξανά', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
  }
}

export function ScanButton() {
  const { status, scanResult, autoFilledFields, scan, clearScan } = useScan();

  const cfg = statusConfig(status);
  const successText = scanResult?.success
    ? `Συμπληρώθηκαν ${autoFilledFields.size} πεδία αυτόματα`
    : '';

  const isClickable = status !== 'scanning';

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={status === 'success' || status === 'partial' ? clearScan : scan}
        disabled={!isClickable}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium
                   transition-colors disabled:opacity-50 disabled:cursor-wait ${cfg.bgColor}`}
      >
        <span className="text-sm">{cfg.icon}</span>
        <span className={cfg.color}>
          {status === 'success' ? successText : cfg.text}
        </span>
        {(status === 'success' || status === 'partial') && (
          <span className="ml-auto text-[10px] text-gray-400">↺ Επανάληψη</span>
        )}
      </button>
      {status === 'not-on-page' && (
        <p className="text-[10px] text-gray-400 px-1">
          Ανοίξτε τη δήλωση Ε1 στο{' '}
          <strong>myAADE (taxisnet)</strong> και δοκιμάστε ξανά.
        </p>
      )}
    </div>
  );
}

import { useAlerts } from '../../hooks/use-alerts';
import { Chip } from '../shared/chip';
import type { AlertSeverity } from '../../../engine/types';

function severityVariant(s: AlertSeverity): 'danger' | 'warning' | 'info' | 'default' {
  if (s === 'critical') return 'danger';
  if (s === 'high') return 'warning';
  if (s === 'medium') return 'info';
  return 'default';
}

function severityLabel(s: AlertSeverity): string {
  if (s === 'critical') return 'Κρίσιμο';
  if (s === 'high') return 'Υψηλό';
  if (s === 'medium') return 'Μέτριο';
  return 'Χαμηλό';
}

export function AlertsTab() {
  const { alerts } = useAlerts();

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-gray-400">
        <span className="text-3xl">✓</span>
        <p className="text-sm">Δεν εντοπίστηκαν προειδοποιήσεις</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {alerts.map((alert, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Chip
              label={severityLabel(alert.severity)}
              variant={severityVariant(alert.severity)}
            />
            {alert.field && (
              <span className="text-xs text-gray-400 font-mono">κωδ. {alert.field}</span>
            )}
          </div>
          <p className="text-sm text-gray-800">{alert.message}</p>
          {alert.suggestion && (
            <p className="text-xs text-gray-500 italic">{alert.suggestion}</p>
          )}
        </div>
      ))}
    </div>
  );
}

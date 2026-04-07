import { useSettlementStore } from '../store/settlement-store';
import type { Alert, AlertSeverity } from '../../engine/types';

interface UseAlertsResult {
  alerts: Alert[];
  critical: Alert[];
  high: Alert[];
  byMinSeverity: (min: AlertSeverity) => Alert[];
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function useAlerts(): UseAlertsResult {
  const alerts = useSettlementStore((s) => s.alerts);

  return {
    alerts,
    critical: alerts.filter((a) => a.severity === 'critical'),
    high: alerts.filter((a) => a.severity === 'high'),
    byMinSeverity: (min) =>
      alerts.filter((a) => SEVERITY_RANK[a.severity] >= SEVERITY_RANK[min]),
  };
}

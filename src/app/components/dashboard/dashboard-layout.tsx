import { useState } from 'react';
import { useSettlement } from '../../hooks/use-settlement';
import { useAlerts } from '../../hooks/use-alerts';
import { RefundDisplay } from './refund-display';
import { TaxBreakdownBar } from './tax-breakdown-bar';
import { ConfidenceBadge } from './confidence-badge';
import { AlertsTab } from './alerts-tab';
import { SavingsTab } from './savings-tab';
import { GuideTab } from './guide-tab';
import { QuestionTab } from './question-tab';
import { YearSwitcher } from '../shared/year-switcher';
import { useDeclarationStore } from '../../store/declaration-store';

type Tab = 'summary' | 'alerts' | 'savings' | 'guide' | 'faq';

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Σύνοψη' },
  { id: 'alerts', label: 'Ειδοποιήσεις' },
  { id: 'savings', label: 'Εξοικονόμηση' },
  { id: 'guide', label: 'Οδηγός' },
  { id: 'faq', label: 'Ερωτήσεις' },
];

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const { result, error } = useSettlement();
  const { alerts } = useAlerts();
  const setOnboardingStep = useDeclarationStore((s) => s.setOnboardingStep);
  const fiscalYear = useDeclarationStore((s) => s.declaration.fiscalYear);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const alertBadge = criticalCount + highCount;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-gray-900">σκονάκι</h1>
          <span className="text-xs text-gray-400">E1 {fiscalYear}</span>
        </div>
        <div className="flex items-center gap-2">
          <YearSwitcher />
          <ConfidenceBadge />
        </div>
      </div>

      {/* Refund hero */}
      <div className="px-4 py-3">
        {error ? (
          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>
        ) : result ? (
          <div className="flex flex-col gap-3">
            <RefundDisplay amount={result.finalPaymentOrRefund} />
            <TaxBreakdownBar
              totalTaxableIncome={result.totalTaxableIncome}
              totalScaleTax={result.totalScaleTax}
              art16Reduction={result.art16Reduction}
              electronicSurcharge={result.electronicPaymentSurcharge}
            />
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-400">
            Συμπληρώστε τα στοιχεία σας για εκκαθάριση.
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none px-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-shrink-0 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.id === 'alerts' && alertBadge > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {alertBadge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="p-4 flex flex-col gap-3">
            {result && (
              <div className="flex flex-col gap-1 text-xs text-gray-600">
                {[
                  ['Φορολογητέο εισόδημα', result.totalTaxableIncome],
                  ['Φόρος κλίμακας', result.totalScaleTax],
                  ['Μείωση Art.16', -result.art16Reduction],
                  ['Προκαταβολή/παρακράτηση', -(result.priorYearPrepayment + result.withheldTax)],
                  ['Ψηφιακές συναλλαγές', result.digitalTransactionFee],
                ].map(([label, value], i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-gray-50">
                    <span>{label}</span>
                    <span className={`tabular-nums font-medium ${Number(value) < 0 ? 'text-green-700' : ''}`}>
                      {Number(value).toLocaleString('el-GR')} €
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setOnboardingStep('work-profile')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 text-left"
            >
              ← Επεξεργασία στοιχείων
            </button>
          </div>
        )}
        {activeTab === 'alerts' && <AlertsTab />}
        {activeTab === 'savings' && <SavingsTab />}
        {activeTab === 'guide' && <GuideTab />}
        {activeTab === 'faq' && <QuestionTab />}
      </div>
    </div>
  );
}

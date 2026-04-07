import { useDeclarationStore } from '../../store/declaration-store';
import { NumericInput } from '../shared/numeric-input';
import { ScanButton } from '../shared/scan-button';
import { useScan } from '../../hooks/use-scan';
import type { IncomeDeclaration } from '../../../engine/types';

type IncomeField = keyof IncomeDeclaration;

interface IncomeRow {
  field: IncomeField;
  label: string;
  /** E1 form code pair, e.g. "301–302" */
  code: string;
  alwaysShow?: boolean;
}

const INCOME_ROWS: IncomeRow[] = [
  { field: 'employment', label: 'Μισθωτές Υπηρεσίες', code: '301–302', alwaysShow: true },
  { field: 'pension', label: 'Συντάξεις', code: '303–304', alwaysShow: true },
  { field: 'business', label: 'Επιχειρηματική Δραστηριότητα', code: '401–402', alwaysShow: true },
  { field: 'agricultural', label: 'Αγροτική Επιχείρηση', code: '313–314' },
  { field: 'realEstate', label: 'Εισόδημα Ακίνητης Περιουσίας', code: '105–110' },
  { field: 'dividends', label: 'Μερίσματα', code: '291–292' },
  { field: 'interest', label: 'Τόκοι', code: '293–294' },
  { field: 'capitalGains', label: 'Υπεραξία Κεφαλαίου', code: '297–298' },
  { field: 'merchantNavy', label: 'Εμποροναυτικό', code: '305–306' },
  { field: 'foreign', label: 'Αλλοδαπή Αμοιβή', code: '389–390' },
  // NOTE: Κωδ. 389–390 αφορά τη στήλη φορολογούμενου. Για FY2025 τα
  // νέα κωδ. 047–048 (μείωση εισοδήματος αλλοδαπής για μικρούς δήμους)
  // είναι ξεχωριστά πεδία εκπτώσεων — δεν αντικαθιστούν τα 389–390.
];

export function IncomeInputScreen() {
  const income = useDeclarationStore((s) => s.declaration.income);
  const withholding = useDeclarationStore((s) => s.declaration.withholding);
  const setIncome = useDeclarationStore((s) => s.setIncome);
  const setWithheld = useDeclarationStore((s) => s.setWithheld);
  const setElectronicPayments = useDeclarationStore((s) => s.setElectronicPayments);
  const electronicTotal = useDeclarationStore((s) => s.declaration.electronicPayments.totalElectronic);
  const setOnboardingStep = useDeclarationStore((s) => s.setOnboardingStep);

  const { status, autoFilledFields, scan, clearScan } = useScan();

  const totalIncome = Object.values(income).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Εισοδήματα</h2>
        <p className="text-xs text-gray-500 mt-1">Βήμα 2 από 3</p>
      </div>

      {/* Auto-scan from TaxisNet page */}
      <ScanButton
        status={status}
        autoFilledCount={autoFilledFields.size}
        onScan={scan}
        onClear={clearScan}
      />

      <div className="flex flex-col gap-3">
        {INCOME_ROWS.map(({ field, label, code }) => (
          <NumericInput
            key={field}
            label={label}
            code={code}
            value={income[field]}
            onChange={(v) => setIncome(field, v)}
            autoFilled={autoFilledFields.has(field)}
          />
        ))}
      </div>

      <div className="border-t pt-3 flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Παρακρατήσεις</p>
        <NumericInput
          label="Φόρος Παρακρατηθείς"
          code="315–320"
          value={withholding.taxWithheld}
          onChange={setWithheld}
          autoFilled={autoFilledFields.has('taxWithheld')}
        />
        <NumericInput
          label="Ηλεκτρονικές Συναλλαγές (σύνολο έτους)"
          value={electronicTotal}
          onChange={setElectronicPayments}
        />
      </div>

      {totalIncome > 0 && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Σύνολο εισοδήματος:{' '}
          <span className="font-semibold">{totalIncome.toLocaleString('el-GR')} €</span>
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => setOnboardingStep('work-profile')}
          className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600
                     hover:bg-gray-50"
        >
          ← Πίσω
        </button>
        <button
          type="button"
          onClick={() => setOnboardingStep('family-assets')}
          className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white
                     hover:bg-blue-700"
        >
          Συνέχεια →
        </button>
      </div>
    </div>
  );
}

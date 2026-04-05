import { useDeclarationStore } from '../../store/declaration-store';
import { NumericInput } from '../shared/numeric-input';
import type { IncomeDeclaration } from '../../../engine/types';

type IncomeField = keyof IncomeDeclaration;

interface IncomeRow {
  field: IncomeField;
  label: string;
  alwaysShow?: boolean;
}

const INCOME_ROWS: IncomeRow[] = [
  { field: 'employment', label: 'Μισθωτές Υπηρεσίες', alwaysShow: true },
  { field: 'pension', label: 'Συντάξεις', alwaysShow: true },
  { field: 'business', label: 'Επιχειρηματική Δραστηριότητα', alwaysShow: true },
  { field: 'agricultural', label: 'Αγροτική Επιχείρηση' },
  { field: 'realEstate', label: 'Εισόδημα Ακίνητης Περιουσίας' },
  { field: 'dividends', label: 'Μερίσματα' },
  { field: 'interest', label: 'Τόκοι' },
  { field: 'capitalGains', label: 'Υπεραξία Κεφαλαίου' },
  { field: 'merchantNavy', label: 'Εμποροναυτικό' },
  { field: 'foreign', label: 'Αλλοδαπή Αμοιβή' },
];

export function IncomeInputScreen() {
  const income = useDeclarationStore((s) => s.declaration.income);
  const withholding = useDeclarationStore((s) => s.declaration.withholding);
  const setIncome = useDeclarationStore((s) => s.setIncome);
  const setWithheld = useDeclarationStore((s) => s.setWithheld);
  const setElectronicPayments = useDeclarationStore((s) => s.setElectronicPayments);
  const electronicTotal = useDeclarationStore((s) => s.declaration.electronicPayments.totalElectronic);
  const setOnboardingStep = useDeclarationStore((s) => s.setOnboardingStep);

  const totalIncome = Object.values(income).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Εισοδήματα</h2>
        <p className="text-xs text-gray-500 mt-1">Βήμα 2 από 3</p>
      </div>

      <div className="flex flex-col gap-3">
        {INCOME_ROWS.map(({ field, label }) => (
          <NumericInput
            key={field}
            label={label}
            value={income[field]}
            onChange={(v) => setIncome(field, v)}
          />
        ))}
      </div>

      <div className="border-t pt-3 flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Παρακρατήσεις</p>
        <NumericInput
          label="Φόρος Παρακρατηθείς"
          value={withholding.taxWithheld}
          onChange={setWithheld}
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

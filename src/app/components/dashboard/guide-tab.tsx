import { useDeclarationStore } from '../../store/declaration-store';

interface GuideStep {
  code: string;
  label: string;
  done: boolean;
}

export function GuideTab() {
  const declaration = useDeclarationStore((s) => s.declaration);
  const income = declaration.income;

  const steps: GuideStep[] = [
    {
      code: '1',
      label: 'Εισαγωγή ΑΦΜ',
      done: declaration.taxpayer.afm.length === 9,
    },
    {
      code: '2',
      label: 'Δήλωση εισοδήματος',
      done: Object.values(income).some((v) => v > 0),
    },
    {
      code: '3',
      label: 'Παρακρατηθείς φόρος',
      done: declaration.withholding.taxWithheld > 0,
    },
    {
      code: '4',
      label: 'Ηλεκτρονικές συναλλαγές',
      done: declaration.electronicPayments.totalElectronic > 0,
    },
    {
      code: '5',
      label: 'Τεκμήρια κατοικίας',
      done: declaration.tekmiria.housing.primaryResidence.sqm > 0,
    },
    {
      code: '6',
      label: 'Υποβολή Ε1 στο myAADE',
      done: false,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Οδηγός Υποβολής</p>
        <span className="text-xs text-gray-400">{doneCount}/{steps.length} βήματα</span>
      </div>
      <div className="flex flex-col gap-2">
        {steps.map((step) => (
          <div
            key={step.code}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
              step.done ? 'bg-green-50' : 'bg-gray-50'
            }`}
          >
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step.done
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.done ? '✓' : step.code}
            </div>
            <span className={`text-sm ${step.done ? 'text-green-800' : 'text-gray-700'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
        Η υποβολή γίνεται αποκλειστικά μέσω του portal{' '}
        <strong>myAADE (taxisnet)</strong>. Αυτή η εφαρμογή δεν υποβάλλει δηλώσεις.
      </div>
    </div>
  );
}

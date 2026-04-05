import { useDeclarationStore } from '../../store/declaration-store';

export function WorkProfileScreen() {
  const afm = useDeclarationStore((s) => s.declaration.taxpayer.afm);
  const maritalStatus = useDeclarationStore((s) => s.declaration.taxpayer.maritalStatus);
  const isDisabled = useDeclarationStore((s) => s.declaration.taxpayer.isDisabled);
  const hasSelfEmployed = useDeclarationStore((s) => !!s.declaration.selfEmployed);
  const setAfm = useDeclarationStore((s) => s.setAfm);
  const setMaritalStatus = useDeclarationStore((s) => s.setMaritalStatus);
  const setIsDisabled = useDeclarationStore((s) => s.setIsDisabled);
  const setSelfEmployed = useDeclarationStore((s) => s.setSelfEmployed);
  const setOnboardingStep = useDeclarationStore((s) => s.setOnboardingStep);

  function handleNext() {
    setOnboardingStep('income-input');
  }

  function toggleSelfEmployed() {
    if (hasSelfEmployed) {
      setSelfEmployed(undefined);
    } else {
      setSelfEmployed({
        isExempt: false,
        yearsOfOperation: 1,
        highestEmployeeGross: 0,
        annualPayrollCost: 0,
        annualTurnover: 0,
        kadCode: '',
        operatingDays: 365,
        suspensionPeriods: [],
        restrictedOperationPeriods: [],
        yearOfOperation: 1,
        hasDisabledChildren: false,
        qualifiesFor30Reduction: false,
        art5GFlatTax: false,
        salaryIncome: 0,
        agriculturalIncome: 0,
        isSmallMunicipality: false,
        isSchoolCafeteriaOperator: false,
      });
    }
  }

  const canContinue = afm.length === 9;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Προφίλ Φορολογούμενου</h2>
        <p className="text-xs text-gray-500 mt-1">Βήμα 1 από 3</p>
      </div>

      {/* AFM */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">ΑΦΜ</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={9}
          value={afm}
          onChange={(e) => setAfm(e.target.value.replace(/\D/g, '').slice(0, 9))}
          placeholder="123456789"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {afm.length > 0 && afm.length < 9 && (
          <p className="text-xs text-red-500">Το ΑΦΜ πρέπει να έχει 9 ψηφία</p>
        )}
      </div>

      {/* Marital status */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-gray-600">Οικογενειακή Κατάσταση</label>
        <div className="grid grid-cols-2 gap-2">
          {(['single', 'married', 'divorced', 'widowed'] as const).map((status) => {
            const labels: Record<string, string> = {
              single: 'Άγαμος/η',
              married: 'Έγγαμος/η',
              divorced: 'Διαζευγμένος/η',
              widowed: 'Χήρος/α',
            };
            return (
              <button
                key={status}
                type="button"
                onClick={() => setMaritalStatus(status)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  maritalStatus === status
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Disability */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isDisabled}
          onChange={(e) => setIsDisabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm text-gray-700">Αναπηρία &gt;67%</span>
      </label>

      {/* Self-employed toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={hasSelfEmployed}
          onChange={toggleSelfEmployed}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm text-gray-700">Ελεύθερος επαγγελματίας / Επιχειρηματίας</span>
      </label>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canContinue}
        className="mt-auto rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white
                   hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Συνέχεια →
      </button>
    </div>
  );
}

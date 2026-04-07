import { useDeclarationStore } from '../../store/declaration-store';
import { Counter } from '../shared/counter';
import { NumericInput } from '../shared/numeric-input';

export function FamilyAssetsScreen() {
  const dependents = useDeclarationStore((s) => s.declaration.taxpayer.dependents);
  const primaryResidence = useDeclarationStore(
    (s) => s.declaration.tekmiria.housing.primaryResidence
  );
  const cars = useDeclarationStore((s) => s.declaration.tekmiria.cars);

  const setDependents = useDeclarationStore((s) => s.setDependents);
  const setHousingPrimary = useDeclarationStore((s) => s.setHousingPrimary);
  const addCar = useDeclarationStore((s) => s.addCar);
  const updateCar = useDeclarationStore((s) => s.updateCar);
  const removeCar = useDeclarationStore((s) => s.removeCar);
  const setOnboardingStep = useDeclarationStore((s) => s.setOnboardingStep);

  function handleFinish() {
    setOnboardingStep('done');
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Οικογένεια & Περιουσία</h2>
        <p className="text-xs text-gray-500 mt-1">Βήμα 3 από 3</p>
      </div>

      {/* Dependents */}
      <Counter
        label="Εξαρτώμενα τέκνα"
        value={dependents}
        onChange={setDependents}
        max={5}
      />

      {/* Primary residence */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Κύρια Κατοικία</p>
        <NumericInput
          label="Τετραγωνικά μέτρα"
          value={primaryResidence.sqm}
          onChange={(sqm) => setHousingPrimary(sqm, primaryResidence.owned)}
          suffix="τ.μ."
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={primaryResidence.owned}
            onChange={(e) => setHousingPrimary(primaryResidence.sqm, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">Ιδιόκτητη</span>
        </label>
      </div>

      {/* Cars */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Αυτοκίνητα (ΙΧ)</p>
          <button
            type="button"
            onClick={() => addCar(1400, undefined, false)}
            className="text-xs text-blue-600 font-medium hover:text-blue-800"
          >
            + Προσθήκη
          </button>
        </div>
        {cars.length === 0 && (
          <p className="text-xs text-gray-400">Δεν έχετε καταχωρήσει αυτοκίνητα.</p>
        )}
        {cars.map((car, i) => (
          <div key={`car-${i}-${car.cc}`} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
            <div className="flex-1">
              <NumericInput
                label={`Αυτ. ${i + 1} — κ.εκ.`}
                value={car.cc}
                onChange={(cc) => updateCar(i, { cc })}
                suffix="κ.εκ."
              />
              <label className="flex items-center gap-2 text-xs cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={car.registeredAfterNov2010 ?? false}
                  onChange={(e) => updateCar(i, { registeredAfterNov2010: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                />
                <span className="text-gray-600">Μετά 11/2010 (τεκμήριο CO2)</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => removeCar(i)}
              className="text-red-400 hover:text-red-600 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => setOnboardingStep('income-input')}
          className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600
                     hover:bg-gray-50"
        >
          ← Πίσω
        </button>
        <button
          type="button"
          onClick={handleFinish}
          className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white
                     hover:bg-green-700"
        >
          Εκκαθάριση →
        </button>
      </div>
    </div>
  );
}

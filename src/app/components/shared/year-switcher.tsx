import { useDeclarationStore } from '../../store/declaration-store';

const SUPPORTED_YEARS = [2025, 2024];

export function YearSwitcher() {
  const fiscalYear = useDeclarationStore((s) => s.declaration.fiscalYear);
  const setFiscalYear = useDeclarationStore((s) => s.setFiscalYear);

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      {SUPPORTED_YEARS.map((year) => (
        <button
          key={year}
          type="button"
          onClick={() => setFiscalYear(year)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            fiscalYear === year
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {year}
        </button>
      ))}
    </div>
  );
}

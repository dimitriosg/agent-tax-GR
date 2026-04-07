interface CounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function Counter({ label, value, onChange, min = 0, max = 10 }: CounterProps) {
  function decrement() {
    if (value > min) onChange(value - 1);
  }
  function increment() {
    if (value < max) onChange(value + 1);
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="h-8 w-8 rounded-full border border-gray-300 text-gray-600
                     flex items-center justify-center text-lg leading-none
                     hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="h-8 w-8 rounded-full border border-gray-300 text-gray-600
                     flex items-center justify-center text-lg leading-none
                     hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}

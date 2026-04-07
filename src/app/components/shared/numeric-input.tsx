import type { ChangeEvent } from 'react';

interface NumericInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** E1 form field code, e.g. "301–302" */
  code?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** Visual indicator that this value was auto-filled from the page */
  autoFilled?: boolean;
}

export function NumericInput({
  label,
  value,
  onChange,
  code,
  suffix = '€',
  placeholder = '0',
  min = 0,
  max,
  disabled = false,
  autoFilled = false,
}: NumericInputProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10);
    if (max !== undefined && num > max) return;
    onChange(num);
  }

  const displayValue = value === 0 ? '' : value.toLocaleString('el-GR');

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        {code && (
          <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
            κωδ. {code}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm pr-8
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-50 disabled:text-gray-400
                     ${autoFilled
                       ? 'border-blue-400 bg-blue-50/30'
                       : 'border-gray-300'}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          {suffix}
        </span>
      </div>
    </div>
  );
}

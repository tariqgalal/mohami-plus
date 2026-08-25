"use client";

interface Option {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyText?: string;
  columns?: 1 | 2;
}

export function CheckboxGroup({
  options,
  value,
  onChange,
  emptyText = "لا توجد عناصر",
  columns = 2,
}: CheckboxGroupProps) {
  return (
    <div
      className={`grid gap-2 p-3 border border-slate-200 rounded-md bg-slate-50 max-h-48 overflow-y-auto ${
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
      }`}
    >
      {options.map((o) => {
        const checked = value.includes(o.value);
        return (
          <label
            key={o.value}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5 rounded"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, o.value]
                    : value.filter((v) => v !== o.value),
                )
              }
              className="size-4 accent-brand-600 shrink-0"
            />
            <span className="truncate">{o.label}</span>
          </label>
        );
      })}
      {options.length === 0 && (
        <p className="text-xs text-slate-400 col-span-full text-center py-2">
          {emptyText}
        </p>
      )}
    </div>
  );
}


import type { ReactNode } from "react";

export const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]";

interface EmployeeFormFieldProps {
  label: string;
  children: ReactNode;
}

export function EmployeeFormField({
  label,
  children,
}: EmployeeFormFieldProps) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

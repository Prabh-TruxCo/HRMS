"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { inputClass } from "./EmployeeFormField";

export interface SearchableSelectOption {
  id: number | string;
  name: string;
  description?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  allowClear?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  disabled = false,
  loading = false,
  allowClear = true,
  emptyMessage = "No matching options found.",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => String(option.id) === value);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return options;

    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(query) ||
        String(option.id).toLowerCase().includes(query) ||
        (option.description ?? "").toLowerCase().includes(query),
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  function selectOption(option: SearchableSelectOption) {
    onChange(String(option.id));
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {selectedOption?.name ?? placeholder}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {allowClear && value && !disabled && (
            <span
              role="button"
              aria-label="Clear selection"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
                setSearch("");
                setOpen(false);
              }}
              className="text-slate-400 hover:text-slate-700"
            >
              ×
            </span>
          )}
          <span className="text-slate-400">▾</span>
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className={inputClass}
            />
          </div>

          <div className="max-h-56 overflow-y-auto p-1" role="listbox">
            {loading ? (
              <p className="px-3 py-4 text-center text-xs text-slate-500">
                Loading options...
              </p>
            ) : filteredOptions.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-500">
                {emptyMessage}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = String(option.id) === value;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(option)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-[var(--brand-color-soft)] font-medium text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{option.name}</span>
                      {option.description && (
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                          {option.description}
                        </span>
                      )}
                    </span>

                    {isSelected && (
                      <span className="shrink-0 text-[var(--brand-color)]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {allowClear && value && (
            <div className="border-t border-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full rounded-md px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

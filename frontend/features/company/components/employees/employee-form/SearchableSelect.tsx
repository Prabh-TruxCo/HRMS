"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { inputClass } from "./EmployeeFormField";

export interface SearchableSelectOption {
  id: number | string;
  name: string;
  description?: string;
}

interface SearchResult {
  options: SearchableSelectOption[];
  hasMore: boolean;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  searchOptions: (query: string, page: number) => Promise<SearchResult>;
  selectedOption?: SearchableSelectOption | null;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  value,
  onChange,
  searchOptions,
  selectedOption,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  disabled = false,
  allowClear = true,
  emptyMessage = "No matching options found.",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const selected = options.find((option) => String(option.id) === value);

  const currentSelection =
    selected ??
    (selectedOption && String(selectedOption.id) === value
      ? selectedOption
      : null);

  const loadOptions = useCallback(
    async (query: string, requestedPage: number) => {
      const request = ++requestId.current;

      if (requestedPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await searchOptions(query, requestedPage);

        if (request !== requestId.current) return;

        setOptions((previous) => {
          const combined =
            requestedPage === 1
              ? result.options
              : [...previous, ...result.options];

          const unique = new Map(
            combined.map((option) => [String(option.id), option]),
          );

          return Array.from(unique.values());
        });

        setHasMore(result.hasMore);
        setPage(requestedPage);
      } catch (error) {
        if (request === requestId.current) {
          console.error("Failed to search selector options:", error);

          if (requestedPage === 1) {
            setOptions([]);
            setHasMore(false);
          }
        }
      } finally {
        if (request === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [searchOptions],
  );

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      void loadOptions(search.trim(), 1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, search, loadOptions]);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        requestId.current += 1;
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
    requestId.current += 1;
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
            currentSelection ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {currentSelection?.name ?? placeholder}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {allowClear && value && !disabled && (
            <span
              className="text-slate-400 hover:text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
                setSearch("");
                setOpen(false);
              }}
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

          <div
            className="max-h-56 overflow-y-auto p-1"
            role="listbox"
            onScroll={(event) => {
              const element = event.currentTarget;
              const nearBottom =
                element.scrollHeight -
                  element.scrollTop -
                  element.clientHeight <
                40;

              if (nearBottom && hasMore && !loading && !loadingMore) {
                void loadOptions(search.trim(), page + 1);
              }
            }}
          >
            {loading ? (
              <p className="px-3 py-4 text-center text-xs text-slate-500">
                Searching...
              </p>
            ) : options.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-500">
                {emptyMessage}
              </p>
            ) : (
              options.map((option) => {
                const isSelected = String(option.id) === value;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(option)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs ${
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
                      <span className="text-[var(--brand-color)]">✓</span>
                    )}
                  </button>
                );
              })
            )}

            {loadingMore && (
              <p className="px-3 py-2 text-center text-xs text-slate-500">
                Loading more...
              </p>
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
                className="w-full rounded-md px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"
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

"use client";

import { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";

import { useCompany } from "@/features/company/context/CompanyContext";

export default function CompanySwitcher() {
  const { companies, currentCompany, setCurrentCompany, isLoading } =
    useCompany();

  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-10 w-56 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
    );
  }

  if (!currentCompany) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-[220px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 text-left shadow-sm transition hover:border-[var(--brand-color-border)]"
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
          style={{
            backgroundColor: "var(--brand-color-soft)",
            color: "var(--brand-color)",
          }}
        >
          {currentCompany.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
            {currentCompany.name}
          </p>

          <p className="truncate text-[10px] text-[var(--text-muted)]">
            {currentCompany.industry_type}
          </p>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text-secondary)] transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close company menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-12 z-50 w-[280px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_16px_40px_rgba(41,43,39,0.12)]">
            <div className="px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Your companies
              </p>
            </div>

            <div className="space-y-1">
              {companies.map((company) => {
                const isSelected = company.id === currentCompany.id;

                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => {
                      setCurrentCompany(company);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      isSelected
                        ? "bg-[var(--brand-color-soft)]"
                        : "hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--brand-color-soft)",
                        color: "var(--brand-color)",
                      }}
                    >
                      {company.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                        {company.name}
                      </p>

                      <p className="truncate text-[10px] text-[var(--text-muted)]">
                        {company.industry_type}
                      </p>
                    </div>

                    {isSelected && (
                      <Check
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--brand-color)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="my-2 border-t border-[var(--border-muted)]" />

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                // We'll connect this to company creation later.
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition hover:bg-[var(--surface-muted)]"
              style={{ color: "var(--brand-color)" }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed"
                style={{ borderColor: "var(--brand-color-border)" }}
              >
                <Plus className="h-4 w-4" />
              </div>
              Add another company
            </button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";

import { useCompany } from "@/features/company/context/CompanyContext";


export default function CompanySwitcher() {
  const {
    companies,
    currentCompany,
    setCurrentCompany,
    isLoading,
  } = useCompany();

  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-10 w-56 animate-pulse rounded-xl bg-[#EEF1EB]" />
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
        className="flex h-10 w-[220px] items-center gap-3 rounded-xl border border-[#E1E5DE] bg-white px-3.5 text-left shadow-sm transition hover:border-[#CBD5C7]"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E5EFE2] text-xs font-semibold text-[#5F8F59]">
          {currentCompany.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#29352A]">
            {currentCompany.name}
          </p>

          <p className="truncate text-[10px] text-[#8A9288]">
            {currentCompany.industry_type}
          </p>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#7B8379] transition ${
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

          <div className="absolute left-0 top-12 z-50 w-[280px] rounded-2xl border border-[#E0E5DD] bg-white p-2 shadow-[0_16px_40px_rgba(41,43,39,0.12)]">
            <div className="px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#929A90]">
                Your companies
              </p>
            </div>

            <div className="space-y-1">
              {companies.map((company) => {
                const isSelected =
                  company.id === currentCompany.id;

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
                        ? "bg-[#EEF4EB]"
                        : "hover:bg-[#F6F8F4]"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E5EFE2] text-xs font-semibold text-[#5F8F59]">
                      {company.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#29352A]">
                        {company.name}
                      </p>

                      <p className="truncate text-[10px] text-[#8A9288]">
                        {company.industry_type}
                      </p>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-[#5F8F59]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="my-2 border-t border-[#EEF0EB]" />

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                // We'll connect this to company creation later.
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-[#5F8F59] transition hover:bg-[#F6F8F4]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-[#B8C8B3]">
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
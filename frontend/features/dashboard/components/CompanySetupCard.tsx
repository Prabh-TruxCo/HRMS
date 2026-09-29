"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

import { useCompany } from "@/features/company/context/CompanyContext";
import { getCompanySetupStatus } from "@/features/company/services/companySetupService";
import type { CompanySetupStatus } from "@/features/company/services/companySetupService";

export default function CompanySetupCard() {
  const router = useRouter();
  const { currentCompany } = useCompany();

  const [status, setStatus] = useState<CompanySetupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentCompany) {
      return;
    }

    let isMounted = true;

    const loadStatus = async () => {
      setIsLoading(true);

      try {
        const result = await getCompanySetupStatus(currentCompany.id);

        if (isMounted) {
          setStatus(result);
        }
      } catch {
        if (isMounted) {
          setStatus(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [currentCompany]);

  if (!currentCompany || isLoading || !status) {
    return null;
  }

  const sections = [
    {
      label: "Company Profile",
      completed: status.profile,
    },
    {
      label: "Branding",
      completed: status.branding,
    },
    {
      label: "Organization Structure",
      completed: status.organization,
    },
    {
      label: "Workforce Settings",
      completed: status.workforce,
    },
  ];

  if (status.percentage === 100) {
    return null;
  }

  return (
    <section className="mx-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Company Setup
          </p>

          <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
            Complete your company setup
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {status.percentage}% complete
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/settings/company")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)]"
        >
          Continue setup
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--brand-color)] transition-all"
          style={{
            width: `${status.percentage}%`,
          }}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <div key={section.label} className="flex items-center gap-3 text-sm">
            {section.completed ? (
              <Check size={17} className="shrink-0 text-[var(--brand-color)]" />
            ) : (
              <Circle size={17} className="shrink-0 text-[var(--text-muted)]" />
            )}

            <span
              className={
                section.completed
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              }
            >
              {section.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

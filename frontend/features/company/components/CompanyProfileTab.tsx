"use client";

import { useEffect, useState } from "react";

import { useCompany } from "@/features/company/context/CompanyContext";
import {
  getCompany,
  updateCompany,
  type CompanyDetail,
} from "@/features/company/services/companyService";
import {
  COMPANY_SIZES,
  COUNTRIES,
  INDUSTRIES,
} from "@/features/onboarding/constants";

export default function CompanyProfileTab() {
  const { currentCompany, isLoading: isCompanyLoading } = useCompany();

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentCompany) {
      return;
    }

    let isMounted = true;

    const loadCompany = async () => {
      try {
        setIsLoading(true);
        setError("");
        setMessage("");

        const result = await getCompany(currentCompany.id);

        if (!isMounted) {
          return;
        }

        setCompany(result);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setError(
          error instanceof Error ? error.message : "Unable to load company.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCompany();

    return () => {
      isMounted = false;
    };
  }, [currentCompany]);

  if (isCompanyLoading) {
    return (
      <div className="text-sm text-[var(--text-secondary)]">
        Loading company...
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="text-sm text-[var(--text-secondary)]">
        No company selected.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-[var(--text-secondary)]">
        Loading company settings...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-sm text-red-600">
        {error || "Company could not be loaded."}
      </div>
    );
  }

  const handleChange = (field: keyof CompanyDetail, value: string) => {
    setCompany((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        [field]: value,
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setMessage("");

      const updated = await updateCompany(company.id, {
        name: company.name.trim(),
        legal_name: company.legal_name?.trim() || null,
        industry_type: company.industry_type,
        employee_size: company.employee_size || null,
        country: company.country,
        timezone: company.timezone.trim(),
        color: company.color,
        logo: company.logo,
      });

      setCompany(updated);
      setMessage("Company profile updated successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update company.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Company Profile
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage the basic information for your company.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Company Name
          </label>

          <input
            type="text"
            value={company.name}
            onChange={(event) => handleChange("name", event.target.value)}
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
            placeholder="Enter company name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Legal Name
          </label>

          <input
            type="text"
            value={company.legal_name ?? ""}
            onChange={(event) => handleChange("legal_name", event.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
            placeholder="Enter legal company name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Company Code
          </label>

          <input
            type="text"
            value={company.code}
            disabled
            className="w-full rounded-xl border border-[var(--border-muted)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-secondary)]"
          />

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Company code cannot be changed.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Industry
          </label>

          <select
            value={company.industry_type}
            onChange={(event) =>
              handleChange("industry_type", event.target.value)
            }
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
          >
            <option value="">Select industry</option>

            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Employee Size
          </label>

          <select
            value={company.employee_size ?? ""}
            onChange={(event) =>
              handleChange("employee_size", event.target.value)
            }
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
          >
            <option value="">Select employee size</option>

            {COMPANY_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Country
          </label>

          <select
            value={company.country}
            onChange={(event) => handleChange("country", event.target.value)}
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
          >
            <option value="">Select country</option>

            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Timezone
          </label>

          <select
            value={company.timezone}
            onChange={(event) => handleChange("timezone", event.target.value)}
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
          >
            <option value="Asia/Kolkata">India — Asia/Kolkata</option>

            <option value="America/New_York">
              United States — Eastern Time
            </option>

            <option value="America/Chicago">
              United States — Central Time
            </option>

            <option value="America/Denver">
              United States — Mountain Time
            </option>

            <option value="America/Los_Angeles">
              United States — Pacific Time
            </option>

            <option value="Europe/London">United Kingdom — London</option>

            <option value="Australia/Sydney">Australia — Sydney</option>

            <option value="Asia/Dubai">UAE — Dubai</option>

            <option value="Asia/Singapore">Singapore — Singapore</option>
          </select>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            This timezone will be used for company attendance and date/time
            calculations.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-xl border border-[var(--brand-color-border)] bg-[var(--brand-color-soft)] px-4 py-3 text-sm text-[var(--brand-color)]">
          {message}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-[var(--brand-color)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

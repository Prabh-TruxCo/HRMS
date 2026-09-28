"use client";

import { useEffect, useState } from "react";

import AuthGuard from "@/features/auth/components/AuthGuard";
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

export default function CompanySettingsPage() {
  return (
    <AuthGuard>
      <CompanySettingsContent />
    </AuthGuard>
  );
}

function CompanySettingsContent() {
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
    return <div className="p-6 text-sm text-[#7B8379]">Loading company...</div>;
  }

  if (!currentCompany) {
    return (
      <div className="p-6 text-sm text-[#7B8379]">No company selected.</div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-[#7B8379]">
        Loading company settings...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 text-sm text-red-600">
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
    <div className="mx-auto max-w-4xl p-6">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-[#5F8F59]">Company Settings</p>

        <h1 className="mt-1 text-2xl font-semibold text-[#29352A]">
          Company Profile
        </h1>

        <p className="mt-2 text-sm text-[#7B8379]">
          Manage the basic information for your company.
        </p>
      </div>

      {/* Company Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#E2E5DF] bg-white p-6"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Company Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#29352A]">
              Company Name
            </label>

            <input
              type="text"
              value={company.name}
              onChange={(event) => handleChange("name", event.target.value)}
              required
              className="w-full rounded-xl border border-[#D9DED6] px-4 py-3 outline-none transition focus:border-[#5F8F59]"
              placeholder="Enter company name"
            />
          </div>

          {/* Legal Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#29352A]">
              Legal Name
            </label>

            <input
              type="text"
              value={company.legal_name ?? ""}
              onChange={(event) =>
                handleChange("legal_name", event.target.value)
              }
              className="w-full rounded-xl border border-[#D9DED6] px-4 py-3 outline-none transition focus:border-[#5F8F59]"
              placeholder="Enter legal company name"
            />
          </div>

          {/* Company Code */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#29352A]">
              Company Code
            </label>

            <input
              type="text"
              value={company.code}
              disabled
              className="w-full rounded-xl border border-[#E3E6E0] bg-[#F5F6F3] px-4 py-3 text-[#7B8379]"
            />

            <p className="mt-1 text-xs text-[#9AA197]">
              Company code cannot be changed.
            </p>
          </div>

          {/* Industry */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#29352A]">
              Industry
            </label>

            <select
              value={company.industry_type}
              onChange={(event) =>
                handleChange("industry_type", event.target.value)
              }
              required
              className="w-full rounded-xl border border-[#D9DED6] bg-white px-4 py-3 outline-none transition focus:border-[#5F8F59]"
            >
              <option value="">Select industry</option>

              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Size */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#29352A]">
              Employee Size
            </label>

            <select
              value={company.employee_size ?? ""}
              onChange={(event) =>
                handleChange("employee_size", event.target.value)
              }
              className="w-full rounded-xl border border-[#D9DED6] bg-white px-4 py-3 outline-none transition focus:border-[#5F8F59]"
            >
              <option value="">Select employee size</option>

              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#29352A]">
              Country
            </label>

            <select
              value={company.country}
              onChange={(event) => handleChange("country", event.target.value)}
              required
              className="w-full rounded-xl border border-[#D9DED6] bg-white px-4 py-3 outline-none transition focus:border-[#5F8F59]"
            >
              <option value="">Select country</option>

              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[#29352A]">
              Timezone
            </label>

            <select
              value={company.timezone}
              onChange={(event) => handleChange("timezone", event.target.value)}
              required
              className="w-full rounded-xl border border-[#D9DED6] bg-white px-4 py-3 outline-none transition focus:border-[#5F8F59]"
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

            <p className="mt-1 text-xs text-[#9AA197]">
              This timezone will be used for company attendance and date/time
              calculations.
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-xl border border-[#DCE9D8] bg-[#EEF3EA] px-4 py-3 text-sm text-[#5F8F59]">
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#5F8F59] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#527D4D] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

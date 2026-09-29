"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useRegistration } from "@/features/auth/context/RegistrationContext";
import { registerAccount } from "@/features/auth/services/authService";
import { createCompanies } from "@/features/onboarding/services/companyService";
import { uploadCompanyLogo } from "@/features/company/services/companyLogoService";

import SetupHeader from "@/features/onboarding/components/SetupHeader";
import SetupProgress from "@/features/onboarding/components/SetupProgress";
import SetupIntro from "@/features/onboarding/components/SetupIntro";
import CompanyList from "@/features/onboarding/components/CompanyList";
import CompanySetupModal from "@/features/onboarding/components/CompanySetupModal";
import SetupFooter from "@/features/onboarding/components/SetupFooter";

import type { CompanySetup } from "@/features/onboarding/types";

export default function SetupPage() {
  const router = useRouter();

  const [workspaceName, setWorkspaceName] = useState("");
  const [companies, setCompanies] = useState<CompanySetup[]>([]);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanySetup | null>(
    null,
  );

  const { registrationData, clearRegistrationData } = useRegistration();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canContinue = workspaceName.trim().length > 0 && companies.length > 0;

  const handleAddCompany = () => {
    setEditingCompany(null);
    setIsCompanyModalOpen(true);
  };

  const handleEditCompany = (company: CompanySetup) => {
    setEditingCompany(company);
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = (company: CompanySetup) => {
    setCompanies((current) => {
      const exists = current.some((item) => item.id === company.id);

      if (exists) {
        return current.map((item) => (item.id === company.id ? company : item));
      }

      return [...current, company];
    });

    setIsCompanyModalOpen(false);
    setEditingCompany(null);
  };

  const handleContinue = async () => {
    if (!canContinue || isSubmitting) return;

    const firstCompany = companies[0];

    if (!firstCompany) return;

    setIsSubmitting(true);
    setError("");

    try {
      // ----------------------------------------
      // STEP 1
      // Create account + first company
      // ----------------------------------------

      const response = await registerAccount({
        first_name: registrationData.first_name,
        last_name: registrationData.last_name,
        email: registrationData.email,
        password: registrationData.password,

        account_name: workspaceName.trim(),

        company_name: firstCompany.companyName.trim(),
        company_code: firstCompany.companyCode.trim(),
        industry_type: firstCompany.industry.trim(),
        employee_size: firstCompany.companySize || null,
        country: firstCompany.country.trim(),

        logo: firstCompany.logo,
        color: firstCompany.brandColor || "#5F8F59",
      });

      console.log("Registration successful:", response);

      // ----------------------------------------
      // STEP 2
      // Create remaining companies
      // ----------------------------------------

      const remainingCompanies = companies.slice(1).map((company) => ({
        name: company.companyName.trim(),
        industry_type: company.industry.trim(),
        employee_size: company.companySize || null,
        country: company.country.trim(),
        code: company.companyCode.trim(),
        color: company.brandColor || "#5F8F59",
      }));

      if (remainingCompanies.length > 0) {
        const createdCompanies = await createCompanies(remainingCompanies);

        for (let index = 0; index < createdCompanies.length; index++) {
          const createdCompany = createdCompanies[index];
          const sourceCompany = companies[index + 1];

          if (sourceCompany.logo) {
            await uploadCompanyLogo(createdCompany.id, sourceCompany.logo);
          }
        }

        console.log("Additional companies created:", createdCompanies);
      }

      // ----------------------------------------
      // STEP 3
      // Registration complete
      // ----------------------------------------

      clearRegistrationData();

      router.push("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to complete account setup.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      {/* Fixed Header */}{" "}
      <div className="shrink-0">
        {" "}
        <SetupHeader /> <SetupProgress />{" "}
      </div>
      ```
      {/* Scrollable Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8 sm:py-10 lg:py-12">
          <SetupIntro />

          {/* Workspace Name */}
          <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_8px_30px_rgba(41,43,39,0.04)] sm:p-7">
            <label
              htmlFor="workspaceName"
              className="mb-2 block text-[13px] font-medium text-[var(--text-secondary)]"
            >
              Workspace name
            </label>

            <input
              id="workspaceName"
              type="text"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="e.g. ABC Group"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-4 focus:ring-[var(--brand-color)]/10"
            />

            <p className="mt-2 text-[12px] leading-5 text-[var(--text-muted)]">
              Your workspace is where you manage one or more companies.
            </p>
          </section>

          {/* Companies */}
          <section className="mt-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">
                  Companies
                </h2>

                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                  Add the companies you want to manage from this workspace.
                </p>
              </div>

              {companies.length > 0 && (
                <span className="shrink-0 rounded-full bg-[var(--brand-color-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand-color)]">
                  {companies.length}{" "}
                  {companies.length === 1 ? "company" : "companies"}
                </span>
              )}
            </div>

            {companies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--brand-color-border)] bg-[var(--brand-color-soft)] p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-color-soft)] text-[var(--brand-color)]">
                  <span className="text-lg">+</span>
                </div>

                <h3 className="mt-4 text-[15px] font-semibold text-[var(--text-secondary)]">
                  Add your first company
                </h3>

                <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-5 text-[var(--text-muted)]">
                  You can add one company now and add more later from your
                  workspace.
                </p>

                <button
                  type="button"
                  onClick={handleAddCompany}
                  className="mt-5 inline-flex h-10 items-center rounded-xl bg-[var(--brand-color)] px-5 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(0,0,0,0.08)] transition hover:bg-[var(--brand-color-hover)]"
                >
                  Add company
                </button>
              </div>
            ) : (
              <CompanyList
                companies={companies}
                onAdd={handleAddCompany}
                onEdit={handleEditCompany}
              />
            )}

            <p className="mt-4 text-[11px] text-[var(--text-muted)]">
              You can add more companies later from Company Settings.
            </p>
          </section>

          <div className="h-10" />
        </div>
      </div>
      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {/* Fixed Footer */}
      <div className="shrink-0">
        <SetupFooter
          disabled={!canContinue || isSubmitting}
          onBack={() => router.push("/login")}
          onContinue={handleContinue}
        />
      </div>
      {/* Company Modal */}
      {isCompanyModalOpen && (
        <CompanySetupModal
          company={editingCompany}
          onClose={() => {
            setIsCompanyModalOpen(false);
            setEditingCompany(null);
          }}
          onSave={handleSaveCompany}
        />
      )}
    </main>
  );
}

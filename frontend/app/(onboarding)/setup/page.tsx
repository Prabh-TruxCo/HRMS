"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useRegistration } from "@/features/auth/context/RegistrationContext";
import { registerAccount } from "@/features/auth/services/authService";
import { createCompanies } from "@/features/onboarding/services/companyService";

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

  const canContinue = workspaceName.trim().length > 0 && companies.length > 0;

  const { registrationData, clearRegistrationData } = useRegistration();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        industry_type: firstCompany.industry.trim(),
        employee_size: firstCompany.companySize || null,
        country: firstCompany.country.trim(),
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
      }));

      if (remainingCompanies.length > 0) {
        const createdCompanies = await createCompanies(remainingCompanies);

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
    <main className="flex h-screen flex-col overflow-hidden bg-[#F3F4F0]">
      {/* Fixed Header */}
      <div className="shrink-0">
        <SetupHeader />
        <SetupProgress />
      </div>

      {/* Scrollable Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8 sm:py-10 lg:py-12">
          <SetupIntro />

          {/* Workspace Name */}
          <section className="mt-8 rounded-2xl border border-[#E0E5DD] bg-[#FCFCFA] p-6 shadow-[0_8px_30px_rgba(41,43,39,0.04)] sm:p-7">
            <label
              htmlFor="workspaceName"
              className="mb-2 block text-[13px] font-medium text-[#414940]"
            >
              Workspace name
            </label>

            <input
              id="workspaceName"
              type="text"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="e.g. ABC Group"
              className="h-11 w-full rounded-xl border border-[#D9DED7] bg-white px-3.5 text-sm text-[#29352A] outline-none transition placeholder:text-[#A2A9A0] focus:border-[#7EA278] focus:ring-4 focus:ring-[#5F8F59]/10"
            />

            <p className="mt-2 text-[12px] leading-5 text-[#8A9288]">
              Your workspace is where you manage one or more companies.
            </p>
          </section>

          {/* Companies */}
          <section className="mt-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[17px] font-semibold text-[#29352A]">
                  Companies
                </h2>

                <p className="mt-1 text-[13px] text-[#7B8379]">
                  Add the companies you want to manage from this workspace.
                </p>
              </div>

              {companies.length > 0 && (
                <span className="shrink-0 rounded-full bg-[#E8F0E5] px-2.5 py-1 text-[11px] font-medium text-[#557950]">
                  {companies.length}{" "}
                  {companies.length === 1 ? "company" : "companies"}
                </span>
              )}
            </div>

            {companies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#C7D1C3] bg-[#F8FAF7] p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E5EFE2] text-[#5F8F59]">
                  <span className="text-lg">+</span>
                </div>

                <h3 className="mt-4 text-[15px] font-semibold text-[#414940]">
                  Add your first company
                </h3>

                <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-5 text-[#899188]">
                  You can add one company now and add more later from your
                  workspace.
                </p>

                <button
                  type="button"
                  onClick={handleAddCompany}
                  className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#5F8F59] px-5 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(95,143,89,0.2)] transition hover:bg-[#527D4D]"
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

            <p className="mt-4 text-[11px] text-[#929A90]">
              You can add more companies later from Company Settings.
            </p>
          </section>

          <div className="h-10" />
        </div>
      </div>
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

"use client";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useCompany } from "@/features/company/context/CompanyContext";
import CompanySetupCard from "@/features/dashboard/components/CompanySetupCard";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { currentCompany, isLoading } = useCompany();

  const firstName = currentUser?.first_name ?? "there";

  return (
    <>
      <div className="p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          {isLoading
            ? "Loading workspace..."
            : (currentCompany?.name ?? "Workspace")}
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
          Good morning, {firstName}
        </h1>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Here’s what’s happening across your workspace.
        </p>
      </div>

      <CompanySetupCard />
    </>
  );
}

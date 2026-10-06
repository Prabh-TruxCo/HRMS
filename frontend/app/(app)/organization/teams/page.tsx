"use client";

import TeamManagement from "@/features/company/components/TeamManagement";
import { useCompany } from "@/features/company/context/CompanyContext";

export default function TeamsPage() {
  const { currentCompany } = useCompany();

  return (
    <TeamManagement
      companyId={currentCompany?.id ?? null}
    />
  );
}
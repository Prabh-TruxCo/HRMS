"use client";

import SiteManagement from "@/features/company/components/SiteManagement";
import { useCompany } from "@/features/company/context/CompanyContext";

export default function SitesPage() {
  const { currentCompany } = useCompany();

  return (
    <SiteManagement
      key={currentCompany?.id ?? "no-company"}
      companyId={currentCompany?.id ?? null}
    />
  );
}
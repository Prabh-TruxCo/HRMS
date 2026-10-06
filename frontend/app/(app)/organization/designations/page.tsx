"use client";

import DesignationManagement from "@/features/company/components/DesignationManagement";
import { useCompany } from "@/features/company/context/CompanyContext";

export default function DesignationsPage() {
  const { currentCompany } = useCompany();

  return (
    <DesignationManagement
      key={currentCompany?.id ?? "no-company"}
      companyId={currentCompany?.id ?? null}
    />
  );
}

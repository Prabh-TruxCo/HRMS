"use client";

import DepartmentManagement from "@/features/company/components/DepartmentManagement";
import { useCompany } from "@/features/company/context/CompanyContext";

export default function DepartmentsPage() {
  const { currentCompany } = useCompany();

  return <DepartmentManagement companyId={currentCompany?.id ?? null} />;
}


"use client";

import EmployeeProfile from "@/features/company/components/EmployeeProfile";
import { useCompany } from "@/features/company/context/CompanyContext";
import { useParams } from "next/navigation";

export default function EmployeeProfilePage() {
  const params = useParams<{ employeeId: string }>();
  const { currentCompany } = useCompany();

  const employeeId = Number(params.employeeId);

  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return (
      <div className="p-6 text-sm text-red-600">
        Invalid employee ID.
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Select a company to view employee details.
      </div>
    );
  }

  return (
    <EmployeeProfile
      companyId={currentCompany.id}
      employeeId={employeeId}
    />
  );
}

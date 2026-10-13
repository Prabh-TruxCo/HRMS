"use client";

import { useParams } from "next/navigation";
import OfficeLocationManagement from "@/features/company/components/OfficeLocationManagement";

export default function OfficeLocationsPage() {
  const params = useParams<{ branchId: string }>();
  const branchId = Number(params.branchId);

  if (!Number.isInteger(branchId) || branchId <= 0) {
    return (
      <div className="p-6 text-sm text-red-600">
        Invalid branch ID.
      </div>
    );
  }

  return <OfficeLocationManagement branchId={branchId} />;
}
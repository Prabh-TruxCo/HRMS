import {
  Building2,
  CheckCircle2,
  Pencil,
  Plus,
} from "lucide-react";

import type { CompanySetup } from "../types";

type CompanyListProps = {
  companies: CompanySetup[];
  onAdd: () => void;
  onEdit: (company: CompanySetup) => void;
};

export default function CompanyList({
  companies,
  onAdd,
  onEdit,
}: CompanyListProps) {
  return (
    <div className="space-y-3">
      {companies.map((company) => (
        <div
          key={company.id}
          className="flex items-center justify-between gap-4 rounded-2xl border border-[#E0E5DD] bg-[#FCFCFA] p-4 shadow-[0_6px_24px_rgba(41,43,39,0.03)]"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
              style={{
                backgroundColor: company.brandColor,
              }}
            >
              <Building2 size={19} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-[14px] font-semibold text-[#29352A]">
                  {company.companyName}
                </h3>

                <CheckCircle2
                  size={15}
                  className="shrink-0 text-[#5F8F59]"
                />
              </div>

              <p className="mt-1 text-[12px] text-[#7B8379]">
                {company.industry} · {company.companySize} ·{" "}
                {company.country}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onEdit(company)}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-[12px] font-medium text-[#687067] transition hover:bg-[#F0F2EE] hover:text-[#414940]"
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="flex min-h-[72px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#BFCBBA] bg-[#F8FAF7] text-[13px] font-medium text-[#5F8F59] transition hover:border-[#8FA88B] hover:bg-[#F2F7F0]"
      >
        <Plus size={17} />
        Add another company
      </button>
    </div>
  );
}
import { BriefcaseBusiness } from "lucide-react";

export default function SetupHeader() {
  return (
    <header className="shrink-0 border-b border-[#E1E5DE] bg-[#FCFCFA]">
      <div className="mx-auto flex h-[76px] w-full max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5F8F59] text-white shadow-sm">
            <BriefcaseBusiness size={18} strokeWidth={2.2} />
          </div>

          <div>
            <p className="text-[15px] font-semibold tracking-[-0.01em] text-[#29352A]">
              HRMS
            </p>

            <p className="text-[11px] text-[#899188]">Workforce platform</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-[12px] font-medium text-[#6F786E]">
            Workspace setup
          </span>

          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#E2E7E0]">
            <div className="h-full w-full rounded-full bg-[#5F8F59]" />
          </div>
        </div>
      </div>
    </header>
  );
}

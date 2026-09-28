"use client";

import CompanySwitcher from "@/features/company/components/CompanySwitcher";
import { Bell, ChevronDown, Search } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useCompany } from "@/features/company/context/CompanyContext";

export default function DashboardTopbar() {
  const { currentUser } = useAuth();
  const { currentCompanyRoles, isRolesLoading } = useCompany();
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#E1E5DE] bg-[#FCFCFA] px-5 sm:px-7">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-4">
        <CompanySwitcher />

        <div className="hidden items-center gap-2 rounded-xl border border-[#E0E5DD] bg-white px-3 py-2 sm:flex">
          <Search size={15} className="text-[#929A90]" />

          <input
            type="text"
            placeholder="Search..."
            className="w-36 bg-transparent text-[12px] text-[#414940] outline-none placeholder:text-[#A2A9A0]"
          />
        </div>

        <div className="sm:hidden">
          <p className="text-[15px] font-semibold text-[#29352A]">Dashboard</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#697169] transition hover:bg-[#F0F2EE]"
          aria-label="Notifications"
        >
          <Bell size={17} />

          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#5F8F59]" />
        </button>

        <div className="h-6 w-px bg-[#E1E5DE]" />

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-[#F2F4F0]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCE9D8] text-[11px] font-semibold text-[#4E704A]">
            {currentUser?.first_name?.charAt(0).toUpperCase() ?? "U"}
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-[11px] font-semibold text-[#414940]">
              {`${currentUser?.first_name ?? ""} ${currentUser?.last_name ?? ""}`.trim()}
            </p>

            <p className="text-[10px] text-[#929A90]">
              {isRolesLoading
                ? "Loading..."
                : currentCompanyRoles.length > 0
                  ? currentCompanyRoles.join(" · ")
                  : "User"}
            </p>
          </div>

          <ChevronDown size={13} className="hidden text-[#929A90] sm:block" />
        </button>
      </div>
    </header>
  );
}

"use client";

import CompanySwitcher from "@/features/company/components/CompanySwitcher";
import { Bell, ChevronDown, Search } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useCompany } from "@/features/company/context/CompanyContext";

export default function DashboardTopbar() {
  const { currentUser } = useAuth();
  const { currentCompanyRoles, isRolesLoading } = useCompany();

  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 sm:px-7">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-4">
        <CompanySwitcher />

        <div className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 sm:flex">
          <Search size={15} className="text-[var(--text-muted)]" />

          <input
            type="text"
            placeholder="Search..."
            className="w-36 bg-transparent text-[12px] text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div className="sm:hidden">
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">
            Dashboard
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
          aria-label="Notifications"
        >
          <Bell size={17} />

          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--brand-color)]" />
        </button>

        <div className="h-6 w-px bg-[var(--border)]" />

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-[var(--surface-muted)]"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{
              backgroundColor: "var(--brand-color-soft)",
              color: "var(--brand-color)",
            }}
          >
            {currentUser?.first_name?.charAt(0).toUpperCase() ?? "U"}
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {`${currentUser?.first_name ?? ""} ${currentUser?.last_name ?? ""}`.trim()}
            </p>

            <p className="text-[10px] text-[var(--text-muted)]">
              {isRolesLoading
                ? "Loading..."
                : currentCompanyRoles.length > 0
                  ? currentCompanyRoles.join(" · ")
                  : "User"}
            </p>
          </div>

          <ChevronDown
            size={13}
            className="hidden text-[var(--text-muted)] sm:block"
          />
        </button>
      </div>
    </header>
  );
}

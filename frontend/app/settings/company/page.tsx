"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Palette,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import AuthGuard from "@/features/auth/components/AuthGuard";
import { useCompany } from "@/features/company/context/CompanyContext";
import CompanyProfileTab from "@/features/company/components/CompanyProfileTab";
import CompanyBrandingTab from "@/features/company/components/CompanyBrandingTab";
import CompanyOrganizationTab from "@/features/company/components/CompanyOrganizationTab";
import CompanyWorkforceTab from "@/features/company/components/CompanyWorkforceTab";

type SettingsTab = "profile" | "branding" | "organization" | "workforce";

type SettingsItem = {
  id: SettingsTab;
  label: string;
  description: string;
  icon: typeof Building2;
};

const generalSettings: SettingsItem[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Company information",
    icon: Building2,
  },
  {
    id: "branding",
    label: "Branding",
    description: "Logo and appearance",
    icon: Palette,
  },
];

const organizationSettings: SettingsItem[] = [
  {
    id: "organization",
    label: "Organization",
    description: "Structure and hierarchy",
    icon: Building2,
  },
  {
    id: "workforce",
    label: "Workforce",
    description: "Workforce policies",
    icon: UsersRound,
  },
];

export default function CompanySettingsPage() {
  return (
    <AuthGuard>
      <CompanySettingsContent />
    </AuthGuard>
  );
}

function CompanySettingsContent() {
  const router = useRouter();
  const { currentCompany } = useCompany();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const allSettings = [...generalSettings, ...organizationSettings];

  const activeSetting = allSettings.find((setting) => setting.id === activeTab);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      {/* =========================================================
          PAGE HEADER
          ========================================================= */}
      <div className="shrink-0">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--brand-color)]">
              Settings
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Company Settings
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
              Manage your company information, appearance, organizational
              structure, and workforce configuration.
            </p>
          </div>

          {currentCompany && (
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: "var(--brand-color-soft)",
                  color: "var(--brand-color)",
                }}
              >
                <Building2 size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-muted)]">
                  Current company
                </p>

                <p className="max-w-[220px] truncate text-sm font-semibold text-[var(--text-primary)]">
                  {currentCompany.name}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          SETTINGS WORKSPACE
          ========================================================= */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)]">
        {/* =======================================================
            LEFT NAVIGATION
            ======================================================= */}
        <aside className="h-fit shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
          <SettingsNavigationSection
            title="General"
            items={generalSettings}
            activeTab={activeTab}
            onSelect={setActiveTab}
          />

          <div className="my-2 border-t border-[var(--border)]" />

          <SettingsNavigationSection
            title="Organization"
            items={organizationSettings}
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
        </aside>

        {/* =======================================================
            RIGHT CONTENT
            ONLY THIS AREA SCROLLS
            ======================================================= */}
        <main className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pr-1">
          {/* Content Header */}
          {activeSetting && (
            <div className="mb-5 flex shrink-0 items-center gap-3">
              {(() => {
                const Icon = activeSetting.icon;

                return (
                  <>
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: "var(--brand-color-soft)",
                        color: "var(--brand-color)",
                      }}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                        {activeSetting.label}
                      </h2>

                      <p className="text-sm text-[var(--text-secondary)]">
                        {activeSetting.description}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* =====================================================
              SETTINGS CONTENT
              ===================================================== */}
          <div className="w-full">
            {activeTab === "profile" && <CompanyProfileTab />}

            {activeTab === "branding" && <CompanyBrandingTab />}

            {activeTab === "organization" && <CompanyOrganizationTab />}

            {activeTab === "workforce" && <CompanyWorkforceTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ===============================================================
   SETTINGS NAVIGATION
   =============================================================== */

function SettingsNavigationSection({
  title,
  items,
  activeTab,
  onSelect,
}: {
  title: string;
  items: SettingsItem[];
  activeTab: SettingsTab;
  onSelect: (id: SettingsTab) => void;
}) {
  return (
    <div>
      <p className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`group flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                isActive
                  ? "bg-[var(--brand-color-soft)] text-[var(--brand-color)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon size={17} className="shrink-0" />

              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-medium ${
                    isActive
                      ? "text-[var(--brand-color)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {item.label}
                </span>

                <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                  {item.description}
                </span>
              </span>

              <ChevronRight
                size={15}
                className={`shrink-0 transition ${
                  isActive
                    ? "text-[var(--brand-color)]"
                    : "text-[var(--text-muted)] opacity-0 group-hover:opacity-100"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

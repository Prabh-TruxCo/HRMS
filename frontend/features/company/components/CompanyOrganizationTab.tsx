"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  Layers3,
  MapPin,
  Network,
  Save,
  Users,
  BriefcaseBusiness,
  LayoutGrid,
} from "lucide-react";

import { useCompany } from "@/features/company/context/CompanyContext";
import {
  getOrganizationConfiguration,
  updateOrganizationConfiguration,
  type OrganizationConfiguration,
} from "@/features/company/services/organizationService";

type OrganizationOption = {
  key: keyof Omit<OrganizationConfiguration, "company_id">;
  title: string;
  description: string;
  icon: typeof Building2;
};

const coreOrganizationOptions: OrganizationOption[] = [
  {
    key: "departments_enabled",
    title: "Departments",
    description:
      "Organize employees into departments such as HR, IT, Finance, or Operations.",
    icon: Building2,
  },
  {
    key: "teams_enabled",
    title: "Teams",
    description: "Group employees into teams within your organization.",
    icon: Users,
  },
  {
    key: "designations_enabled",
    title: "Designations",
    description:
      "Define employee job titles such as Manager, Developer, Supervisor, or Security Guard.",
    icon: Layers3,
  },
  {
    key: "branches_enabled",
    title: "Branches",
    description: "Manage separate business branches or company locations.",
    icon: Network,
  },
];

const operationalOrganizationOptions: OrganizationOption[] = [
  {
    key: "clients_enabled",
    title: "Clients",
    description: "Manage customer or client organizations your company serves.",
    icon: BriefcaseBusiness,
  },
  {
    key: "sites_enabled",
    title: "Sites",
    description:
      "Manage operational or work locations belonging to your company or clients.",
    icon: MapPin,
  },
  {
    key: "posts_enabled",
    title: "Posts",
    description:
      "Define operational posts or work positions within sites, such as Main Gate, Back Gate, Front Desk, Lift, Parking, or Control Room.",
    icon: LayoutGrid,
  },
];

export default function CompanyOrganizationTab() {
  const { currentCompany } = useCompany();

  const [configuration, setConfiguration] =
    useState<OrganizationConfiguration | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!currentCompany) {
      return;
    }

    let isMounted = true;

    const loadConfiguration = async () => {
      try {
        setIsLoading(true);
        setError("");
        setSuccess("");

        const result = await getOrganizationConfiguration(currentCompany.id);

        if (!isMounted) return;

        setConfiguration(result);
      } catch (err) {
        if (!isMounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load organization configuration.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadConfiguration();

    return () => {
      isMounted = false;
    };
  }, [currentCompany]);

  const handleToggle = (
    key: keyof Omit<OrganizationConfiguration, "company_id">,
  ) => {
    setConfiguration((current) => {
      if (!current) return current;

      const nextValue = !current[key];

      const updated = {
        ...current,
        [key]: nextValue,
      };

      /*
       * Organization hierarchy:
       *
       * Client
       *   ↓
       * Site
       *   ↓
       * Post
       *
       * Therefore:
       * - Sites cannot remain enabled when Clients are disabled.
       * - Posts cannot remain enabled when Sites are disabled.
       */

      if (key === "clients_enabled" && !nextValue) {
        updated.sites_enabled = false;
        updated.posts_enabled = false;
      }

      if (key === "sites_enabled" && !nextValue) {
        updated.posts_enabled = false;
      }

      return updated;
    });

    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!currentCompany || !configuration) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const result = await updateOrganizationConfiguration(currentCompany.id, {
        branches_enabled: configuration.branches_enabled,
        departments_enabled: configuration.departments_enabled,
        teams_enabled: configuration.teams_enabled,
        designations_enabled: configuration.designations_enabled,
        clients_enabled: configuration.clients_enabled,
        sites_enabled: configuration.sites_enabled,
        posts_enabled: configuration.posts_enabled,
      });

      setConfiguration(result);
      setSuccess("Organization settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save organization settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentCompany) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Please select a company to configure its organization.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Loading organization settings...
        </p>
      </div>
    );
  }

  if (!configuration) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-red-600">
          {error || "Organization configuration could not be loaded."}
        </p>
      </div>
    );
  }

  const renderOption = (option: OrganizationOption) => {
    const Icon = option.icon;
    const enabled = configuration[option.key];

    const isSiteOption = option.key === "sites_enabled";
    const isPostOption = option.key === "posts_enabled";

    const disabled =
      (isSiteOption && !configuration.clients_enabled) ||
      (isPostOption && !configuration.sites_enabled);

    return (
      <div
        key={option.key}
        className={`flex items-center justify-between gap-5 p-5 ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <div className="flex min-w-0 items-start gap-4">
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
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {option.title}
            </h3>

            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              {option.description}
            </p>

            {isSiteOption && !configuration.clients_enabled && (
              <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">
                Enable Clients first to use Sites.
              </p>
            )}

            {isPostOption && !configuration.sites_enabled && (
              <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">
                Enable Sites first to use Posts.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`Enable ${option.title}`}
          disabled={disabled}
          onClick={() => handleToggle(option.key)}
          className={`relative flex h-7 w-12 shrink-0 items-center rounded-full transition ${
            disabled
              ? "cursor-not-allowed bg-[var(--border)]"
              : enabled
                ? "bg-[var(--brand-color)]"
                : "bg-[var(--border)]"
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          >
            {enabled && (
              <Check size={12} className="text-[var(--brand-color)]" />
            )}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Organization Structure
        </h2>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
          Choose the organizational structures your company uses. You can
          configure the actual records after enabling them.
        </p>
      </div>

      {/* Core Organization */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Core Organization
          </h3>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Define how your employees and internal organization are structured.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="divide-y divide-[var(--border)]">
            {coreOrganizationOptions.map(renderOption)}
          </div>
        </div>
      </div>

      {/* Operational Organization */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Operational Organization
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            Enable these when your company manages clients, operational sites,
            or specific posts within those sites.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="divide-y divide-[var(--border)]">
            {operationalOrganizationOptions.map(renderOption)}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-[var(--brand-color-border)] bg-[var(--brand-color-soft)] px-4 py-3 text-sm text-[var(--brand-color)]">
          {success}
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-color)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} />

          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

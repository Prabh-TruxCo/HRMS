"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  Clock3,
  Fingerprint,
  MapPin,
  Settings2,
  ShieldCheck,
  Users,
  Wifi,
} from "lucide-react";

import AuthGuard from "@/features/auth/components/AuthGuard";
import { useCompany } from "@/features/company/context/CompanyContext";
import {
  getWorkforceConfiguration,
  getWorkforceRecommendation,
  type WorkforceConfiguration,
} from "@/features/company/services/workforceService";

type FeatureCardProps = {
  title: string;
  description: string;
  enabled: boolean;
  icon: typeof Users;
};

function FeatureCard({
  title,
  description,
  enabled,
  icon: Icon,
}: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: "var(--brand-color-soft)",
            color: "var(--brand-color)",
          }}
        >
          <Icon size={19} />
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            enabled
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
          }`}
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}

function WorkforceContent() {
  const { currentCompany } = useCompany();

  const [configuration, setConfiguration] =
    useState<WorkforceConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const companyId = currentCompany?.id;
    let cancelled = false;

    if (companyId == null) {
      return () => {
        cancelled = true;
      };
    }

    const validCompanyId: number = companyId;

    async function loadConfiguration() {
      try {
        const savedConfiguration =
          await getWorkforceConfiguration(validCompanyId);

        if (cancelled) return;

        if (savedConfiguration) {
          setConfiguration(savedConfiguration);
        } else {
          // Load recommendations without saving them automatically.
          const recommendation =
            await getWorkforceRecommendation(validCompanyId);

          if (cancelled) return;

          setConfiguration({
            company_id: validCompanyId,
            setup_mode: recommendation.setup_mode,
            attendance_enabled: recommendation.attendance_enabled,
            attendance_methods: recommendation.attendance_methods,
            late_marking_enabled: recommendation.late_marking_enabled,
            grace_period_minutes: recommendation.grace_period_minutes,
            early_checkout_enabled: recommendation.early_checkout_enabled,
            auto_markout_enabled: recommendation.auto_markout_enabled,
            attendance_regularization_enabled:
              recommendation.attendance_regularization_enabled,
            attendance_approval_required:
              recommendation.attendance_approval_required,
            shifts_enabled: recommendation.shifts_enabled,
            overtime_enabled: recommendation.overtime_enabled,
            overtime_approval_required:
              recommendation.overtime_approval_required,
            remote_work_enabled: recommendation.remote_work_enabled,
            field_work_enabled: recommendation.field_work_enabled,
            gps_attendance_enabled: recommendation.gps_attendance_enabled,
            geofencing_enabled: recommendation.geofencing_enabled,
          });
        }
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load Workforce Overview.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadConfiguration();

    return () => {
      cancelled = true;
    };
  }, [currentCompany?.id]);

  const settingsUrl = "/settings/company";

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Loading Workforce Overview...
        </p>
      </div>
    );
  }

  if (error || !configuration) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Unable to load Workforce Overview
        </h2>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {error || "Select a company to view its workforce configuration."}
        </p>

        {error && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--brand-color)" }}
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const features = [
    {
      title: "Attendance",
      description: `${configuration.attendance_methods.length} configured method(s)`,
      enabled: configuration.attendance_enabled,
      icon: CalendarCheck,
    },
    {
      title: "Shift Management",
      description: "Manage employee shifts and schedules",
      enabled: configuration.shifts_enabled,
      icon: Clock3,
    },
    {
      title: "Overtime",
      description: configuration.overtime_approval_required
        ? "Approval required"
        : "Approval not required",
      enabled: configuration.overtime_enabled,
      icon: BriefcaseBusiness,
    },
    {
      title: "Remote Work",
      description: "Remote-work capability",
      enabled: configuration.remote_work_enabled,
      icon: Wifi,
    },
    {
      title: "Field Work",
      description: "Field-work capability",
      enabled: configuration.field_work_enabled,
      icon: MapPin,
    },
    {
      title: "GPS Attendance",
      description: "Location-based attendance",
      enabled: configuration.gps_attendance_enabled,
      icon: Fingerprint,
    },
    {
      title: "Geofencing",
      description: "Attendance location boundaries",
      enabled: configuration.geofencing_enabled,
      icon: ShieldCheck,
    },
  ];

  const enabledCount = features.filter((feature) => feature.enabled).length;

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--brand-color)" }}
          >
            Workspace
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Workforce Overview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Review your company&apos;s workforce capabilities and configuration
            at a glance.
          </p>
        </div>

        <Link
          href={settingsUrl}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
        >
          <Settings2 size={17} />
          Workforce Settings
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Setup Mode</p>
            <Settings2 size={19} style={{ color: "var(--brand-color)" }} />
          </div>

          <p className="mt-3 text-xl font-semibold capitalize text-[var(--text-primary)]">
            {configuration.setup_mode}
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Workforce configuration
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Enabled Capabilities
            </p>
            <BriefcaseBusiness
              size={19}
              style={{ color: "var(--brand-color)" }}
            />
          </div>

          <p className="mt-3 text-xl font-semibold text-[var(--text-primary)]">
            {enabledCount} of {features.length}
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Configured workforce features
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Attendance Rules
            </p>
            <CalendarCheck size={19} style={{ color: "var(--brand-color)" }} />
          </div>

          <p className="mt-3 text-xl font-semibold text-[var(--text-primary)]">
            {configuration.attendance_enabled
              ? `${configuration.grace_period_minutes} min`
              : "Disabled"}
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {configuration.attendance_enabled
              ? "Late-arrival grace period"
              : "Attendance is currently disabled"}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Workforce Capabilities
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Features available according to your company&apos;s configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "var(--brand-color-soft)",
                color: "var(--brand-color)",
              }}
            >
              <Settings2 size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Manage Workforce Configuration
              </h2>
              <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                Update attendance rules, shifts, overtime, work modes and
                location-based settings.
              </p>
            </div>
          </div>

          <Link
            href={settingsUrl}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: "var(--brand-color)" }}
          >
            Open Settings
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function WorkforcePage() {
  return (
    <AuthGuard>
      <WorkforceContent />
    </AuthGuard>
  );
}

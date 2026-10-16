
"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Edit3,
  Mail,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";

import {
  getEmployee,
  type Employee,
} from "@/features/company/services/employeeService";

type Props = {
  companyId: number;
  
  employeeId: number;
};

type Section =
  | "overview"
  | "personal"
  | "employment"
  | "organization"
  | "activity";

const sections: {
  id: Section;
  label: string;
  icon: typeof UserRound;
}[] = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "personal", label: "Personal Details", icon: UserRound },
  { id: "employment", label: "Employment", icon: BriefcaseBusiness },
  { id: "organization", label: "Organization", icon: Users },
  { id: "activity", label: "Activity", icon: Activity },
];

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not provided";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fullName(employee: Employee) {
  return (
    employee.display_name ||
    [
      employee.first_name,
      employee.middle_name,
      employee.last_name,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function prettyLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function EmployeeProfile({
  companyId,
  employeeId,
}: Props) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<Section>("overview");

  useEffect(() => {
    let cancelled = false;

    async function loadEmployee() {
      try {
        const result = await getEmployee(companyId, employeeId);

        if (!cancelled) {
          setEmployee(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load employee profile.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEmployee();

    return () => {
      cancelled = true;
    };
  }, [companyId, employeeId]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--brand-color)]" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-700">
          Unable to open employee profile
        </p>
        <p className="mt-1 text-sm text-red-600">
          {error ?? "Employee not found."}
        </p>
        <Link
          href="/organization/employees"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700"
        >
          <ArrowLeft size={16} />
          Back to employees
        </Link>
      </div>
    );
  }

  const name = fullName(employee);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const statusClass = employee.is_active
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    : "bg-slate-100 text-slate-600 ring-slate-500/20";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Link
        href="/organization/employees"
        className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        All Employees
      </Link>

      {/* Profile header */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-[var(--brand-color)]" />

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-color-soft)] text-xl font-bold text-[var(--brand-color)] sm:h-20 sm:w-20 sm:text-2xl">
              {initials || <UserRound size={28} />}
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {name}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {employee.employee_code}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass}`}
                >
                  {employee.is_active ? "Active record" : "Inactive record"}
                </span>

                <span className="rounded-full bg-[var(--brand-color-soft)] px-2.5 py-1 text-xs font-medium text-[var(--brand-color)]">
                  {prettyLabel(employee.employment_status)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveSection("activity")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Activity size={16} />
              Activity
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("personal")}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-color)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Edit3 size={16} />
              View details
            </button>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<BriefcaseBusiness size={19} />}
          label="Employee ID"
          value={employee.employee_code}
        />
        <SummaryCard
          icon={<CalendarDays size={19} />}
          label="Joining Date"
          value={formatDate(employee.joining_date)}
        />
        <SummaryCard
          icon={<Mail size={19} />}
          label="Work Email"
          value={displayValue(employee.work_email)}
        />
        <SummaryCard
          icon={<Clock3 size={19} />}
          label="Added On"
          value={formatDate(employee.created_at)}
        />
      </div>

      {/* Profile navigation */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="flex min-w-max gap-1 p-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const selected = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  selected
                    ? "bg-[var(--brand-color-soft)] text-[var(--brand-color)]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section content */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {activeSection === "overview" && (
          <div className="space-y-6">
            <SectionHeading
              title="Employee Overview"
              subtitle="A summary of the employee's current information."
            />

            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
              <Detail label="Full Name" value={name} />
              <Detail label="Employee Code" value={employee.employee_code} />
              <Detail
                label="Employment Status"
                value={prettyLabel(employee.employment_status)}
              />
              <Detail label="Joining Date" value={formatDate(employee.joining_date)} />
              <Detail label="Department ID" value={employee.department_id} />
              <Detail label="Designation ID" value={employee.designation_id} />
            </div>
          </div>
        )}

        {activeSection === "personal" && (
          <div className="space-y-6">
            <SectionHeading
              title="Personal Information"
              subtitle="Personal and contact information currently stored for this employee."
            />

            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
              <Detail label="First Name" value={employee.first_name} />
              <Detail label="Middle Name" value={employee.middle_name} />
              <Detail label="Last Name" value={employee.last_name} />
              <Detail label="Display Name" value={employee.display_name} />
              <Detail label="Date of Birth" value={formatDate(employee.date_of_birth)} />
              <Detail label="Gender" value={employee.gender ? prettyLabel(employee.gender) : null} />
              <Detail label="Personal Email" value={employee.personal_email} />
              <Detail label="Work Email" value={employee.work_email} />
              <Detail label="Phone" value={employee.phone} />
              <Detail label="Alternate Phone" value={employee.alternate_phone} />
              <Detail label="Height (cm)" value={employee.height_cm} />
              <Detail label="Weight (kg)" value={employee.weight_kg} />
            </div>
          </div>
        )}

        {activeSection === "employment" && (
          <div className="space-y-6">
            <SectionHeading
              title="Employment Details"
              subtitle="Employment dates and current status."
            />

            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
              <Detail label="Employee Code" value={employee.employee_code} />
              <Detail label="Joining Date" value={formatDate(employee.joining_date)} />
              <Detail label="Probation End Date" value={formatDate(employee.probation_end_date)} />
              <Detail label="Confirmation Date" value={formatDate(employee.confirmation_date)} />
              <Detail label="Employment End Date" value={formatDate(employee.employment_end_date)} />
              <Detail label="Employment Status" value={prettyLabel(employee.employment_status)} />
              <Detail label="Record Status" value={employee.is_active ? "Active" : "Inactive"} />
            </div>
          </div>
        )}

        {activeSection === "organization" && (
          <div className="space-y-6">
            <SectionHeading
              title="Organization Assignment"
              subtitle="The employee's linked organization records."
            />

            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
              <Detail label="Department ID" value={employee.department_id} />
              <Detail label="Designation ID" value={employee.designation_id} />
              <Detail label="Team ID" value={employee.team_id} />
              <Detail label="Branch ID" value={employee.branch_id} />
              <Detail label="Site ID" value={employee.site_id} />
              <Detail label="Employment Type ID" value={employee.employment_type_id} />
              <Detail label="Manager Employee ID" value={employee.manager_id} />
              <Detail label="Linked Login User ID" value={employee.user_id} />
            </div>
          </div>
        )}

        {activeSection === "activity" && (
          <div className="space-y-4">
            <SectionHeading
              title="Employee Activity"
              subtitle="Audit history is available through the existing activity log."
            />

            <p className="text-sm leading-6 text-slate-600">
              Use the Activity action in the employee list to review recorded
              changes, including old and new values. We can connect the shared
              audit-log service directly to this tab in the next step.
            </p>

            <p className="text-xs text-slate-400">
              Created: {formatDate(employee.created_at)} · Last updated:{" "}
              {formatDate(employee.updated_at)}
            </p>
          </div>
        )}

        {employee.notes && activeSection === "overview" && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-800">
              Notes
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {employee.notes}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-color-soft)] text-[var(--brand-color)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-5">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {displayValue(value)}
      </p>
    </div>
  );
}

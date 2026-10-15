"use client";

import { useEffect, useState } from "react";
import { Activity, Pencil, Power, Plus, Search, Users } from "lucide-react";

import AuditLogModal from "./AuditLogModal";
import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  type Employee,
  type EmployeePayload,
} from "@/features/company/services/employeeService";
import {
  getEntityAuditLogs,
  type AuditLog,
} from "@/features/company/services/auditLogService";
import { useRouter } from "next/navigation";
type Props = {
  companyId: number | null;
};

type EmployeeForm = {
  first_name: string;
  middle_name: string;
  last_name: string;
  display_name: string;
  employee_code: string;
  personal_email: string;
  work_email: string;
  phone: string;
  alternate_phone: string;
  date_of_birth: string;
  gender: string;
  joining_date: string;
  probation_end_date: string;
  confirmation_date: string;
  employment_end_date: string;
  employment_status: string;
  is_active: boolean;
  height_cm: string;
  weight_kg: string;
  notes: string;
};

const EMPTY_FORM: EmployeeForm = {
  first_name: "",
  middle_name: "",
  last_name: "",
  display_name: "",
  employee_code: "",
  personal_email: "",
  work_email: "",
  phone: "",
  alternate_phone: "",
  date_of_birth: "",
  gender: "",
  joining_date: "",
  probation_end_date: "",
  confirmation_date: "",
  employment_end_date: "",
  employment_status: "DRAFT",
  is_active: true,
  height_cm: "",
  weight_kg: "",
  notes: "",
};

const STATUSES = [
  "DRAFT",
  "ACTIVE",
  "ON_PROBATION",
  "CONFIRMED",
  "ON_NOTICE",
  "RESIGNED",
  "TERMINATED",
  "INACTIVE",
];

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function toForm(employee: Employee): EmployeeForm {
  return {
    first_name: employee.first_name ?? "",
    middle_name: employee.middle_name ?? "",
    last_name: employee.last_name ?? "",
    display_name: employee.display_name ?? "",
    employee_code: employee.employee_code ?? "",
    personal_email: employee.personal_email ?? "",
    work_email: employee.work_email ?? "",
    phone: employee.phone ?? "",
    alternate_phone: employee.alternate_phone ?? "",
    date_of_birth: toDateInput(employee.date_of_birth),
    gender: employee.gender ?? "",
    joining_date: toDateInput(employee.joining_date),
    probation_end_date: toDateInput(employee.probation_end_date),
    confirmation_date: toDateInput(employee.confirmation_date),
    employment_end_date: toDateInput(employee.employment_end_date),
    employment_status: employee.employment_status ?? "DRAFT",
    is_active: employee.is_active,
    height_cm: employee.height_cm == null ? "" : String(employee.height_cm),
    weight_kg: employee.weight_kg == null ? "" : String(employee.weight_kg),
    notes: employee.notes ?? "",
  };
}

function toPayload(form: EmployeeForm): EmployeePayload {
  return {
    first_name: form.first_name.trim(),
    middle_name: form.middle_name.trim() || null,
    last_name: form.last_name.trim() || null,
    display_name: form.display_name.trim() || null,
    employee_code: form.employee_code.trim() || null,
    personal_email: form.personal_email.trim() || null,
    work_email: form.work_email.trim() || null,
    phone: form.phone.trim() || null,
    alternate_phone: form.alternate_phone.trim() || null,
    date_of_birth: form.date_of_birth || null,
    gender: form.gender || null,
    joining_date: form.joining_date || null,
    probation_end_date: form.probation_end_date || null,
    confirmation_date: form.confirmation_date || null,
    employment_end_date: form.employment_end_date || null,
    employment_status: form.employment_status,
    is_active: form.is_active,
    height_cm: form.height_cm ? Number(form.height_cm) : null,
    weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
    notes: form.notes.trim() || null,
  };
}

function toUpdatePayload(payload: EmployeePayload): EmployeePayload {
  const result = { ...payload };
  delete result.employee_code;
  return result;
}

function employeeName(employee: Employee) {
  return (
    employee.display_name ||
    [employee.first_name, employee.middle_name, employee.last_name]
      .filter(Boolean)
      .join(" ")
  );
}

function prettyStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function EmployeeManagement({ companyId }: Props) {
  const { showSuccess, showError } = useSnackbar();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [statusEmployee, setStatusEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditEntityName, setAuditEntityName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    if (companyId === null) {
      return () => {
        cancelled = true;
      };
    }

    const loadEmployees = async () => {
      try {
        const result = await getEmployees(companyId, {
          page,
          page_size: pageSize,
          search,
          ...(statusFilter ? { employment_status: statusFilter } : {}),
          ...(activeFilter !== ""
            ? { is_active: activeFilter === "true" }
            : {}),
        });

        if (cancelled) return;

        setEmployees(result.employees);
        setTotal(result.total);
        setTotalPages(result.total_pages);
        setError(null);
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error ? err.message : "Unable to load employees.";

        setError(message);
        showError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [
    companyId,
    page,
    pageSize,
    search,
    statusFilter,
    activeFilter,
    refreshKey,
    showError,
  ]);

  function openCreateModal() {
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }

  function openEditModal(employee: Employee) {
    setEditingEmployee(employee);
    setForm(toForm(employee));
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (companyId === null) return;

    if (!form.first_name.trim()) {
      setError("First name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = toPayload(form);

      if (editingEmployee) {
        // Employee code is generated on creation and is not editable here.
        await updateEmployee(
          companyId,
          editingEmployee.id,
          toUpdatePayload(payload),
        );
        showSuccess("Employee updated successfully.");
      } else {
        await createEmployee(companyId, payload);
        setPage(1);
        showSuccess("Employee created successfully.");
      }

      setShowModal(false);
      setEditingEmployee(null);
      setForm(EMPTY_FORM);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save employee.";
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmStatus() {
    if (companyId === null || statusEmployee === null) return;

    const employee = statusEmployee;
    const nextActive = !employee.is_active;

    try {
      setSaving(true);

      // Preserve the employee's existing details while changing active state.
      const payload = toPayload(toForm(employee));
      await updateEmployee(companyId, employee.id, {
        ...toUpdatePayload(payload),
        is_active: nextActive,
      });

      setStatusEmployee(null);
      setRefreshKey((current) => current + 1);
      showSuccess(
        nextActive
          ? "Employee enabled successfully."
          : "Employee disabled successfully.",
      );
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to update employee status.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleViewActivity(employee: Employee) {
    if (companyId === null) return;

    try {
      setAuditOpen(true);
      setAuditEntityName(employeeName(employee));
      setAuditLogs([]);
      setAuditError(null);
      setAuditLoading(true);

      const logs = await getEntityAuditLogs(companyId, "EMPLOYEE", employee.id);

      setAuditLogs(logs);
    } catch (err) {
      setAuditError(
        err instanceof Error ? err.message : "Unable to load activity.",
      );
    } finally {
      setAuditLoading(false);
    }
  }

  function updateField<K extends keyof EmployeeForm>(
    key: K,
    value: EmployeeForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  if (companyId === null) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Select a company to manage employees.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Employees</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage employee records for this company.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[var(--brand-color)] px-3.5 text-xs font-medium text-white transition hover:opacity-90"
        >
          <Plus size={15} />
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, code, email or phone..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"
        >
          <option value="">All employment statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {prettyStatus(item)}
            </option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={(event) => {
            setActiveFilter(event.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"
        >
          <option value="">Active and inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <Users size={15} />
          {total} {total === 1 ? "employee" : "employees"} found
        </span>
      </div>

      {error && !showModal && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <Users size={19} />
            </div>
            <h3 className="mt-3 text-sm font-medium text-slate-900">
              {search ? "No matching employees" : "No employees yet"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {search
                ? "Try another search term or adjust your filters."
                : "Add your first employee to get started."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-3 text-xs font-medium text-[var(--brand-color)] hover:underline"
              >
                Add employee
              </button>
            )}
          </div>
        ) : (
          <div className="max-h-[65dvh] overflow-auto">
            <table className="min-w-[900px] divide-y divide-slate-200">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr>
                  {[
                    "Employee",
                    "Code",
                    "Contact",
                    "Joining Date",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className={`transition-colors ${
                      employee.is_active
                        ? "hover:bg-slate-50/60"
                        : "bg-slate-50/70 hover:bg-slate-100/70"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">
                        {employeeName(employee)}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {employee.work_email ||
                          employee.personal_email ||
                          "No email"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {employee.employee_code}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {employee.phone || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {employee.joining_date || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="space-y-1">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {prettyStatus(employee.employment_status)}
                        </span>
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              employee.is_active
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {employee.is_active ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/employees/${employee.id}`)
                          }
                          className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--brand-color)] hover:bg-[var(--brand-color-soft)]"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(employee)}
                          title="Edit employee"
                          aria-label={`Edit ${employeeName(employee)}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusEmployee(employee)}
                          disabled={saving}
                          title={
                            employee.is_active
                              ? "Disable employee"
                              : "Enable employee"
                          }
                          aria-label={`${employee.is_active ? "Disable" : "Enable"} ${employeeName(employee)}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:opacity-50"
                        >
                          <Power size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleViewActivity(employee)}
                          title="View activity"
                          aria-label={`View activity for ${employeeName(employee)}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                        >
                          <Activity size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <label htmlFor="employee-page-size">Rows per page</label>
            <select
              id="employee-page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              {total === 0
                ? "0 results"
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="min-h-9 rounded-md border border-slate-200 px-3 text-xs text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {totalPages === 0 ? 0 : page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="min-h-9 rounded-md border border-slate-200 px-3 text-xs text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-5">
          <div className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingEmployee ? "Edit Employee" : "Add Employee"}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {editingEmployee
                  ? "Update the employee's basic information."
                  : "Enter the employee's basic information. The employee code can be generated automatically."}
              </p>
            </div>

            <form onSubmit={handleSave}>
              <div className="space-y-5 px-5 py-5">
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <section>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="First Name *">
                      <input
                        required
                        maxLength={100}
                        value={form.first_name}
                        onChange={(e) =>
                          updateField("first_name", e.target.value)
                        }
                        className={inputClass}
                        placeholder="First name"
                      />
                    </Field>
                    <Field label="Middle Name">
                      <input
                        value={form.middle_name}
                        onChange={(e) =>
                          updateField("middle_name", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Middle name"
                      />
                    </Field>
                    <Field label="Last Name">
                      <input
                        value={form.last_name}
                        onChange={(e) =>
                          updateField("last_name", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Last name"
                      />
                    </Field>
                    <Field label="Display Name">
                      <input
                        value={form.display_name}
                        onChange={(e) =>
                          updateField("display_name", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Preferred display name"
                      />
                    </Field>
                    <Field label="Employee Code">
                      <input
                        value={form.employee_code}
                        disabled={Boolean(editingEmployee)}
                        onChange={(e) =>
                          updateField("employee_code", e.target.value)
                        }
                        className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
                        placeholder={
                          editingEmployee ? "" : "Auto-generated if blank"
                        }
                      />
                    </Field>
                    <Field label="Date of Birth">
                      <input
                        type="date"
                        value={form.date_of_birth}
                        onChange={(e) =>
                          updateField("date_of_birth", e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Gender">
                      <select
                        value={form.gender}
                        onChange={(e) => updateField("gender", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Not specified</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_TO_SAY">
                          Prefer not to say
                        </option>
                      </select>
                    </Field>
                    <Field label="Phone">
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className={inputClass}
                        placeholder="Phone number"
                      />
                    </Field>

                    <Field label="Alternate Phone">
                      <input
                        type="tel"
                        value={form.alternate_phone}
                        onChange={(e) =>
                          updateField("alternate_phone", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Alternate phone number"
                      />
                    </Field>

                    <Field label="Personal Email">
                      <input
                        type="email"
                        value={form.personal_email}
                        onChange={(e) =>
                          updateField("personal_email", e.target.value)
                        }
                        className={inputClass}
                        placeholder="name@example.com"
                      />
                    </Field>
                    <Field label="Work Email">
                      <input
                        type="email"
                        value={form.work_email}
                        onChange={(e) =>
                          updateField("work_email", e.target.value)
                        }
                        className={inputClass}
                        placeholder="name@company.com"
                      />
                    </Field>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employment Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Joining Date">
                      <input
                        type="date"
                        value={form.joining_date}
                        onChange={(e) =>
                          updateField("joining_date", e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Employment Status">
                      <select
                        required
                        value={form.employment_status}
                        onChange={(e) =>
                          updateField("employment_status", e.target.value)
                        }
                        className={inputClass}
                      >
                        {STATUSES.map((item) => (
                          <option key={item} value={item}>
                            {prettyStatus(item)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Record Status">
                      <select
                        value={String(form.is_active)}
                        onChange={(e) =>
                          updateField("is_active", e.target.value === "true")
                        }
                        className={inputClass}
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </Field>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employment Timeline
                  </h4>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Probation End Date">
                      <input
                        type="date"
                        value={form.probation_end_date}
                        onChange={(e) =>
                          updateField("probation_end_date", e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Confirmation Date">
                      <input
                        type="date"
                        value={form.confirmation_date}
                        onChange={(e) =>
                          updateField("confirmation_date", e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Employment End Date">
                      <input
                        type="date"
                        value={form.employment_end_date}
                        onChange={(e) =>
                          updateField("employment_end_date", e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Additional Details
                  </h4>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Height (cm)">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={form.height_cm}
                        onChange={(e) =>
                          updateField("height_cm", e.target.value)
                        }
                        className={inputClass}
                        placeholder="e.g. 175"
                      />
                    </Field>

                    <Field label="Weight (kg)">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={form.weight_kg}
                        onChange={(e) =>
                          updateField("weight_kg", e.target.value)
                        }
                        className={inputClass}
                        placeholder="e.g. 70"
                      />
                    </Field>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes
                  </h4>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className={`${inputClass} h-auto py-2`}
                    placeholder="Optional notes"
                  />
                </section>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-9 rounded-md px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-md bg-[var(--brand-color)] px-4 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingEmployee
                      ? "Update Employee"
                      : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StatusConfirmModal
        open={statusEmployee !== null}
        entityName={statusEmployee ? employeeName(statusEmployee) : ""}
        entityType="Employee"
        isActive={statusEmployee?.is_active ?? false}
        loading={saving}
        onConfirm={() => void handleConfirmStatus()}
        onClose={() => {
          if (!saving) setStatusEmployee(null);
        }}
      />

      <AuditLogModal
        open={auditOpen}
        entityName={auditEntityName}
        logs={auditLogs}
        loading={auditLoading}
        error={auditError}
        onClose={() => {
          setAuditOpen(false);
          setAuditLogs([]);
          setAuditError(null);
          setAuditEntityName("");
        }}
      />
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

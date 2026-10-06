"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Pencil, Power } from "lucide-react";

import AuditLogModal from "./AuditLogModal";
import {
  AuditLog,
  getEntityAuditLogs,
} from "@/features/company/services/auditLogService";

import { useSnackbar } from "@/components/feedback/SnackbarProvider";
import {
  createDepartment,
  getDepartments,
  updateDepartment,
  type Department,
} from "@/features/company/services/departmentService";
import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";

type DepartmentManagementProps = {
  companyId: number | null;
};

type DepartmentForm = {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
};

const EMPTY_FORM: DepartmentForm = {
  name: "",
  code: "",
  description: "",
  is_active: true,
};

export default function DepartmentManagement({
  companyId,
}: DepartmentManagementProps) {
  const { showSuccess, showError } = useSnackbar();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [statusDepartment, setStatusDepartment] = useState<Department | null>(
    null,
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditEntityName, setAuditEntityName] = useState("");
  const [form, setForm] = useState<DepartmentForm>(EMPTY_FORM);

  useEffect(() => {
    if (companyId === null) {
      return;
    }

    const activeCompanyId: number = companyId;
    let cancelled = false;

    async function loadDepartments() {
      try {
        setLoading(true);
        setError(null);

        const result = await getDepartments(activeCompanyId);

        if (!cancelled) {
          setDepartments(result);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Unable to load departments.";

          setError(message);
          showError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [companyId, showError]);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return departments;
    }

    return departments.filter((department) => {
      return (
        department.name.toLowerCase().includes(query) ||
        department.code?.toLowerCase().includes(query) ||
        department.description?.toLowerCase().includes(query)
      );
    });
  }, [departments, search]);

  function openCreateModal() {
    setEditingDepartment(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }

  function openEditModal(department: Department) {
    setEditingDepartment(department);

    setForm({
      name: department.name,
      code: department.code ?? "",
      description: department.description ?? "",
      is_active: department.is_active,
    });

    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingDepartment(null);
    setForm(EMPTY_FORM);
    setError(null);
  }
  function openStatusConfirmation(department: Department) {
    setStatusDepartment(department);
  }

  function closeStatusConfirmation() {
    if (saving) {
      return;
    }

    setStatusDepartment(null);
  }
  async function handleConfirmDepartmentStatus() {
    if (companyId === null || statusDepartment === null) {
      return;
    }

    const department = statusDepartment;
    const nextStatus = !department.is_active;

    try {
      setSaving(true);

      await updateDepartment(companyId, department.id, {
        name: department.name,
        code: department.code ?? null,
        description: department.description ?? null,
        is_active: nextStatus,
      });

      const updatedDepartments = await getDepartments(companyId);

      setDepartments(updatedDepartments);
      setStatusDepartment(null);

      showSuccess(
        nextStatus
          ? "Department enabled successfully."
          : "Department disabled successfully.",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to update department status.";

      showError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleViewActivity(department: Department) {
    if (companyId === null) {
      return;
    }

    try {
      setAuditOpen(true);
      setAuditEntityName(department.name);
      setAuditLogs([]);
      setAuditError(null);
      setAuditLoading(true);

      const logs = await getEntityAuditLogs(
        companyId,
        "DEPARTMENT",
        department.id,
      );

      setAuditLogs(logs);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load activity.";

      setAuditError(message);
    } finally {
      setAuditLoading(false);
    }
  }

  function handleCloseActivity() {
    setAuditOpen(false);
    setAuditLogs([]);
    setAuditError(null);
    setAuditEntityName("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (companyId === null) {
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError("Department name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingDepartment) {
        await updateDepartment(companyId, editingDepartment.id, {
          name,
          code: form.code.trim() || null,
          description: form.description.trim() || null,
          is_active: form.is_active,
        });

        showSuccess("Department updated successfully.");
      } else {
        await createDepartment(companyId, {
          name,
          code: form.code.trim() || null,
          description: form.description.trim() || null,
          is_active: form.is_active,
        });

        showSuccess("Department created successfully.");
      }

      const updatedDepartments = await getDepartments(companyId);

      setDepartments(updatedDepartments);
      closeModal();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save department.";

      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  if (companyId === null) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Select a company to manage departments.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">
            Departments
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Manage departments within this company.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--brand-color)] px-3.5 text-xs font-medium text-white transition hover:opacity-90"
        >
          + Add Department
        </button>
      </div>

      {/* Search / Summary */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search departments..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
          />
        </div>

        <p className="text-xs text-slate-500">
          {filteredDepartments.length}{" "}
          {filteredDepartments.length === 1 ? "department" : "departments"}
        </p>
      </div>

      {/* Error */}
      {error && !showModal && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            Loading departments...
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-base text-slate-400">
              ▦
            </div>

            <h3 className="mt-3 text-sm font-medium text-slate-900">
              {search ? "No departments found" : "No departments yet"}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {search
                ? "Try a different search term."
                : "Create your first department to get started."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-3 text-xs font-medium text-[var(--brand-color)] hover:underline"
              >
                Add department
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Department
                  </th>

                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Code
                  </th>

                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>

                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredDepartments.map((department) => (
                  <tr
                    key={department.id}
                    className={`transition-colors ${
                      department.is_active
                        ? "hover:bg-slate-50/60"
                        : "bg-slate-50/70 text-slate-500 hover:bg-slate-100/70"
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div
                        className={`text-sm font-medium ${
                          department.is_active
                            ? "text-slate-900"
                            : "text-slate-500"
                        }`}
                      >
                        {department.name}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {department.code || "—"}
                    </td>

                    <td className="max-w-sm px-4 py-3 text-xs text-slate-600">
                      <div className="truncate">
                        {department.description || "—"}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          department.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {department.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(department)}
                          title="Edit department"
                          aria-label={`Edit ${department.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openStatusConfirmation(department)}
                          disabled={saving}
                          title={
                            department.is_active
                              ? "Disable department"
                              : "Enable department"
                          }
                          aria-label={
                            department.is_active
                              ? `Disable ${department.name}`
                              : `Enable ${department.name}`
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Power size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleViewActivity(department)}
                          title="View activity"
                          aria-label={`View activity for ${department.name}`}
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
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-5">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingDepartment ? "Edit Department" : "Add Department"}
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                {editingDepartment
                  ? "Update the department details."
                  : "Create a new department for this company."}
              </p>
            </div>

            <form onSubmit={handleSave}>
              <div className="space-y-4 px-5 py-5">
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                {/* Department Name */}
                <div>
                  <label
                    htmlFor="department-name"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Department Name
                  </label>

                  <input
                    id="department-name"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Human Resources"
                    maxLength={150}
                    autoFocus
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>

                {/* Code */}
                <div>
                  <label
                    htmlFor="department-code"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Code
                  </label>

                  <input
                    id="department-code"
                    type="text"
                    value={form.code}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                    placeholder="e.g. HR"
                    maxLength={50}
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="department-description"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="department-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Optional department description"
                    className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-8 rounded-md px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-8 rounded-md bg-[var(--brand-color)] px-3.5 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingDepartment
                      ? "Update Department"
                      : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <StatusConfirmModal
        open={statusDepartment !== null}
        entityName={statusDepartment?.name ?? ""}
        entityType="Department"
        isActive={statusDepartment?.is_active ?? false}
        loading={saving}
        onConfirm={() => void handleConfirmDepartmentStatus()}
        onClose={closeStatusConfirmation}
      />

      <AuditLogModal
        open={auditOpen}
        entityName={auditEntityName}
        logs={auditLogs}
        loading={auditLoading}
        error={auditError}
        onClose={handleCloseActivity}
      />
    </div>
  );
}

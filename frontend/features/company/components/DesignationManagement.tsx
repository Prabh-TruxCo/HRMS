"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Pencil, Power } from "lucide-react";

import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";

import AuditLogModal from "./AuditLogModal";

import {
  getEntityAuditLogs,
  type AuditLog,
} from "../services/auditLogService";

import {
  createDesignation,
  getDesignations,
  updateDesignation,
  updateDesignationStatus,
  type Designation,
} from "../services/designationService";


type DesignationManagementProps = {
  companyId: number | null;
};


type DesignationForm = {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
};


const EMPTY_FORM: DesignationForm = {
  name: "",
  code: "",
  description: "",
  is_active: true,
};


export default function DesignationManagement({
  companyId,
}: DesignationManagementProps) {
  const { showSuccess, showError } = useSnackbar();

  const [designations, setDesignations] = useState<
    Designation[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingDesignation, setEditingDesignation] =
    useState<Designation | null>(null);

  const [statusDesignation, setStatusDesignation] =
    useState<Designation | null>(null);

  const [form, setForm] =
    useState<DesignationForm>(EMPTY_FORM);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] =
    useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditEntityName, setAuditEntityName] =
    useState("");


  useEffect(() => {
    if (companyId === null) {
      return;
    }

    const activeCompanyId = companyId;
    let cancelled = false;

    async function loadDesignations() {
      try {
        setLoading(true);
        setError(null);

        const data = await getDesignations(
          activeCompanyId,
        );

        if (cancelled) {
          return;
        }

        setDesignations(data);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load designations.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDesignations();

    return () => {
      cancelled = true;
    };
  }, [companyId]);


  const filteredDesignations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return designations;
    }

    return designations.filter((designation) => {
      return (
        designation.name
          .toLowerCase()
          .includes(query) ||
        designation.code
          ?.toLowerCase()
          .includes(query) ||
        designation.description
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [designations, search]);


  function openCreateModal() {
    setEditingDesignation(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }


  function openEditModal(
    designation: Designation,
  ) {
    setEditingDesignation(designation);

    setForm({
      name: designation.name,
      code: designation.code ?? "",
      description: designation.description ?? "",
      is_active: designation.is_active,
    });

    setError(null);
    setShowModal(true);
  }


  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingDesignation(null);
    setForm(EMPTY_FORM);
    setError(null);
  }


  function openStatusConfirmation(
    designation: Designation,
  ) {
    setStatusDesignation(designation);
  }


  function closeStatusConfirmation() {
    if (saving) {
      return;
    }

    setStatusDesignation(null);
  }


  async function handleConfirmDesignationStatus() {
    if (
      companyId === null ||
      statusDesignation === null
    ) {
      return;
    }

    const designation = statusDesignation;
    const nextStatus = !designation.is_active;

    try {
      setSaving(true);

      const updated =
        await updateDesignationStatus(
          companyId,
          designation.id,
          nextStatus,
        );

      setDesignations((current) =>
        current
          .map((item) =>
            item.id === updated.id
              ? updated
              : item,
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
      );

      setStatusDesignation(null);

      showSuccess(
        nextStatus
          ? "Designation enabled successfully."
          : "Designation disabled successfully.",
      );
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to update designation status.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (companyId === null) {
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError("Designation name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingDesignation) {
        const updated =
          await updateDesignation(
            companyId,
            editingDesignation.id,
            {
              name,
              code: form.code.trim() || null,
              description:
                form.description.trim() || null,
            },
          );

        setDesignations((current) =>
          current
            .map((item) =>
              item.id === updated.id
                ? updated
                : item,
            )
            .sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
        );

        showSuccess(
          "Designation updated successfully.",
        );
      } else {
        const created =
          await createDesignation(
            companyId,
            {
              name,
              code: form.code.trim() || null,
              description:
                form.description.trim() || null,
              is_active: form.is_active,
            },
          );

        setDesignations((current) =>
          [...current, created].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );

        showSuccess(
          "Designation created successfully.",
        );
      }

      closeModal();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save designation.";

      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }


  async function handleViewActivity(
    designation: Designation,
  ) {
    if (companyId === null) {
      return;
    }

    try {
      setAuditOpen(true);
      setAuditEntityName(designation.name);
      setAuditLogs([]);
      setAuditError(null);
      setAuditLoading(true);

      const logs =
        await getEntityAuditLogs(
          companyId,
          "DESIGNATION",
          designation.id,
        );

      setAuditLogs(logs);
    } catch (err) {
      setAuditError(
        err instanceof Error
          ? err.message
          : "Unable to load activity.",
      );
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


  if (companyId === null) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Select a company to manage designations.
      </div>
    );
  }


  return (
    <>
      <div className="space-y-4 p-4 sm:p-5">

        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              Designations
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Manage employee designations within your company.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--brand-color)] px-3.5 text-xs font-medium text-white transition hover:opacity-90"
          >
            + Add Designation
          </button>
        </div>


        {/* Search / Summary */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search designations..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
            />
          </div>

          <p className="text-xs text-slate-500">
            {filteredDesignations.length}{" "}
            {filteredDesignations.length === 1
              ? "designation"
              : "designations"}
          </p>
        </div>


        {/* Error */}
        {error && !showModal && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </div>
        )}


        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {loading ? (
            <div className="px-4 py-10 text-center text-xs text-slate-500">
              Loading designations...
            </div>
          ) : filteredDesignations.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-base text-slate-400">
                ▦
              </div>

              <h3 className="mt-3 text-sm font-medium text-slate-900">
                {search
                  ? "No designations found"
                  : "No designations yet"}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {search
                  ? "Try a different search term."
                  : "Create your first designation to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-3 text-xs font-medium text-[var(--brand-color)] hover:underline"
                >
                  Add designation
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Designation
                    </th>

                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Code
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
                  {filteredDesignations.map(
                    (designation) => (
                      <tr
                        key={designation.id}
                        className={`transition-colors ${
                          designation.is_active
                            ? "hover:bg-slate-50/60"
                            : "bg-slate-50/70 text-slate-500 hover:bg-slate-100/70"
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <div
                            className={`text-sm font-medium ${
                              designation.is_active
                                ? "text-slate-900"
                                : "text-slate-500"
                            }`}
                          >
                            {designation.name}
                          </div>

                          {designation.description && (
                            <div className="mt-0.5 max-w-xs truncate text-[11px] text-slate-500">
                              {designation.description}
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                          {designation.code || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              designation.is_active
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {designation.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  designation,
                                )
                              }
                              title="Edit designation"
                              aria-label={`Edit ${designation.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openStatusConfirmation(
                                  designation,
                                )
                              }
                              disabled={saving}
                              title={
                                designation.is_active
                                  ? "Disable designation"
                                  : "Enable designation"
                              }
                              aria-label={
                                designation.is_active
                                  ? `Disable ${designation.name}`
                                  : `Enable ${designation.name}`
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Power size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleViewActivity(
                                  designation,
                                )
                              }
                              title="View activity"
                              aria-label={`View activity for ${designation.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                            >
                              <Activity size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* Create / Edit Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="designation-modal-title"
          >
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3
                  id="designation-modal-title"
                  className="text-base font-semibold text-slate-900"
                >
                  {editingDesignation
                    ? "Edit Designation"
                    : "Add Designation"}
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  {editingDesignation
                    ? "Update the designation details."
                    : "Create a new designation for this company."}
                </p>
              </div>

              <form onSubmit={handleSave}>
                <div className="space-y-4 px-5 py-5">

                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label
                      htmlFor="designation-name"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Designation Name
                    </label>

                    <input
                      id="designation-name"
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Software Engineer"
                      maxLength={150}
                      autoFocus
                      className="h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>


                  {/* Code */}
                  <div>
                    <label
                      htmlFor="designation-code"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Code
                    </label>

                    <input
                      id="designation-code"
                      type="text"
                      value={form.code}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          code: event.target.value,
                        }))
                      }
                      placeholder="e.g. SE"
                      maxLength={50}
                      className="h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>


                  {/* Description */}
                  <div>
                    <label
                      htmlFor="designation-description"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="designation-description"
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Optional designation description"
                      className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>


                  {/* Active — CREATE ONLY */}
                  {!editingDesignation && (
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            is_active:
                              event.target.checked,
                          }))
                        }
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-[var(--brand-color)]"
                      />

                      <span>
                        <span className="block text-xs font-medium text-slate-700">
                          Active
                        </span>

                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          Allow this designation to be used for employees.
                        </span>
                      </span>
                    </label>
                  )}

                </div>

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
                      : editingDesignation
                        ? "Update Designation"
                        : "Create Designation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>


      <StatusConfirmModal
        open={statusDesignation !== null}
        entityName={
          statusDesignation?.name ?? ""
        }
        entityType="Designation"
        isActive={
          statusDesignation?.is_active ?? false
        }
        loading={saving}
        onConfirm={() =>
          void handleConfirmDesignationStatus()
        }
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
    </>
  );
}
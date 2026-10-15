"use client";

import { useEffect, useState } from "react";

import { Clock3, Pencil, Power, Search, Layers3 } from "lucide-react";

import { useCompany } from "@/features/company/context/CompanyContext";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";
import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";

import {
  createShift,
  createShiftsBulk,
  getShifts,
  updateShift,
  type Shift,
  type BulkShiftCreateRequest,
} from "@/features/company/services/shiftService";

type ShiftForm = {
  name: string;
  code: string;
  description: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  is_active: boolean;
};

const EMPTY_FORM: ShiftForm = {
  name: "",
  code: "",
  description: "",
  start_time: "09:00",
  end_time: "18:00",
  break_duration_minutes: 60,
  is_active: true,
};

type BulkShiftForm = {
  name_prefix: string;
  first_start_time: string;
  last_start_time: string;
  interval_minutes: number;
  duration_hours: number;
  break_duration_minutes: number;
  is_active: boolean;
};

const EMPTY_BULK_FORM: BulkShiftForm = {
  name_prefix: "Morning",
  first_start_time: "06:00",
  last_start_time: "08:30",
  interval_minutes: 30,
  duration_hours: 8,
  break_duration_minutes: 30,
  is_active: true,
};

const inputClass =
  "min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]";

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function formatClockTime(totalMinutes: number): string {
  const normalized = totalMinutes % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function displayClockTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  const suffix = hours < 12 ? "AM" : "PM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatDuration(start: string, end: string): string {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return "—";
  }

  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const duration = endMinutes - startMinutes;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export default function ShiftsManagementPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id ?? null;
  const { showSuccess, showError } = useSnackbar();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [statusShift, setStatusShift] = useState<Shift | null>(null);
  const [form, setForm] = useState<ShiftForm>(EMPTY_FORM);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkShiftForm>(EMPTY_BULK_FORM);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  const bulkPreview = (() => {
    const first = bulkForm.first_start_time;
    const last = bulkForm.last_start_time;

    if (!first || !last) {
      return {
        shifts: [] as Array<{
          name: string;
          start_time: string;
          end_time: string;
        }>,
        error: "Enter both start times.",
      };
    }

    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const firstMinutes = toMinutes(first);
    const lastMinutes = toMinutes(last);
    const interval = Number(bulkForm.interval_minutes);
    const duration = Number(bulkForm.duration_hours) * 60;
    const breakMinutes = Number(bulkForm.break_duration_minutes);
    const prefix = bulkForm.name_prefix.trim();

    if (!prefix) {
      return { shifts: [], error: "Enter a shift name prefix." };
    }

    if (
      !Number.isFinite(firstMinutes) ||
      !Number.isFinite(lastMinutes) ||
      lastMinutes < firstMinutes
    ) {
      return {
        shifts: [],
        error: "Last start time must be at or after first start time.",
      };
    }

    if (!Number.isInteger(interval) || interval < 1 || interval > 720) {
      return {
        shifts: [],
        error: "Interval must be between 1 and 720 minutes.",
      };
    }

    if (!Number.isInteger(duration) || duration < 1 || duration > 1439) {
      return {
        shifts: [],
        error: "Duration must be between 1 minute and 23 hours 59 minutes.",
      };
    }

    if (
      !Number.isInteger(breakMinutes) ||
      breakMinutes < 0 ||
      breakMinutes >= duration
    ) {
      return {
        shifts: [],
        error: "Break must be shorter than shift duration.",
      };
    }

    const count = Math.floor((lastMinutes - firstMinutes) / interval) + 1;

    if (count > 100) {
      return {
        shifts: [],
        error: "A batch cannot contain more than 100 shifts.",
      };
    }

    const shifts = Array.from({ length: count }, (_, index) => {
      const start = firstMinutes + index * interval;

      return {
        name: `${prefix} ${formatClockTime(start)}`,
        start_time: formatClockTime(start),
        end_time: formatClockTime(start + duration),
      };
    });

    const existingNames = new Set(
      shifts.map((shift) => shift.name.toLocaleLowerCase()),
    );

    if (existingNames.size !== shifts.length) {
      return { shifts: [], error: "Generated shift names must be unique." };
    }

    return { shifts, error: null };
  })();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (companyId === null) {
      return;
    }

    const activeCompanyId = companyId;
    let cancelled = false;

    async function loadShifts() {
      try {
        setLoading(true);
        setError(null);

        const result = await getShifts(activeCompanyId, {
          page,
          page_size: pageSize,
          search,
          ...(statusFilter === "all"
            ? {}
            : { is_active: statusFilter === "active" }),
        });

        if (!cancelled) {
          setShifts(result.shifts);
          setTotal(result.total);
          setTotalPages(result.total_pages);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Unable to load shifts.";
          setError(message);
          setShifts([]);
          setTotal(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadShifts();

    return () => {
      cancelled = true;
    };
  }, [companyId, page, pageSize, search, statusFilter, refreshKey]);

  function openBulkModal() {
    setBulkForm(EMPTY_BULK_FORM);
    setBulkError(null);
    setShowBulkModal(true);
  }

  async function handleBulkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (companyId === null) {
      setBulkError("No company is currently selected.");
      return;
    }

    if (bulkPreview.error || bulkPreview.shifts.length === 0) {
      setBulkError(bulkPreview.error ?? "No shifts to create.");
      return;
    }

    // Check conflicts against shifts currently loaded in the table.
    // The backend performs the authoritative company-wide check.
    const existingNames = new Set(
      shifts.map((shift) => shift.name.trim().toLocaleLowerCase()),
    );

    const conflicts = bulkPreview.shifts
      .filter((shift) => existingNames.has(shift.name.toLocaleLowerCase()))
      .map((shift) => shift.name);

    if (conflicts.length > 0) {
      setBulkError(
        `Some shifts already exist on this page: ${conflicts.join(", ")}. Change the prefix or review existing shifts.`,
      );
      return;
    }

    const payload: BulkShiftCreateRequest = {
      name_prefix: bulkForm.name_prefix.trim(),
      first_start_time: `${bulkForm.first_start_time}:00`,
      last_start_time: `${bulkForm.last_start_time}:00`,
      interval_minutes: Number(bulkForm.interval_minutes),
      duration_minutes: Number(bulkForm.duration_hours) * 60,
      break_duration_minutes: Number(bulkForm.break_duration_minutes),
      is_active: bulkForm.is_active,
    };

    try {
      setBulkSaving(true);
      setBulkError(null);

      const result = await createShiftsBulk(companyId, payload);

      setShowBulkModal(false);
      setPage(1);
      setSearchInput("");
      setSearch("");
      setStatusFilter("all");
      setRefreshKey((current) => current + 1);

      showSuccess(`${result.created_count} shifts created successfully.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create shifts.";

      setBulkError(message);
      showError(message);
    } finally {
      setBulkSaving(false);
    }
  }

  function openCreateModal() {
    setEditingShift(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }

  function openEditModal(shift: Shift) {
    setEditingShift(shift);
    setForm({
      name: shift.name,
      code: shift.code ?? "",
      description: shift.description ?? "",
      start_time: formatTime(shift.start_time),
      end_time: formatTime(shift.end_time),
      break_duration_minutes: shift.break_duration_minutes,
      is_active: shift.is_active,
    });
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingShift(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (companyId === null) {
      setError("No company is currently selected.");
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError("Shift name is required.");
      return;
    }

    if (!form.start_time || !form.end_time) {
      setError("Start time and end time are required.");
      return;
    }

    const toApiTime = (value: string) =>
      value.length === 5 ? `${value}:00` : value;

    const payload = {
      name,
      code: form.code.trim() || null,
      description: form.description.trim() || null,
      start_time: toApiTime(form.start_time),
      end_time: toApiTime(form.end_time),
      break_duration_minutes: Number(form.break_duration_minutes),
      is_active: form.is_active,
    };

    try {
      setSaving(true);
      setError(null);

      if (editingShift) {
        await updateShift(companyId, editingShift.id, payload);
        showSuccess("Shift updated successfully.");
      } else {
        await createShift(companyId, payload);
        setPage(1);
        showSuccess("Shift created successfully.");
      }

      setShowModal(false);
      setEditingShift(null);
      setForm(EMPTY_FORM);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save shift.";
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmStatus() {
    if (companyId === null || statusShift === null) return;

    const shift = statusShift;
    const nextStatus = !shift.is_active;

    try {
      setSaving(true);

      await updateShift(companyId, shift.id, {
        name: shift.name,
        code: shift.code,
        description: shift.description,
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_duration_minutes: shift.break_duration_minutes,
        is_active: nextStatus,
      });

      setStatusShift(null);
      setRefreshKey((current) => current + 1);

      showSuccess(
        nextStatus
          ? "Shift enabled successfully."
          : "Shift disabled successfully.",
      );
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Unable to update shift status.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!currentCompany) {
    return (
      <div className="p-5 sm:p-6 lg:p-7">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Select a company to manage shifts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Shifts
            </h1>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              Configure working hours and break durations for your company.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={openBulkModal}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
            >
              <Layers3 size={16} />
              Bulk Create
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[var(--brand-color)] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)]"
            >
              <span className="text-base leading-none">+</span>
              Add Shift
            </button>
          </div>
        </div>

        {error && !showModal && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search shifts..."
              aria-label="Search shifts"
              className={`${inputClass} pl-9`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as typeof statusFilter);
                setPage(1);
              }}
              aria-label="Filter shifts by status"
              className={`${inputClass} w-auto min-w-32`}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <p className="text-sm text-[var(--text-secondary)]">
              {total} {total === 1 ? "shift" : "shifts"} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Loading shifts...
            </p>
          </div>
        ) : error && shifts.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="mt-3 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        ) : shifts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
            <Clock3 size={28} className="mx-auto text-[var(--text-muted)]" />
            <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              {search ? "No matching shifts" : "No shifts yet"}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-secondary)]">
              {search
                ? "Try a different search term."
                : "Create your first shift to define working hours for your employees."}
            </p>
            {!search && statusFilter === "all" && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white"
              >
                Add Shift
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="h-[clamp(220px,calc(100dvh-360px),760px)] overflow-x-auto overflow-y-auto overscroll-contain">
              <table className="w-full min-w-[760px]">
                <thead className="sticky top-0 z-10 bg-[var(--surface-muted)]">
                  <tr className="border-b border-[var(--border)] text-left">
                    {[
                      "Shift",
                      "Working hours",
                      "Duration",
                      "Break",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] ${
                          heading === "Actions" ? "text-right" : ""
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {shifts.map((shift) => (
                    <tr
                      key={shift.id}
                      className={`border-b border-[var(--border-muted)] last:border-b-0 transition-colors ${
                        shift.is_active
                          ? "hover:bg-[var(--surface-muted)]/40"
                          : "bg-slate-50/70 text-slate-500 hover:bg-slate-100/70"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {shift.name}
                        </p>
                        {shift.code && (
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                            {shift.code}
                          </p>
                        )}
                        {shift.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--text-secondary)]">
                            {shift.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                        {formatTime(shift.start_time)} –{" "}
                        {formatTime(shift.end_time)}
                      </td>

                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                        {formatDuration(shift.start_time, shift.end_time)}
                      </td>

                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                        {shift.break_duration_minutes} min
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={
                            shift.is_active
                              ? "inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700"
                              : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                          }
                        >
                          {shift.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(shift)}
                            title="Edit shift"
                            aria-label={`Edit ${shift.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatusShift(shift)}
                            disabled={saving}
                            title={
                              shift.is_active ? "Disable shift" : "Enable shift"
                            }
                            aria-label={`${shift.is_active ? "Disable" : "Enable"} ${shift.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:opacity-50"
                          >
                            <Power size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="relative z-10 flex min-w-0 shrink-0 flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2 text-sm text-[var(--text-secondary)]">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--text-primary)]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                <span>
                  {total === 0
                    ? "0 results"
                    : `${(page - 1) * pageSize + 1}–${Math.min(
                        page * pageSize,
                        total,
                      )} of ${total}`}
                </span>
              </div>

              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  className="min-h-9 shrink-0 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="whitespace-nowrap text-sm text-[var(--text-secondary)]">
                  Page {totalPages === 0 ? 0 : page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                  className="min-h-9 shrink-0 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shift-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-xl">
            <form onSubmit={handleSubmit}>
              <div className="border-b border-[var(--border)] px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      id="shift-modal-title"
                      className="text-base font-semibold text-[var(--text-primary)]"
                    >
                      {editingShift ? "Edit Shift" : "Add Shift"}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Define the shift name, working hours, and break duration.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    aria-label="Close"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="grid gap-x-5 gap-y-4 px-6 py-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="shift-name"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Shift Name *
                  </label>
                  <input
                    id="shift-name"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. General Shift"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="shift-code"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Shift Code
                  </label>
                  <input
                    id="shift-code"
                    maxLength={50}
                    value={form.code}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                    placeholder="e.g. GS"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="shift-start"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Start Time *
                  </label>
                  <input
                    id="shift-start"
                    type="time"
                    required
                    value={form.start_time}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        start_time: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="shift-end"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    End Time *
                  </label>
                  <input
                    id="shift-end"
                    type="time"
                    required
                    value={form.end_time}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        end_time: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Overnight shifts are supported.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="shift-break"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Break Duration (minutes) *
                  </label>
                  <input
                    id="shift-break"
                    type="number"
                    required
                    min={0}
                    max={1440}
                    value={form.break_duration_minutes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        break_duration_minutes: Number(event.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="flex items-center gap-3 self-end pb-2">
                  <input
                    id="shift-active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[var(--brand-color)]"
                  />
                  <label
                    htmlFor="shift-active"
                    className="text-sm font-medium text-[var(--text-primary)]"
                  >
                    Shift is active
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="shift-description"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Description
                  </label>
                  <textarea
                    id="shift-description"
                    rows={3}
                    maxLength={2000}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Optional description of this shift"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="min-h-10 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-10 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingShift
                      ? "Save Changes"
                      : "Create Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-shift-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-xl">
            <form onSubmit={handleBulkSubmit}>
              <div className="border-b border-[var(--border)] px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      id="bulk-shift-modal-title"
                      className="text-base font-semibold text-[var(--text-primary)]"
                    >
                      Bulk Create Shifts
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Generate multiple shifts automatically at regular
                      intervals.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() => setShowBulkModal(false)}
                    aria-label="Close"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="bulk-prefix"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      Shift Name Prefix *
                    </label>
                    <input
                      id="bulk-prefix"
                      required
                      maxLength={70}
                      value={bulkForm.name_prefix}
                      onChange={(event) =>
                        setBulkForm((current) => ({
                          ...current,
                          name_prefix: event.target.value,
                        }))
                      }
                      placeholder="e.g. Morning"
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Example: Morning 06:00
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="bulk-interval"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      Start-Time Interval *
                    </label>
                    <select
                      id="bulk-interval"
                      value={bulkForm.interval_minutes}
                      onChange={(event) =>
                        setBulkForm((current) => ({
                          ...current,
                          interval_minutes: Number(event.target.value),
                        }))
                      }
                      className={inputClass}
                    >
                      <option value={15}>Every 15 minutes</option>
                      <option value={30}>Every 30 minutes</option>
                      <option value={60}>Every 1 hour</option>
                      <option value={90}>Every 1 hour 30 minutes</option>
                      <option value={120}>Every 2 hours</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="bulk-first-time"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      First Start Time *
                    </label>
                    <input
                      id="bulk-first-time"
                      type="time"
                      required
                      value={bulkForm.first_start_time}
                      onChange={(event) =>
                        setBulkForm((current) => ({
                          ...current,
                          first_start_time: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bulk-last-time"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      Last Start Time *
                    </label>
                    <input
                      id="bulk-last-time"
                      type="time"
                      required
                      value={bulkForm.last_start_time}
                      onChange={(event) =>
                        setBulkForm((current) => ({
                          ...current,
                          last_start_time: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bulk-duration"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      Shift Duration *
                    </label>
                    <select
                      id="bulk-duration"
                      value={bulkForm.duration_hours}
                      onChange={(event) =>
                        setBulkForm((current) => ({
                          ...current,
                          duration_hours: Number(event.target.value),
                        }))
                      }
                      className={inputClass}
                    >
                      <option value={8}>8 hours</option>
                      <option value={9}>9 hours</option>
                      <option value={10}>10 hours</option>
                      <option value={11}>11 hours</option>
                      <option value={12}>12 hours</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="bulk-break"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      Break Duration *
                    </label>
                    <select
                      id="bulk-break"
                      value={bulkForm.break_duration_minutes}
                      onChange={(event) =>
                        setBulkForm((current) => ({
                          ...current,
                          break_duration_minutes: Number(event.target.value),
                        }))
                      }
                      className={inputClass}
                    >
                      <option value={0}>No break</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={bulkForm.is_active}
                    onChange={(event) =>
                      setBulkForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[var(--brand-color)]"
                  />
                  Create shifts as active
                </label>

                <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                  <div className="flex items-center justify-between gap-3 bg-[var(--surface-muted)] px-4 py-3">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        Shift Preview
                      </h4>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                        Review generated times before saving.
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]">
                      {bulkPreview.shifts.length} shifts
                    </span>
                  </div>

                  {bulkPreview.error ? (
                    <p className="px-4 py-4 text-sm text-red-600">
                      {bulkPreview.error}
                    </p>
                  ) : (
                    <div className="max-h-56 overflow-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-[var(--surface)]">
                          <tr className="border-b border-[var(--border)]">
                            <th className="px-4 py-2 font-medium text-[var(--text-secondary)]">
                              Shift Name
                            </th>
                            <th className="px-4 py-2 font-medium text-[var(--text-secondary)]">
                              Start
                            </th>
                            <th className="px-4 py-2 font-medium text-[var(--text-secondary)]">
                              End
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkPreview.shifts.map((shift) => (
                            <tr
                              key={shift.name}
                              className="border-b border-[var(--border-muted)] last:border-0"
                            >
                              <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">
                                {shift.name}
                              </td>
                              <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                                {displayClockTime(shift.start_time)}
                              </td>
                              <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                                {displayClockTime(shift.end_time)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!bulkPreview.error && (
                    <p className="border-t border-[var(--border)] px-4 py-2.5 text-xs text-[var(--text-secondary)]">
                      Each shift has a {bulkForm.duration_hours}-hour duration
                      and a {bulkForm.break_duration_minutes}-minute break. End
                      times may fall on the following day for overnight shifts.
                    </p>
                  )}
                </div>

                {bulkError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                  >
                    {bulkError}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={bulkSaving}
                  onClick={() => setShowBulkModal(false)}
                  className="min-h-10 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    bulkSaving ||
                    Boolean(bulkPreview.error) ||
                    bulkPreview.shifts.length === 0
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkSaving
                    ? "Creating shifts..."
                    : `Create ${bulkPreview.shifts.length} Shifts`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StatusConfirmModal
        open={statusShift !== null}
        entityName={statusShift?.name ?? ""}
        entityType="Shift"
        isActive={statusShift?.is_active ?? false}
        loading={saving}
        onConfirm={() => void handleConfirmStatus()}
        onClose={() => {
          if (!saving) setStatusShift(null);
        }}
      />
    </>
  );
}

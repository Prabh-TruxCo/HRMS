"use client";

import { useEffect, useState } from "react";
import {
  Clock3,
  Fingerprint,
  Pencil,
  Plus,
  Timer,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { useCompany } from "@/features/company/context/CompanyContext";

import {
  getWorkforceConfiguration,
  getWorkforceRecommendation,
  updateWorkforceConfiguration,
  type AttendanceMethod,
  type WorkforceConfiguration,
} from "@/features/company/services/workforceService";

import {
  createEmploymentType,
  deleteEmploymentType,
  getEmploymentTypes,
  updateEmploymentType,
  type EmploymentType,
} from "@/features/company/services/employmentService";

const attendanceMethods: {
  value: AttendanceMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "web",
    label: "Web / Browser",
    description: "Employees can mark attendance from the HRMS web application.",
  },
  {
    value: "mobile",
    label: "Mobile App",
    description: "Employees can mark attendance using the mobile application.",
  },
  {
    value: "face",
    label: "Face Recognition",
    description: "Attendance can be captured through face recognition.",
  },
  {
    value: "device",
    label: "Biometric / Device",
    description:
      "Attendance can be captured through biometric attendance devices.",
  },
];

export default function CompanyWorkforceTab() {
  const { currentCompany } = useCompany();

  const [configuration, setConfiguration] =
    useState<WorkforceConfiguration | null>(null);

  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);

  const [loading, setLoading] = useState(true);
  const [employmentLoading, setEmploymentLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmploymentType, setEditingEmploymentType] =
    useState<EmploymentType | null>(null);

  const [employmentName, setEmploymentName] = useState("");
  const [employmentDescription, setEmploymentDescription] = useState("");
  const [employmentActive, setEmploymentActive] = useState(true);
  const [modalError, setModalError] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    if (!currentCompany?.id) return;

    const loadWorkforce = async () => {
      setLoading(true);
      setEmploymentLoading(true);
      setError("");
      setMessage("");

      try {
        const [savedConfiguration, types] = await Promise.all([
          getWorkforceConfiguration(currentCompany.id),
          getEmploymentTypes(currentCompany.id),
        ]);

        if (savedConfiguration) {
          // Existing saved configuration.
          setConfiguration(savedConfiguration);
          setEmploymentTypes(types);
        } else {
          // New company: load industry recommendation.
          const recommendation = await getWorkforceRecommendation(
            currentCompany.id,
          );

          setConfiguration({
            company_id: currentCompany.id,
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

          // Show recommended employment types before they are saved.
          const recommendedTypes: EmploymentType[] =
            recommendation.recommended_employment_types.map((name, index) => ({
              id: -(index + 1),
              company_id: currentCompany.id,
              name,
              description: null,
              is_active: true,
            }));

          setEmploymentTypes(types.length > 0 ? types : recommendedTypes);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load workforce settings.",
        );
      } finally {
        setLoading(false);
        setEmploymentLoading(false);
      }
    };

    loadWorkforce();
  }, [currentCompany?.id]);

  const updateField = <K extends keyof WorkforceConfiguration>(
    field: K,
    value: WorkforceConfiguration[K],
  ) => {
    setConfiguration((current) =>
      current
        ? {
            ...current,
            [field]: value,
            setup_mode: "custom",
          }
        : current,
    );
  };

  const handleSave = async () => {
    if (!currentCompany?.id || !configuration) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updated = await updateWorkforceConfiguration(currentCompany.id, {
        setup_mode: configuration.setup_mode,

        attendance_enabled: configuration.attendance_enabled,
        attendance_methods: configuration.attendance_methods,
        late_marking_enabled: configuration.late_marking_enabled,
        grace_period_minutes: configuration.grace_period_minutes,
        early_checkout_enabled: configuration.early_checkout_enabled,
        auto_markout_enabled: configuration.auto_markout_enabled,
        attendance_regularization_enabled:
          configuration.attendance_regularization_enabled,
        attendance_approval_required:
          configuration.attendance_approval_required,

        shifts_enabled: configuration.shifts_enabled,

        overtime_enabled: configuration.overtime_enabled,
        overtime_approval_required: configuration.overtime_approval_required,

        remote_work_enabled: configuration.remote_work_enabled,
        field_work_enabled: configuration.field_work_enabled,
        gps_attendance_enabled: configuration.gps_attendance_enabled,
        geofencing_enabled: configuration.geofencing_enabled,
      });

      setConfiguration(updated);

      // Reload real DB employment types.
      const savedEmploymentTypes = await getEmploymentTypes(currentCompany.id);
      setEmploymentTypes(savedEmploymentTypes);

      setMessage("Workforce settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save workforce settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openCreateEmploymentModal = () => {
    setEditingEmploymentType(null);
    setEmploymentName("");
    setEmploymentDescription("");
    setEmploymentActive(true);
    setModalError("");
    setModalOpen(true);
  };

  const openEditEmploymentModal = (type: EmploymentType) => {
    setEditingEmploymentType(type);
    setEmploymentName(type.name);
    setEmploymentDescription(type.description ?? "");
    setEmploymentActive(type.is_active);
    setModalError("");
    setModalOpen(true);
  };

  const closeEmploymentModal = () => {
    if (modalSaving) return;

    setModalOpen(false);
    setEditingEmploymentType(null);
    setEmploymentName("");
    setEmploymentDescription("");
    setEmploymentActive(true);
    setModalError("");
  };

  const handleEmploymentSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!currentCompany?.id) return;

    const name = employmentName.trim();

    if (!name) {
      setModalError("Employment type name is required.");
      return;
    }

    setModalSaving(true);
    setModalError("");

    try {
      if (editingEmploymentType) {
        const updated = await updateEmploymentType(
          currentCompany.id,
          editingEmploymentType.id,
          {
            name,
            description: employmentDescription.trim() || null,
            is_active: employmentActive,
          },
        );

        setEmploymentTypes((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      } else {
        const created = await createEmploymentType(currentCompany.id, {
          name,
          description: employmentDescription.trim() || null,
        });

        setEmploymentTypes((current) => [...current, created]);
      }

      closeEmploymentModal();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Unable to save employment type.",
      );
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteEmploymentType = async (employmentType: EmploymentType) => {
    if (!currentCompany?.id) return;

    const confirmed = window.confirm(`Delete "${employmentType.name}"?`);

    if (!confirmed) return;

    try {
      await deleteEmploymentType(currentCompany.id, employmentType.id);

      setEmploymentTypes((current) =>
        current.filter((item) => item.id !== employmentType.id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete employment type.",
      );
    }
  };

  if (loading || !configuration) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-[var(--text-secondary)]">
          Loading workforce settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Workforce
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Configure how employees work, attend, and manage workforce operations
          in your company.
        </p>
      </div>

      {/* Setup Overview */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-[var(--text-primary)]">
                Workforce Setup
              </h3>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Start with recommended settings based on your industry, then
                customize them as needed.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                configuration.setup_mode === "recommended"
                  ? "bg-[var(--brand-color-soft)] text-[var(--brand-color)]"
                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
              }`}
            >
              {configuration.setup_mode === "recommended"
                ? "Recommended"
                : "Custom"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Industry
            </p>

            <p className="mt-1 text-base font-medium capitalize text-[var(--text-primary)]">
              {currentCompany?.industry_type || "Not specified"}
            </p>
          </div>
        </div>
      </section>

      {/* Employment */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">
              Employment
            </h3>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Define the employment types used by your company.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateEmploymentModal}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
          >
            <Plus size={16} />
            Add Employment Type
          </button>
        </div>

        <div className="p-5">
          {employmentLoading ? (
            <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
              Loading employment types...
            </div>
          ) : employmentTypes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] px-5 py-8 text-center">
              <UserRound
                size={24}
                className="mx-auto text-[var(--text-muted)]"
              />

              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                No employment types configured
              </p>

              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Recommended employment types will be created when you save the
                initial workforce configuration. You can customize them
                afterward.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-muted)]">
              {employmentTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--text-primary)]">
                        {type.name}
                      </p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          type.is_active
                            ? "bg-[var(--brand-color-soft)] text-[var(--brand-color)]"
                            : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                        }`}
                      >
                        {type.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {type.description && (
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {type.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditEmploymentModal(type)}
                      className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                      aria-label={`Edit ${type.name}`}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEmploymentType(type)}
                      className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${type.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Working Schedule */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <SectionHeader
          icon={<Clock3 size={18} />}
          title="Working Schedule"
          description="Configure shifts and working schedule behaviour."
        />

        <div className="divide-y divide-[var(--border-muted)]">
          <ToggleRow
            title="Shift Management"
            description="Enable multiple shifts and shift-based workforce scheduling."
            checked={configuration.shifts_enabled}
            onChange={(value) => updateField("shifts_enabled", value)}
          />
        </div>
      </section>

      {/* Attendance */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <SectionHeader
          icon={<Fingerprint size={18} />}
          title="Attendance"
          description="Configure attendance collection and attendance rules."
        />

        <div className="p-5">
          <div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Attendance Methods
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Select all attendance methods your company allows. Multiple
                methods can be enabled at the same time.
              </p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {attendanceMethods.map((method) => {
                const selected = configuration.attendance_methods.includes(
                  method.value,
                );

                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => {
                      const methods = configuration.attendance_methods;

                      if (selected) {
                        if (methods.length === 1) return;

                        updateField(
                          "attendance_methods",
                          methods.filter((item) => item !== method.value),
                        );
                      } else {
                        updateField("attendance_methods", [
                          ...methods,
                          method.value,
                        ]);
                      }
                    }}
                    className={`rounded-lg border p-4 text-left transition ${
                      selected
                        ? "border-[var(--brand-color)] bg-[var(--brand-color-soft)]"
                        : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {method.label}
                        </p>

                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {method.description}
                        </p>
                      </div>

                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-semibold ${
                          selected
                            ? "border-[var(--brand-color)] bg-[var(--brand-color)] text-white"
                            : "border-[var(--border)] bg-[var(--surface)] text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-[var(--text-muted)]">
              At least one attendance method must remain enabled.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[var(--border-muted)] border-t border-[var(--border)]">
          <ToggleRow
            title="Attendance Enabled"
            description="Enable attendance tracking for employees."
            checked={configuration.attendance_enabled}
            onChange={(value) => updateField("attendance_enabled", value)}
          />

          <ToggleRow
            title="Late Marking"
            description="Mark employees late when they exceed the allowed grace period."
            checked={configuration.late_marking_enabled}
            onChange={(value) => updateField("late_marking_enabled", value)}
          />

          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Grace Period
              </p>

              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Allowed late arrival time before late marking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={120}
                value={configuration.grace_period_minutes}
                onChange={(event) =>
                  updateField(
                    "grace_period_minutes",
                    Math.max(0, Math.min(120, Number(event.target.value) || 0)),
                  )
                }
                className="w-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]"
              />

              <span className="text-sm text-[var(--text-secondary)]">
                minutes
              </span>
            </div>
          </div>

          <ToggleRow
            title="Early Checkout"
            description="Track employees leaving before their scheduled checkout time."
            checked={configuration.early_checkout_enabled}
            onChange={(value) => updateField("early_checkout_enabled", value)}
          />

          <ToggleRow
            title="Automatic Mark-out"
            description="Automatically mark attendance out when employees forget to check out."
            checked={configuration.auto_markout_enabled}
            onChange={(value) => updateField("auto_markout_enabled", value)}
          />

          <ToggleRow
            title="Attendance Regularization"
            description="Allow employees to request corrections for attendance records."
            checked={configuration.attendance_regularization_enabled}
            onChange={(value) =>
              updateField("attendance_regularization_enabled", value)
            }
          />

          <ToggleRow
            title="Attendance Approval"
            description="Require approval for attendance records or attendance changes."
            checked={configuration.attendance_approval_required}
            onChange={(value) =>
              updateField("attendance_approval_required", value)
            }
          />
        </div>
      </section>

      {/* Overtime */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <SectionHeader
          icon={<Timer size={18} />}
          title="Overtime"
          description="Configure overtime tracking and approval."
        />

        <div className="divide-y divide-[var(--border-muted)]">
          <ToggleRow
            title="Overtime Tracking"
            description="Track employee hours beyond their scheduled working hours."
            checked={configuration.overtime_enabled}
            onChange={(value) => updateField("overtime_enabled", value)}
          />

          <ToggleRow
            title="Overtime Approval"
            description="Require manager approval before overtime is accepted."
            checked={configuration.overtime_approval_required}
            onChange={(value) =>
              updateField("overtime_approval_required", value)
            }
          />
        </div>
      </section>

      {/* Remote & Field Work */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <SectionHeader
          icon={<UserRound size={18} />}
          title="Remote & Field Work"
          description="Configure remote employees and field workforce operations."
        />

        <div className="divide-y divide-[var(--border-muted)]">
          <ToggleRow
            title="Remote Work"
            description="Allow employees to work remotely."
            checked={configuration.remote_work_enabled}
            onChange={(value) => updateField("remote_work_enabled", value)}
          />

          <ToggleRow
            title="Field Work"
            description="Enable workforce operations for employees working outside the office."
            checked={configuration.field_work_enabled}
            onChange={(value) => updateField("field_work_enabled", value)}
          />

          <ToggleRow
            title="GPS Attendance"
            description="Capture employee location when attendance is marked through supported devices."
            checked={configuration.gps_attendance_enabled}
            onChange={(value) => updateField("gps_attendance_enabled", value)}
          />

          <ToggleRow
            title="Geofencing"
            description="Restrict attendance to configured geographical areas."
            checked={configuration.geofencing_enabled}
            onChange={(value) => updateField("geofencing_enabled", value)}
          />
        </div>
      </section>

      {/* Messages */}
      {(error || message) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[var(--brand-color-border)] bg-[var(--brand-color-soft)] text-[var(--brand-color)]"
          }`}
        >
          {error || message}
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end border-t border-[var(--border)] pt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[var(--brand-color)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Workforce Settings"}
        </button>
      </div>

      {/* Employment Type Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">
                  {editingEmploymentType
                    ? "Edit Employment Type"
                    : "Add Employment Type"}
                </h3>

                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Define an employment type used by your company.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEmploymentModal}
                className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEmploymentSubmit} className="space-y-5 p-5">
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Name
                </label>

                <input
                  type="text"
                  value={employmentName}
                  onChange={(event) => setEmploymentName(event.target.value)}
                  placeholder="e.g. Full Time"
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Description
                </label>

                <textarea
                  value={employmentDescription}
                  onChange={(event) =>
                    setEmploymentDescription(event.target.value)
                  }
                  placeholder="Optional description"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]"
                />
              </div>

              {editingEmploymentType && (
                <ToggleRow
                  title="Active"
                  description="Allow this employment type to be used for employees."
                  checked={employmentActive}
                  onChange={setEmploymentActive}
                />
              )}

              {modalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {modalError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEmploymentModal}
                  disabled={modalSaving}
                  className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={modalSaving}
                  className="rounded-lg bg-[var(--brand-color)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-color-hover)] disabled:opacity-60"
                >
                  {modalSaving
                    ? "Saving..."
                    : editingEmploymentType
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-4">
      <div className="mt-0.5 text-[var(--brand-color)]">{icon}</div>

      <div>
        <h3 className="font-medium text-[var(--text-primary)]">{title}</h3>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {title}
        </p>

        <p className="mt-1 max-w-2xl text-xs text-[var(--text-secondary)]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[var(--brand-color)]" : "bg-[var(--border)]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

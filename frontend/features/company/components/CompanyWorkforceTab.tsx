"use client";

import { useEffect, useState } from "react";
import { Clock3, Fingerprint, Timer, UserRound } from "lucide-react";

import { useCompany } from "@/features/company/context/CompanyContext";
import {
  getWorkforceConfiguration,
  updateWorkforceConfiguration,
  type WorkforceConfiguration,
} from "@/features/company/services/workforceService";

const attendanceModes = [
  {
    value: "manual",
    label: "Manual",
    description: "Attendance is recorded manually.",
  },
  {
    value: "office",
    label: "Office",
    description: "Attendance is recorded from the office.",
  },
  {
    value: "mobile",
    label: "Mobile",
    description: "Employees can mark attendance from mobile.",
  },
  {
    value: "device",
    label: "Device",
    description: "Attendance is recorded through attendance devices.",
  },
];

export default function CompanyWorkforceTab() {
  const { currentCompany } = useCompany();

  const [configuration, setConfiguration] =
    useState<WorkforceConfiguration | null>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentCompany) return;

    const companyId = currentCompany.id;

    async function loadConfiguration() {
      try {
        setLoading(true);
        setError("");

        const data = await getWorkforceConfiguration(companyId);

        setConfiguration(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load workforce configuration.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadConfiguration();
  }, [currentCompany]);

  if (!currentCompany) {
    return null;
  }

  if (loading || !configuration) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Loading workforce settings...
        </p>
      </div>
    );
  }

  const updateField = <K extends keyof WorkforceConfiguration>(
    field: K,
    value: WorkforceConfiguration[K],
  ) => {
    setConfiguration((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const updated = await updateWorkforceConfiguration(currentCompany.id, {
        attendance_mode: configuration.attendance_mode,
        shifts_enabled: configuration.shifts_enabled,
        overtime_enabled: configuration.overtime_enabled,
        late_marking_enabled: configuration.late_marking_enabled,
        grace_period_minutes: configuration.grace_period_minutes,
      });

      setConfiguration(updated);
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

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Workforce
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Configure how employees work, attend, and follow company workforce
          policies.
        </p>
      </div>

      {/* Employment */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-start gap-3 border-b border-[var(--border-muted)] p-5">
          <div className="rounded-lg bg-[var(--brand-color-soft)] p-2">
            <UserRound size={18} className="text-[var(--brand-color)]" />
          </div>

          <div>
            <h3 className="font-medium text-[var(--text-primary)]">
              Employment
            </h3>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Employment types and work arrangements will be configured here.
            </p>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm text-[var(--text-muted)]">
            Employment Types and Work Modes will be available after the
            workforce foundation is configured.
          </p>
        </div>
      </section>

      {/* Working Schedule */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-start gap-3 border-b border-[var(--border-muted)] p-5">
          <div className="rounded-lg bg-[var(--brand-color-soft)] p-2">
            <Clock3 size={18} className="text-[var(--brand-color)]" />
          </div>

          <div>
            <h3 className="font-medium text-[var(--text-primary)]">
              Working Schedule
            </h3>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Configure shifts and working schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Shift Management
            </p>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Allow this company to use employee shifts.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              updateField("shifts_enabled", !configuration.shifts_enabled)
            }
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              configuration.shifts_enabled
                ? "bg-[var(--brand-color)]"
                : "bg-[var(--border)]"
            }`}
            aria-label="Toggle shift management"
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                configuration.shifts_enabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Attendance */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-start gap-3 border-b border-[var(--border-muted)] p-5">
          <div className="rounded-lg bg-[var(--brand-color-soft)] p-2">
            <Fingerprint size={18} className="text-[var(--brand-color)]" />
          </div>

          <div>
            <h3 className="font-medium text-[var(--text-primary)]">
              Attendance
            </h3>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Configure attendance and late-marking behaviour.
            </p>
          </div>
        </div>

        <div className="space-y-6 p-5">
          {/* Attendance mode */}
          <div>
            <label
              htmlFor="attendance-mode"
              className="text-sm font-medium text-[var(--text-primary)]"
            >
              Attendance Mode
            </label>

            <p className="mb-3 mt-1 text-sm text-[var(--text-secondary)]">
              Choose how employees record attendance.
            </p>

            <select
              id="attendance-mode"
              value={configuration.attendance_mode}
              onChange={(event) =>
                updateField("attendance_mode", event.target.value)
              }
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)] sm:max-w-md"
            >
              {attendanceModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          {/* Late marking */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Late Marking
              </p>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Automatically identify late attendance.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                updateField(
                  "late_marking_enabled",
                  !configuration.late_marking_enabled,
                )
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                configuration.late_marking_enabled
                  ? "bg-[var(--brand-color)]"
                  : "bg-[var(--border)]"
              }`}
              aria-label="Toggle late marking"
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                  configuration.late_marking_enabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Grace period */}
          {configuration.late_marking_enabled && (
            <div>
              <label
                htmlFor="grace-period"
                className="text-sm font-medium text-[var(--text-primary)]"
              >
                Grace Period
              </label>

              <p className="mb-3 mt-1 text-sm text-[var(--text-secondary)]">
                Minutes allowed after the scheduled start time before an
                employee is marked late.
              </p>

              <div className="flex items-center gap-2">
                <input
                  id="grace-period"
                  type="number"
                  min={0}
                  max={120}
                  value={configuration.grace_period_minutes}
                  onChange={(event) =>
                    updateField(
                      "grace_period_minutes",
                      Math.max(
                        0,
                        Math.min(120, Number(event.target.value) || 0),
                      ),
                    )
                  }
                  className="w-28 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]"
                />

                <span className="text-sm text-[var(--text-secondary)]">
                  minutes
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Overtime */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-start gap-3 border-b border-[var(--border-muted)] p-5">
          <div className="rounded-lg bg-[var(--brand-color-soft)] p-2">
            <Timer size={18} className="text-[var(--brand-color)]" />
          </div>

          <div>
            <h3 className="font-medium text-[var(--text-primary)]">Overtime</h3>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Enable overtime tracking for employees.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Overtime Tracking
            </p>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Allow overtime hours to be tracked.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              updateField("overtime_enabled", !configuration.overtime_enabled)
            }
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              configuration.overtime_enabled
                ? "bg-[var(--brand-color)]"
                : "bg-[var(--border)]"
            }`}
            aria-label="Toggle overtime tracking"
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                configuration.overtime_enabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[var(--brand-color)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Workforce Settings"}
        </button>
      </div>
    </div>
  );
}

"use client";

import {
  Activity,
  CheckCircle2,
  Clock3,
  Edit3,
  PlusCircle,
  Power,
  X,
  XCircle,
} from "lucide-react";

import {
  formatAuditValue,
  getAuditChanges,
} from "@/utils/audit-log";
import { AuditLog } from "../services/auditLogService";

type AuditLogModalProps = {
  open: boolean;
  entityName: string;
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

function getActionIcon(action: string) {
  switch (action) {
    case "CREATED":
      return <PlusCircle size={17} />;

    case "UPDATED":
      return <Edit3 size={17} />;

    case "ENABLED":
      return <CheckCircle2 size={17} />;

    case "DISABLED":
      return <Power size={17} />;

    default:
      return <Activity size={17} />;
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case "CREATED":
      return "Created";

    case "UPDATED":
      return "Updated";

    case "ENABLED":
      return "Enabled";

    case "DISABLED":
      return "Disabled";

    default:
      return action;
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogModal({
  open,
  entityName,
  logs,
  loading,
  error,
  onClose,
}: AuditLogModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-color-soft)]">
              <Activity
                size={18}
                className="text-[var(--brand-color)]"
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Activity Log
              </h2>

              <p className="text-xs text-slate-400">
                {entityName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close activity log"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--brand-color)]" />

              <p className="mt-3 text-sm text-slate-400">
                Loading activity...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                <XCircle size={17} />
                Unable to load activity
              </div>

              <p className="mt-1 text-xs text-red-500">
                {error}
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                <Clock3
                  size={21}
                  className="text-slate-400"
                />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                No activity yet
              </h3>

              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Changes made to this record will appear here.
              </p>
            </div>
          )}

          {/* Timeline */}
          {!loading && !error && logs.length > 0 && (
            <div className="relative">
              <div className="absolute bottom-5 left-[17px] top-5 w-px bg-slate-200" />

              <div className="space-y-6">
                {logs.map((log) => {
                  const changes =
                    log.action === "UPDATED"
                      ? getAuditChanges(log)
                      : [];

                  return (
                    <div
                      key={log.id}
                      className="relative flex gap-4"
                    >
                      {/* Icon */}
                      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[var(--brand-color)] shadow-sm">
                        {getActionIcon(log.action)}
                      </div>

                      {/* Event */}
                      <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                        {/* Title / Date */}
                        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                          <p className="text-sm font-semibold text-slate-800">
                            {getActionLabel(log.action)}
                          </p>

                          <span className="text-[11px] text-slate-400">
                            {formatDate(log.created_at)}
                          </span>
                        </div>

                        {/* Description */}
                        {log.description && (
                          <p className="mt-1 text-xs text-slate-500">
                            {log.description}
                          </p>
                        )}

                        {/* Changes */}
                        {changes.length > 0 && (
                          <div className="mt-3 border-t border-slate-200 pt-3">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              Changes
                            </p>

                            <div className="space-y-2">
                              {changes.map((change, index) => (
                                <div
                                  key={`${change.path}-${index}`}
                                  className="rounded-lg border border-slate-100 bg-white px-3 py-2.5"
                                >
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="min-w-0 text-xs font-medium text-slate-600">
                                      {change.field}
                                    </span>

                                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
                                      {change.type === "added" && (
                                        <>
                                          <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-600">
                                            Added
                                          </span>

                                          {change.newValue !==
                                            undefined && (
                                            <span className="max-w-[220px] truncate text-slate-500">
                                              {formatAuditValue(
                                                change.newValue,
                                              )}
                                            </span>
                                          )}
                                        </>
                                      )}

                                      {change.type === "removed" && (
                                        <>
                                          <span className="rounded-md bg-red-50 px-2 py-1 font-medium text-red-600">
                                            Removed
                                          </span>

                                          {change.oldValue !==
                                            undefined && (
                                            <span className="max-w-[220px] truncate text-slate-500">
                                              {formatAuditValue(
                                                change.oldValue,
                                              )}
                                            </span>
                                          )}
                                        </>
                                      )}

                                      {change.type === "updated" && (
                                        <>
                                          <span className="max-w-[180px] truncate rounded-md bg-red-50 px-2 py-1 text-red-600">
                                            {formatAuditValue(
                                              change.oldValue,
                                            )}
                                          </span>

                                          <span className="text-slate-300">
                                            →
                                          </span>

                                          <span className="max-w-[180px] truncate rounded-md bg-emerald-50 px-2 py-1 text-emerald-600">
                                            {formatAuditValue(
                                              change.newValue,
                                            )}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* User */}
                        <p className="mt-3 text-[11px] text-slate-400">
                          Performed by{" "}
                          {log.user_name ||
                            (log.user_id
                              ? `User #${log.user_id}`
                              : "System")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
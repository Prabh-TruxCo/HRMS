"use client";

import { Power } from "lucide-react";

type StatusConfirmModalProps = {
  open: boolean;
  entityName: string;
  entityType: string;
  isActive: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function StatusConfirmModal({
  open,
  entityName,
  entityType,
  isActive,
  loading = false,
  onConfirm,
  onClose,
}: StatusConfirmModalProps) {
  if (!open) {
    return null;
  }

  const action = isActive ? "Disable" : "Enable";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-confirm-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] shadow-xl">
        <div className="px-6 py-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-color-soft)] text-[var(--brand-color)]">
              <Power size={18} />
            </div>

            <div className="min-w-0">
              <h3
                id="status-confirm-title"
                className="text-base font-semibold text-[var(--text-primary)]"
              >
                {action} {entityType}?
              </h3>

              <p className="mt-1.5 text-sm leading-5 text-[var(--text-secondary)]">
                Are you sure you want to {action.toLowerCase()}{" "}
                <span className="font-medium text-[var(--text-primary)]">
                  {entityName}
                </span>
                ?
              </p>

              {isActive ? (
                <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                  The {entityType.toLowerCase()} will remain in the system for
                  historical records, but it will no longer be active.
                </p>
              ) : (
                <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                  The {entityType.toLowerCase()} will become active again and
                  can be used normally.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="min-h-10 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="min-h-10 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : action}
          </button>
        </div>
      </div>
    </div>
  );
}
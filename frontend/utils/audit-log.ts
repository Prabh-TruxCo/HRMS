import { AuditChange, AuditLog } from "@/features/company/services/auditLogService";

function formatFieldName(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    return value || "—";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map((item) => formatAuditValue(item)).join(", ")
      : "—";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }

  return String(value);
}

export function getAuditChanges(log: AuditLog): AuditChange[] {
  const oldValues = log.old_values ?? {};
  const newValues = log.new_values ?? {};

  const keys = new Set([
    ...Object.keys(oldValues),
    ...Object.keys(newValues),
  ]);

  const changes: AuditChange[] = [];

  for (const key of keys) {
    const oldValue = oldValues[key];
    const newValue = newValues[key];

    const oldExists = Object.prototype.hasOwnProperty.call(
      oldValues,
      key,
    );

    const newExists = Object.prototype.hasOwnProperty.call(
      newValues,
      key,
    );

    if (!oldExists && newExists) {
      changes.push({
        path: key,
        field: formatFieldName(key),
        type: "added",
        newValue,
      });

      continue;
    }

    if (oldExists && !newExists) {
      changes.push({
        path: key,
        field: formatFieldName(key),
        type: "removed",
        oldValue,
      });

      continue;
    }

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        path: key,
        field: formatFieldName(key),
        type: "updated",
        oldValue,
        newValue,
      });
    }
  }

  return changes;
}
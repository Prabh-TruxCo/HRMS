"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  MapPin,
  Pencil,
  Plus,
  Power,
  Search,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";

import { useCompany } from "../context/CompanyContext";
import {
  createOfficeLocation,
  getOfficeLocations,
  updateOfficeLocation,
  type OfficeLocation,
  type OfficeLocationFormData,
} from "../services/officeLocationService";
import { getBranch, type Branch } from "../services/branchService";
import { getEntityAuditLogs, type AuditLog } from "../services/auditLogService";

import AuditLogModal from "./AuditLogModal";

const OfficeLocationMapPicker = dynamic(
  () => import("./OfficeLocationMapPicker"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-80 items-center justify-center rounded-lg border"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        Loading map...
      </div>
    ),
  },
);

const EMPTY_FORM: OfficeLocationFormData = {
  name: "",
  code: null,
  description: null,
  address: null,
  city: null,
  state: null,
  country: "India",
  postal_code: null,
  latitude: null,
  longitude: null,
  geofence_enabled: false,
  geofence_radius_meters: null,
  is_active: true,
};

export default function OfficeLocationManagement({
  branchId,
}: {
  branchId: number;
}) {
  const router = useRouter();
  const { currentCompany } = useCompany();
  const { showSuccess, showError } = useSnackbar();

  const companyId = currentCompany?.id ?? null;

  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OfficeLocation | null>(null);
  const [form, setForm] = useState<OfficeLocationFormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const [statusLocation, setStatusLocation] = useState<OfficeLocation | null>(
    null,
  );
  const [activityLocation, setActivityLocation] =
    useState<OfficeLocation | null>(null);

  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchLoading, setBranchLoading] = useState(true);
  const [branchError, setBranchError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Load the office locations for the selected branch.
  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      if (companyId === null) {
        setLocations([]);
        setTotal(0);
        setTotalPages(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await getOfficeLocations(companyId, branchId, {
          page,
          page_size: pageSize,
          search,
        });

        if (!cancelled) {
          setLocations(result.locations);
          setTotal(result.total);
          setTotalPages(result.total_pages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load office locations.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLocations();

    return () => {
      cancelled = true;
    };
  }, [companyId, branchId, page, pageSize, search, refreshKey]);

  // Load the branch address so new locations can inherit it.
  useEffect(() => {
    let cancelled = false;

    async function loadBranch() {
      if (companyId === null) {
        setBranch(null);
        setBranchError(null);
        setBranchLoading(false);
        return;
      }

      try {
        setBranchLoading(true);
        setBranchError(null);

        const result = await getBranch(companyId, branchId);

        if (!cancelled) {
          setBranch(result);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load branch details.";

          setBranch(null);
          setBranchError(message);
          showError(message);
        }
      } finally {
        if (!cancelled) {
          setBranchLoading(false);
        }
      }
    }

    void loadBranch();

    return () => {
      cancelled = true;
    };
  }, [companyId, branchId, showError]);

  function openCreateForm() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      address: branch?.address ?? null,
      city: branch?.city ?? null,
      state: branch?.state ?? null,
      country: branch?.country || "India",
      postal_code: null,
    });
    setError(null);
    setShowForm(true);
  }

  function openEditForm(location: OfficeLocation) {
    setEditing(location);

    setForm({
      name: location.name,
      code: location.code,
      description: location.description,
      address: location.address,
      city: location.city,
      state: location.state,
      country: location.country,
      postal_code: location.postal_code,
      latitude: location.latitude,
      longitude: location.longitude,
      geofence_enabled: location.geofence_enabled,
      geofence_radius_meters: location.geofence_radius_meters,
      is_active: location.is_active,
    });

    setError(null);
    setShowForm(true);
  }

  function openStatusConfirmation(location: OfficeLocation) {
    setStatusLocation(location);
  }

  function closeStatusConfirmation() {
    if (saving) return;
    setStatusLocation(null);
  }

  function closeActivityLog() {
    setActivityLocation(null);
    setActivityLogs([]);
    setActivityError(null);
  }

  async function openActivityLog(location: OfficeLocation) {
    if (companyId === null) return;

    setActivityLocation(location);
    setActivityLogs([]);
    setActivityError(null);
    setActivityLoading(true);

    try {
      const logs = await getEntityAuditLogs(
        companyId,
        "OFFICE_LOCATION",
        location.id,
      );

      setActivityLogs(logs);
    } catch (err) {
      setActivityError(
        err instanceof Error ? err.message : "Unable to load activity logs.",
      );
    } finally {
      setActivityLoading(false);
    }
  }

  async function handleConfirmLocationStatus() {
    if (companyId === null || statusLocation === null) return;

    const location = statusLocation;
    const nextStatus = !location.is_active;

    try {
      setSaving(true);

      await updateOfficeLocation(companyId, branchId, location.id, {
        name: location.name,
        code: location.code,
        description: location.description,
        address: location.address,
        city: location.city,
        state: location.state,
        country: location.country,
        postal_code: location.postal_code,
        latitude: location.latitude,
        longitude: location.longitude,
        geofence_enabled: location.geofence_enabled,
        geofence_radius_meters: location.geofence_radius_meters,
        is_active: nextStatus,
      });

      setRefreshKey((current) => current + 1);

      showSuccess(
        nextStatus
          ? "Office location activated successfully."
          : "Office location deactivated successfully.",
      );

      setStatusLocation(null);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to update office location status.",
      );
    } finally {
      setSaving(false);
    }
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
  }

  function setField<K extends keyof OfficeLocationFormData>(
    field: K,
    value: OfficeLocationFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (companyId === null) {
      setError("Select a company before managing office locations.");
      return;
    }

    if (branchLoading) {
      setError("Please wait while branch details are loading.");
      return;
    }

    if (!branch) {
      setError(
        branchError ?? "Branch details could not be loaded. Please try again.",
      );
      return;
    }

    if (!form.name.trim()) {
      setError("Office location name is required.");
      return;
    }

    if ((form.latitude == null) !== (form.longitude == null)) {
      setError("Enter both latitude and longitude, or leave both empty.");
      return;
    }

    if (
      form.geofence_enabled &&
      (form.latitude == null ||
        form.longitude == null ||
        form.geofence_radius_meters == null)
    ) {
      setError("Geofencing requires latitude, longitude, and a radius.");
      return;
    }

    if (form.geofence_enabled && Number(form.geofence_radius_meters) <= 0) {
      setError("Geofence radius must be greater than zero.");
      return;
    }

    const payload: OfficeLocationFormData = {
      ...form,
      name: form.name.trim(),
      code: form.code?.trim() || null,
      description: form.description?.trim() || null,
      address: form.address?.trim() || null,
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      country: form.country?.trim() || "India",
      postal_code: form.postal_code?.trim() || null,
      latitude: form.latitude == null ? null : Number(form.latitude),
      longitude: form.longitude == null ? null : Number(form.longitude),
      geofence_radius_meters: form.geofence_enabled
        ? Number(form.geofence_radius_meters)
        : null,
    };

    try {
      setSaving(true);
      setError(null);

      if (editing) {
        await updateOfficeLocation(companyId, branchId, editing.id, payload);
        showSuccess("Office location updated successfully.");
      } else {
        await createOfficeLocation(companyId, branchId, payload);
        showSuccess("Office location created successfully.");
        setPage(1);
      }

      setShowForm(false);
      setEditing(null);
      setForm({ ...EMPTY_FORM });
      setRefreshKey((value) => value + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save office location.";

      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  if (!currentCompany) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--text-secondary)]">
          Select a company to manage office locations.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Office Locations
          </h1>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage offices, warehouses, addresses, and geofencing for this
            branch.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          disabled={branchLoading || !branch}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Add Location
        </button>
      </div>

      {branchError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {branchError}
        </div>
      )}

      {error && !showForm && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
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
            placeholder="Search office locations..."
            aria-label="Search office locations"
            className="min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]"
          />
        </div>

        <p className="text-sm text-[var(--text-secondary)]">
          {total} {total === 1 ? "location" : "locations"} found
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-secondary)]">
          Loading office locations...
        </div>
      ) : locations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <MapPin className="mx-auto mb-3 text-[var(--text-muted)]" size={28} />

          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {search ? "No matching locations" : "No office locations yet"}
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Add a main office, warehouse, or another location for this branch.
          </p>

          {!search && (
            <button
              type="button"
              onClick={openCreateForm}
              disabled={branchLoading || !branch}
              className="mt-4 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Add Location
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[760px]">
            <thead className="bg-[var(--surface-muted)]">
              <tr className="border-b border-[var(--border)] text-left">
                {[
                  "Location",
                  "Code",
                  "Address",
                  "Geofencing",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {locations.map((location) => (
                <tr
                  key={location.id}
                  className="border-b border-[var(--border-muted)] last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {location.name}
                    </p>

                    {location.description && (
                      <p className="mt-1 max-w-xs truncate text-xs text-[var(--text-secondary)]">
                        {location.description}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {location.code || "—"}
                  </td>

                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {[
                      location.address,
                      location.city,
                      location.state,
                      location.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>

                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {location.geofence_enabled
                      ? `${location.geofence_radius_meters} m`
                      : "Off"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={
                        location.is_active
                          ? "rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                          : "rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                      }
                    >
                      {location.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEditForm(location)}
                      disabled={branchLoading || !branch}
                      title="Edit location"
                      aria-label={`Edit ${location.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:opacity-50"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openStatusConfirmation(location)}
                      disabled={saving}
                      title={
                        location.is_active
                          ? "Deactivate office location"
                          : "Activate office location"
                      }
                      aria-label={
                        location.is_active
                          ? `Deactivate ${location.name}`
                          : `Activate ${location.name}`
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Power size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => void openActivityLog(location)}
                      title="View activity"
                      aria-label={`View activity for ${location.name}`}
                      className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface)] hover:text-[var(--brand-color)]"
                    >
                      <Activity size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 sm:p-6">
          <div className="flex min-h-full items-start justify-center">
            <div className="my-4 w-full max-w-4xl overflow-visible rounded-2xl bg-[var(--surface)] shadow-xl">
              <form onSubmit={handleSubmit}>
                <div className="border-b border-[var(--border)] px-5 py-4">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    {editing ? "Edit Office Location" : "Add Office Location"}
                  </h2>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Coordinates are optional unless geofencing is enabled.
                  </p>
                </div>

                <div className="space-y-6 p-5">
                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                      {error}
                    </div>
                  )}

                  {/* Basic information */}
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        Location Information
                      </h3>

                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Give this office or facility a name and an optional
                        reference code.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Location name *">
                        <input
                          required
                          maxLength={150}
                          value={form.name}
                          onChange={(event) =>
                            setField("name", event.target.value)
                          }
                          className={inputClass}
                          placeholder="e.g. Head Office"
                        />
                      </Field>

                      <Field label="Location code">
                        <input
                          maxLength={50}
                          value={form.code ?? ""}
                          onChange={(event) =>
                            setField("code", event.target.value || null)
                          }
                          className={inputClass}
                          placeholder="e.g. HQ-01"
                        />
                      </Field>

                      <div className="sm:col-span-2">
                        <Field label="Description">
                          <textarea
                            value={form.description ?? ""}
                            onChange={(event) =>
                              setField(
                                "description",
                                event.target.value || null,
                              )
                            }
                            className={inputClass}
                            rows={2}
                            placeholder="Optional details about this location"
                          />
                        </Field>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[var(--border)]" />

                  {/* Address Details */}
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        Address Details
                      </h3>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        The branch address is prefilled. Edit these fields if
                        this office has a different address.
                      </p>
                    </div>

                    {branchLoading ? (
                      <div className="rounded-xl border border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]">
                        Loading branch address...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Field label="Street address">
                            <textarea
                              value={form.address ?? ""}
                              onChange={(e) =>
                                setField("address", e.target.value || null)
                              }
                              className={inputClass}
                              rows={2}
                              placeholder="Building, street, area"
                            />
                          </Field>
                        </div>

                        <Field label="City">
                          <input
                            value={form.city ?? ""}
                            onChange={(e) =>
                              setField("city", e.target.value || null)
                            }
                            className={inputClass}
                            placeholder="City"
                          />
                        </Field>

                        <Field label="State">
                          <input
                            value={form.state ?? ""}
                            onChange={(e) =>
                              setField("state", e.target.value || null)
                            }
                            className={inputClass}
                            placeholder="State"
                          />
                        </Field>

                        <Field label="Country *">
                          <input
                            required
                            maxLength={100}
                            value={form.country}
                            onChange={(e) =>
                              setField("country", e.target.value)
                            }
                            className={inputClass}
                            placeholder="Country"
                          />
                        </Field>

                        <Field label="Postal code">
                          <input
                            maxLength={20}
                            value={form.postal_code ?? ""}
                            onChange={(e) =>
                              setField("postal_code", e.target.value || null)
                            }
                            className={inputClass}
                            placeholder="Postal code"
                          />
                        </Field>
                      </div>
                    )}
                  </section>

                  <div className="border-t border-[var(--border)]" />

                  {/* Map coordinates */}
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        Map Location
                      </h3>

                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Use the map to set coordinates. Searching the map is
                        optional; you can click the map, drag the pin, or use
                        your current location. You do not need to enter the
                        address again here.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
                      <OfficeLocationMapPicker
                        latitude={form.latitude ?? null}
                        longitude={form.longitude ?? null}
                        onChange={({ latitude, longitude }) => {
                          setForm((current) => ({
                            ...current,
                            latitude,
                            longitude,
                          }));
                        }}
                      />

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Latitude">
                          <input
                            type="number"
                            step="any"
                            min="-90"
                            max="90"
                            value={form.latitude ?? ""}
                            onChange={(event) =>
                              setField(
                                "latitude",
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                              )
                            }
                            className={inputClass}
                            placeholder="e.g. 30.9010"
                          />
                        </Field>

                        <Field label="Longitude">
                          <input
                            type="number"
                            step="any"
                            min="-180"
                            max="180"
                            value={form.longitude ?? ""}
                            onChange={(event) =>
                              setField(
                                "longitude",
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                              )
                            }
                            className={inputClass}
                            placeholder="e.g. 75.8573"
                          />
                        </Field>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[var(--border)]" />

                  {/* Geofencing */}
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        Attendance Geofencing
                      </h3>

                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Optionally restrict location-based attendance to a
                        radius around this office. Company-level geofencing
                        settings must also allow it.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] p-4">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={form.geofence_enabled}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              geofence_enabled: event.target.checked,
                              geofence_radius_meters: event.target.checked
                                ? (current.geofence_radius_meters ?? 100)
                                : null,
                            }))
                          }
                          className="mt-1 h-4 w-4 accent-[var(--brand-color)]"
                        />

                        <span>
                          <span className="block text-sm font-medium text-[var(--text-primary)]">
                            Enable geofencing for this location
                          </span>

                          <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                            Requires valid map coordinates and a radius.
                          </span>
                        </span>
                      </label>

                      {form.geofence_enabled && (
                        <div className="mt-4 max-w-sm">
                          <Field label="Geofence radius (meters) *">
                            <input
                              type="number"
                              min="1"
                              max="100000"
                              required
                              value={form.geofence_radius_meters ?? ""}
                              onChange={(event) =>
                                setField(
                                  "geofence_radius_meters",
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                                )
                              }
                              className={inputClass}
                              placeholder="100"
                            />
                          </Field>

                          <p className="mt-2 text-xs text-[var(--text-secondary)]">
                            Example: 100 metres allows attendance within
                            approximately 100 metres of the selected point.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Status */}
                  <section className="rounded-xl border border-[var(--border)] p-4">
                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <span>
                        <span className="block text-sm font-medium text-[var(--text-primary)]">
                          Location is active
                        </span>

                        <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                          Inactive locations remain saved but should not be used
                          for new operational assignments.
                        </span>
                      </span>

                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(event) =>
                          setField("is_active", event.target.checked)
                        }
                        className="h-4 w-4 shrink-0 accent-[var(--brand-color)]"
                      />
                    </label>
                  </section>
                </div>

                <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={closeForm}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || branchLoading || !branch}
                    className="rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editing
                        ? "Save Changes"
                        : "Create Location"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <StatusConfirmModal
        open={statusLocation !== null}
        entityName={statusLocation?.name ?? ""}
        entityType="Office Location"
        isActive={statusLocation?.is_active ?? false}
        loading={saving}
        onConfirm={() => void handleConfirmLocationStatus()}
        onClose={closeStatusConfirmation}
      />

      <AuditLogModal
        open={activityLocation !== null}
        entityName={activityLocation?.name ?? ""}
        logs={activityLogs}
        loading={activityLoading}
        error={activityError}
        onClose={closeActivityLog}
      />
    </div>
  );
}

const inputClass =
  "min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-[var(--text-secondary)]">
      <span>{label}</span>
      {children}
    </label>
  );
}

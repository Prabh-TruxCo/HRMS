"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  MapPin,
  Pencil,
  Plus,
  Power,
  Search,
  Users,
  X,
} from "lucide-react";

import {
  Client,
  ClientPayload,
  createClient,
  getClients,
  updateClient,
  updateClientStatus,
} from "@/features/company/services/clientService";
import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";
import AuditLogModal from "@/features/company/components/AuditLogModal";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";

type ClientManagementProps = {
  companyId: number | null;
};

const emptyForm: ClientPayload = {
  name: "",
  code: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  description: "",
  is_active: true,
};

export default function ClientManagement({
  companyId,
}: ClientManagementProps) {
  const { showSnackbar } = useSnackbar();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] =
    useState<Client | null>(null);

  const [form, setForm] =
    useState<ClientPayload>(emptyForm);

  const [saving, setSaving] = useState(false);

  const [statusClient, setStatusClient] =
    useState<Client | null>(null);

  const [statusLoading, setStatusLoading] =
    useState(false);

  const [activityClient, setActivityClient] =
    useState<Client | null>(null);

  useEffect(() => {
    if (companyId === null) {
      return;
    }

    const activeCompanyId = companyId;
    let cancelled = false;

    async function loadClients() {
      try {
        setLoading(true);
        setError(null);

        const data = await getClients(activeCompanyId);

        if (cancelled) {
          return;
        }

        setClients(data);
      } catch (err) {
        if (cancelled) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Unable to load clients.";

        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadClients();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const filteredClients = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return clients;
    }

    return clients.filter((client) => {
      return [
        client.name,
        client.code,
        client.contact_person,
        client.phone,
        client.email,
        client.city,
        client.state,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(value),
        );
    });
  }, [clients, search]);

  function openCreateModal() {
    setEditingClient(null);
    setForm({
      ...emptyForm,
      is_active: true,
    });
    setModalOpen(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);

    setForm({
      name: client.name,
      code: client.code ?? "",
      contact_person: client.contact_person ?? "",
      phone: client.phone ?? "",
      email: client.email ?? "",
      address: client.address ?? "",
      city: client.city ?? "",
      state: client.state ?? "",
      country: client.country ?? "India",
      description: client.description ?? "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingClient(null);
    setForm(emptyForm);
  }

  function updateField(
    field: keyof ClientPayload,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (companyId === null) {
      return;
    }

    if (!form.name?.trim()) {
      showSnackbar(
        "Client name is required.",
        "error",
      );
      return;
    }

    try {
      setSaving(true);

      let result: Client;

      if (editingClient) {
        const payload: ClientPayload = {
          name: form.name.trim(),
          code: form.code?.trim() || null,
          contact_person:
            form.contact_person?.trim() || null,
          phone: form.phone?.trim() || null,
          email: form.email?.trim() || null,
          address: form.address?.trim() || null,
          city: form.city?.trim() || null,
          state: form.state?.trim() || null,
          country:
            form.country?.trim() || "India",
          description:
            form.description?.trim() || null,
        };

        result = await updateClient(
          companyId,
          editingClient.id,
          payload,
        );

        setClients((current) =>
          current.map((item) =>
            item.id === result.id
              ? result
              : item,
          ),
        );

        showSnackbar(
          "Client updated successfully.",
          "success",
        );
      } else {
        const payload: ClientPayload = {
          name: form.name.trim(),
          code: form.code?.trim() || null,
          contact_person:
            form.contact_person?.trim() || null,
          phone: form.phone?.trim() || null,
          email: form.email?.trim() || null,
          address: form.address?.trim() || null,
          city: form.city?.trim() || null,
          state: form.state?.trim() || null,
          country:
            form.country?.trim() || "India",
          description:
            form.description?.trim() || null,
          is_active:
            form.is_active !== false,
        };

        result = await createClient(
          companyId,
          payload,
        );

        setClients((current) =>
          [...current, result].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );

        showSnackbar(
          "Client created successfully.",
          "success",
        );
      }

      closeModal();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save client.";

      showSnackbar(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusConfirm() {
    if (
      companyId === null ||
      statusClient === null
    ) {
      return;
    }

    try {
      setStatusLoading(true);

      const result = await updateClientStatus(
        companyId,
        statusClient.id,
        !statusClient.is_active,
      );

      setClients((current) =>
        current.map((item) =>
          item.id === result.id
            ? result
            : item,
        ),
      );

      showSnackbar(
        result.is_active
          ? "Client enabled successfully."
          : "Client disabled successfully.",
        "success",
      );

      setStatusClient(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to update client status.";

      showSnackbar(message, "error");
    } finally {
      setStatusLoading(false);
    }
  }

  function formatLocation(client: Client) {
    return [client.city, client.state]
      .filter(Boolean)
      .join(", ");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users
              size={20}
              className="text-[var(--brand-color)]"
            />

            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Clients
            </h1>
          </div>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage clients and operational customer accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={companyId === null}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search clients..."
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {error ? (
          <div className="px-5 py-10 text-center text-sm text-red-600">
            {error}
          </div>
        ) : loading ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
            Loading clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Users
              size={28}
              className="mx-auto text-[var(--text-muted)]"
            />

            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              {search
                ? "No clients found"
                : "No clients yet"}
            </p>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {search
                ? "Try a different search."
                : "Create your first client to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left">
                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Client
                  </th>

                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Contact
                  </th>

                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Location
                  </th>

                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Code
                  </th>

                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className={`border-b border-[var(--border)] last:border-0 ${
                      client.is_active
                        ? ""
                        : "opacity-60"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)]">
                          {client.name}
                        </div>

                        {client.description && (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-[var(--text-muted)]">
                            {client.description}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-[var(--text-primary)]">
                        {client.contact_person || "—"}
                      </div>

                      {client.email && (
                        <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {client.email}
                        </div>
                      )}

                      {client.phone && (
                        <div className="text-xs text-[var(--text-muted)]">
                          {client.phone}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {formatLocation(client) ? (
                        <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
                          <MapPin
                            size={14}
                            className="text-[var(--text-muted)]"
                          />

                          {formatLocation(client)}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-5 py-4 text-[var(--text-secondary)]">
                      {client.code || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          client.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {client.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() =>
                            openEditModal(client)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title={
                            client.is_active
                              ? "Disable"
                              : "Enable"
                          }
                          onClick={() =>
                            setStatusClient(client)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Power size={16} />
                        </button>

                        <button
                          type="button"
                          title="Activity"
                          onClick={() =>
                            setActivityClient(client)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Activity size={16} />
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {editingClient
                    ? "Edit Client"
                    : "Add Client"}
                </h2>

                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {editingClient
                    ? "Update client information."
                    : "Add a new operational client."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 px-6 py-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Client Name *
                  </label>

                  <input
                    value={form.name ?? ""}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value,
                      )
                    }
                    required
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--brand-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Client Code
                  </label>

                  <input
                    value={form.code ?? ""}
                    onChange={(event) =>
                      updateField(
                        "code",
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--brand-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Contact Person
                  </label>

                  <input
                    value={form.contact_person ?? ""}
                    onChange={(event) =>
                      updateField(
                        "contact_person",
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--brand-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Phone
                  </label>

                  <input
                    value={form.phone ?? ""}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--brand-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--brand-color)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Address
                  </label>

                  <textarea
                    value={form.address ?? ""}
                    onChange={(event) =>
                      updateField(
                        "address",
                        event.target.value,
                      )
                    }
                    rows={2}
                    className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    City
                  </label>

                  <input
                    value={form.city ?? ""}
                    onChange={(event) =>
                      updateField(
                        "city",
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--brand-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    State
                  </label>

                  <input
                    value={form.state ?? ""}
                    onChange={(event) =>
                      updateField(
                        "state",
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--brand-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Country
                  </label>

                  <input
                    value={form.country ?? "India"}
                    onChange={(event) =>
                      updateField(
                        "country",
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--brand-color)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Description
                  </label>

                  <textarea
                    value={form.description ?? ""}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                    }
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-color)]"
                  />
                </div>
              </div>

              {!editingClient && (
                <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={form.is_active !== false}
                    onChange={(event) =>
                      updateField(
                        "is_active",
                        event.target.checked,
                      )
                    }
                    className="h-4 w-4 rounded border-[var(--border)]"
                  />

                  Active
                </label>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
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
                  className="min-h-10 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-color-hover)] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingClient
                      ? "Save Changes"
                      : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StatusConfirmModal
        open={statusClient !== null}
        entityName={statusClient?.name ?? ""}
        entityType="client"
        isActive={statusClient?.is_active ?? false}
        loading={statusLoading}
        onConfirm={handleStatusConfirm}
        onClose={() =>
          statusLoading
            ? undefined
            : setStatusClient(null)
        }
      />

      {activityClient && companyId !== null && (
        <AuditLogModal
          open
          companyId={companyId}
          entityType="CLIENT"
          entityId={activityClient.id}
          entityName={activityClient.name}
          onClose={() =>
            setActivityClient(null)
          }
        />
      )}
    </div>
  );
}
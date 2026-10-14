"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Activity,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Power,
  Search,
  X,
} from "lucide-react";

import {
  createPost,
  getPosts,
  updatePost,
  updatePostStatus,
  type Post,
  type PostPayload,
} from "@/features/company/services/postService";
import { getSites, type Site } from "@/features/company/services/siteService";
import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";
import AuditLogModal from "@/features/company/components/AuditLogModal";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";
import OfficeLocationMapPicker from "@/features/company/components/OfficeLocationMapPicker";
import {
  type AuditLog,
  getEntityAuditLogs,
} from "@/features/company/services/auditLogService";

type PostManagementProps = {
  companyId: number | null;
};

const emptyForm: PostPayload = {
  site_id: 0,
  name: "",
  code: "",
  description: "",
  latitude: null,
  longitude: null,
  geofence_radius: 100,
  is_geofence_enabled: false,
  is_active: true,
};

const inputClass =
  "h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]";

const labelClass = "mb-1 block text-xs font-medium text-[var(--text-primary)]";

export default function PostManagement({ companyId }: PostManagementProps) {
  const { showSnackbar } = useSnackbar();

  const [posts, setPosts] = useState<Post[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [form, setForm] = useState<PostPayload>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [siteSearch, setSiteSearch] = useState("");
  const [sitePickerOpen, setSitePickerOpen] = useState(false);

  const [statusPost, setStatusPost] = useState<Post | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [activityPost, setActivityPost] = useState<Post | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Debounce the post search.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadPosts = useCallback(
    async (signal?: AbortSignal) => {
      if (companyId === null) return;

      try {
        setLoading(true);
        setError(null);

        const result = await getPosts(companyId, {
          page,
          page_size: pageSize,
          search: debouncedSearch || undefined,
        });

        if (signal?.aborted) return;

        setPosts(result.posts);
        setPagination({
          total: result.total,
          page: result.page,
          page_size: result.page_size,
          total_pages: result.total_pages,
        });
      } catch (err) {
        if (signal?.aborted) return;

        setError(err instanceof Error ? err.message : "Unable to load posts.");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [companyId, page, pageSize, debouncedSearch],
  );

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      void loadPosts(controller.signal);
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadPosts]);

  // Load sites for the site selector and table labels.
  useEffect(() => {
    if (companyId === null) return;

    let cancelled = false;
    const activeCompanyId = companyId;

    async function loadCompanySites() {
      try {
        const result = await getSites(activeCompanyId, {
          page: 1,
          page_size: 100,
        });

        if (!cancelled) {
          setSites(result.sites);
        }
      } catch (err) {
        if (!cancelled) {
          showSnackbar(
            err instanceof Error ? err.message : "Unable to load sites.",
            "error",
          );
        }
      }
    }

    void loadCompanySites();

    return () => {
      cancelled = true;
    };
  }, [companyId, showSnackbar]);

  const siteNames = useMemo(
    () => new Map(sites.map((site) => [site.id, site.name])),
    [sites],
  );

  const activeSites = useMemo(
    () => sites.filter((site) => site.is_active),
    [sites],
  );

  const selectableSites = useMemo(
    () =>
      sites.filter(
        (site) =>
          site.name.toLowerCase().includes(siteSearch.trim().toLowerCase()) &&
          (site.is_active ||
            (editingPost !== null && site.id === editingPost.site_id)),
      ),
    [sites, siteSearch, editingPost],
  );

  const totalPages = pagination.total_pages;
  const firstRow = pagination.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, pagination.total);

  function updateField(
    field: keyof PostPayload,
    value: string | number | boolean | null,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectSite(site: Site) {
    setForm((current) => ({
      ...current,
      site_id: site.id,
    }));

    setSiteSearch(site.name);
    setSitePickerOpen(false);
  }

  function openCreateModal() {
    if (activeSites.length === 0) {
      showSnackbar(
        "Create or enable an active site before adding a post.",
        "error",
      );
      return;
    }

    setEditingPost(null);
    setForm({ ...emptyForm });
    setSiteSearch("");
    setSitePickerOpen(false);
    setModalOpen(true);
  }

  function openEditModal(post: Post) {
    setEditingPost(post);

    setForm({
      site_id: post.site_id,
      name: post.name,
      code: post.code ?? "",
      description: post.description ?? "",
      latitude: post.latitude ?? null,
      longitude: post.longitude ?? null,
      geofence_radius: post.geofence_radius ?? 100,
      is_geofence_enabled: post.is_geofence_enabled ?? false,
      is_active: post.is_active,
    });

    setSiteSearch(siteNames.get(post.site_id) ?? "");
    setSitePickerOpen(false);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingPost(null);
    setForm({ ...emptyForm });
    setSiteSearch("");
    setSitePickerOpen(false);
  }

  function buildPayload(): PostPayload {
    return {
      site_id: Number(form.site_id),
      name: form.name.trim(),
      code: form.code?.trim() || null,
      description: form.description?.trim() || null,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
      geofence_radius: form.geofence_radius ?? null,
      is_geofence_enabled: form.is_geofence_enabled ?? false,
      is_active: form.is_active !== false,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (companyId === null) return;

    const selectedSite = sites.find((site) => site.id === Number(form.site_id));

    if (!selectedSite) {
      showSnackbar("Please select a valid site.", "error");
      return;
    }

    if (!editingPost && !selectedSite.is_active) {
      showSnackbar(
        "An inactive site cannot be assigned to a new post.",
        "error",
      );
      return;
    }

    if (!form.name.trim()) {
      showSnackbar("Post name is required.", "error");
      return;
    }

    if (form.is_geofence_enabled) {
      if (form.latitude == null || form.longitude == null) {
        showSnackbar(
          "Latitude and longitude are required when the post geofence is enabled.",
          "error",
        );
        return;
      }

      if (
        form.latitude < -90 ||
        form.latitude > 90 ||
        form.longitude < -180 ||
        form.longitude > 180
      ) {
        showSnackbar("Enter valid latitude and longitude values.", "error");
        return;
      }

      if (
        form.geofence_radius == null ||
        !Number.isInteger(form.geofence_radius) ||
        form.geofence_radius <= 0
      ) {
        showSnackbar("Enter a positive whole-number geofence radius.", "error");
        return;
      }
    }

    try {
      setSaving(true);

      const payload = buildPayload();

      if (editingPost) {
        await updatePost(companyId, editingPost.id, payload);
        showSnackbar("Post updated successfully.", "success");
      } else {
        await createPost(companyId, payload);
        showSnackbar("Post created successfully.", "success");
      }

      setModalOpen(false);
      setEditingPost(null);
      setForm({ ...emptyForm });
      setSiteSearch("");
      setSitePickerOpen(false);

      // Return to the first page after creating a post.
      if (!editingPost && page !== 1) {
        setPage(1);
      } else {
        await loadPosts();
      }
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : "Unable to save post.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusConfirm() {
    if (companyId === null || statusPost === null) return;

    try {
      setStatusLoading(true);

      await updatePostStatus(companyId, statusPost.id, !statusPost.is_active);

      showSnackbar(
        statusPost.is_active
          ? "Post disabled successfully."
          : "Post enabled successfully.",
        "success",
      );

      setStatusPost(null);
      await loadPosts();
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : "Unable to update post status.",
        "error",
      );
    } finally {
      setStatusLoading(false);
    }
  }

  async function openActivity(post: Post) {
    if (companyId === null) return;

    setActivityPost(post);
    setActivityLogs([]);
    setActivityError(null);
    setActivityLoading(true);

    try {
      const logs = await getEntityAuditLogs(companyId, "POST", post.id);
      setActivityLogs(logs);
    } catch (err) {
      setActivityError(
        err instanceof Error ? err.message : "Unable to load post activity.",
      );
    } finally {
      setActivityLoading(false);
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={19} className="text-[var(--brand-color)]" />
            <h1 className="text-base font-semibold text-[var(--text-primary)]">
              Posts
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Manage operational positions at your company sites.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={companyId === null || activeSites.length === 0}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[var(--brand-color)] px-3 text-sm font-medium text-white hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} />
          Add Post
        </button>
      </div>

      {companyId !== null && !loading && activeSites.length === 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No active sites are available. Create or enable a site before adding a
          post.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search posts..."
            className={`${inputClass} pl-9`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              title="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          {pagination.total} {pagination.total === 1 ? "post" : "posts"}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {error ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadPosts()}
              className="mt-3 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--surface-muted)]"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Building2 size={26} className="mx-auto text-[var(--text-muted)]" />
            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              {debouncedSearch ? "No posts found" : "No posts yet"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {debouncedSearch
                ? "Try a different search term."
                : "Add a post to start managing site positions."}
            </p>
          </div>
        ) : (
          <div className="h-[clamp(220px,calc(100dvh-360px),760px)] overflow-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="border-b border-[var(--border)]">
                  {[
                    "Post",
                    "Site",
                    "Code",
                    "Description",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] ${
                        heading === "Actions" ? "text-right" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]/50 ${
                      post.is_active ? "" : "opacity-60"
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-[var(--text-primary)]">
                        {post.name}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-[var(--text-primary)]">
                      {siteNames.get(post.site_id) ?? `Site #${post.site_id}`}
                    </td>

                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                      {post.code || "—"}
                    </td>

                    <td className="max-w-[260px] px-3 py-2.5 text-[var(--text-secondary)]">
                      <span className="block truncate">
                        {post.description || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
                          post.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {post.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Edit post"
                          onClick={() => openEditModal(post)}
                          className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          title={
                            post.is_active ? "Disable post" : "Enable post"
                          }
                          onClick={() => setStatusPost(post)}
                          className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Power size={14} />
                        </button>

                        <button
                          type="button"
                          title="View activity"
                          onClick={() => void openActivity(post)}
                          className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Activity size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[var(--border)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span>
              {firstRow}–{lastRow} of {pagination.total}
            </span>
            <span>·</span>
            <label htmlFor="post-page-size">Rows</label>
            <select
              id="post-page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-7 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--text-primary)]"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex h-7 items-center gap-1 rounded border border-[var(--border)] px-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span className="min-w-16 text-center text-xs text-[var(--text-secondary)]">
              Page {page} of {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              disabled={loading || totalPages === 0 || page >= totalPages}
              onClick={() =>
                setPage((current) =>
                  Math.min(Math.max(totalPages, 1), current + 1),
                )
              }
              className="flex h-7 items-center gap-1 rounded border border-[var(--border)] px-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5">
          <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {editingPost ? "Edit Post" : "Add Post"}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {editingPost
                    ? "Update this post's details."
                    : "Choose a site and add its post details."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                title="Close"
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                <div className="relative sm:col-span-2">
                  <label className={labelClass}>Site *</label>

                  <div className="relative">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />

                    <input
                      value={siteSearch}
                      onFocus={() => setSitePickerOpen(true)}
                      onChange={(event) => {
                        setSiteSearch(event.target.value);
                        setSitePickerOpen(true);
                        setForm((current) => ({
                          ...current,
                          site_id: 0,
                        }));
                      }}
                      placeholder="Type a site name to search..."
                      autoComplete="off"
                      required
                      className={`${inputClass} pl-9 pr-9`}
                    />

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                  </div>

                  {sitePickerOpen && (
                    <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                      {selectableSites.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-[var(--text-secondary)]">
                          No matching active sites found.
                        </p>
                      ) : (
                        selectableSites.map((site) => (
                          <button
                            key={site.id}
                            type="button"
                            onClick={() => selectSite(site)}
                            className="flex w-full items-start gap-2 border-b border-[var(--border)] px-3 py-2.5 text-left last:border-0 hover:bg-[var(--surface-muted)]"
                          >
                            <Building2
                              size={15}
                              className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                                {site.name}
                              </span>
                              <span className="mt-0.5 block truncate text-[11px] text-[var(--text-secondary)]">
                                {site.code || "No site code"}
                                {site.city ? ` · ${site.city}` : ""}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Each post belongs to one site.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Post Name *</label>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    maxLength={200}
                    required
                    placeholder="Main Gate, Reception..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Post Code</label>
                  <input
                    value={form.code ?? ""}
                    onChange={(event) =>
                      updateField("code", event.target.value)
                    }
                    maxLength={50}
                    placeholder="Optional unique code"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={form.description ?? ""}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    rows={3}
                    placeholder="Describe this operational position..."
                    className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Post Location & Geofence
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Set a location specific to this post. If no post location is
                    configured, location-based operations can fall back to the
                    site&apos;s coordinates.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={form.latitude ?? ""}
                      onChange={(event) =>
                        updateField(
                          "latitude",
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                        )
                      }
                      placeholder="e.g. 30.9010"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={form.longitude ?? ""}
                      onChange={(event) =>
                        updateField(
                          "longitude",
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                        )
                      }
                      placeholder="e.g. 75.8573"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    id="post-geofence-enabled"
                    type="checkbox"
                    checked={form.is_geofence_enabled ?? false}
                    onChange={(event) =>
                      updateField("is_geofence_enabled", event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-[var(--border)]"
                  />
                  <div>
                    <label
                      htmlFor="post-geofence-enabled"
                      className="text-sm font-medium text-[var(--text-primary)]"
                    >
                      Enable post geofence
                    </label>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      Restrict location-based attendance to the configured
                      radius.
                    </p>
                  </div>
                </div>

                {form.is_geofence_enabled && (
                  <div>
                    <label className={labelClass}>
                      Geofence Radius (metres) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={form.geofence_radius ?? ""}
                      onChange={(event) =>
                        updateField(
                          "geofence_radius",
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                        )
                      }
                      placeholder="100"
                      className={inputClass}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className={labelClass}>Select Post Location</label>

                  <OfficeLocationMapPicker
                    latitude={form.latitude ?? null}
                    longitude={form.longitude ?? null}
                    radius={
                      form.is_geofence_enabled
                        ? (form.geofence_radius ?? null)
                        : null
                    }
                    onChange={({ latitude, longitude }) => {
                      setForm((current) => ({
                        ...current,
                        latitude,
                        longitude,
                      }));
                    }}
                  />

                  <p className="text-[11px] text-[var(--text-muted)]">
                    Search for a location, select it on the map, or drag the
                    marker. The coordinates above update automatically.
                  </p>
                </div>
              </div>

              {!editingPost && (
                <label className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={form.is_active !== false}
                    onChange={(event) =>
                      updateField("is_active", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-[var(--border)]"
                  />
                  Active
                </label>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-9 rounded-md border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || Number(form.site_id) === 0}
                  className="h-9 rounded-md bg-[var(--brand-color)] px-4 text-sm font-medium text-white hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingPost
                      ? "Save Changes"
                      : "Create Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StatusConfirmModal
        open={statusPost !== null}
        entityName={statusPost?.name ?? ""}
        entityType="post"
        isActive={statusPost?.is_active ?? false}
        loading={statusLoading}
        onConfirm={handleStatusConfirm}
        onClose={() => (statusLoading ? undefined : setStatusPost(null))}
      />

      {activityPost && companyId !== null && (
        <AuditLogModal
          open
          entityName={activityPost.name}
          logs={activityLogs}
          loading={activityLoading}
          error={activityError}
          onClose={() => setActivityPost(null)}
        />
      )}
    </div>
  );
}

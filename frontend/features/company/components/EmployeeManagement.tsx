"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Pencil, Power, Plus, Search, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import AuditLogModal from "./AuditLogModal";
import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";
import { useCompany } from "@/features/company/context/CompanyContext";

import {
  getOrganizationConfiguration,
  type OrganizationConfiguration,
} from "@/features/company/services/organizationService";

import {
  createEmployee,
  getEmployees,
  updateEmployee,
  type Employee,
  type EmployeePayload,
  type EmployeeFieldDefinition,
  getEmployeeFieldDefinitions,
} from "@/features/company/services/employeeService";

import {
  getEntityAuditLogs,
  type AuditLog,
} from "@/features/company/services/auditLogService";

import {
  EmployeeFormField as Field,
  inputClass,
} from "./employees/employee-form/EmployeeFormField";

import PersonalDetailsSection from "./employees/employee-form/PersonalDetailsSection";
import EmploymentDetailsSection from "./employees/employee-form/EmploymentDetailsSection";
import JobDetailsSection from "./employees/employee-form/JobDetailsSection";
import type { EmployeeForm } from "./employees/employee-form/employeeForm.types";

import { getDepartments } from "../services/departmentService";
import { getDesignations } from "../services/designationService";
import { getTeams } from "../services/teamService";
import { getBranches } from "../services/branchService";
import { getSites } from "../services/siteService";
import { getPosts } from "../services/postService";
import { getEmploymentTypes } from "../services/employmentService";

type Props = {
  companyId: number | null;
};

type AssignmentOption = {
  id: number;
  name: string;
};

const EMPTY_FORM: EmployeeForm = {
  first_name: "",
  middle_name: "",
  last_name: "",
  display_name: "",
  employee_code: "",
  personal_email: "",
  work_email: "",
  phone: "",
  alternate_phone: "",
  date_of_birth: "",
  gender: "",
  joining_date: "",
  probation_end_date: "",
  confirmation_date: "",
  employment_end_date: "",
  employment_status: "DRAFT",
  is_active: true,
  height_cm: "",
  weight_kg: "",
  notes: "",
  department_id: "",
  designation_id: "",
  team_id: "",
  branch_id: "",
  site_id: "",
  employment_type_id: "",
  manager_id: "",
  post_id: "",
  office_location_id: "",
};

const STATUSES = [
  "DRAFT",
  "ACTIVE",
  "ON_PROBATION",
  "CONFIRMED",
  "ON_NOTICE",
  "RESIGNED",
  "TERMINATED",
  "INACTIVE",
];

const EMPLOYEE_FORM_STEPS = [
  {
    title: "Personal Information",
    description: "Basic identity and contact details",
  },
  {
    title: "Employment Details",
    description: "Employment status and important dates",
  },
  {
    title: "Organization & Job Assignment",
    description: "Department, designation, location, and reporting",
  },
] as const;

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function toForm(employee: Employee): EmployeeForm {
  return {
    first_name: employee.first_name ?? "",
    middle_name: employee.middle_name ?? "",
    last_name: employee.last_name ?? "",
    display_name: employee.display_name ?? "",
    employee_code: employee.employee_code ?? "",
    personal_email: employee.personal_email ?? "",
    work_email: employee.work_email ?? "",
    phone: employee.phone ?? "",
    alternate_phone: employee.alternate_phone ?? "",
    date_of_birth: toDateInput(employee.date_of_birth),
    gender: employee.gender ?? "",
    joining_date: toDateInput(employee.joining_date),
    probation_end_date: toDateInput(employee.probation_end_date),
    confirmation_date: toDateInput(employee.confirmation_date),
    employment_end_date: toDateInput(employee.employment_end_date),
    employment_status: employee.employment_status ?? "DRAFT",
    is_active: employee.is_active,
    height_cm: employee.height_cm == null ? "" : String(employee.height_cm),
    weight_kg: employee.weight_kg == null ? "" : String(employee.weight_kg),
    notes: employee.notes ?? "",
    department_id:
      employee.department_id == null ? "" : String(employee.department_id),
    designation_id:
      employee.designation_id == null ? "" : String(employee.designation_id),
    team_id: employee.team_id == null ? "" : String(employee.team_id),
    branch_id: employee.branch_id == null ? "" : String(employee.branch_id),
    site_id: employee.site_id == null ? "" : String(employee.site_id),
    employment_type_id:
      employee.employment_type_id == null
        ? ""
        : String(employee.employment_type_id),
    manager_id: employee.manager_id == null ? "" : String(employee.manager_id),
    post_id: employee.post_id == null ? "" : String(employee.post_id),
    office_location_id:
      employee.office_location_id == null
        ? ""
        : String(employee.office_location_id),
  };
}

function toPayload(form: EmployeeForm): EmployeePayload {
  return {
    first_name: form.first_name.trim(),
    middle_name: form.middle_name.trim() || null,
    last_name: form.last_name.trim() || null,
    display_name: form.display_name.trim() || null,
    employee_code: form.employee_code.trim() || null,
    personal_email: form.personal_email.trim() || null,
    work_email: form.work_email.trim() || null,
    phone: form.phone.trim() || null,
    alternate_phone: form.alternate_phone.trim() || null,
    date_of_birth: form.date_of_birth || null,
    gender: form.gender || null,
    joining_date: form.joining_date || null,
    probation_end_date: form.probation_end_date || null,
    confirmation_date: form.confirmation_date || null,
    employment_end_date: form.employment_end_date || null,
    employment_status: form.employment_status,
    is_active: form.is_active,
    height_cm: form.height_cm ? Number(form.height_cm) : null,
    weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
    notes: form.notes.trim() || null,
    department_id: form.department_id ? Number(form.department_id) : null,
    designation_id: form.designation_id ? Number(form.designation_id) : null,
    team_id: form.team_id ? Number(form.team_id) : null,
    branch_id: form.branch_id ? Number(form.branch_id) : null,
    site_id: form.site_id ? Number(form.site_id) : null,
    employment_type_id: form.employment_type_id
      ? Number(form.employment_type_id)
      : null,
    manager_id: form.manager_id ? Number(form.manager_id) : null,
    post_id: form.post_id ? Number(form.post_id) : null,
    office_location_id: form.office_location_id
      ? Number(form.office_location_id)
      : null,
  };
}

function toUpdatePayload(payload: EmployeePayload): EmployeePayload {
  const result = { ...payload };
  delete result.employee_code;
  return result;
}

function employeeName(employee: Employee) {
  return (
    employee.display_name ||
    [employee.first_name, employee.middle_name, employee.last_name]
      .filter(Boolean)
      .join(" ")
  );
}

function prettyStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function EmployeeManagement({ companyId }: Props) {
  const { showSuccess, showError } = useSnackbar();
  const { currentCompany } = useCompany();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [statusEmployee, setStatusEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditEntityName, setAuditEntityName] = useState("");
  const [activeFormStep, setActiveFormStep] = useState(0);
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<
    EmployeeFieldDefinition[]
  >([]);
  const [customFieldsLoading, setCustomFieldsLoading] = useState(false);

  const [organizationConfiguration, setOrganizationConfiguration] =
    useState<OrganizationConfiguration | null>(null);
  const [
    organizationConfigurationLoading,
    setOrganizationConfigurationLoading,
  ] = useState(false);
  const [organizationConfigurationError, setOrganizationConfigurationError] =
    useState<string | null>(null);

  const [departments, setDepartments] = useState<AssignmentOption[]>([]);
  const [designations, setDesignations] = useState<AssignmentOption[]>([]);
  const [teams, setTeams] = useState<AssignmentOption[]>([]);
  const [branches, setBranches] = useState<AssignmentOption[]>([]);
  const [sites, setSites] = useState<AssignmentOption[]>([]);
  const [posts, setPosts] = useState<AssignmentOption[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<AssignmentOption[]>(
    [],
  );
  const [managers] = useState<AssignmentOption[]>([]);

  const configurationReady =
    organizationConfiguration !== null &&
    organizationConfiguration.company_id === companyId &&
    !organizationConfigurationLoading;

  const showDepartments =
    organizationConfiguration?.departments_enabled === true;
  const showDesignations =
    organizationConfiguration?.designations_enabled === true;
  const showTeams = organizationConfiguration?.teams_enabled === true;
  const showBranches = organizationConfiguration?.branches_enabled === true;
  const showSites = organizationConfiguration?.sites_enabled === true;
  const showPosts = organizationConfiguration?.posts_enabled === true;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    if (companyId === null) {
      return () => {
        cancelled = true;
      };
    }
    const employeeCompanyId = companyId;
    async function loadEmployees() {
      setLoading(true);

      try {
        const result = await getEmployees(employeeCompanyId, {
          page,
          page_size: pageSize,
          search,
          ...(statusFilter ? { employment_status: statusFilter } : {}),
          ...(activeFilter !== ""
            ? { is_active: activeFilter === "true" }
            : {}),
        });

        if (cancelled) return;

        setEmployees(result.employees);
        setTotal(result.total);
        setTotalPages(result.total_pages);
        setError(null);
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error ? err.message : "Unable to load employees.";

        setError(message);
        showError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [
    companyId,
    page,
    pageSize,
    search,
    statusFilter,
    activeFilter,
    refreshKey,
    showError,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomFieldDefinitions() {
      if (!companyId) {
        setCustomFieldDefinitions([]);
        setCustomFieldsLoading(false);
        return;
      }

      setCustomFieldsLoading(true);

      try {
        const definitions = await getEmployeeFieldDefinitions(companyId);

        if (!cancelled) {
          setCustomFieldDefinitions(
            definitions
              .filter((field) => field.is_active)
              .sort(
                (a, b) =>
                  a.display_order - b.display_order ||
                  a.label.localeCompare(b.label),
              ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load employee field definitions:", err);
        }
      } finally {
        if (!cancelled) setCustomFieldsLoading(false);
      }
    }

    void loadCustomFieldDefinitions();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    let cancelled = false;

    if (companyId === null) {
      return () => {
        cancelled = true;
      };
    }
    const activeCompanyId = companyId;
    async function loadOrganizationConfiguration() {
      setOrganizationConfigurationLoading(true);

      try {
        const configuration =
          await getOrganizationConfiguration(activeCompanyId);

        if (!cancelled) {
          setOrganizationConfiguration(configuration);
          setOrganizationConfigurationError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setOrganizationConfiguration(null);
          setOrganizationConfigurationError(
            err instanceof Error
              ? err.message
              : "Unable to load organization configuration.",
          );
        }
      } finally {
        if (!cancelled) {
          setOrganizationConfigurationLoading(false);
        }
      }
    }

    void loadOrganizationConfiguration();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    let cancelled = false;

    if (companyId === null || currentCompany?.id !== companyId) {
      return () => {
        cancelled = true;
      };
    }
    const assignmentCompanyId = companyId;

    async function loadAssignmentOptions() {
      try {
        const results = await Promise.allSettled([
          getDepartments(assignmentCompanyId),
          getDesignations(assignmentCompanyId),
          getTeams(assignmentCompanyId),
          getBranches(assignmentCompanyId),
          getSites(assignmentCompanyId),
          getPosts(assignmentCompanyId),
          getEmploymentTypes(assignmentCompanyId),
        ]);

        if (cancelled) return;

        const [
          departmentResult,
          designationResult,
          teamResult,
          branchResult,
          siteResult,
          postResult,
          employmentTypeResult,
        ] = results;

        if (departmentResult.status === "fulfilled") {
          setDepartments(departmentResult.value.departments);
        }

        if (designationResult.status === "fulfilled") {
          setDesignations(designationResult.value.designations);
        }

        if (teamResult.status === "fulfilled") {
          setTeams(teamResult.value.teams);
        }

        if (branchResult.status === "fulfilled") {
          setBranches(branchResult.value.branches);
        }

        if (siteResult.status === "fulfilled") {
          setSites(siteResult.value.sites);
        }

        if (postResult.status === "fulfilled") {
          setPosts(postResult.value.posts);
        }

        if (employmentTypeResult.status === "fulfilled") {
          setEmploymentTypes(employmentTypeResult.value);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load employee assignment options:", err);
        }
      }
    }

    void loadAssignmentOptions();

    return () => {
      cancelled = true;
    };
  }, [companyId, currentCompany?.id]);

  const openCreateModal = useCallback(() => {
    if (!configurationReady) return;

    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setActiveFormStep(0);
    setError(null);
    setShowModal(true);
  }, [configurationReady]);
  useEffect(() => {
    if (action !== "create" || !configurationReady) return;

    const timeoutId = setTimeout(() => {
      openCreateModal();
      router.replace("/employees");
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [action, configurationReady, openCreateModal, router]);

  function openEditModal(employee: Employee) {
    if (!configurationReady) {
      setError(
        organizationConfigurationError ??
          "Organization configuration is still loading. Please try again.",
      );
      return;
    }

    setEditingEmployee(employee);
    setForm(toForm(employee));
    setActiveFormStep(0);
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setActiveFormStep(0);
    setError(null);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Prevent saving until the final step.
    if (activeFormStep !== EMPLOYEE_FORM_STEPS.length - 1) {
      console.warn("Blocked employee submission before final step.");
      return;
    }

    if (companyId === null) return;

    if (!configurationReady || !organizationConfiguration) {
      setError(
        organizationConfigurationError ??
          "Organization configuration is unavailable. Please try again.",
      );
      return;
    }

    if (!form.first_name.trim()) {
      setError("First name is required.");

      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = toPayload(form);

      // Never submit assignments for organization features that are disabled.
      if (!organizationConfiguration.departments_enabled) {
        payload.department_id = null;
      }
      if (!organizationConfiguration.designations_enabled) {
        payload.designation_id = null;
      }
      if (!organizationConfiguration.teams_enabled) {
        payload.team_id = null;
      }
      if (!organizationConfiguration.branches_enabled) {
        payload.branch_id = null;
      }
      if (!organizationConfiguration.sites_enabled) {
        payload.site_id = null;
      }
      if (!organizationConfiguration.posts_enabled) {
        payload.post_id = null;
      }

      if (editingEmployee) {
        await updateEmployee(
          companyId,
          editingEmployee.id,
          toUpdatePayload(payload),
        );
        showSuccess("Employee updated successfully.");
      } else {
        await createEmployee(companyId, payload);
        setPage(1);
        showSuccess("Employee created successfully.");
      }

      setShowModal(false);
      setEditingEmployee(null);
      setForm(EMPTY_FORM);
      setActiveFormStep(0);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save employee.";
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  function validateFormStep(step: number): boolean {
    if (step === 0) {
      if (!form.first_name.trim()) {
        setError("First name is required before continuing.");
        return false;
      }
    }

    if (step === 1) {
      if (!form.employment_status) {
        setError("Please select an employment status.");
        return false;
      }
    }

    setError(null);
    return true;
  }

  function handleNextStep() {
    if (!validateFormStep(activeFormStep)) return;

    if (activeFormStep < EMPLOYEE_FORM_STEPS.length - 1) {
      setError(null);
      setActiveFormStep(activeFormStep + 1);
    }
  }

  function handlePreviousStep() {
    setError(null);
    setActiveFormStep((current) => Math.max(current - 1, 0));
  }

  async function handleConfirmStatus() {
    if (companyId === null || statusEmployee === null) return;

    const employee = statusEmployee;
    const nextActive = !employee.is_active;

    try {
      setSaving(true);

      // This action changes only employee active status.
      // Keep the other existing employee assignments intact.
      const payload = toPayload(toForm(employee));

      await updateEmployee(companyId, employee.id, {
        ...toUpdatePayload(payload),
        is_active: nextActive,
      });

      setStatusEmployee(null);
      setRefreshKey((current) => current + 1);
      showSuccess(
        nextActive
          ? "Employee enabled successfully."
          : "Employee disabled successfully.",
      );
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to update employee status.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleViewActivity(employee: Employee) {
    if (companyId === null) return;

    try {
      setAuditOpen(true);
      setAuditEntityName(employeeName(employee));
      setAuditLogs([]);
      setAuditError(null);
      setAuditLoading(true);

      const logs = await getEntityAuditLogs(companyId, "EMPLOYEE", employee.id);
      setAuditLogs(logs);
    } catch (err) {
      setAuditError(
        err instanceof Error ? err.message : "Unable to load activity.",
      );
    } finally {
      setAuditLoading(false);
    }
  }

  function updateField<K extends keyof EmployeeForm>(
    key: K,
    value: EmployeeForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  if (companyId === null) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Select a company to manage employees.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Employees</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage employee records for this company.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={!configurationReady}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[var(--brand-color)] px-3.5 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} />
          Add Employee
        </button>
      </div>

      {organizationConfigurationError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          Unable to load organization configuration:{" "}
          {organizationConfigurationError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, code, email or phone..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"
        >
          <option value="">All employment statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {prettyStatus(item)}
            </option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={(event) => {
            setActiveFilter(event.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"
        >
          <option value="">Active and inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <Users size={15} />
          {total} {total === 1 ? "employee" : "employees"} found
        </span>
      </div>

      {error && !showModal && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <Users size={19} />
            </div>
            <h3 className="mt-3 text-sm font-medium text-slate-900">
              {search ? "No matching employees" : "No employees yet"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {search
                ? "Try another search term or adjust your filters."
                : "Add your first employee to get started."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                disabled={!configurationReady}
                className="mt-3 text-xs font-medium text-[var(--brand-color)] hover:underline disabled:opacity-50"
              >
                Add employee
              </button>
            )}
          </div>
        ) : (
          <div className="max-h-[65dvh] overflow-auto">
            <table className="min-w-[900px] divide-y divide-slate-200">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr>
                  {[
                    "Employee",
                    "Code",
                    "Contact",
                    "Joining Date",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className={`transition-colors ${
                      employee.is_active
                        ? "hover:bg-slate-50/60"
                        : "bg-slate-50/70 hover:bg-slate-100/70"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">
                        {employeeName(employee)}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {employee.work_email ||
                          employee.personal_email ||
                          "No email"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {employee.employee_code}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {employee.phone || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {employee.joining_date || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="space-y-1">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {prettyStatus(employee.employment_status)}
                        </span>
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              employee.is_active
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {employee.is_active ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/employees/${employee.id}`)
                          }
                          className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--brand-color)] hover:bg-[var(--brand-color-soft)]"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(employee)}
                          disabled={!configurationReady}
                          title="Edit employee"
                          aria-label={`Edit ${employeeName(employee)}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:opacity-50"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusEmployee(employee)}
                          disabled={saving}
                          title={
                            employee.is_active
                              ? "Disable employee"
                              : "Enable employee"
                          }
                          aria-label={`${employee.is_active ? "Disable" : "Enable"} ${employeeName(employee)}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:opacity-50"
                        >
                          <Power size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleViewActivity(employee)}
                          title="View activity"
                          aria-label={`View activity for ${employeeName(employee)}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                        >
                          <Activity size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <label htmlFor="employee-page-size">Rows per page</label>
            <select
              id="employee-page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              {total === 0
                ? "0 results"
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="min-h-9 rounded-md border border-slate-200 px-3 text-xs text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {totalPages === 0 ? 0 : page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="min-h-9 rounded-md border border-slate-200 px-3 text-xs text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-5">
          <div className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingEmployee ? "Edit Employee" : "Add Employee"}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {editingEmployee
                  ? "Update the employee's basic information."
                  : "Enter the employee's basic information. The employee code can be generated automatically."}
              </p>
            </div>

            {organizationConfigurationLoading ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                Loading organization configuration...
              </div>
            ) : organizationConfigurationError ? (
              <div className="px-5 py-6">
                <p className="text-sm text-red-700">
                  {organizationConfigurationError}
                </p>
                <button
                  type="button"
                  onClick={() => setRefreshKey((current) => current + 1)}
                  className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-xs"
                >
                  Refresh employee list
                </button>
              </div>
            ) : organizationConfiguration ? (
              <form onSubmit={handleSave} noValidate>
                <div className="space-y-5 px-5 py-5">
                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {error}
                    </div>
                  )}
                  <div className="mb-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Step {activeFormStep + 1} of{" "}
                          {EMPLOYEE_FORM_STEPS.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {EMPLOYEE_FORM_STEPS[activeFormStep].description}
                        </p>
                      </div>

                      <span className="text-xs font-medium text-slate-500">
                        {Math.round(
                          ((activeFormStep + 1) / EMPLOYEE_FORM_STEPS.length) *
                            100,
                        )}
                        % complete
                      </span>
                    </div>

                    <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[var(--brand-color)] transition-all duration-300"
                        style={{
                          width: `${
                            ((activeFormStep + 1) /
                              EMPLOYEE_FORM_STEPS.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {EMPLOYEE_FORM_STEPS.map((step, index) => (
                        <button
                          key={step.title}
                          type="button"
                          onClick={() => {
                            if (index <= activeFormStep) {
                              setError(null);
                              setActiveFormStep(index);
                              return;
                            }

                            if (
                              index === activeFormStep + 1 &&
                              validateFormStep(activeFormStep)
                            ) {
                              setActiveFormStep(index);
                            }
                          }}
                          className={`rounded-lg border px-2 py-3 text-left transition ${
                            index === activeFormStep
                              ? "border-[var(--brand-color)] bg-[var(--brand-color-soft)]"
                              : index < activeFormStep
                                ? "border-slate-200 bg-slate-50"
                                : "border-slate-200 bg-white"
                          }`}
                        >
                          <span className="block text-[10px] text-slate-500">
                            STEP {index + 1}
                          </span>
                          <span className="mt-1 block text-xs font-medium text-slate-800">
                            {step.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {activeFormStep === 0 && (
                    <PersonalDetailsSection
                      form={form}
                      updateField={updateField}
                      editingEmployee={Boolean(editingEmployee)}
                    />
                  )}

                  {activeFormStep === 1 && (
                    <EmploymentDetailsSection
                      form={form}
                      updateField={updateField}
                      statuses={STATUSES}
                      prettyStatus={prettyStatus}
                    />
                  )}

                  {activeFormStep === 2 && (
                    <>
                      <JobDetailsSection
                        companyId={companyId}
                        form={form}
                        updateField={updateField}
                        departments={departments}
                        designations={designations}
                        teams={teams}
                        branches={branches}
                        sites={sites}
                        posts={posts}
                        employmentTypes={employmentTypes}
                        managers={managers}
                        loading={loading}
                        showDepartments={showDepartments}
                        showDesignations={showDesignations}
                        showTeams={showTeams}
                        showBranches={showBranches}
                        showSites={showSites}
                        showPosts={showPosts}
                      />

                      <section>
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Additional Details
                        </h4>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Height (cm)">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={form.height_cm}
                              onChange={(event) =>
                                updateField("height_cm", event.target.value)
                              }
                              className={inputClass}
                              placeholder="e.g. 175"
                            />
                          </Field>

                          <Field label="Weight (kg)">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={form.weight_kg}
                              onChange={(event) =>
                                updateField("weight_kg", event.target.value)
                              }
                              className={inputClass}
                              placeholder="e.g. 70"
                            />
                          </Field>
                        </div>
                      </section>

                      <section>
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Notes
                        </h4>

                        <textarea
                          rows={3}
                          value={form.notes}
                          onChange={(event) =>
                            updateField("notes", event.target.value)
                          }
                          className={`${inputClass} h-auto py-2`}
                          placeholder="Optional notes"
                        />
                      </section>

                      {customFieldsLoading && (
                        <p className="text-xs text-slate-500">
                          Loading custom employee fields...
                        </p>
                      )}

                      {customFieldDefinitions.length > 0 && (
                        <section>
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Custom Employee Fields
                          </h4>
                          <p className="text-xs text-slate-500">
                            Custom field values are not yet wired into the form.
                          </p>
                        </section>
                      )}
                    </>
                  )}
                </div>

                <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-5 py-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    disabled={saving || activeFormStep === 0}
                    className="h-9 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="h-9 rounded-md px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={saving}
                      hidden={activeFormStep >= EMPLOYEE_FORM_STEPS.length - 1}
                      className="h-9 rounded-md bg-[var(--brand-color)] px-4 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      Next
                    </button>

                    <button
                      type="submit"
                      disabled={saving || !configurationReady}
                      hidden={activeFormStep < EMPLOYEE_FORM_STEPS.length - 1}
                      className="h-9 rounded-md bg-[var(--brand-color)] px-4 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : editingEmployee
                          ? "Update Employee"
                          : "Create Employee"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                Organization configuration is unavailable.
              </div>
            )}
          </div>
        </div>
      )}

      <StatusConfirmModal
        open={statusEmployee !== null}
        entityName={statusEmployee ? employeeName(statusEmployee) : ""}
        entityType="Employee"
        isActive={statusEmployee?.is_active ?? false}
        loading={saving}
        onConfirm={() => void handleConfirmStatus()}
        onClose={() => {
          if (!saving) setStatusEmployee(null);
        }}
      />

      <AuditLogModal
        open={auditOpen}
        entityName={auditEntityName}
        logs={auditLogs}
        loading={auditLoading}
        error={auditError}
        onClose={() => {
          setAuditOpen(false);
          setAuditLogs([]);
          setAuditError(null);
          setAuditEntityName("");
        }}
      />
    </div>
  );
}

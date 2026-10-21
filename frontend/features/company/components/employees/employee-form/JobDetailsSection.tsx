"use client";

import { useCallback, useEffect, useState } from "react";
import type { EmployeeForm } from "./employeeForm.types";
import { EmployeeFormField as Field } from "./EmployeeFormField";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "./SearchableSelect";

import {
  getOfficeLocation,
  getOfficeLocations,
} from "@/features/company/services/officeLocationService";
import {
  getDepartment,
  getDepartments,
} from "@/features/company/services/departmentService";
import {
  getDesignation,
  getDesignations,
} from "@/features/company/services/designationService";
import { getTeam, getTeams } from "@/features/company/services/teamService";
import {
  getBranch,
  getBranches,
} from "@/features/company/services/branchService";
import { getSite, getSites } from "@/features/company/services/siteService";
import { getPost, getPosts } from "@/features/company/services/postService";
import { getEmploymentTypes } from "@/features/company/services/employmentService";
import {
  getEmployee,
  getEmployees,
} from "@/features/company/services/employeeService";

export type AssignmentOption = {
  id: number;
  name: string;
};

type SearchResult = {
  options: SearchableSelectOption[];
  hasMore: boolean;
};

type Props = {
  companyId: number;
  form: EmployeeForm;
  updateField: <K extends keyof EmployeeForm>(
    key: K,
    value: EmployeeForm[K],
  ) => void;
  departments: AssignmentOption[];
  designations: AssignmentOption[];
  teams: AssignmentOption[];
  branches: AssignmentOption[];
  sites: AssignmentOption[];
  posts: AssignmentOption[];
  employmentTypes: AssignmentOption[];
  managers: AssignmentOption[];
  loading: boolean;

  // Organization configuration
  showDepartments: boolean;
  showDesignations: boolean;
  showTeams: boolean;
  showBranches: boolean;
  showSites: boolean;
  showPosts: boolean;
};

const PAGE_SIZE = 10;

export default function JobDetailsSection({
  companyId,
  form,
  updateField,
  departments,
  designations,
  teams,
  branches,
  sites,
  posts,
  employmentTypes,
  managers,
  loading,
  showDepartments,
  showDesignations,
  showTeams,
  showBranches,
  showSites,
  showPosts,
}: Props) {
  const [selectedDepartment, setSelectedDepartment] =
    useState<SearchableSelectOption | null>(null);
  const [selectedDesignation, setSelectedDesignation] =
    useState<SearchableSelectOption | null>(null);
  const [selectedTeam, setSelectedTeam] =
    useState<SearchableSelectOption | null>(null);
  const [selectedBranch, setSelectedBranch] =
    useState<SearchableSelectOption | null>(null);
  const [selectedSite, setSelectedSite] =
    useState<SearchableSelectOption | null>(null);
  const [selectedPost, setSelectedPost] =
    useState<SearchableSelectOption | null>(null);
  const [selectedOfficeLocation, setSelectedOfficeLocation] =
    useState<SearchableSelectOption | null>(null);
  const [selectedManager, setSelectedManager] =
    useState<SearchableSelectOption | null>(null);

  // Resolve saved IDs to their labels, even when the records
  // aren't present on the first page of the dropdown results.
  useEffect(() => {
    let cancelled = false;

    const loadOption = async (
      id: string,
      fetchOption: (id: number) => Promise<{ id: number; name: string }>,
      setOption: (option: SearchableSelectOption | null) => void,
    ): Promise<void> => {
      if (!id) {
        setOption(null);
        return;
      }

      try {
        const item = await fetchOption(Number(id));

        if (!cancelled) {
          setOption({
            id: item.id,
            name: item.name,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error(`Failed to load selected option ${id}:`, error);
          setOption(null);
        }
      }
    };

    const loadManager = async (): Promise<void> => {
      if (!form.manager_id) {
        setSelectedManager(null);
        return;
      }

      try {
        const employee = await getEmployee(companyId, Number(form.manager_id));

        if (!cancelled) {
          setSelectedManager({
            id: employee.id,
            name:
              `${employee.first_name ?? ""} ${
                employee.last_name ?? ""
              }`.trim() ||
              employee.display_name ||
              `Employee ${employee.id}`,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load reporting manager:", error);
          setSelectedManager(null);
        }
      }
    };

    const loadSelectedOptions = async (): Promise<void> => {
      await Promise.all([
        loadOption(
          form.department_id,
          (id) => getDepartment(companyId, id),
          setSelectedDepartment,
        ),
        loadOption(
          form.designation_id,
          (id) => getDesignation(companyId, id),
          setSelectedDesignation,
        ),
        loadOption(
          form.team_id,
          (id) => getTeam(companyId, id),
          setSelectedTeam,
        ),
        loadOption(
          form.branch_id,
          (id) => getBranch(companyId, id),
          setSelectedBranch,
        ),
        loadOption(
          form.site_id,
          (id) => getSite(companyId, id),
          setSelectedSite,
        ),
        loadOption(
          form.post_id,
          (id) => getPost(companyId, id),
          setSelectedPost,
        ),
        form.branch_id && form.office_location_id
          ? loadOption(
              form.office_location_id,
              (id) => getOfficeLocation(companyId, Number(form.branch_id), id),
              setSelectedOfficeLocation,
            )
          : Promise.resolve(),
        loadManager(),
      ]);
    };

    void loadSelectedOptions();

    return () => {
      cancelled = true;
    };
  }, [
    companyId,
    form.department_id,
    form.designation_id,
    form.team_id,
    form.branch_id,
    form.site_id,
    form.post_id,
    form.office_location_id,
    form.manager_id,
  ]);

  const searchDepartments = useCallback(
    async (query: string, page: number): Promise<SearchResult> => {
      const result = await getDepartments(companyId, {
        page,
        page_size: PAGE_SIZE,
        search: query,
      });

      return {
        options: result.departments.map((item) => ({
          id: item.id,
          name: item.name,
        })),
        hasMore: result.page < result.total_pages,
      };
    },
    [companyId],
  );

  const searchDesignations = useCallback(
    async (query: string, page: number): Promise<SearchResult> => {
      const result = await getDesignations(companyId, {
        page,
        page_size: PAGE_SIZE,
        search: query,
      });

      return {
        options: result.designations.map((item) => ({
          id: item.id,
          name: item.name,
        })),
        hasMore: result.page < result.total_pages,
      };
    },
    [companyId],
  );

  const searchTeams = useCallback(
    async (query: string, page: number): Promise<SearchResult> => {
      if (!form.department_id) {
        return { options: [], hasMore: false };
      }

      const result = await getTeams(companyId, {
        page,
        page_size: PAGE_SIZE,
        department_id: Number(form.department_id),
        search: query,
      });

      return {
        options: result.teams.map((item) => ({
          id: item.id,
          name: item.name,
        })),
        hasMore: result.page < result.total_pages,
      };
    },
    [companyId, form.department_id],
  );

  const searchBranches = useCallback(
    async (query: string, page: number): Promise<SearchResult> => {
      const result = await getBranches(companyId, {
        page,
        page_size: PAGE_SIZE,
        search: query,
      });

      return {
        options: result.branches.map((item) => ({
          id: item.id,
          name: item.name,
        })),
        hasMore: result.page < result.total_pages,
      };
    },
    [companyId],
  );

  const searchOfficeLocations = useCallback(
    async (query: string, page: number): Promise<SearchResult> => {
      if (!form.branch_id) {
        return { options: [], hasMore: false };
      }

      const result = await getOfficeLocations(
        companyId,
        Number(form.branch_id),
        {
          page,
          page_size: PAGE_SIZE,
          search: query,
        },
      );

      return {
        options: result.locations.map((location) => ({
          id: location.id,
          name: location.name,
        })),
        hasMore: result.page < result.total_pages,
      };
    },
    [companyId, form.branch_id],
  );

  const searchSites = useCallback(
    async (query: string, page: number): Promise<SearchResult> => {
      const result = await getSites(companyId, {
        page,
        page_size: PAGE_SIZE,
        search: query,
      });

      return {
        options: result.sites.map((item) => ({
          id: item.id,
          name: item.name,
        })),
        hasMore: result.page < result.total_pages,
      };
    },
    [companyId],
  );

  const searchPosts = useCallback(
    async (query: string, page: number): Promise<SearchResult> => {
      if (!form.site_id) {
        return { options: [], hasMore: false };
      }

      const result = await getPosts(companyId, {
        page,
        page_size: PAGE_SIZE,
        search: query,
        site_id: Number(form.site_id),
      });

      return {
        options: result.posts.map((item) => ({
          id: item.id,
          name: item.name,
        })),
        hasMore: result.page < result.total_pages,
      };
    },
    [companyId, form.site_id],
  );

  const searchEmploymentTypes = useCallback(
    async (query: string, page: number): Promise<SearchResult> => {
      if (page > 1) {
        return { options: [], hasMore: false };
      }

      const result = await getEmploymentTypes(companyId);
      const normalizedQuery = query.trim().toLowerCase();

      const filtered = result.filter((item) =>
        item.name.toLowerCase().includes(normalizedQuery),
      );

      return {
        options: filtered.map((item) => ({
          id: item.id,
          name: item.name,
        })),
        hasMore: false,
      };
    },
    [companyId],
  );

  const searchManagers = useCallback(
    async (query: string, page: number): Promise<SearchResult> => {
      const result = await getEmployees(companyId, {
        page,
        page_size: PAGE_SIZE,
        search: query,
        is_active: true,
      });

      return {
        options: result.employees.map((item) => ({
          id: item.id,
          name:
            `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() ||
            item.display_name ||
            `Employee ${item.id}`,
        })),
        hasMore: result.page < result.total_pages,
      };
    },
    [companyId],
  );

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Job Assignments
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure the employee&apos;s organization, work location, employment
          type, and reporting manager.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {showDepartments && (
          <Field label="Department">
            <SearchableSelect
              key={`department-${companyId}`}
              searchOptions={searchDepartments}
              value={form.department_id}
              selectedOption={
                departments.find(
                  (item) => String(item.id) === form.department_id,
                ) ??
                (selectedDepartment &&
                String(selectedDepartment.id) === form.department_id
                  ? selectedDepartment
                  : null)
              }
              onChange={(value) => {
                updateField("department_id", value);
                updateField("team_id", "");
              }}
              placeholder="Select department"
              searchPlaceholder="Search departments..."
              disabled={loading}
            />
          </Field>
        )}

        {showDesignations && (
          <Field label="Designation">
            <SearchableSelect
              key={`designation-${companyId}`}
              searchOptions={searchDesignations}
              value={form.designation_id}
              selectedOption={
                designations.find(
                  (item) => String(item.id) === form.designation_id,
                ) ??
                (selectedDesignation &&
                String(selectedDesignation.id) === form.designation_id
                  ? selectedDesignation
                  : null)
              }
              onChange={(value) => updateField("designation_id", value)}
              placeholder="Select designation"
              searchPlaceholder="Search designations..."
              disabled={loading}
            />
          </Field>
        )}

        {showTeams && (
          <Field label="Team">
            <SearchableSelect
              key={`team-${companyId}-${form.department_id}`}
              searchOptions={searchTeams}
              value={form.team_id}
              selectedOption={
                teams.find((item) => String(item.id) === form.team_id) ??
                (selectedTeam && String(selectedTeam.id) === form.team_id
                  ? selectedTeam
                  : null)
              }
              onChange={(value) => updateField("team_id", value)}
              placeholder="Select team"
              searchPlaceholder="Search teams..."
              disabled={loading || !showDepartments || !form.department_id}
            />
          </Field>
        )}

        {showBranches && (
          <Field label="Branch">
            <SearchableSelect
              key={`branch-${companyId}`}
              searchOptions={searchBranches}
              value={form.branch_id}
              selectedOption={
                branches.find((item) => String(item.id) === form.branch_id) ??
                (selectedBranch && String(selectedBranch.id) === form.branch_id
                  ? selectedBranch
                  : null)
              }
              onChange={(value) => {
                updateField("branch_id", value);
                updateField("office_location_id", "");
              }}
              placeholder="Select branch"
              searchPlaceholder="Search branches..."
              disabled={loading}
            />
          </Field>
        )}

        {showBranches && (
          <Field label="Office Location">
            <SearchableSelect
              key={`office-location-${companyId}-${form.branch_id}`}
              searchOptions={searchOfficeLocations}
              value={form.office_location_id}
              selectedOption={
                selectedOfficeLocation &&
                String(selectedOfficeLocation.id) === form.office_location_id
                  ? selectedOfficeLocation
                  : null
              }
              onChange={(value) => updateField("office_location_id", value)}
              placeholder={
                form.branch_id
                  ? "Select office location"
                  : "Select branch first"
              }
              searchPlaceholder="Search office locations..."
              disabled={loading || !form.branch_id}
            />
          </Field>
        )}

        {showSites && (
          <Field label="Site">
            <SearchableSelect
              key={`site-${companyId}`}
              searchOptions={searchSites}
              value={form.site_id}
              selectedOption={
                sites.find((item) => String(item.id) === form.site_id) ??
                (selectedSite && String(selectedSite.id) === form.site_id
                  ? selectedSite
                  : null)
              }
              onChange={(value) => {
                updateField("site_id", value);
                updateField("post_id", "");
              }}
              placeholder="Select site"
              searchPlaceholder="Search sites..."
              disabled={loading}
            />
          </Field>
        )}

        {showPosts && (
          <Field label="Post">
            <SearchableSelect
              key={`post-${companyId}-${form.site_id}`}
              searchOptions={searchPosts}
              value={form.post_id}
              selectedOption={
                posts.find((item) => String(item.id) === form.post_id) ??
                (selectedPost && String(selectedPost.id) === form.post_id
                  ? selectedPost
                  : null)
              }
              onChange={(value) => updateField("post_id", value)}
              placeholder="Select post"
              searchPlaceholder="Search posts..."
              disabled={loading || !showSites || !form.site_id}
            />
          </Field>
        )}

        <Field label="Employment Type">
          <SearchableSelect
            key={`employment-type-${companyId}`}
            searchOptions={searchEmploymentTypes}
            value={form.employment_type_id}
            selectedOption={
              employmentTypes.find(
                (item) => String(item.id) === form.employment_type_id,
              ) ?? null
            }
            onChange={(value) => updateField("employment_type_id", value)}
            placeholder="Select employment type"
            searchPlaceholder="Search employment types..."
            disabled={loading}
          />
        </Field>

        <Field label="Reporting Manager">
          <SearchableSelect
            key={`manager-${companyId}`}
            searchOptions={searchManagers}
            value={form.manager_id}
            selectedOption={
              managers.find((item) => String(item.id) === form.manager_id) ??
              (selectedManager && String(selectedManager.id) === form.manager_id
                ? selectedManager
                : null)
            }
            onChange={(value) => updateField("manager_id", value)}
            placeholder="Select reporting manager"
            searchPlaceholder="Search employees..."
            disabled={loading}
          />
        </Field>
      </div>
    </section>
  );
}

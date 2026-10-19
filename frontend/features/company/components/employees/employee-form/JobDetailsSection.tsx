"use client";

import { useCallback } from "react";
import type { EmployeeForm } from "./employeeForm.types";
import { EmployeeFormField as Field } from "./EmployeeFormField";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "./SearchableSelect";

import { getDepartments } from "@/features/company/services/departmentService";
import { getDesignations } from "@/features/company/services/designationService";
import { getTeams } from "@/features/company/services/teamService";
import { getBranches } from "@/features/company/services/branchService";
import { getSites } from "@/features/company/services/siteService";
import { getPosts } from "@/features/company/services/postService";
import { getEmploymentTypes } from "@/features/company/services/employmentService";
import { getEmployees } from "@/features/company/services/employeeService";

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
      // The current service returns an array rather than a paginated result.
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
              selectedOption={departments.find(
                (item) => String(item.id) === form.department_id,
              )}
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
              selectedOption={designations.find(
                (item) => String(item.id) === form.designation_id,
              )}
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
              selectedOption={teams.find(
                (item) => String(item.id) === form.team_id,
              )}
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
              selectedOption={branches.find(
                (item) => String(item.id) === form.branch_id,
              )}
              onChange={(value) => updateField("branch_id", value)}
              placeholder="Select branch"
              searchPlaceholder="Search branches..."
              disabled={loading}
            />
          </Field>
        )}

        {showSites && (
          <Field label="Site">
            <SearchableSelect
              key={`site-${companyId}`}
              searchOptions={searchSites}
              value={form.site_id}
              selectedOption={sites.find(
                (item) => String(item.id) === form.site_id,
              )}
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
              selectedOption={posts.find(
                (item) => String(item.id) === form.post_id,
              )}
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
            selectedOption={employmentTypes.find(
              (item) => String(item.id) === form.employment_type_id,
            )}
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
            selectedOption={managers.find(
              (item) => String(item.id) === form.manager_id,
            )}
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

"use client";

import type { EmployeeForm } from "./employeeForm.types";
import { EmployeeFormField as Field } from "./EmployeeFormField";
import { SearchableSelect } from "./SearchableSelect";
export type AssignmentOption = {
  id: number;
  name: string;
};

type Props = {
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
};

export default function JobDetailsSection({
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
}: Props) {
  const selectClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100";

  function renderOptions(options: AssignmentOption[]) {
    return options.map((option) => (
      <option key={option.id} value={option.id}>
        {option.name}
      </option>
    ));
  }

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
        <Field label="Department">
          <SearchableSelect
            options={departments}
            value={form.department_id}
            onChange={(value) => {
              updateField("department_id", value);
              updateField("team_id", "");
            }}
            placeholder="Select department"
            searchPlaceholder="Search departments..."
          />
        </Field>

        <Field label="Designation">
          <SearchableSelect
options={designations}
value={form.designation_id}
onChange={(value) => updateField("designation_id", value)}
placeholder="Select designation"
searchPlaceholder="Search designations..."
/>
        </Field>

        <Field label="Team">
         <SearchableSelect
options={filteredTeams}
value={form.team_id}
onChange={(value) => updateField("team_id", value)}
placeholder="Select team"
searchPlaceholder="Search teams..."
disabled={!form.department_id}
/>
        </Field>

        <Field label="Branch">
          <SearchableSelect
options={branches}
value={form.branch_id}
onChange={(value) => updateField("branch_id", value)}
placeholder="Select branch"
searchPlaceholder="Search branches..."
/>
        </Field>

        <Field label="Site">
         <SearchableSelect
options={sites}
value={form.site_id}
onChange={(value) => {
updateField("site_id", value);
updateField("post_id", "");
}}
placeholder="Select site"
searchPlaceholder="Search sites..."
/>
        </Field>

        <Field label="Post">
          <SearchableSelect
options={filteredPosts}
value={form.post_id}
onChange={(value) => updateField("post_id", value)}
placeholder="Select post"
searchPlaceholder="Search posts..."
disabled={!form.site_id}
/>
        </Field>

        <Field label="Employment Type">
          <select
            className={selectClass}
            value={form.employment_type_id}
            disabled={loading}
            onChange={(e) => updateField("employment_type_id", e.target.value)}
          >
            <option value="">Select employment type</option>
            {renderOptions(employmentTypes)}
          </select>
        </Field>

        <Field label="Reporting Manager">
          <SearchableSelect
options={managers}
value={form.manager_id}
onChange={(value) => updateField("manager_id", value)}
placeholder="Select reporting manager"
searchPlaceholder="Search employees..."
/>
        </Field>
      </div>
    </section>
  );
}

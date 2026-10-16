
import { EmployeeFormField as Field, inputClass } from "./EmployeeFormField";

type EmploymentDetails = {
  joining_date: string;
  probation_end_date: string;
  confirmation_date: string;
  employment_end_date: string;
  employment_status: string;
  is_active: boolean;
};

type EmploymentDetailsSectionProps = {
  form: EmploymentDetails;
  updateField: (
    key: keyof EmploymentDetails,
    value: string | boolean,
  ) => void;
  statuses: string[];
  prettyStatus: (value: string) => string;
};

export default function EmploymentDetailsSection({
  form,
  updateField,
  statuses,
  prettyStatus,
}: EmploymentDetailsSectionProps) {
  return (
    <>
      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Employment Information
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Joining Date">
            <input
              type="date"
              value={form.joining_date}
              onChange={(e) => updateField("joining_date", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Employment Status">
            <select
              required
              value={form.employment_status}
              onChange={(e) =>
                updateField("employment_status", e.target.value)
              }
              className={inputClass}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {prettyStatus(status)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Record Status">
            <select
              value={String(form.is_active)}
              onChange={(e) =>
                updateField("is_active", e.target.value === "true")
              }
              className={inputClass}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </Field>
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Employment Timeline
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Probation End Date">
            <input
              type="date"
              value={form.probation_end_date}
              onChange={(e) =>
                updateField("probation_end_date", e.target.value)
              }
              className={inputClass}
            />
          </Field>

          <Field label="Confirmation Date">
            <input
              type="date"
              value={form.confirmation_date}
              onChange={(e) =>
                updateField("confirmation_date", e.target.value)
              }
              className={inputClass}
            />
          </Field>

          <Field label="Employment End Date">
            <input
              type="date"
              value={form.employment_end_date}
              onChange={(e) =>
                updateField("employment_end_date", e.target.value)
              }
              className={inputClass}
            />
          </Field>
        </div>
      </section>
    </>
  );
}

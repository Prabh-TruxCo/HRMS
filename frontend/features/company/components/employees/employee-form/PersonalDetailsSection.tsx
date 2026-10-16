
import { EmployeeFormField as Field, inputClass } from "./EmployeeFormField";

type PersonalDetails = {
  first_name: string;
  middle_name: string;
  last_name: string;
  display_name: string;
  employee_code: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  alternate_phone: string;
  personal_email: string;
  work_email: string;
};

type PersonalDetailsSectionProps = {
  form: PersonalDetails;
  updateField: <K extends keyof PersonalDetails>(
    key: K,
    value: PersonalDetails[K],
  ) => void;
  editingEmployee: boolean;
};

export default function PersonalDetailsSection({
  form,
  updateField,
  editingEmployee,
}: PersonalDetailsSectionProps) {
  return (
    <section>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Personal Information
      </h4>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="First Name *">
          <input
            required
            maxLength={100}
            value={form.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
            className={inputClass}
            placeholder="First name"
          />
        </Field>

        <Field label="Middle Name">
          <input
            value={form.middle_name}
            onChange={(e) => updateField("middle_name", e.target.value)}
            className={inputClass}
            placeholder="Middle name"
          />
        </Field>

        <Field label="Last Name">
          <input
            value={form.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
            className={inputClass}
            placeholder="Last name"
          />
        </Field>

        <Field label="Display Name">
          <input
            value={form.display_name}
            onChange={(e) => updateField("display_name", e.target.value)}
            className={inputClass}
            placeholder="Preferred display name"
          />
        </Field>

        <Field label="Employee Code">
          <input
            value={form.employee_code}
            disabled={editingEmployee}
            onChange={(e) => updateField("employee_code", e.target.value)}
            className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
            placeholder={editingEmployee ? "" : "Auto-generated if blank"}
          />
        </Field>

        <Field label="Date of Birth">
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => updateField("date_of_birth", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Gender">
          <select
            value={form.gender}
            onChange={(e) => updateField("gender", e.target.value)}
            className={inputClass}
          >
            <option value="">Not specified</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </Field>

        <Field label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={inputClass}
            placeholder="Phone number"
          />
        </Field>

        <Field label="Alternate Phone">
          <input
            type="tel"
            value={form.alternate_phone}
            onChange={(e) => updateField("alternate_phone", e.target.value)}
            className={inputClass}
            placeholder="Alternate phone number"
          />
        </Field>

        <Field label="Personal Email">
          <input
            type="email"
            value={form.personal_email}
            onChange={(e) => updateField("personal_email", e.target.value)}
            className={inputClass}
            placeholder="name@example.com"
          />
        </Field>

        <Field label="Work Email">
          <input
            type="email"
            value={form.work_email}
            onChange={(e) => updateField("work_email", e.target.value)}
            className={inputClass}
            placeholder="name@company.com"
          />
        </Field>
      </div>
    </section>
  );
}

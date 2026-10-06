const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type AttendanceMethod = "web" | "mobile" | "face" | "device";

export type WorkforceConfiguration = {
  company_id: number;
  setup_mode: "recommended" | "custom";

  attendance_enabled: boolean;
  attendance_methods: AttendanceMethod[];
  late_marking_enabled: boolean;
  grace_period_minutes: number;
  early_checkout_enabled: boolean;
  auto_markout_enabled: boolean;
  attendance_regularization_enabled: boolean;
  attendance_approval_required: boolean;

  shifts_enabled: boolean;

  overtime_enabled: boolean;
  overtime_approval_required: boolean;

  remote_work_enabled: boolean;
  field_work_enabled: boolean;
  gps_attendance_enabled: boolean;
  geofencing_enabled: boolean;
};

export type WorkforceConfigurationUpdate = {
  setup_mode: "recommended" | "custom";

  attendance_enabled: boolean;
  attendance_methods: AttendanceMethod[];
  late_marking_enabled: boolean;
  grace_period_minutes: number;
  early_checkout_enabled: boolean;
  auto_markout_enabled: boolean;
  attendance_regularization_enabled: boolean;
  attendance_approval_required: boolean;

  shifts_enabled: boolean;

  overtime_enabled: boolean;
  overtime_approval_required: boolean;

  remote_work_enabled: boolean;
  field_work_enabled: boolean;
  gps_attendance_enabled: boolean;
  geofencing_enabled: boolean;
};

export type WorkforceRecommendation = {
  industry_type: string | null;
  setup_mode: "recommended" | "custom";

  attendance_enabled: boolean;
  attendance_methods: AttendanceMethod[];
  late_marking_enabled: boolean;
  grace_period_minutes: number;
  early_checkout_enabled: boolean;
  auto_markout_enabled: boolean;
  attendance_regularization_enabled: boolean;
  attendance_approval_required: boolean;

  shifts_enabled: boolean;

  overtime_enabled: boolean;
  overtime_approval_required: boolean;

  remote_work_enabled: boolean;
  field_work_enabled: boolean;
  gps_attendance_enabled: boolean;
  geofencing_enabled: boolean;

  recommended_employment_types: string[];
};

async function parseResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  let result: unknown = null;

  try {
    result = await response.json();
  } catch {
    // Keep fallback message if response has no JSON body.
  }

  if (!response.ok) {
    const detail =
      typeof result === "object" &&
      result !== null &&
      "detail" in result &&
      typeof result.detail === "string"
        ? result.detail
        : fallbackMessage;

    throw new Error(detail);
  }

  return result as T;
}

/**
 * Returns null when the company has not saved
 * Workforce configuration yet.
 *
 * This is expected for a newly created company.
 */
export async function getWorkforceConfiguration(
  companyId: number,
): Promise<WorkforceConfiguration | null> {
  const response = await fetch(`${API_URL}/companies/${companyId}/workforce`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 404) {
    return null;
  }

  return parseResponse<WorkforceConfiguration>(
    response,
    "Unable to load workforce configuration.",
  );
}

export async function getWorkforceRecommendation(
  companyId: number,
): Promise<WorkforceRecommendation> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/workforce/recommendation`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return parseResponse<WorkforceRecommendation>(
    response,
    "Unable to load workforce recommendation.",
  );
}

export async function updateWorkforceConfiguration(
  companyId: number,
  data: WorkforceConfigurationUpdate,
): Promise<WorkforceConfiguration> {
  const response = await fetch(`${API_URL}/companies/${companyId}/workforce`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseResponse<WorkforceConfiguration>(
    response,
    "Unable to save workforce configuration.",
  );
}

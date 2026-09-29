const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type WorkforceConfiguration = {
  company_id: number;
  attendance_mode: string;
  shifts_enabled: boolean;
  overtime_enabled: boolean;
  late_marking_enabled: boolean;
  grace_period_minutes: number;
};

export type WorkforceConfigurationUpdate = {
  attendance_mode: string;
  shifts_enabled: boolean;
  overtime_enabled: boolean;
  late_marking_enabled: boolean;
  grace_period_minutes: number;
};

export async function getWorkforceConfiguration(
  companyId: number,
): Promise<WorkforceConfiguration> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/workforce`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Unable to load workforce configuration.",
    );
  }

  return result;
}

export async function updateWorkforceConfiguration(
  companyId: number,
  data: WorkforceConfigurationUpdate,
): Promise<WorkforceConfiguration> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/workforce`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Unable to save workforce configuration.",
    );
  }

  return result;
}
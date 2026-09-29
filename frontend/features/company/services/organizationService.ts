const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type OrganizationConfiguration = {
  company_id: number;
  branches_enabled: boolean;
  departments_enabled: boolean;
  teams_enabled: boolean;
  designations_enabled: boolean;
  clients_enabled: boolean;
  sites_enabled: boolean;
  posts_enabled: boolean;
};

export type OrganizationConfigurationUpdate = {
  branches_enabled: boolean;
  departments_enabled: boolean;
  teams_enabled: boolean;
  designations_enabled: boolean;
  clients_enabled: boolean;
  sites_enabled: boolean;
  posts_enabled: boolean;
};

export async function getOrganizationConfiguration(
  companyId: number,
): Promise<OrganizationConfiguration> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/organization`,
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
        : "Unable to load organization configuration.",
    );
  }

  return result;
}

export async function updateOrganizationConfiguration(
  companyId: number,
  data: OrganizationConfigurationUpdate,
): Promise<OrganizationConfiguration> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/organization`,
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
        : "Unable to save organization configuration.",
    );
  }

  return result;
}

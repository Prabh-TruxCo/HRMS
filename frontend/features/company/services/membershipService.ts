export type CompanyRoleResponse = {
  company_id: number;
  role_names: string[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getCompanyRoles(
  companyId: number,
): Promise<CompanyRoleResponse> {
  const response = await fetch(
    `${API_URL}/membership/company/${companyId}/roles`,
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
        : "Unable to load company roles.",
    );
  }

  return result;
}
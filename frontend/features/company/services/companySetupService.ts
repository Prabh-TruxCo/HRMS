const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export type CompanySetupStatus = {
  profile: boolean;
  branding: boolean;
  organization: boolean;
  workforce: boolean;
  completed_sections: number;
  total_sections: number;
  percentage: number;
};

export async function getCompanySetupStatus(
  companyId: number,
): Promise<CompanySetupStatus> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/setup-status`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to load company setup status.");
  }

  return response.json();
}
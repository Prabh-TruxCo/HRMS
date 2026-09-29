const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export async function uploadCompanyLogo(
  companyId: number,
  logo: File,
) {
  const formData = new FormData();

  formData.append("file", logo);

  const response = await fetch(
    `${API_URL}/companies/${companyId}/logo`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Unable to upload company logo.",
    );
  }

  return result;
}
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type Industry = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export async function getIndustries(): Promise<Industry[]> {
  const response = await fetch(`${API_URL}/industries`, {
    method: "GET",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Unable to load industries.",
    );
  }

  return result;
}
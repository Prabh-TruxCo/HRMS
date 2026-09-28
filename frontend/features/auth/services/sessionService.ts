export type CurrentUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string | null;
  is_platform_admin: boolean;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";


export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Not authenticated.");
  }

  return response.json();
}
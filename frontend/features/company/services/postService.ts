const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type Post = {
  id: number;
  company_id: number;
  site_id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PostListResponse = {
  posts: Post[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type PostListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  site_id?: number;
};

export type PostPayload = {
  site_id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
};

async function handleResponse<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item: { msg?: string }) => item.msg ?? "")
          .filter(Boolean)
          .join(", ");
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getPosts(
  companyId: number,
  params: PostListParams = {},
): Promise<PostListResponse> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.page_size ?? 20),
  });

  const search = params.search?.trim();

  if (search) {
    query.set("search", search);
  }

  if (params.site_id !== undefined) {
    query.set("site_id", String(params.site_id));
  }

  const response = await fetch(
    `${API_URL}/companies/${companyId}/posts?${query.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<PostListResponse>(response);
}

export async function getPost(
  companyId: number,
  postId: number,
): Promise<Post> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/posts/${postId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<Post>(response);
}

export async function createPost(
  companyId: number,
  payload: PostPayload,
): Promise<Post> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/posts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Post>(response);
}

export async function updatePost(
  companyId: number,
  postId: number,
  payload: PostPayload,
): Promise<Post> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/posts/${postId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Post>(response);
}

export async function updatePostStatus(
  companyId: number,
  postId: number,
  isActive: boolean,
): Promise<Post> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/posts/${postId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ is_active: isActive }),
    },
  );

  return handleResponse<Post>(response);
}
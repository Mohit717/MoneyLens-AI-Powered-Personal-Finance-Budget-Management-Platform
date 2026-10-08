export interface ApiCallOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string | null;
}

export interface DefaultApiResponseData {
  [key: string]: unknown;
  data?: {
    [key: string]: unknown;
    user?: { name?: string; email?: string };
    accessToken?: string;
    refreshToken?: string;
  };
  user?: { name?: string; email?: string };
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

export interface ApiResponse<T = DefaultApiResponseData> {
  ok: boolean;
  status: number;
  data: T | null;
  message?: string;
}

const getBackendUrl = () => process.env.BACKEND_URL || "http://localhost:5000/api/v1";

/**
 * Reusable server-side API call utility
 */
export async function apiCall<T = DefaultApiResponseData>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<ApiResponse<T>> {
  const { body, headers, token, ...restOptions } = options;
  const baseUrl = getBackendUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };

  try {
    const formattedBody =
      body !== undefined && body !== null
        ? typeof body === "string" || body instanceof FormData
          ? body
          : JSON.stringify(body)
        : undefined;

    const res = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
      body: formattedBody,
      cache: "no-store",
    });

    const data = (await res.json().catch(() => null)) as T | null;

    return {
      ok: res.ok,
      status: res.status,
      data,
      message: (data as { message?: string } | null)?.message,
    };
  } catch (error: unknown) {
    console.warn(`apiCall error [${endpoint}]:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Network error or server unavailable.";
    return {
      ok: false,
      status: 500,
      data: null,
      message: errorMessage,
    };
  }
}

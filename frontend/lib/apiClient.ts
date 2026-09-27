export interface ApiCallOptions extends Omit<RequestInit, "body"> {
  body?: Record<string, unknown> | BodyInit | null;
}

export interface ApiResponse<T = Record<string, any>> {
  ok: boolean;
  status: number;
  data: T | null;
  message?: string;
}

const getBackendUrl = () => process.env.BACKEND_URL || "http://localhost:5000";

/**
 * Reusable server-side API call utility
 */
export async function apiCall<T = Record<string, any>>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<ApiResponse<T>> {
  const { body, headers, ...restOptions } = options;
  const url = `${getBackendUrl()}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
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
    });

    const data = (await res.json().catch(() => null)) as T | null;

    return {
      ok: res.ok,
      status: res.status,
      data,
      message: (data as Record<string, any> | null)?.message,
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

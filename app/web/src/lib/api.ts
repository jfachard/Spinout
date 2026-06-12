const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type NestErrorBody = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

function extractMessage(body: NestErrorBody, fallback: string): string {
  if (!body) return fallback;
  if (Array.isArray(body.message)) return body.message.join(", ");
  if (typeof body.message === "string") return body.message;
  if (typeof body.error === "string") return body.error;
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Please try again.");
  }

  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      extractMessage(body, `Error ${res.status}`),
    );
  }

  return body as T;
}

import type { AxiosError } from "axios";

/**
 * Extract error message(s) from the API's error response format.
 */
export function extractErrorMessages(
  err: unknown
): { general: string; fields: string[] } {
  const axiosErr = err as AxiosError<{
    success: false;
    error: { message: string | string[]; statusCode: number };
  }>;

  const msg = axiosErr?.response?.data?.error?.message;

  if (Array.isArray(msg)) {
    return { general: "", fields: msg };
  }

  return { general: typeof msg === "string" ? msg : "Something went wrong", fields: [] };
}

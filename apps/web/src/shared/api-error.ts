export function parseApiErrorMessage(error: unknown, fallback = "Request failed."): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeResponse = (error as { response?: { data?: unknown } }).response;
    const data = maybeResponse?.data as
      | { message?: string | string[]; error?: { message?: string | string[] } }
      | undefined;

    if (Array.isArray(data?.message)) {
      return data.message.join(", ");
    }
    if (typeof data?.message === "string" && data.message.length > 0) {
      return data.message;
    }
    if (Array.isArray(data?.error?.message)) {
      return data.error.message.join(", ");
    }
    if (typeof data?.error?.message === "string" && data.error.message.length > 0) {
      return data.error.message;
    }
  }

  return fallback;
}

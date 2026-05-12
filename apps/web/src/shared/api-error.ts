export function parseApiErrorMessage(error: unknown, fallback = "Request failed."): string {
  const defaultFallback = "Request failed.";
  const effectiveFallback = fallback === defaultFallback ? "" : fallback;

  if (typeof error !== "object" || error === null) {
    return effectiveFallback || "Не удалось выполнить запрос.";
  }

  const withAxiosShape = error as {
    response?: { status?: number; data?: unknown };
    code?: string;
    message?: string;
  };

  if (!withAxiosShape.response) {
    if (withAxiosShape.code === "ERR_NETWORK") {
      return "Сервер недоступен. Проверьте, что backend запущен.";
    }
    if (typeof withAxiosShape.message === "string" && withAxiosShape.message.length > 0) {
      if (withAxiosShape.message.toLowerCase().includes("network")) {
        return "Сервер недоступен. Проверьте, что backend запущен.";
      }
    }
    return effectiveFallback || "Не удалось выполнить запрос.";
  }

  const status = withAxiosShape.response.status;
  const data = withAxiosShape.response.data as
    | { message?: string | string[]; error?: { message?: string | string[] } }
    | undefined;

  const rawMessage = (() => {
    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message.join(", ");
    }
    if (typeof data?.message === "string" && data.message.length > 0) {
      return data.message;
    }
    if (Array.isArray(data?.error?.message) && data.error.message.length > 0) {
      return data.error.message.join(", ");
    }
    if (typeof data?.error?.message === "string" && data.error.message.length > 0) {
      return data.error.message;
    }
    return "";
  })();

  const isRawTechnicalMessage =
    rawMessage.length > 0 &&
    /(forbidden resource|internal server error|network error|request failed|cannot get)/i.test(
      rawMessage
    );

  if (status === 401) {
    return "Сессия истекла. Войдите снова.";
  }
  if (status === 403) {
    return "У вас нет доступа к этому действию.";
  }
  if (status === 404) {
    return effectiveFallback || "Данные не найдены.";
  }
  if (status === 400) {
    if (rawMessage && !isRawTechnicalMessage) {
      return rawMessage;
    }
    return effectiveFallback || "Проверьте корректность введенных данных.";
  }
  if (status && status >= 500) {
    return effectiveFallback || "Не удалось загрузить данные. Попробуйте позже.";
  }

  if (rawMessage && !isRawTechnicalMessage) {
    return rawMessage;
  }

  return effectiveFallback || "Не удалось выполнить запрос.";
}

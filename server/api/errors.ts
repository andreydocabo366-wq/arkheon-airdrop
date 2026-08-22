export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string | number | boolean | null>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, string | number | boolean | null>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(code: string, message: string) {
  return new ApiError(400, code, message);
}

export function unauthorized(code = "UNAUTHORIZED", message = "Authentication is required.") {
  return new ApiError(401, code, message);
}

export function forbidden(code: string, message: string) {
  return new ApiError(403, code, message);
}

export function notFound(code: string, message: string) {
  return new ApiError(404, code, message);
}

export function conflict(code: string, message: string) {
  return new ApiError(409, code, message);
}

export function tooManyRequests() {
  return new ApiError(429, "RATE_LIMITED", "Too many requests. Try again shortly.");
}

export function serviceUnavailable() {
  return new ApiError(
    503,
    "SERVICE_NOT_CONFIGURED",
    "The secure backend is not configured in this environment.",
  );
}

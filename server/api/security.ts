import type { DataRepository, SecurityEventType } from "../domain/types";
import type { RuntimeEnv } from "../runtime/env";
import { forbidden, tooManyRequests, unauthorized } from "./errors";

const authAttempts = new Map<string, { count: number; resetAt: number }>();
const AUTH_WINDOW_MS = 60_000;
const AUTH_MAX_ATTEMPTS = 10;

export function assertAllowedOrigin(request: Request, env: RuntimeEnv) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const allowedOrigin = env.PUBLIC_APP_ORIGIN?.replace(/\/$/, "") ?? new URL(request.url).origin;
  if (origin.replace(/\/$/, "") !== allowedOrigin) {
    throw forbidden("ORIGIN_NOT_ALLOWED", "This request origin is not allowed.");
  }
}

export function corsHeaders(request: Request, env: RuntimeEnv) {
  const origin = request.headers.get("origin");
  const allowedOrigin = env.PUBLIC_APP_ORIGIN?.replace(/\/$/, "") ?? new URL(request.url).origin;
  const headers = new Headers();
  if (origin && origin.replace(/\/$/, "") === allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Max-Age", "600");
  return headers;
}

function requestRateLimitKey(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? "unknown";
}

export function enforceAuthRateLimit(request: Request) {
  const now = Date.now();
  const key = requestRateLimitKey(request);
  const current = authAttempts.get(key);
  if (!current || current.resetAt <= now) {
    authAttempts.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return;
  }
  current.count += 1;
  if (current.count > AUTH_MAX_ATTEMPTS) throw tooManyRequests();
}

export function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(authorization ?? "");
  if (!match) throw unauthorized();
  return match[1].toLowerCase();
}

export async function recordSecurityEventSafely(
  repository: DataRepository | null,
  input: {
    type: SecurityEventType;
    requestId: string;
    route: string;
    details?: Record<string, string | number | boolean | null>;
  },
) {
  if (!repository) return;
  try {
    await repository.recordSecurityEvent(input);
  } catch {
    // Security logging must never leak credentials or replace the original response.
  }
}

export function resetRateLimitForTests() {
  authAttempts.clear();
}

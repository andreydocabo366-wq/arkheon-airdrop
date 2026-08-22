export interface RuntimeEnv {
  DATABASE_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_AUTH_MAX_AGE_SECONDS?: string;
  SESSION_TTL_SECONDS?: string;
  PUBLIC_APP_ORIGIN?: string;
}

function boundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

export function authMaxAgeSeconds(env: RuntimeEnv) {
  return boundedInteger(env.TELEGRAM_AUTH_MAX_AGE_SECONDS, 300, 60, 86_400);
}

export function sessionTtlSeconds(env: RuntimeEnv) {
  return boundedInteger(env.SESSION_TTL_SECONDS, 86_400, 900, 604_800);
}

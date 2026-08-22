import { z } from "zod";
import type {
  CostCategory,
  DataRepository,
  Locale,
  UserRecord,
} from "../domain/types";
import { toPublicUser } from "../domain/types";
import { authMaxAgeSeconds, sessionTtlSeconds, type RuntimeEnv } from "../runtime/env";
import { randomReferralCode, randomTokenHex, sha256Hex } from "../security/crypto";
import { validateTelegramInitData } from "../telegram/init-data";
import { ApiError, badRequest, notFound, serviceUnavailable } from "./errors";
import { repositoryFromEnv } from "./repository";
import {
  assertAllowedOrigin,
  bearerToken,
  corsHeaders,
  enforceAuthRateLimit,
  recordSecurityEventSafely,
} from "./security";

const authBodySchema = z.object({ initData: z.string().min(1).max(8_192) }).strict();
const activityBodySchema = z
  .object({
    type: z.enum(["viewed", "tutorial_viewed", "started"]),
    airdropId: z.uuid().optional(),
    idempotencyKey: z.string().min(8).max(100).regex(/^[A-Za-z0-9_.:-]+$/).optional(),
  })
  .strict();
const localeSchema = z.enum(["ar", "en"]);
const costSchema = z.enum([
  "free",
  "free_early",
  "free_testnet",
  "free_quest",
  "low_cost",
  "paid",
]);
const slugSchema = z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const uuidSchema = z.uuid();

export interface ApiRouterOptions {
  repository?: DataRepository;
  now?: () => Date;
}

interface RequestContext {
  requestId: string;
  repository: DataRepository | null;
  startedAt: number;
}

function securityHeaders() {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}

function jsonResponse(
  request: Request,
  env: RuntimeEnv,
  requestId: string,
  status: number,
  body: unknown,
) {
  const headers = corsHeaders(request, env);
  for (const [name, value] of Object.entries(securityHeaders())) headers.set(name, value);
  headers.set("X-Request-Id", requestId);
  return new Response(JSON.stringify(body), { status, headers });
}

function success(
  request: Request,
  env: RuntimeEnv,
  requestId: string,
  data: unknown,
  status = 200,
) {
  return jsonResponse(request, env, requestId, status, {
    ok: true,
    data,
    meta: { requestId },
  });
}

function failure(request: Request, env: RuntimeEnv, requestId: string, error: ApiError) {
  return jsonResponse(request, env, requestId, error.status, {
    ok: false,
    error: { code: error.code, message: error.message },
    meta: { requestId },
  });
}

async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw badRequest("JSON_REQUIRED", "Content-Type must be application/json.");
  }
  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(declaredLength) && declaredLength > 16_384) {
    throw badRequest("PAYLOAD_TOO_LARGE", "The request body is too large.");
  }
  const raw = await request.text();
  if (raw.length > 16_384) throw badRequest("PAYLOAD_TOO_LARGE", "The request body is too large.");
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw badRequest("INVALID_JSON", "The request body is not valid JSON.");
  }
}

function requireRepository(context: RequestContext) {
  if (!context.repository) throw serviceUnavailable();
  return context.repository;
}

async function authenticatedUser(request: Request, repository: DataRepository) {
  const sessionToken = bearerToken(request);
  const sessionHash = await sha256Hex(sessionToken);
  const user = await repository.getUserBySessionHash(sessionHash);
  if (!user) throw new ApiError(401, "SESSION_INVALID", "The session is invalid or expired.");
  return user;
}

function parseLocale(url: URL): Locale {
  const parsed = localeSchema.safeParse(url.searchParams.get("locale") ?? "ar");
  if (!parsed.success) throw badRequest("INVALID_LOCALE", "Locale must be ar or en.");
  return parsed.data;
}

function parseCosts(url: URL): CostCategory[] {
  const value = url.searchParams.get("cost");
  if (!value) return [];
  const values = [...new Set(value.split(",").filter(Boolean))];
  const result = z.array(costSchema).max(6).safeParse(values);
  if (!result.success) throw badRequest("INVALID_COST_FILTER", "One or more cost filters are invalid.");
  return result.data;
}

function parseLimit(url: URL, fallback: number, maximum: number) {
  const value = Number.parseInt(url.searchParams.get("limit") ?? String(fallback), 10);
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw badRequest("INVALID_LIMIT", `Limit must be between 1 and ${maximum}.`);
  }
  return value;
}

function safeBotUsername(value: string | undefined) {
  const username = value?.replace(/^@/, "");
  return username && /^[A-Za-z0-9_]{5,32}$/.test(username) ? username : null;
}

async function handleTelegramAuth(
  request: Request,
  env: RuntimeEnv,
  context: RequestContext,
  now: Date,
) {
  enforceAuthRateLimit(request);
  const repository = requireRepository(context);
  if (!env.TELEGRAM_BOT_TOKEN) throw serviceUnavailable();

  const parsedBody = authBodySchema.safeParse(await readJson(request));
  if (!parsedBody.success) {
    throw badRequest("INVALID_AUTH_PAYLOAD", "Telegram initialization data is required.");
  }

  const identity = validateTelegramInitData({
    initData: parsedBody.data.initData,
    botToken: env.TELEGRAM_BOT_TOKEN,
    expiresIn: authMaxAgeSeconds(env),
    now,
  });
  const candidateReferralCode = randomReferralCode();
  const { user, isNewUser } = await repository.upsertTelegramUser(identity, candidateReferralCode);

  if (isNewUser && identity.startParam) {
    await repository.attachReferral(user.id, identity.startParam);
  }

  const sessionToken = randomTokenHex();
  const tokenHash = await sha256Hex(sessionToken);
  const initDataHash = await sha256Hex(parsedBody.data.initData);
  const expiresAt = new Date(now.getTime() + sessionTtlSeconds(env) * 1_000);
  const created = await repository.createSession({
    userId: user.id,
    tokenHash,
    initDataHash,
    expiresAt,
  });
  if (!created) throw new ApiError(500, "SESSION_CREATION_FAILED", "The session could not be created.");

  return success(request, env, context.requestId, {
    session: { token: sessionToken, expiresAt: expiresAt.toISOString() },
    user: toPublicUser(user),
    isNewUser,
  });
}

async function handleAuthenticatedRoute(
  request: Request,
  env: RuntimeEnv,
  context: RequestContext,
  user: UserRecord,
  path: string,
  url: URL,
) {
  const repository = requireRepository(context);

  if (path === "/api/v1/me" && request.method === "GET") {
    return success(request, env, context.requestId, toPublicUser(user));
  }

  if (path === "/api/v1/me/saved" && request.method === "GET") {
    return success(
      request,
      env,
      context.requestId,
      await repository.listSaved(user.id, parseLocale(url)),
    );
  }

  const savedMatch = /^\/api\/v1\/me\/saved\/([^/]+)$/.exec(path);
  if (savedMatch && (request.method === "PUT" || request.method === "DELETE")) {
    const id = uuidSchema.safeParse(savedMatch[1]);
    if (!id.success) throw badRequest("INVALID_AIRDROP_ID", "Airdrop id is invalid.");

    if (request.method === "PUT") {
      const saved = await repository.saveAirdrop(user.id, id.data);
      if (!saved) throw notFound("AIRDROP_NOT_FOUND", "The published airdrop was not found.");
      await repository.recordActivity({ userId: user.id, airdropId: id.data, type: "saved" });
      return success(request, env, context.requestId, { saved: true });
    }

    await repository.unsaveAirdrop(user.id, id.data);
    await repository.recordActivity({ userId: user.id, airdropId: id.data, type: "unsaved" });
    return success(request, env, context.requestId, { saved: false });
  }

  if (path === "/api/v1/me/points" && request.method === "GET") {
    return success(request, env, context.requestId, {
      points: await repository.getPoints(user.id),
      kind: "gamification",
      financialValue: false,
    });
  }

  if (path === "/api/v1/me/referral" && request.method === "GET") {
    const summary = await repository.getReferralSummary(user.id);
    const botUsername = safeBotUsername(env.TELEGRAM_BOT_USERNAME);
    return success(request, env, context.requestId, {
      ...summary,
      deepLink: botUsername
        ? `https://t.me/${botUsername}?startapp=ref_${summary.code}`
        : null,
    });
  }

  if (path === "/api/v1/me/activity" && request.method === "POST") {
    const parsed = activityBodySchema.safeParse(await readJson(request));
    if (!parsed.success) throw badRequest("INVALID_ACTIVITY", "Activity payload is invalid.");
    await repository.recordActivity({ userId: user.id, ...parsed.data });
    return success(request, env, context.requestId, { recorded: true }, 202);
  }

  throw notFound("ROUTE_NOT_FOUND", "The requested API route does not exist.");
}

async function dispatch(
  request: Request,
  env: RuntimeEnv,
  context: RequestContext,
  options: ApiRouterOptions,
) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const now = options.now?.() ?? new Date();

  if (request.method === "OPTIONS") {
    assertAllowedOrigin(request, env);
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (path === "/api/v1/health" && request.method === "GET") {
    return success(request, env, context.requestId, {
      service: "arkheon-api",
      version: "v1",
      status: "ok",
      time: now.toISOString(),
    });
  }

  assertAllowedOrigin(request, env);

  if (path === "/api/v1/auth/telegram" && request.method === "POST") {
    return handleTelegramAuth(request, env, context, now);
  }

  if (path === "/api/v1/airdrops" && request.method === "GET") {
    const repository = requireRepository(context);
    return success(
      request,
      env,
      context.requestId,
      await repository.listAirdrops(parseLocale(url), parseCosts(url), parseLimit(url, 20, 50)),
    );
  }

  const airdropMatch = /^\/api\/v1\/airdrops\/([^/]+)$/.exec(path);
  if (airdropMatch && request.method === "GET") {
    const slug = slugSchema.safeParse(airdropMatch[1]);
    if (!slug.success) throw badRequest("INVALID_AIRDROP_SLUG", "Airdrop slug is invalid.");
    const airdrop = await requireRepository(context).getAirdrop(slug.data, parseLocale(url));
    if (!airdrop) throw notFound("AIRDROP_NOT_FOUND", "The published airdrop was not found.");
    return success(request, env, context.requestId, airdrop);
  }

  if (path === "/api/v1/ranking" && request.method === "GET") {
    const scope = url.searchParams.get("scope") ?? "saudi";
    if (scope !== "saudi") throw badRequest("INVALID_RANKING_SCOPE", "Only the Saudi scope is available.");
    return success(request, env, context.requestId, {
      scope,
      entries: await requireRepository(context).getRanking(parseLimit(url, 25, 100)),
      demo: false,
    });
  }

  if (path.startsWith("/api/v1/me")) {
    const repository = requireRepository(context);
    const user = await authenticatedUser(request, repository);
    return handleAuthenticatedRoute(request, env, context, user, path, url);
  }

  throw notFound("ROUTE_NOT_FOUND", "The requested API route does not exist.");
}

function logRequest(request: Request, context: RequestContext, status: number) {
  console.log(
    JSON.stringify({
      level: "info",
      event: "api_request",
      requestId: context.requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      status,
      durationMs: Date.now() - context.startedAt,
    }),
  );
}

export async function handleApiRequest(
  request: Request,
  env: RuntimeEnv,
  options: ApiRouterOptions = {},
) {
  const context: RequestContext = {
    requestId: crypto.randomUUID(),
    repository: options.repository ?? null,
    startedAt: Date.now(),
  };

  if (!context.repository && env.DATABASE_URL) {
    try {
      context.repository = repositoryFromEnv(env);
    } catch {
      context.repository = null;
    }
  }

  try {
    const response = await dispatch(request, env, context, options);
    logRequest(request, context, response.status);
    return response;
  } catch (error) {
    const apiError = error instanceof ApiError
      ? error
      : new ApiError(500, "INTERNAL_ERROR", "The request could not be completed.");
    const path = new URL(request.url).pathname;
    const securityType = apiError.code === "RATE_LIMITED"
      ? "rate_limit_triggered"
      : apiError.code === "ORIGIN_NOT_ALLOWED"
          ? "invalid_origin"
          : path === "/api/v1/auth/telegram" && apiError.status >= 400 && apiError.status < 500
            ? "auth_failure"
            : null;

    if (securityType) {
      await recordSecurityEventSafely(context.repository, {
        type: securityType,
        requestId: context.requestId,
        route: path,
        details: { errorCode: apiError.code },
      });
    }

    if (apiError.status >= 500) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "api_error",
          requestId: context.requestId,
          path,
          code: apiError.code,
        }),
      );
    }
    const response = failure(request, env, context.requestId, apiError);
    logRequest(request, context, response.status);
    return response;
  }
}

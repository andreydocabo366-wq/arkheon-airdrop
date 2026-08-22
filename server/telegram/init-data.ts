import { validate } from "@tma.js/init-data-node";
import { z } from "zod";
import type { TelegramIdentity } from "../domain/types";
import { unauthorized } from "../api/errors";

const telegramUserSchema = z
  .object({
    id: z.number().int().positive(),
    first_name: z.string().min(1).max(128),
    last_name: z.string().max(128).optional(),
    username: z.string().max(64).optional(),
    language_code: z.string().max(16).optional(),
    is_bot: z.boolean().optional(),
  })
  .passthrough();

const referralPattern = /^ref_([A-Z0-9]{6,24})$/i;

export function normalizeReferralStartParam(value: string | null) {
  if (!value) return undefined;
  const match = referralPattern.exec(value);
  return match?.[1].toUpperCase();
}

export function validateTelegramInitData(input: {
  initData: string;
  botToken: string;
  expiresIn: number;
  now?: Date;
}): TelegramIdentity {
  if (!input.initData || input.initData.length > 8_192) {
    throw unauthorized("INVALID_TELEGRAM_INIT_DATA", "Telegram initialization data is invalid.");
  }

  try {
    validate(input.initData, input.botToken, { expiresIn: input.expiresIn });
  } catch {
    throw unauthorized("INVALID_TELEGRAM_INIT_DATA", "Telegram initialization data is invalid or expired.");
  }

  const parameters = new URLSearchParams(input.initData);
  const rawUser = parameters.get("user");
  const rawAuthDate = parameters.get("auth_date");
  if (!rawUser || !rawAuthDate) {
    throw unauthorized("INVALID_TELEGRAM_INIT_DATA", "Telegram initialization data is incomplete.");
  }

  let user: z.infer<typeof telegramUserSchema>;
  try {
    user = telegramUserSchema.parse(JSON.parse(rawUser));
  } catch {
    throw unauthorized("INVALID_TELEGRAM_USER", "Telegram user data is invalid.");
  }

  if (user.is_bot) {
    throw unauthorized("BOT_USER_BLOCKED", "Bot identities cannot create user sessions.");
  }

  const authDateSeconds = Number.parseInt(rawAuthDate, 10);
  if (!Number.isSafeInteger(authDateSeconds) || authDateSeconds <= 0) {
    throw unauthorized("INVALID_AUTH_DATE", "Telegram authentication date is invalid.");
  }

  const authDate = new Date(authDateSeconds * 1_000);
  const now = input.now ?? new Date();
  if (authDate.getTime() > now.getTime() + 60_000) {
    throw unauthorized("FUTURE_AUTH_DATE", "Telegram authentication date is invalid.");
  }

  return {
    telegramId: BigInt(user.id),
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    languageCode: user.language_code,
    startParam: normalizeReferralStartParam(parameters.get("start_param")),
    authDate,
  };
}

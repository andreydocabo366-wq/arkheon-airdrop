export type Locale = "ar" | "en";
export type CostCategory =
  | "free"
  | "free_early"
  | "free_testnet"
  | "free_quest"
  | "low_cost"
  | "paid";

export type OpportunityStatus =
  | "discovered"
  | "watching"
  | "under_review"
  | "approved"
  | "rejected"
  | "published"
  | "ending_soon"
  | "ended"
  | "claim_live";

export interface TelegramIdentity {
  telegramId: bigint;
  username?: string;
  firstName: string;
  lastName?: string;
  languageCode?: string;
  startParam?: string;
  authDate: Date;
}

export interface UserRecord {
  id: string;
  telegramId: bigint;
  username: string | null;
  firstName: string;
  lastName: string | null;
  languageCode: string | null;
  referralCode: string;
  createdAt: Date;
}

export interface PublicUser {
  id: string;
  displayName: string;
  username: string | null;
  languageCode: string | null;
  referralCode: string;
  createdAt: string;
}

export interface PublicAirdrop {
  id: string;
  slug: string;
  title: string;
  summary: string;
  network: string | null;
  cost: CostCategory;
  risk: "low" | "medium" | "high" | "unknown";
  difficulty: "easy" | "medium" | "hard";
  estimatedMinutes: number | null;
  arkheonScore: number | null;
  isDemo: boolean;
  startUrl: string | null;
  tutorial?: {
    title: string;
    steps: Array<{ position: number; instruction: string }>;
  } | null;
}

export interface RankingEntry {
  rank: number;
  displayName: string;
  points: number;
}

export interface ReferralSummary {
  code: string;
  total: number;
  valid: number;
  pending: number;
}

export type SecurityEventType =
  | "auth_failure"
  | "rate_limit_triggered"
  | "invalid_origin";

export interface DataRepository {
  upsertTelegramUser(identity: TelegramIdentity, candidateReferralCode: string): Promise<{
    user: UserRecord;
    isNewUser: boolean;
  }>;
  attachReferral(inviteeUserId: string, referralCode: string): Promise<void>;
  createSession(input: {
    userId: string;
    tokenHash: string;
    initDataHash: string;
    expiresAt: Date;
  }): Promise<boolean>;
  getUserBySessionHash(tokenHash: string): Promise<UserRecord | null>;
  listAirdrops(locale: Locale, costs: CostCategory[], limit: number): Promise<PublicAirdrop[]>;
  getAirdrop(slug: string, locale: Locale): Promise<PublicAirdrop | null>;
  listSaved(userId: string, locale: Locale): Promise<PublicAirdrop[]>;
  saveAirdrop(userId: string, airdropId: string): Promise<boolean>;
  unsaveAirdrop(userId: string, airdropId: string): Promise<void>;
  getPoints(userId: string): Promise<number>;
  getRanking(limit: number): Promise<RankingEntry[]>;
  getReferralSummary(userId: string): Promise<ReferralSummary>;
  recordActivity(input: {
    userId: string;
    airdropId?: string;
    type: "viewed" | "tutorial_viewed" | "started" | "saved" | "unsaved";
    idempotencyKey?: string;
  }): Promise<void>;
  recordSecurityEvent(input: {
    type: SecurityEventType;
    requestId: string;
    route: string;
    details?: Record<string, string | number | boolean | null>;
  }): Promise<void>;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    displayName: [user.firstName, user.lastName].filter(Boolean).join(" "),
    username: user.username,
    languageCode: user.languageCode,
    referralCode: user.referralCode,
    createdAt: user.createdAt.toISOString(),
  };
}

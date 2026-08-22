import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const opportunityStatus = pgEnum("opportunity_status", [
  "discovered",
  "watching",
  "under_review",
  "approved",
  "rejected",
  "published",
  "ending_soon",
  "ended",
  "claim_live",
]);

export const costCategory = pgEnum("cost_category", [
  "free",
  "free_early",
  "free_testnet",
  "free_quest",
  "low_cost",
  "paid",
]);

export const riskLevel = pgEnum("risk_level", ["low", "medium", "high", "unknown"]);
export const difficultyLevel = pgEnum("difficulty_level", ["easy", "medium", "hard"]);
export const referralStatus = pgEnum("referral_status", ["pending", "valid", "rejected"]);
export const activityType = pgEnum("activity_type", [
  "viewed",
  "tutorial_viewed",
  "started",
  "saved",
  "unsaved",
]);
export const securityEventType = pgEnum("security_event_type", [
  "auth_failure",
  "rate_limit_triggered",
  "invalid_origin",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    telegramId: bigint("telegram_id", { mode: "bigint" }).notNull(),
    username: varchar("username", { length: 64 }),
    firstName: varchar("first_name", { length: 128 }).notNull(),
    lastName: varchar("last_name", { length: 128 }),
    languageCode: varchar("language_code", { length: 16 }),
    referralCode: varchar("referral_code", { length: 24 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_telegram_id_uidx").on(table.telegramId),
    uniqueIndex("users_referral_code_uidx").on(table.referralCode),
    index("users_last_seen_idx").on(table.lastSeenAt),
  ],
);

export const telegramSessions = pgTable(
  "telegram_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    initDataHash: varchar("init_data_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("telegram_sessions_token_hash_uidx").on(table.tokenHash),
    index("telegram_sessions_init_data_hash_idx").on(table.initDataHash),
    index("telegram_sessions_user_idx").on(table.userId),
    index("telegram_sessions_expiry_idx").on(table.expiresAt),
  ],
);

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inviterUserId: uuid("inviter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    inviteeUserId: uuid("invitee_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    referralCode: varchar("referral_code", { length: 24 }).notNull(),
    status: referralStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("referrals_invitee_uidx").on(table.inviteeUserId),
    index("referrals_inviter_idx").on(table.inviterUserId),
    check("referrals_no_self_check", sql`${table.inviterUserId} <> ${table.inviteeUserId}`),
  ],
);

export const airdrops = pgTable(
  "airdrops",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    status: opportunityStatus("status").default("under_review").notNull(),
    titleAr: varchar("title_ar", { length: 160 }).notNull(),
    titleEn: varchar("title_en", { length: 160 }).notNull(),
    summaryAr: text("summary_ar").notNull(),
    summaryEn: text("summary_en").notNull(),
    network: varchar("network", { length: 80 }),
    cost: costCategory("cost").notNull(),
    risk: riskLevel("risk").default("unknown").notNull(),
    difficulty: difficultyLevel("difficulty").default("medium").notNull(),
    estimatedMinutes: smallint("estimated_minutes"),
    arkheonScore: smallint("arkheon_score"),
    isDemo: boolean("is_demo").default(false).notNull(),
    officialUrl: text("official_url"),
    verifiedReferralUrl: text("verified_referral_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("airdrops_slug_uidx").on(table.slug),
    index("airdrops_feed_idx").on(table.status, table.cost, table.publishedAt),
    check(
      "airdrops_score_range_check",
      sql`${table.arkheonScore} is null or (${table.arkheonScore} >= 0 and ${table.arkheonScore} <= 100)`,
    ),
    check(
      "airdrops_minutes_positive_check",
      sql`${table.estimatedMinutes} is null or ${table.estimatedMinutes} > 0`,
    ),
  ],
);

export const airdropTutorials = pgTable(
  "airdrop_tutorials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    airdropId: uuid("airdrop_id")
      .notNull()
      .references(() => airdrops.id, { onDelete: "cascade" }),
    titleAr: varchar("title_ar", { length: 180 }).notNull(),
    titleEn: varchar("title_en", { length: 180 }).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("airdrop_tutorials_airdrop_uidx").on(table.airdropId)],
);

export const airdropSteps = pgTable(
  "airdrop_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tutorialId: uuid("tutorial_id")
      .notNull()
      .references(() => airdropTutorials.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    instructionAr: text("instruction_ar").notNull(),
    instructionEn: text("instruction_en").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("airdrop_steps_tutorial_position_uidx").on(table.tutorialId, table.position),
    check("airdrop_steps_position_positive_check", sql`${table.position} > 0`),
  ],
);

export const userSavedAirdrops = pgTable(
  "user_saved_airdrops",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    airdropId: uuid("airdrop_id")
      .notNull()
      .references(() => airdrops.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_saved_airdrops_user_airdrop_uidx").on(table.userId, table.airdropId),
    index("user_saved_airdrops_airdrop_idx").on(table.airdropId),
  ],
);

export const userAirdropActivity = pgTable(
  "user_airdrop_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    airdropId: uuid("airdrop_id").references(() => airdrops.id, { onDelete: "set null" }),
    type: activityType("type").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 100 }),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_activity_idempotency_uidx").on(table.idempotencyKey),
    index("user_activity_user_created_idx").on(table.userId, table.createdAt),
    index("user_activity_airdrop_idx").on(table.airdropId),
  ],
);

export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    points: integer("points").notNull(),
    reason: varchar("reason", { length: 80 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 100 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("points_ledger_idempotency_uidx").on(table.idempotencyKey),
    index("points_ledger_user_created_idx").on(table.userId, table.createdAt),
    check("points_ledger_nonzero_check", sql`${table.points} <> 0`),
  ],
);

export const securityEvents = pgTable(
  "security_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: securityEventType("type").notNull(),
    requestId: uuid("request_id").notNull(),
    route: varchar("route", { length: 160 }).notNull(),
    details: jsonb("details").$type<Record<string, string | number | boolean | null>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("security_events_type_created_idx").on(table.type, table.createdAt)],
);

export type UserRow = typeof users.$inferSelect;
export type AirdropRow = typeof airdrops.$inferSelect;

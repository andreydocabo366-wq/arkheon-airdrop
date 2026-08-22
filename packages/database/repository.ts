import { and, asc, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import type {
  CostCategory,
  DataRepository,
  Locale,
  PublicAirdrop,
  RankingEntry,
  ReferralSummary,
  TelegramIdentity,
  UserRecord,
} from "../../server/domain/types";
import {
  airdrops,
  airdropSteps,
  airdropTutorials,
  pointsLedger,
  referrals,
  securityEvents,
  telegramSessions,
  userAirdropActivity,
  userSavedAirdrops,
  users,
} from "./schema";

type Database = ReturnType<typeof createDatabase>;

function createDatabase(databaseUrl: string) {
  return drizzle(databaseUrl, {
    schema: {
      airdrops,
      airdropSteps,
      airdropTutorials,
      pointsLedger,
      referrals,
      securityEvents,
      telegramSessions,
      userAirdropActivity,
      userSavedAirdrops,
      users,
    },
  });
}

const publicStatuses = ["published", "ending_soon", "claim_live"] as const;

function mapUser(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    telegramId: row.telegramId,
    username: row.username,
    firstName: row.firstName,
    lastName: row.lastName,
    languageCode: row.languageCode,
    referralCode: row.referralCode,
    createdAt: row.createdAt,
  };
}

function mapAirdrop(row: typeof airdrops.$inferSelect, locale: Locale): PublicAirdrop {
  return {
    id: row.id,
    slug: row.slug,
    title: locale === "ar" ? row.titleAr : row.titleEn,
    summary: locale === "ar" ? row.summaryAr : row.summaryEn,
    network: row.network,
    cost: row.cost,
    risk: row.risk,
    difficulty: row.difficulty,
    estimatedMinutes: row.estimatedMinutes,
    arkheonScore: row.arkheonScore,
    isDemo: row.isDemo,
    startUrl: row.verifiedReferralUrl ?? row.officialUrl,
  };
}

export class PostgresRepository implements DataRepository {
  private readonly db: Database;

  constructor(databaseUrl: string) {
    this.db = createDatabase(databaseUrl);
  }

  async upsertTelegramUser(identity: TelegramIdentity, candidateReferralCode: string) {
    const [existing] = await this.db
      .select()
      .from(users)
      .where(eq(users.telegramId, identity.telegramId))
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(users)
        .set({
          username: identity.username ?? null,
          firstName: identity.firstName,
          lastName: identity.lastName ?? null,
          languageCode: identity.languageCode ?? null,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();

      return { user: mapUser(updated), isNewUser: false };
    }

    const [created] = await this.db
      .insert(users)
      .values({
        telegramId: identity.telegramId,
        username: identity.username ?? null,
        firstName: identity.firstName,
        lastName: identity.lastName ?? null,
        languageCode: identity.languageCode ?? null,
        referralCode: candidateReferralCode,
      })
      .onConflictDoUpdate({
        target: users.telegramId,
        set: {
          username: identity.username ?? null,
          firstName: identity.firstName,
          lastName: identity.lastName ?? null,
          languageCode: identity.languageCode ?? null,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return { user: mapUser(created), isNewUser: created.referralCode === candidateReferralCode };
  }

  async attachReferral(inviteeUserId: string, referralCode: string): Promise<void> {
    const [inviter] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, referralCode))
      .limit(1);

    if (!inviter || inviter.id === inviteeUserId) return;

    await this.db
      .insert(referrals)
      .values({
        inviterUserId: inviter.id,
        inviteeUserId,
        referralCode,
        status: "pending",
      })
      .onConflictDoNothing({ target: referrals.inviteeUserId });
  }

  async createSession(input: {
    userId: string;
    tokenHash: string;
    initDataHash: string;
    expiresAt: Date;
  }): Promise<boolean> {
    const inserted = await this.db
      .insert(telegramSessions)
      .values(input)
      .returning({ id: telegramSessions.id });

    return inserted.length === 1;
  }

  async getUserBySessionHash(tokenHash: string): Promise<UserRecord | null> {
    const [row] = await this.db
      .select({ user: users })
      .from(telegramSessions)
      .innerJoin(users, eq(telegramSessions.userId, users.id))
      .where(
        and(
          eq(telegramSessions.tokenHash, tokenHash),
          isNull(telegramSessions.revokedAt),
          gt(telegramSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row) return null;

    await this.db
      .update(telegramSessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(telegramSessions.tokenHash, tokenHash));

    return mapUser(row.user);
  }

  async listAirdrops(locale: Locale, costs: CostCategory[], limit: number): Promise<PublicAirdrop[]> {
    const freeFirst = sql<number>`case ${airdrops.cost}
      when 'free' then 1
      when 'free_early' then 2
      when 'free_testnet' then 3
      when 'free_quest' then 4
      when 'low_cost' then 5
      when 'paid' then 6
      else 7 end`;

    const where = costs.length
      ? and(inArray(airdrops.status, publicStatuses), inArray(airdrops.cost, costs))
      : inArray(airdrops.status, publicStatuses);

    const rows = await this.db
      .select()
      .from(airdrops)
      .where(where)
      .orderBy(asc(freeFirst), desc(airdrops.publishedAt), desc(airdrops.createdAt))
      .limit(limit);

    return rows.map((row) => mapAirdrop(row, locale));
  }

  async getAirdrop(slug: string, locale: Locale): Promise<PublicAirdrop | null> {
    const [row] = await this.db
      .select()
      .from(airdrops)
      .where(and(eq(airdrops.slug, slug), inArray(airdrops.status, publicStatuses)))
      .limit(1);

    if (!row) return null;

    const [tutorial] = await this.db
      .select()
      .from(airdropTutorials)
      .where(and(eq(airdropTutorials.airdropId, row.id), eq(airdropTutorials.isPublished, true)))
      .limit(1);

    if (!tutorial) return { ...mapAirdrop(row, locale), tutorial: null };

    const steps = await this.db
      .select()
      .from(airdropSteps)
      .where(eq(airdropSteps.tutorialId, tutorial.id))
      .orderBy(asc(airdropSteps.position));

    return {
      ...mapAirdrop(row, locale),
      tutorial: {
        title: locale === "ar" ? tutorial.titleAr : tutorial.titleEn,
        steps: steps.map((step) => ({
          position: step.position,
          instruction: locale === "ar" ? step.instructionAr : step.instructionEn,
        })),
      },
    };
  }

  async listSaved(userId: string, locale: Locale): Promise<PublicAirdrop[]> {
    const rows = await this.db
      .select({ airdrop: airdrops })
      .from(userSavedAirdrops)
      .innerJoin(airdrops, eq(userSavedAirdrops.airdropId, airdrops.id))
      .where(and(eq(userSavedAirdrops.userId, userId), inArray(airdrops.status, publicStatuses)))
      .orderBy(desc(userSavedAirdrops.createdAt));

    return rows.map(({ airdrop }) => mapAirdrop(airdrop, locale));
  }

  async saveAirdrop(userId: string, airdropId: string): Promise<boolean> {
    const [airdrop] = await this.db
      .select({ id: airdrops.id })
      .from(airdrops)
      .where(and(eq(airdrops.id, airdropId), inArray(airdrops.status, publicStatuses)))
      .limit(1);

    if (!airdrop) return false;

    await this.db
      .insert(userSavedAirdrops)
      .values({ userId, airdropId })
      .onConflictDoNothing({ target: [userSavedAirdrops.userId, userSavedAirdrops.airdropId] });

    return true;
  }

  async unsaveAirdrop(userId: string, airdropId: string): Promise<void> {
    await this.db
      .delete(userSavedAirdrops)
      .where(and(eq(userSavedAirdrops.userId, userId), eq(userSavedAirdrops.airdropId, airdropId)));
  }

  async getPoints(userId: string): Promise<number> {
    const total = sql<number>`coalesce(sum(${pointsLedger.points}), 0)::int`;
    const [row] = await this.db
      .select({ total })
      .from(pointsLedger)
      .where(eq(pointsLedger.userId, userId));
    return Number(row?.total ?? 0);
  }

  async getRanking(limit: number): Promise<RankingEntry[]> {
    const points = sql<number>`coalesce(sum(${pointsLedger.points}), 0)::int`;
    const rows = await this.db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        points,
      })
      .from(users)
      .leftJoin(pointsLedger, eq(users.id, pointsLedger.userId))
      .groupBy(users.id)
      .orderBy(desc(points), asc(users.createdAt))
      .limit(limit);

    return rows.map((row, index) => ({
      rank: index + 1,
      displayName: [row.firstName, row.lastName].filter(Boolean).join(" "),
      points: Number(row.points),
    }));
  }

  async getReferralSummary(userId: string): Promise<ReferralSummary> {
    const [user] = await this.db
      .select({ code: users.referralCode })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new Error("USER_NOT_FOUND");

    const rows = await this.db
      .select({ status: referrals.status, total: sql<number>`count(*)::int` })
      .from(referrals)
      .where(eq(referrals.inviterUserId, userId))
      .groupBy(referrals.status);

    const totals = { total: 0, valid: 0, pending: 0 };
    for (const row of rows) {
      const count = Number(row.total);
      totals.total += count;
      if (row.status === "valid") totals.valid += count;
      if (row.status === "pending") totals.pending += count;
    }

    return { code: user.code, ...totals };
  }

  async recordActivity(input: {
    userId: string;
    airdropId?: string;
    type: "viewed" | "tutorial_viewed" | "started" | "saved" | "unsaved";
    idempotencyKey?: string;
  }): Promise<void> {
    await this.db
      .insert(userAirdropActivity)
      .values({
        userId: input.userId,
        airdropId: input.airdropId,
        type: input.type,
        idempotencyKey: input.idempotencyKey,
      })
      .onConflictDoNothing();
  }

  async recordSecurityEvent(input: {
    type: "auth_failure" | "rate_limit_triggered" | "invalid_origin";
    requestId: string;
    route: string;
    details?: Record<string, string | number | boolean | null>;
  }): Promise<void> {
    await this.db.insert(securityEvents).values(input);
  }
}

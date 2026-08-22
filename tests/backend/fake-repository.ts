import type {
  DataRepository,
  PublicAirdrop,
  RankingEntry,
  ReferralSummary,
  SecurityEventType,
  TelegramIdentity,
  UserRecord,
} from "../../server/domain/types";

const user: UserRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  telegramId: BigInt(42),
  username: "arkheon_test",
  firstName: "Andrey",
  lastName: null,
  languageCode: "ar",
  referralCode: "ARKHEON42",
  createdAt: new Date("2026-08-21T00:00:00.000Z"),
};

const airdrop: PublicAirdrop = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "verified-campaign",
  title: "Verified campaign",
  summary: "A database-backed test record.",
  network: "Testnet",
  cost: "free_testnet",
  risk: "low",
  difficulty: "easy",
  estimatedMinutes: 10,
  arkheonScore: 82,
  isDemo: false,
  startUrl: "https://example.com/official",
};

export class FakeRepository implements DataRepository {
  readonly sessionHashes = new Map<string, UserRecord>();
  readonly securityEvents: SecurityEventType[] = [];

  async upsertTelegramUser(identity: TelegramIdentity, candidateReferralCode: string) {
    return {
      user: {
        ...user,
        telegramId: identity.telegramId,
        username: identity.username ?? null,
        firstName: identity.firstName,
        lastName: identity.lastName ?? null,
        languageCode: identity.languageCode ?? null,
        referralCode: candidateReferralCode,
      },
      isNewUser: true,
    };
  }

  async attachReferral(): Promise<void> {}

  async createSession(input: {
    userId: string;
    tokenHash: string;
    initDataHash: string;
    expiresAt: Date;
  }): Promise<boolean> {
    this.sessionHashes.set(input.tokenHash, user);
    return true;
  }

  async getUserBySessionHash(tokenHash: string) {
    return this.sessionHashes.get(tokenHash) ?? null;
  }

  async listAirdrops() {
    return [airdrop];
  }

  async getAirdrop(slug: string) {
    return slug === airdrop.slug ? airdrop : null;
  }

  async listSaved() {
    return [airdrop];
  }

  async saveAirdrop(userId: string, airdropId: string) {
    void userId;
    return airdropId === airdrop.id;
  }

  async unsaveAirdrop(): Promise<void> {}

  async getPoints() {
    return 0;
  }

  async getRanking(): Promise<RankingEntry[]> {
    return [];
  }

  async getReferralSummary(): Promise<ReferralSummary> {
    return { code: user.referralCode, total: 0, valid: 0, pending: 0 };
  }

  async recordActivity(): Promise<void> {}

  async recordSecurityEvent(input: { type: SecurityEventType }): Promise<void> {
    this.securityEvents.push(input.type);
  }
}

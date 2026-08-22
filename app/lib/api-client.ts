export interface AuthenticatedProfile {
  id: string;
  displayName: string;
  username: string | null;
  languageCode: string | null;
  referralCode: string;
  createdAt: string;
}

export interface AuthSnapshot {
  user: AuthenticatedProfile;
  points: number;
  referrals: number;
}

export interface LiveRankingEntry {
  rank: number;
  displayName: string;
  points: number;
}

interface Envelope<T> {
  ok: boolean;
  data: T;
}

const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  sessionToken?: string,
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);

  try {
    const response = await fetch(`${configuredBase}${path}`, {
      ...options,
      credentials: "omit",
      headers,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`API_${response.status}`);
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) throw new Error("API_ERROR");
    return envelope.data;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function authenticateTelegram(initData: string): Promise<AuthSnapshot> {
  const auth = await apiRequest<{
    session: { token: string; expiresAt: string };
    user: AuthenticatedProfile;
  }>("/api/v1/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData }),
  });

  const [points, referral] = await Promise.all([
    apiRequest<{ points: number }>("/api/v1/me/points", {}, auth.session.token),
    apiRequest<{ total: number }>("/api/v1/me/referral", {}, auth.session.token),
  ]);

  return { user: auth.user, points: points.points, referrals: referral.total };
}

export async function fetchSaudiRanking(): Promise<LiveRankingEntry[]> {
  const ranking = await apiRequest<{
    scope: "saudi";
    entries: LiveRankingEntry[];
    demo: false;
  }>("/api/v1/ranking?scope=saudi&limit=25");
  return ranking.entries;
}

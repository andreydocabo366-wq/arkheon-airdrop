# Phase 2 — Backend foundation

## Outcome

Phase 2 adds a server-only API, PostgreSQL persistence, Telegram authentication, and the public product domains required by the Mini App. It does not add the Admin panel, agents, queues, blockchain execution, operational wallets, claims, or financial automation.

## Runtime boundary

```text
Telegram Mini App
       |
       | HTTPS /api/v1
       v
Server router and validation
       |
       | HTTP-compatible PostgreSQL protocol
       v
PostgreSQL source of truth
```

The Cloudflare-compatible Site runtime does not open raw TCP sockets. The PostgreSQL adapter therefore uses the Neon HTTP driver with Drizzle ORM. The database remains standard PostgreSQL and the schema is represented by checked-in SQL migrations.

## Authentication flow

1. The Mini App reads raw Telegram `initData` only inside the Telegram environment.
2. The browser posts the raw string to `POST /api/v1/auth/telegram` over HTTPS.
3. The server validates Telegram's HMAC signature and enforces a five-minute default maximum age.
4. The server parses the signed user fields; `initDataUnsafe` is never accepted as proof of identity.
5. A user is created or updated in PostgreSQL.
6. A cryptographically random session token is returned once. PostgreSQL stores only its SHA-256 hash.
7. Protected requests send the opaque token as a Bearer credential. The client keeps it only in memory.

Repeated valid launches rotate sessions. Rate limits and the short `initData` lifetime bound replay abuse without preventing legitimate Mini App reloads.

## Initial database scope

- `users`
- `telegram_sessions`
- `referrals`
- `airdrops`
- `airdrop_tutorials`
- `airdrop_steps`
- `user_saved_airdrops`
- `user_airdrop_activity`
- `points_ledger`
- `security_events`

No fake production records are seeded. Ranking totals are calculated from the append-only points ledger. Referral records begin as `pending`; Phase 2 does not award points automatically from an unreviewed referral.

## Security defaults

- Same-origin API requests by default; an explicit production origin can be configured.
- JSON bodies capped at 16 KiB and validated with Zod.
- Telegram authentication attempts bounded per edge runtime window.
- Session tokens are 256-bit random values and stored only as hashes.
- Auth, identity, and user-specific responses use `Cache-Control: no-store`.
- Structured logs include request IDs, method, path, status, and duration only.
- Raw `initData`, Telegram bot tokens, database URLs, and session tokens never enter logs.
- Database-backed routes return `503 SERVICE_NOT_CONFIGURED` when required secrets are absent.

## Deferred by design

- Admin authentication and operational UI (Phase 3)
- Redis and BullMQ (Phase 4)
- SCOUT, AUDITOR, and PUBLISHER
- Policy Engine, blockchain simulation, and FARMER
- Wallet signer service, claims, HARVESTER, and TREASURY

These capabilities must not be placed in the public browser bundle.

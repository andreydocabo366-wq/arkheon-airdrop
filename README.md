# ARKHÉON AIRDROP

Saudi-first Telegram Mini App for discovering clear, carefully reviewed airdrop opportunities.

> The public opportunity feed remains a clearly marked `DEMO`. Phase 2 adds the secure backend foundation, but there are still no real campaigns, claims, wallets, or financial actions in this release.

## Product principles

- Arabic is the primary language with true RTL layout; English is the fallback.
- FREE-FIRST ordering: free → free + early → free testnet/quest → low cost → paid.
- The public experience shows project, risk, cost, time, difficulty, tutorial, and a safe start state.
- Internal agents, operational wallets, treasury information, prompts, logs, signer logic, and private workflows never belong in the public client.
- ARKHÉON never requests a seed phrase or private key.

## Current scope

- Home, Explore, Saved, Ranking, and Profile navigation.
- Typed DEMO opportunity cards and detail views.
- Quick Tutorial with completion controlled explicitly by the user.
- Local-only language and saved-opportunity preferences.
- Safe disabled `START AIRDROP` state while a campaign is unapproved.
- Telegram Mini Apps initialization through `@tma.js/sdk-react`.
- Responsive mobile-first UI, keyboard focus, reduced-motion support, and safe-area spacing.
- Server-side Telegram `initData` verification and opaque sessions.
- PostgreSQL schema and Drizzle migration for users, sessions, referrals, airdrops, tutorials, saved items, activity, points, and security events.
- Versioned `/api/v1` endpoints for the public feed, user profile, saved items, points, referrals, ranking, and activity.
- Same-origin enforcement, bounded auth attempts, structured request logs, idempotency fields, and explicit server-only secret handling.

## Stack

- React 19
- TypeScript 5
- Vite 8 through Vinext
- `@tma.js/sdk-react`
- `@tma.js/init-data-node`
- PostgreSQL through an HTTP-compatible Neon driver
- Drizzle ORM and versioned SQL migrations
- Zod request validation
- Tailwind CSS 4 build pipeline with project-specific CSS
- Cloudflare-compatible worker deployment

Admin tooling, Redis/BullMQ, agents, blockchain modules, policy execution, signer services, wallets, and financial operations remain intentionally deferred.

## Development

Requirements:

- Node.js `>=22.13.0`
- npm

```bash
npm ci
npm run dev
```

Quality gates:

```bash
npm run typecheck
npm run lint
npm test
npm run security:bundle
npm run db:check
```

The production build is created with:

```bash
npm run build
```

## Environment

Copy `.env.example` to an ignored local `.env` file and provide values only through the deployment secret manager. Never commit tokens, credentials, RPC secrets, private keys, seed phrases, or signing material.

The API health route works without secrets. Authenticated and database-backed routes fail closed with `503 SERVICE_NOT_CONFIGURED` until `DATABASE_URL` and `TELEGRAM_BOT_TOKEN` are configured.

## Architecture boundary

```text
Private infrastructure and workers
              ↓
         Backend / API
              ↓
   Public Telegram Mini App
```

The browser receives only the Mini App client. Phase 2 API, Telegram verification, database access, and environment secrets remain in the server bundle.

## Roadmap

1. Public Mini App — completed.
2. Backend, PostgreSQL, and server-side Telegram `initData` validation — current phase.
3. Private admin application.
4. Redis and BullMQ.
5. Private discovery, audit, publication, policy, blockchain, farming, harvesting, and treasury phases in the approved order.

See [Phase 1 architecture](docs/architecture/PHASE-1.md), [Phase 2 architecture](docs/architecture/PHASE-2.md), [API v1 contract](docs/api/V1.md), and [Security policy](SECURITY.md).

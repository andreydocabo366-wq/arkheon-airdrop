# ARKHÉON AIRDROP

Saudi-first Telegram Mini App for discovering clear, carefully reviewed airdrop opportunities.

> Phase 1 is a public interface demonstration. Every sample opportunity is marked `DEMO`; there are no real campaigns, referrals, claims, wallets, or financial actions in this release.

## Product principles

- Arabic is the primary language with true RTL layout; English is the fallback.
- FREE-FIRST ordering: free → free + early → free testnet/quest → low cost → paid.
- The public experience shows project, risk, cost, time, difficulty, tutorial, and a safe start state.
- Internal agents, operational wallets, treasury information, prompts, logs, signer logic, and private workflows never belong in the public client.
- ARKHÉON never requests a seed phrase or private key.

## Phase 1 scope

- Home, Explore, Saved, Ranking, and Profile navigation.
- Typed DEMO opportunity cards and detail views.
- Quick Tutorial with completion controlled explicitly by the user.
- Local-only language and saved-opportunity preferences.
- Safe disabled `START AIRDROP` state while a campaign is unapproved.
- Telegram Mini Apps initialization through `@tma.js/sdk-react`.
- Responsive mobile-first UI, keyboard focus, reduced-motion support, and safe-area spacing.

## Stack

- React 19
- TypeScript 5
- Vite 8 through Vinext
- `@tma.js/sdk-react`
- Tailwind CSS 4 build pipeline with project-specific CSS
- Cloudflare-compatible worker deployment

PostgreSQL, server-side Telegram authentication, referrals, points ledger, real opportunity data, agents, queues, blockchain modules, and wallets are intentionally deferred to later phases.

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
```

The production build is created with:

```bash
npm run build
```

## Environment

Copy `.env.example` to an ignored local `.env` file only when a later phase needs configuration. Never commit tokens, credentials, RPC secrets, private keys, seed phrases, or signing material.

## Architecture boundary

```text
Private infrastructure and workers
              ↓
         Backend / API
              ↓
   Public Telegram Mini App
```

This repository currently contains only the public Phase 1 application. The location and visibility of future private infrastructure must be decided before those components are added.

## Roadmap

1. Public Mini App — current phase.
2. Backend, PostgreSQL, and server-side Telegram `initData` validation.
3. Private admin application.
4. Redis and BullMQ.
5. Private discovery, audit, publication, policy, blockchain, farming, harvesting, and treasury phases in the approved order.

See [Phase 1 architecture](docs/architecture/PHASE-1.md) and [Security policy](SECURITY.md).

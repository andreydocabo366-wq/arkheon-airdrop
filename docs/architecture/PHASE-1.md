# Phase 1 Architecture

## Status

Implemented as a public, Arabic-first Telegram Mini App demonstration.

## Runtime boundary

The browser receives only public presentation code and explicitly labeled DEMO fixtures. No agent workflow, wallet configuration, treasury record, private prompt, signing service, policy rule, or secret is present in the public bundle.

## Current data flow

```text
Typed DEMO fixtures
        ↓
Public view state
        ↓
Home / Explore / Detail / Tutorial
        ↓
Local preferences only
```

No production airdrop source exists in Phase 1. The primary CTA remains disabled because no approved destination is available.

## Telegram integration

`@tma.js/sdk-react` is initialized only when the runtime is detected as a Telegram Mini App. The app then mounts theme and Mini App components, signals readiness, mounts the viewport, binds CSS viewport variables, and requests expansion.

Telegram launch data is not trusted for authentication in this phase. Phase 2 must send raw `initData` to the backend, validate its signature and age server-side, and create an authenticated session before accepting user-specific writes.

## Internationalization

- Initial document language: Arabic.
- Initial direction: RTL.
- English can be selected in the interface and switches direction to LTR.
- The preference is device-local and carries no authentication meaning.

## State

Saved DEMO opportunities and locale preference use `localStorage`. Ranking, points, referrals, started campaigns, and Telegram identity remain DEMO or empty states until the PostgreSQL-backed API exists.

## Next architectural step

Phase 2 introduces a Node.js/TypeScript API, PostgreSQL with Drizzle ORM, server-side Telegram authentication, typed public API contracts, and durable user records. It must not introduce agents, wallets, or financial execution.

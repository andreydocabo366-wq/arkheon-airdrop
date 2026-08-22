# Security Policy

## Public application guarantees

- ARKHÉON will never ask users for a seed phrase, private key, wallet password, or recovery code.
- The application does not connect wallets, sign messages, call contracts, move funds, or execute airdrops.
- Every sample opportunity and score is marked `DEMO`.
- The `START AIRDROP` action is disabled until an approved official destination exists.
- Telegram `initDataUnsafe` is presentation-only. Authentication accepts only raw `initData` verified on the server.

## Secret handling

Never commit Telegram bot tokens, database credentials, RPC secrets, private keys, signing keys, API keys, session tokens, or real `.env` files. `.env.example` contains variable names only.

Opaque session tokens are returned once, kept in browser memory, and stored in PostgreSQL only as SHA-256 hashes. Raw Telegram launch data, tokens, and database URLs must never enter logs, browser storage, public bundles, prompts, or analytics.

## Public/private separation

Private agents, prompts, internal workflows, wallet configuration, treasury records, signer implementation, policy internals, and operational logs must not be added to the public client bundle. Phase 2 database and authentication code stays in the server bundle.

## Phase 2 controls

- Validate Telegram HMAC signatures and a bounded `auth_date` on the server.
- Reject invalid origins, expired launch data, oversized JSON payloads, malformed authorization headers, and bot identities.
- Fail database-backed routes closed until deployment secrets are configured.
- Keep points as an append-only gamification ledger with no financial classification.
- Store no private keys, seed phrases, wallet signers, or financial execution capability.

## Reporting a vulnerability

Do not disclose an exploitable vulnerability or secret in a public issue. Use the repository's private security-reporting channel when it is enabled, or contact the repository owner privately.

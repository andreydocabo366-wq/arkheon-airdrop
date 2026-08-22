# Security Policy

## Public application guarantees

- ARKHÉON will never ask users for a seed phrase, private key, wallet password, or recovery code.
- The Phase 1 application does not connect wallets, sign messages, call contracts, move funds, or execute airdrops.
- Every sample opportunity and score is marked `DEMO`.
- The `START AIRDROP` action is disabled until an approved official destination exists.
- Telegram client data is not treated as trusted authentication.

## Secret handling

Never commit Telegram bot tokens, database credentials, RPC secrets, private keys, signing keys, API keys, or real `.env` files. `.env.example` contains variable names only.

## Public/private separation

Private agents, prompts, internal workflows, wallet configuration, treasury records, signer implementation, policy internals, and operational logs must not be added to the public client or production bundle.

## Reporting a vulnerability

Do not disclose an exploitable vulnerability or secret in a public issue. Use the repository's private security-reporting channel when it is enabled, or contact the repository owner privately.

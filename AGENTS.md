# AGENTS.md — Merge-to-Earn Oracle

## Project Overview
Merge-to-Earn Oracle automates reward payouts when GitHub PRs are merged.
It listens for `pull_request.closed` webhooks, extracts point values from labels,
resolves contributor wallet addresses from GitHub bios, and calls a Soroban
smart contract to release XLM rewards on Stellar.

## Tech Stack
- **Smart Contracts**: Rust, Soroban SDK
- **Backend**: Node.js 20+, TypeScript 5.5, Express.js, Stellar SDK, Pino, Zod
- **Infra**: PostgreSQL, Docker, GitHub Actions

## Key Architecture Decisions
1. **Clean Architecture**: Controllers → Services → External (contract/GitHub)
2. **Stateless Backend**: Horizontal scaling via containerization
3. **Defense in Depth**: Webhook HMAC verification, rate limiting, input validation

## Development Commands
```bash
pnpm dev          # Start backend with hot-reload
pnpm test         # Run all tests
pnpm lint         # Lint all files
cargo test        # Run Soroban contract tests
cargo build       # Build Soroban contract (wasm)
docker compose up # Start full stack
```

## Environment Variables
Key variables (see .env.example for full list):
- GITHUB_WEBHOOK_SECRET, GITHUB_TOKEN, RPC_URL, CONTRACT_ADDRESS, ORACLE_SECRET_KEY, TOKEN_ADDRESS

## Common Tasks
- **Add new label format**: Edit `src/utils/point-parser.ts`
- **Add new address source**: Edit `src/utils/address-resolver.ts`
- **Add contract method**: Edit `contracts/src/lib.rs` then update `contract.service.ts`
- **Deploy contract**: `soroban contract deploy --wasm target/wasm32-unknown-unknown/release/wave_vault.wasm --source $SECRET_KEY --rpc-url $RPC_URL`

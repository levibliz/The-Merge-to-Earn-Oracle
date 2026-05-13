# AGENTS.md — Merge-to-Earn Oracle

## Project Overview
Merge-to-Earn Oracle automates reward payouts when GitHub PRs are merged.
It listens for `pull_request.closed` webhooks, extracts point values from labels,
resolves contributor wallet addresses from GitHub bios, and calls a Solidity
smart contract to release ETH rewards.

## Tech Stack
- **Smart Contracts**: Solidity ^0.8.20, Foundry (Forge), OpenZeppelin
- **Backend**: Node.js 20+, TypeScript 5.5, Express.js, Ethers.js v6, Pino, Zod
- **Infra**: PostgreSQL, Docker, GitHub Actions

## Key Architecture Decisions
1. **Clean Architecture**: Controllers → Services → External (contract/GitHub)
2. **Stateless Backend**: Horizontal scaling via containerization
3. **Defense in Depth**: Webhook HMAC verification, rate limiting, input validation
4. **Gas-Optimized Contracts**: CEI pattern, ReentrancyGuard, custom errors

## Development Commands
```bash
pnpm dev          # Start backend with hot-reload
pnpm test         # Run all tests
pnpm lint         # Lint all files
forge test        # Run Solidity tests
forge build       # Compile Solidity
docker compose up # Start full stack
```

## Environment Variables
Key variables (see .env.example for full list):
- GITHUB_WEBHOOK_SECRET, GITHUB_TOKEN, RPC_URL, CONTRACT_ADDRESS, ORACLE_PRIVATE_KEY

## Common Tasks
- **Add new label format**: Edit `src/utils/point-parser.ts`
- **Add new address source**: Edit `src/utils/address-resolver.ts`
- **Add contract method**: Update contract ABI in `src/services/contract.service.ts`
- **Deploy contract**: `forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast`

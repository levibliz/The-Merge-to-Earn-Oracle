# Merge-to-Earn Oracle

> **Automate the transition from a merged PR to a paid reward — bridging GitHub contributions with on-chain payouts.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/Node-%5E20.0-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-1.75-orange)](https://rust-lang.org)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-000000)](https://stellar.org)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Vision & Goals](#vision--goals)
- [Key Features](#key-features)
- [Technical Architecture](#technical-architecture)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Smart Contract](#smart-contract)
- [Backend API](#backend-api)
- [Testing Strategy](#testing-strategy)
- [CI/CD Pipeline](#cicd-pipeline)
- [Docker Deployment](#docker-deployment)
- [Security Best Practices](#security-best-practices)
- [Performance Optimizations](#performance-optimizations)
- [Monitoring & Observability](#monitoring--observability)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Problem Statement

Open-source maintainers and DAOs often struggle to **automatically reward contributors** when a pull request is merged. The typical flow is manual:

1. A contributor opens a PR.
2. A maintainer reviews and merges it.
3. Someone must manually look up the contributor's wallet address, calculate the reward, and trigger an on-chain payment.

This manual process is error-prone, time-consuming, and does not scale. Contributors may wait days or weeks for their rewards, and maintainers bear an operational burden that could be automated.

**The Merge-to-Earn Oracle solves this** by listening for GitHub `pull_request.closed` events with a `merged` action, extracting point-based rewards from PR labels (e.g., `drips-wave: 100`), resolving the contributor's on-chain address from their GitHub bio, and calling a smart contract to release the reward — all in real-time.

---

## Vision & Goals

### Vision
Create a trust-minimized, automated reward pipeline that turns every merged pull request into an instant, transparent, and verifiable on-chain payment — fueling a sustainable contributor economy.

### Goals
- **Zero-touch automation**: From merge to payment with no human intervention.
- **Transparency**: Every reward is recorded on-chain and visible to the community.
- **Extensibility**: Support multiple reward strategies (fixed points, time-based, tiered).
- **Security**: Oracle-only contract access, webhook signature verification, rate limiting.
- **Developer Experience**: Clear setup, comprehensive testing, and thorough documentation.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Automated Reward Release** | Triggers on-chain payment immediately upon PR merge |
| **Label-Based Point System** | Extract reward amounts from PR labels (`drips-wave: <points>`) |
| **GitHub Bio Address Resolution** | Resolve contributor wallet address from their GitHub profile bio |
| **On-Chain Payment Tracking** | Each reward is recorded with `contributor`, `issueId`, and `amount` |
| **Duplicate Payment Prevention** | On-chain paid-issues tracking ensures no issue is paid twice |
| **Webhook Signature Verification** | Validates GitHub webhook payloads with HMAC-SHA256 |
| **Rate Limiting** | Prevents abuse with configurable request throttling |
| **Health Monitoring** | `/health` endpoint for uptime checks |
| **Comprehensive Logging** | Structured JSON logging via Pino |
| **Dockerized Deployment** | Containerized for easy scaling and deployment |
| **CI/CD Pipeline** | Automated testing and deployment via GitHub Actions |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  PR Merged → Webhook (pull_request.closed)                │  │
│  └──────────────────────┬────────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────────┘
                          │ POST /webhook
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js / TypeScript)                │
│                                                                  │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────────┐  │
│  │  Webhook     │──▶│  Reward        │──▶│  Contract        │  │
│  │  Controller  │   │  Service       │   │  Service         │  │
│  └──────┬───────┘   └───────┬────────┘   └────────┬─────────┘  │
│         │                   │                      │            │
│         ▼                   ▼                      ▼            │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────────┐  │
│  │  Validate    │   │  Point Parser  │   │  GitHub Service  │  │
│  │  Webhook     │   │  Address       │   │  (Bio Resolver)  │  │
│  │  Middleware  │   │  Resolver      │   │                  │  │
│  └──────────────┘   └────────────────┘   └──────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ releaseReward()
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Stellar Network (Soroban Smart Contract)            │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  WaveVault                                                 │  │
│  │  ├── release_reward(contributor, issueId, amount)         │  │
│  │  ├── paid(issueId) → bool (dupe prevention)               │  │
│  │  └── reward_paid event (contributor, issueId, amount)     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Smart Contract Layer

| Technology | Purpose |
|------------|---------|
| **Rust** | Smart contract language |
| **Soroban SDK** | Development, testing, and deployment framework |
| **soroban-cli** | Contract build, deploy, and interaction CLI |

### Backend Layer

| Technology | Purpose |
|------------|---------|
| **Node.js 20+** | JavaScript runtime |
| **TypeScript 5.5** | Type-safe development |
| **Express.js** | HTTP server framework |
| **Stellar SDK v12** | Stellar/Soroban interaction library |
| **Pino** | Structured JSON logging |
| **Zod** | Runtime input validation |
| **Vitest** | Unit and integration testing |
| **Prisma** | Database ORM (for tracking) |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local orchestration |
| **PostgreSQL** | Event tracking database |
| **GitHub Actions** | CI/CD automation |
| **Nginx** | Reverse proxy (production) |

---

## Folder Structure

```
merge-to-earn-oracle/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Continuous integration
│       └── deploy.yml              # Continuous deployment
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   │
│   ├── src/
│   │   ├── index.ts                # Server entry point
│   │   ├── app.ts                  # Express app setup
│   │   │
│   │   ├── config/
│   │   │   ├── index.ts            # Centralized config loader
│   │   │   ├── environments.ts     # Environment enum & types
│   │   │   └── logger.ts           # Pino logger setup
│   │   │
│   │   ├── controllers/
│   │   │   ├── webhook.controller.ts
│   │   │   └── health.controller.ts
│   │   │
│   │   ├── services/
│   │   │   ├── reward.service.ts   # Reward orchestration logic
│   │   │   ├── github.service.ts   # GitHub API client
│   │   │   └── contract.service.ts # Smart contract interaction
│   │   │
│   │   ├── middleware/
│   │   │   ├── error-handler.ts    # Global error handler
│   │   │   ├── validate-webhook.ts # GitHub webhook signature verification
│   │   │   └── rate-limiter.ts     # Rate limiting middleware
│   │   │
│   │   ├── utils/
│   │   │   ├── point-parser.ts     # Extract points from labels
│   │   │   ├── address-resolver.ts # Resolve address from GitHub bio
│   │   │   └── errors.ts           # Custom error classes
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts            # Shared TypeScript types
│   │   │   ├── github.ts           # GitHub webhook payload types
│   │   │   └── contract.ts         # Contract interaction types
│   │   │
│   │   └── __tests__/
│   │       ├── point-parser.test.ts
│   │       ├── reward-service.test.ts
│   │       └── webhook.test.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── Dockerfile
│   └── .env.example
│
├── contracts/
│   ├── Cargo.toml                   # Rust project configuration
│   ├── src/
│   │   └── lib.rs                   # Soroban WaveVault contract + tests
│   └── .env.example
│
├── docker-compose.yml               # Local development stack
├── .env.example                     # Root environment template
├── .gitignore
├── .prettierrc
├── AGENTS.md                        # AI assistant instructions
└── README.md
```

---

## Installation & Setup

### Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | ^20.0 | [nodejs.org](https://nodejs.org) |
| pnpm | ^9.0 | `npm install -g pnpm` |
| Rust | ^1.75 | [rustup.rs](https://rustup.rs) |
| Docker | ^24.0 | [docker.com](https://docker.com) |
| Docker Compose | ^2.20 | Included with Docker Desktop |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/merge-to-earn-oracle.git
cd merge-to-earn-oracle

# 2. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp contracts/.env.example contracts/.env

# 3. Install dependencies
pnpm install              # Root workspace dependencies
cd backend && pnpm install && cd ..

# 4. Set up the database
cd backend && pnpm db:migrate && cd ..

# 5. Start development stack
docker compose up -d       # PostgreSQL
pnpm dev                   # Starts backend + contract watcher

# 6. Run tests
pnpm test                  # Runs all tests
cd contracts && cargo test && cd ..
```

### Environment Variables

#### Root `.env`

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NODE_ENV` | No | Runtime environment | `development` |
| `LOG_LEVEL` | No | Logging verbosity | `info` |

#### Backend `backend/.env`

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | No | HTTP server port | `3001` |
| `HOST` | No | Server bind address | `0.0.0.0` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | — |
| `GITHUB_WEBHOOK_SECRET` | Yes | GitHub webhook secret for HMAC verification | — |
| `GITHUB_TOKEN` | Yes | GitHub personal access token (for API calls) | — |
| `RPC_URL` | Yes | Soroban RPC endpoint | — |
| `CONTRACT_ADDRESS` | Yes | Deployed WaveVault contract address (C...) | — |
| `ORACLE_SECRET_KEY` | Yes | Stellar secret key for the oracle (S...) | — |
| `TOKEN_ADDRESS` | Yes | Token contract address for rewards (C...) | — |
| `NETWORK_PASSPHRASE` | No | Stellar network passphrase | `Test SDF Network ; September 2015` |
| `PRICE_PER_POINT` | No | XLM value per point | `0.001` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window | `100` |

#### Contracts `contracts/.env`

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `RPC_URL` | Yes | Soroban RPC URL | — |
| `DEPLOYER_SECRET_KEY` | Yes | Deployer Stellar secret key (S...) | — |
| `ORACLE_ADDRESS` | Yes | Oracle Stellar public key (G...) | — |
| `TOKEN_ADDRESS` | Yes | Token contract address for rewards (C...) | — |
| `NETWORK_PASSPHRASE` | No | Stellar network passphrase | `Test SDF Network ; September 2015` |

---

## Development Workflow

### Available Scripts

```bash
# Root (workspace orchestration)
pnpm dev           # Start backend in development mode
pnpm build         # Build backend TypeScript
pnpm test          # Run all tests
pnpm lint          # Lint all files
pnpm format        # Format all files

# Backend
pnpm dev:backend   # Start with hot-reload (tsx watch)
pnpm build:backend # Compile TypeScript
pnpm start         # Start production server
pnpm test:backend  # Run backend tests
pnpm db:migrate    # Run Prisma migrations
pnpm db:studio     # Open Prisma Studio

# Contracts
cargo build --target wasm32-unknown-unknown --release  # Build contract WASM
cargo test         # Run Rust/Soroban tests
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/wave_vault.wasm \
  --source $DEPLOYER_SECRET_KEY --rpc-url $RPC_URL  # Deploy
```

### Code Quality Tools

- **ESLint** — TypeScript linting
- **Prettier** — Opinionated code formatting
- **Husky** — Git hooks (pre-commit lint + test)
- **lint-staged** — Only lint staged files

---

## Smart Contract

### WaveVault

The `WaveVault` contract is the Soroban smart contract that holds reward tokens and releases them when called by the authorized oracle.

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Env, Map};

#[contract]
pub struct WaveVault;

#[contractimpl]
impl WaveVault {
    pub fn initialize(env: Env, oracle: Address, token: Address);
    pub fn release_reward(env: Env, contributor: Address, issue_id: u64, amount: i128);
    pub fn paid(env: Env, issue_id: u64) -> bool;
    pub fn set_oracle(env: Env, new_oracle: Address);
}
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Soroban SDK** | Official Stellar smart contract framework |
| **Authorized Oracle** | `oracle.require_auth()` ensures only the oracle can release rewards |
| **Token Transfer** | Uses token interface for native XLM or custom token payouts |
| **Duplicate Prevention** | On-chain storage tracks paid issue IDs |
| **WASM Runtime** | Contract compiles to WASM for Soroban execution environment |

### Deployment

```bash
# Build contract WASM
cargo build --target wasm32-unknown-unknown --release

# Deploy to Soroban
soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/wave_vault.wasm \
    --source $DEPLOYER_SECRET_KEY \
    --rpc-url $RPC_URL \
    --network-passphrase "$NETWORK_PASSPHRASE"

# Initialize the contract
soroban contract invoke \
    --id $CONTRACT_ADDRESS \
    --source $DEPLOYER_SECRET_KEY \
    --rpc-url $RPC_URL \
    --network-passphrase "$NETWORK_PASSPHRASE" \
    -- \
    initialize \
    --oracle $ORACLE_ADDRESS \
    --token $TOKEN_ADDRESS
```

---

## Backend API

### Endpoints

#### `POST /webhook`

GitHub webhook receiver for `pull_request.closed` events.

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `x-hub-signature-256` | Yes | HMAC-SHA256 signature for payload verification |
| `x-github-event` | Yes | Must be `pull_request` |
| `x-github-delivery` | Yes | Unique delivery ID for deduplication |
| `content-type` | Yes | `application/json` |

**Payload (GitHub `pull_request.closed` with `merged: true`):**

```json
{
  "action": "closed",
  "pull_request": {
    "number": 42,
    "merged": true,
    "user": {
      "login": "contributor123",
      "bio": "GA7QNF7C3PJ4XZ6QJ3K5Y5V7Z7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q"
    },
    "labels": [
      { "name": "drips-wave: 100" },
      { "name": "bug" }
    ]
  }
}
```

**Response:**
```json
// 200 Success
{
  "success": true,
  "data": {
    "issueId": 42,
    "contributor": "GA7QNF7C3PJ4XZ6QJ3K5Y5V7Z7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q",
    "points": 100,
    "amount": "0.0010000",
    "txHash": "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890"
  }
}

// 400 Validation Error
{
  "success": false,
  "error": "Invalid webhook signature"
}

// 409 Already Paid
{
  "success": false,
  "error": "Issue 42 has already been rewarded"
}
```

#### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-13T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

## Testing Strategy

### Smart Contract Tests (Rust / Soroban)

```bash
cd contracts && cargo test
```

| Test File | Coverage |
|-----------|----------|
| `src/lib.rs` (inline tests) | Initialize, reward release, duplicate prevention, access control, oracle management, multiple rewards |

### Backend Tests (Vitest)

```bash
cd backend && pnpm test
```

| Test File | Coverage |
|-----------|----------|
| `point-parser.test.ts` | Label parsing, edge cases, invalid formats |
| `reward-service.test.ts` | Full reward flow, error scenarios |
| `webhook.test.ts` | Signature verification, payload validation |

### Integration Tests

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit
```

| Scenario | Description |
|----------|-------------|
| Full flow | Webhook → point parsing → address resolution → contract call |
| Duplicate | Same issue ID called twice |
| Unauthorized | Request without valid signature |
| Invalid payload | Malformed or missing fields |

---

## CI/CD Pipeline

### Continuous Integration (`.github/workflows/ci.yml`)

Triggered on every push and PR:

1. **Lint** — ESLint + Prettier check
2. **TypeScript Compile** — `tsc --noEmit`
3. **Smart Contract Tests** — `cargo test`
4. **Backend Tests** — `vitest run`
5. **Build** — `cargo build` + `pnpm build`

### Continuous Deployment (`.github/workflows/deploy.yml`)

Triggered on merge to `main`:

1. **Build & Push Docker image** to GitHub Container Registry
2. **Deploy Smart Contract** via soroban-cli (if changed)
3. **Deploy Backend** to target environment (Kubernetes / Docker Swarm)

---

## Docker Deployment

### Local Development

```yaml
# docker-compose.yml runs:
services:
  postgres:     # PostgreSQL 16 for event tracking
  backend:      # Node.js backend with hot-reload
```

### Production Build

```bash
# Build optimized image
docker build -t merge-to-earn-oracle:latest ./backend

# Run with production config
docker run -d \
  --name oracle \
  -p 3001:3001 \
  --env-file .env.production \
  merge-to-earn-oracle:latest
```

### Kubernetes Deployment (Recommended for Production)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: merge-to-earn-oracle
spec:
  replicas: 2
  selector:
    matchLabels:
      app: oracle
  template:
    metadata:
      labels:
        app: oracle
    spec:
      containers:
      - name: oracle
        image: ghcr.io/your-org/merge-to-earn-oracle:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: oracle-secrets
              key: database-url
```

---

## Security Best Practices

| Practice | Implementation |
|----------|---------------|
| **Webhook Verification** | Every payload is verified with HMAC-SHA256 using the GitHub secret |
| **Rate Limiting** | Token bucket algorithm prevents abuse |
| **Input Validation** | Zod schemas validate every request payload |
| **Access Control** | Only the oracle address can call `releaseReward` |
| **Oracle Authorization** | `require_auth()` ensures only the oracle can release rewards |
| **Duplicate Prevention** | On-chain storage prevents double payments |
| **No Secrets in Code** | All credentials via environment variables |
| **Dependency Audits** | `pnpm audit` runs in CI |
| **HTTPS Only** | Require TLS in production (terminated at reverse proxy) |
| **CORS** | Restricted origin policy for API endpoints |

---

## Performance Optimizations

- **Stateless Backend**: Horizontal scaling with no session affinity required
- **Connection Pooling**: Efficient PostgreSQL connection management
- **Batch Processing**: Queue-based reward processing for high throughput
- **WASM Optimization**: Contract compiled with `opt-level = "z"` and LTO for minimal size
- **Caching**: GitHub API responses cached with TTL
- **Lazy Loading**: Prisma queries use selective field loading

---

## Monitoring & Observability

### Logging (Pino Structured JSON)

```json
{
  "level": "info",
  "time": 1712345678901,
  "pid": 42,
  "hostname": "oracle-1",
  "msg": "Reward released successfully",
  "issueId": 42,
  "contributor": "G...",
  "amount": "0.0010000",
  "txHash": "a1b2c3d4..."
}
```

### Metrics to Track

| Metric | Description | Tool |
|--------|-------------|------|
| Webhook throughput | Requests per second | Prometheus |
| Reward success rate | % of webhooks → successful payouts | Grafana |
| Contract call latency | Time to mine transaction | Datadog |
| Duplicate prevention hits | How often duplicate payments are blocked | Custom |
| Error rate by type | Validation vs. contract vs. network errors | Sentry |

### Recommended Stack

- **Sentry** — Error tracking and performance monitoring
- **Prometheus + Grafana** — Metrics collection and dashboards
- **Datadog / New Relic** — Full observability (APM, logs, metrics)
- **Stellar Expert** — Stellar network monitoring

---

## Future Roadmap

### Phase 1 — Foundation (Current)
- [x] Smart contract with core reward release functionality
- [x] GitHub webhook listener
- [x] Label-based point extraction
- [x] GitHub bio address resolution
- [x] Basic testing suite

### Phase 2 — Production Hardening
- [ ] Multi-network support (Stellar mainnet, testnet, future networks)
- [ ] Reward strategy plugins (time-weighted, quadratic, tiered)
- [ ] Event sourcing with webhook replay capability
- [ ] Admin dashboard for monitoring and manual overrides
- [ ] Rate limiting per contributor

### Phase 3 — Scaling
- [ ] Decentralized oracle network (multiple oracle operators)
- [ ] Governance DAO for reward parameter voting
- [ ] Cross-chain reward distribution (Stellar ecosystem bridges)
- [ ] Real-time contributor analytics dashboard
- [ ] Integration with popular DAO tooling (Snapshot, Coordinape)

### Phase 4 — Ecosystem
- [ ] Public API for third-party integrations
- [ ] Browser extension for reward tracking
- [ ] Mobile notifications for contributors
- [ ] Plugin system for customizable reward rules
- [ ] On-chain reputation and score system

---

## Contributing

We welcome contributions! Here's how you can help:

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-network support
fix: resolve duplicate payment race condition
docs: update API documentation
test: add webhook signature verification tests
chore: upgrade ethers.js to v6.5
```

### Pull Request Checklist

- [ ] Tests pass (`cargo test && pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] New tests cover the change
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format

---

## Coding Standards

### Rust

- Follow [Rust Style Guide](https://doc.rust-lang.org/style-guide/)
- Use `cargo fmt` for formatting
- Use `#[cfg(test)]` for inline tests
- Follow Soroban idiomatic patterns
- Maximum line length: 120 characters

### TypeScript

- Strict mode enabled in `tsconfig.json`
- Prefer `interface` over `type` for object shapes
- Use `const` over `let` where possible
- Async/await over raw promises
- Named exports over default exports
- Maximum line length: 100 characters

---

## FAQ

**Q: What happens if the webhook delivery fails?**
A: GitHub retries webhook deliveries with exponential backoff for up to 3 days. Failed deliveries are logged, and we recommend setting up a dead-letter queue for manual review.

**Q: Can an issue be paid twice?**
A: No. The `paidIssues` mapping prevents duplicate payments. If the oracle receives a duplicate webhook, it logs an error and returns a `409 Conflict` response.

**Q: What if the contributor doesn't have a wallet address in their bio?**
A: The reward service logs an error and skips the payout. We recommend configuring an alternative lookup method (e.g., a mapping file or API) for Phase 2.

**Q: How are reward amounts calculated?**
A: The label format `drips-wave: <points>` determines the point value, which is multiplied by `PRICE_PER_POINT` to get the XLM amount. This is configurable.

**Q: Can I use a different network?**
A: Yes. The contract can be deployed to any Soroban-enabled Stellar network. Update the `RPC_URL` and `NETWORK_PASSPHRASE` accordingly.

**Q: Is the project audited?**
A: Not yet. We recommend a professional security audit before mainnet deployment.

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Invalid webhook signature` | Verify `GITHUB_WEBHOOK_SECRET` matches what's configured in GitHub |
| `Contract call failed` | Check `ORACLE_SECRET_KEY` has XLM for fees, and contract has sufficient token balance |
| `Address not found in bio` | Contributor's GitHub bio doesn't contain a valid Stellar address |
| `Issue already paid` | The PR has already been processed — check the contract's `paidIssues` mapping |
| `WASM build failure` | Ensure `wasm32-unknown-unknown` target is installed: `rustup target add wasm32-unknown-unknown` |
| `Port already in use` | Change `PORT` in `.env` or stop the process using the port |

### Getting Help

- Open a [GitHub Issue](https://github.com/your-org/merge-to-earn-oracle/issues)
- Check existing issues for solutions
- Review the [Discussions](https://github.com/your-org/merge-to-earn-oracle/discussions) board

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for the open-source ecosystem
  <br>
  <a href="https://opencode.ai">Powered by OpenCode</a>
</p>

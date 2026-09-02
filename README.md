# ChangeDecision OS

ChangeDecision OS is a WebMCP-native construction decision workspace for resolving an HVAC duct and structural beam conflict at Riverside Office Tower.

The current build implements the full local MVP through Phase 12 readiness:

- versioned central decision state and deterministic state-machine actions
- decision-room UI with issue, plan, options, comparison, impact, rejection reasons, and activity panels
- human-created blocked-region constraints by pointer or coordinate fields
- predefined resolution routes, Corridor C East revision logic, and geometry tests
- production WebMCP read and mutation tools through `draft_change_order`
- spec-compliant, AbortSignal-owned dynamic tool registration by decision phase without reloads
- explicit human-only approval before `draft_change_order` becomes available
- final draft change-order artifact `CO-007`
- local eval plan, submission checklist, and open-source license

The interface uses Tailwind CSS and shared shadcn/ui primitives. Product code follows a feature-oriented modular architecture documented in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md); explicit `any` types are prohibited by a repository quality gate.

## Local development

```bash
npm install
npm run dev
```

The Vite development and preview servers send:

```text
Origin-Agent-Cluster: ?1
Permissions-Policy: tools=(self)
```

## Verification

Run the local quality gate:

```bash
npm run verify
```

This checks the no-`any` rule, TypeScript, tests, and the production build.

Run the complete gate, including real Chromium WebMCP lifecycle tests:

```bash
npx playwright install chromium
npm run verify:all
```

GitHub Actions runs the same complete gate for every pull request and every push to `main`.

The human interface remains usable without WebMCP. In a supported browser, the app exposes only the tools valid for the current decision phase.

Additional readiness docs:

- [`docs/EVALS.md`](./docs/EVALS.md) — six agent eval prompts and five-run hero journey checklist
- [`docs/SUBMISSION.md`](./docs/SUBMISSION.md) — deployment, repository, video, and Devpost readiness checklist
- [`docs/FUTURE_SCOPE.md`](./docs/FUTURE_SCOPE.md) — intentionally deferred tools and features

## Deployment

The project is configured for Vercel through [`vercel.json`](./vercel.json). Any other static host is acceptable if it serves `dist/` over HTTPS and preserves the two WebMCP response headers above.

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

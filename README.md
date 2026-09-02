# ChangeDecision OS

ChangeDecision OS is a WebMCP-native construction decision workspace for resolving a synthetic HVAC duct and structural beam conflict at Riverside Office Tower.

The current build implements Phases 1-4 of the MVP:

- versioned central decision state and deterministic state-machine actions
- decision-room UI with issue, plan, options, impact, and activity panels
- human-created blocked-region constraints by pointer or coordinate fields
- predefined resolution routes, Corridor C East revision logic, and geometry tests

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

WebMCP production tools begin in Phase 5. Until then, the human interface is fully usable and the Phase 0 spike tool has been removed from the active app.

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

## Phase boundary

Phases 5-6 add the production WebMCP tools from [`docs/PRD.md`](./docs/PRD.md). Phases 7-9 add dynamic lifecycle reconciliation, human approval, and the change-order draft.

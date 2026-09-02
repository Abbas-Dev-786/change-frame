# ChangeDecision OS

ChangeDecision OS is a WebMCP-native construction decision workspace for resolving a synthetic HVAC duct and structural beam conflict at Riverside Office Tower.

The current build implements Phases 1-8 of the MVP:

- versioned central decision state and deterministic state-machine actions
- decision-room UI with issue, plan, options, impact, and activity panels
- human-created blocked-region constraints by pointer or coordinate fields
- predefined resolution routes, Corridor C East revision logic, and geometry tests
- production WebMCP read and mutation tools through `draft_change_order`
- dynamic tool registration by decision phase
- explicit human-only approval before `draft_change_order` becomes available

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

The human interface remains usable without WebMCP. In a supported browser, the app exposes only the tools valid for the current decision phase.

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

Phase 9 is the next product boundary: render the polished change-order draft panel after the already-implemented `draft_change_order` tool runs.

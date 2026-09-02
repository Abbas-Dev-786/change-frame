# ChangeDecision OS Architecture

The application is a source-level modular monolith. It deploys as one static web application while keeping domain policy, browser integration, React state adaptation, and presentation separated.

## Dependency direction

```text
components/ui (shared shadcn primitives)
                ↑
feature components → feature hooks → WebMCP adapter → feature model
                ↑
              App.tsx
```

Dependencies point toward the Phase 0 model. The model contains no React, Tailwind, shadcn, browser API, or persistence imports.

## Top-level structure

```text
components/ui/                         generated shadcn primitives
hooks/                                 shared shadcn hooks
lib/                                   shared framework utilities
src/features/phase-zero/model/         Phase 0 contracts and result types
src/features/phase-zero/webmcp/        browser boundary and tool lifecycle
src/features/phase-zero/hooks/         React adapter for external-store state
src/features/phase-zero/components/    Phase 0 presentation components
src/App.tsx                             application composition root
src/main.tsx                            React browser bootstrap
scripts/                                repository quality checks
```

## Rules

- Product features live under `src/features/<feature>`.
- Shared shadcn primitives remain under `components/ui` and contain no product policy.
- Feature models do not import React, browser APIs, Zustand, Tailwind, or shadcn.
- WebMCP modules translate browser behavior into feature-owned contracts.
- Components consume feature hooks; they do not register WebMCP tools directly.
- Explicit `any` types are prohibited and checked by `npm run check:no-any`.
- Phase 1 may introduce `domain`, `store`, and additional feature modules without changing the WebMCP boundary direction.

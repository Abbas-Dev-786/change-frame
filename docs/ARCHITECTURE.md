# ChangeDecision OS Architecture

The application is a source-level modular monolith. It deploys as one static web application while keeping domain policy, browser integration, React state adaptation, and presentation separated.

## Dependency direction

```text
components/ui (shared shadcn primitives)
                ↑
feature components → feature hooks → store adapter → domain policy
                         ↑
                    WebMCP adapter
                ↑
              App.tsx
```

Dependencies point toward the domain model. The domain layer contains no React, Tailwind, shadcn, browser API, Zustand, or persistence imports.

## Top-level structure

```text
components/ui/                         generated shadcn primitives
hooks/                                 shared shadcn hooks
lib/                                   shared framework utilities
src/domain/decision/                   entities, fixtures, geometry, state-machine actions
src/store/                             Zustand state adapter and session persistence
src/webmcp/                            WebMCP descriptors, schemas, validators, registry
src/features/decision-room/hooks/      React hook for decision-room state
src/features/decision-room/components/ Decision Room presentation components
src/App.tsx                            application composition root
src/main.tsx                           React browser bootstrap
scripts/                                repository quality checks
```

## Rules

- Product features live under `src/features/<feature>`.
- Shared shadcn primitives remain under `components/ui` and contain no product policy.
- Feature models do not import React, browser APIs, Zustand, Tailwind, or shadcn.
- WebMCP modules translate browser behavior into feature-owned contracts.
- Components consume feature hooks; they do not register WebMCP tools directly.
- Explicit `any` types are prohibited and checked by `npm run check:no-any`.
- WebMCP production tools in later phases must call the same domain actions as the UI.
- Human approval is a domain action exposed only through UI dispatch, never through WebMCP.

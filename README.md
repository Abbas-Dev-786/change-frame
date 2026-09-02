# ChangeDecision OS

Phase 0 is a disposable WebMCP compatibility spike for the ChangeDecision OS hackathon MVP. It proves that a deployed React page can register one read-only imperative WebMCP tool and visibly confirm invocation before the product workflow is built.

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
npm run typecheck
npm test
npm run build
```

After deploying the repository, open the HTTPS URL in either:

- ChatGPT's in-app browser, or
- Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled and Chrome restarted.

Ask the browser agent:

> Check whether the ChangeDecision OS Phase 0 WebMCP spike is ready.

Phase 0 passes when the agent discovers and invokes `get_phase_zero_status`, receives `status: ready`, and the visible invocation count increments.

In Chrome, the tool can also be inspected and manually invoked from **DevTools → Application → WebMCP**. If that pane is unavailable, enable `chrome://flags/#devtools-webmcp-support` and restart Chrome.

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

`get_phase_zero_status` exists only for the compatibility spike. Remove it when Phase 1 begins; the production tool registry is defined in [`docs/PRD.md`](./docs/PRD.md).

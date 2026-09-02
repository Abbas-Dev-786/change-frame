import { useEffect, useSyncExternalStore } from 'react'
import {
  ensurePhaseZeroToolRegistered,
  getPhaseZeroSnapshot,
  PHASE_ZERO_TOOL_NAME,
  subscribeToPhaseZero,
} from './webmcp/phaseZero'

const statusCopy = {
  checking: {
    label: 'Checking WebMCP',
    detail: 'Looking for the imperative browser API and registering the spike tool.',
  },
  registered: {
    label: 'Tool registered',
    detail: 'The page is ready for a browser agent to discover the Phase 0 tool.',
  },
  unsupported: {
    label: 'WebMCP unavailable',
    detail:
      'The human interface still works. Open the deployed site in ChatGPT’s in-app browser or Chrome 149+ with WebMCP enabled.',
  },
  error: {
    label: 'Registration failed',
    detail: 'The browser exposed WebMCP, but the temporary tool could not register.',
  },
} as const

function Diagnostic({ label, passed }: { label: string; passed: boolean }) {
  return (
    <li className="diagnostic-row">
      <span>{label}</span>
      <span className={passed ? 'diagnostic-pass' : 'diagnostic-warn'}>
        {passed ? 'Yes' : 'No'}
      </span>
    </li>
  )
}

export function App() {
  const spike = useSyncExternalStore(
    subscribeToPhaseZero,
    getPhaseZeroSnapshot,
    getPhaseZeroSnapshot,
  )

  useEffect(() => {
    void ensurePhaseZeroToolRegistered()
  }, [])

  const copy = statusCopy[spike.status]

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ChangeDecision OS home">
          <span className="brand-mark" aria-hidden="true">CD</span>
          <span>ChangeDecision OS</span>
        </a>
        <span className="phase-pill">Phase 0 · Compatibility spike</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Agent-native construction decisions</p>
          <h1>Prove the browser connection before building the product.</h1>
          <p className="lede">
            This disposable spike validates that a deployed ChangeDecision OS page can
            expose a structured, read-only WebMCP tool to a browser agent.
          </p>

          <div className={`status-card status-${spike.status}`} role="status" aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            <div>
              <strong>{copy.label}</strong>
              <p>{copy.detail}</p>
              {spike.error ? <code className="error-message">{spike.error}</code> : null}
            </div>
          </div>
        </div>

        <aside className="tool-card" aria-labelledby="tool-title">
          <div className="tool-card-header">
            <span>Registered capability</span>
            <span className="read-only-badge">Read only</span>
          </div>
          <h2 id="tool-title">{PHASE_ZERO_TOOL_NAME}</h2>
          <p>
            Returns a compact success payload with the application name, spike phase,
            API mode, and deployment diagnostics.
          </p>
          <dl className="tool-stats">
            <div>
              <dt>Invocations</dt>
              <dd>{spike.invocationCount}</dd>
            </div>
            <div>
              <dt>Last invoked</dt>
              <dd>{spike.lastInvokedAt ? new Date(spike.lastInvokedAt).toLocaleTimeString() : 'Not yet'}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="verification-grid" aria-label="Phase 0 verification">
        <article className="panel">
          <p className="panel-index">01</p>
          <h2>Environment</h2>
          <ul className="diagnostic-list">
            <Diagnostic label="Secure context" passed={spike.secureContext} />
            <Diagnostic label="Origin agent cluster" passed={spike.originAgentCluster} />
            <Diagnostic label="modelContext API" passed={spike.modelContextAvailable} />
          </ul>
        </article>

        <article className="panel">
          <p className="panel-index">02</p>
          <h2>Agent prompt</h2>
          <p>Open this page in a supported browser agent and ask:</p>
          <blockquote>
            “Check whether the ChangeDecision OS Phase 0 WebMCP spike is ready.”
          </blockquote>
        </article>

        <article className="panel">
          <p className="panel-index">03</p>
          <h2>Pass condition</h2>
          <p>
            The agent discovers <code>{PHASE_ZERO_TOOL_NAME}</code>, invokes it with an
            empty object, reports <code>status: ready</code>, and this page increments
            the invocation count.
          </p>
        </article>
      </section>

      <footer>
        <span>Riverside Office Tower · HVAC conflict workflow</span>
        <span>Temporary spike — remove before Phase 1</span>
      </footer>
    </main>
  )
}

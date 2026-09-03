import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import { App } from "./App"
import { createInitialDecisionState, evaluateResolutionOptions, type DomainResult } from "./domain/decision"
import { useDecisionRoomStore } from "./store/decision-room-store"
import { resetDecisionToolRegistryForTests } from "./webmcp/decision-tool-registry"
import { resetFlightRecorderForTests } from "./observability/agent-flight-recorder"
import { agentOptions, createConfiguredTestState } from "./test/decision-fixture"

afterEach(() => {
  resetDecisionToolRegistryForTests(); resetFlightRecorderForTests(); window.sessionStorage.clear()
  useDecisionRoomStore.setState(createInitialDecisionState())
  Object.defineProperty(document, "modelContext", { configurable: true, value: undefined })
})

it("starts with a replaceable project context and no canned resolution", () => {
  render(<App />)
  expect(screen.getByRole("heading", { name: "ChangeFrame" })).toBeVisible()
  expect(screen.getAllByText(/Riverside Office Tower/).length).toBeGreaterThan(0)
  expect(screen.getByRole("heading", { name: "Starter project ready" })).toBeVisible()
  expect(screen.getByText(/No resolution is preselected or stored/i)).toBeVisible()
  expect(screen.queryByRole("button", { name: /evaluate options/i })).not.toBeInTheDocument()
})

it("renders arbitrary agent-authored project context and alternatives", () => {
  useDecisionRoomStore.setState(evaluatedState())
  render(<App />)
  expect(screen.getByText(/Harbor Medical Center/)).toBeVisible()
  expect(screen.getAllByText("ISS-VENT-42")[0]).toBeVisible()
  expect(screen.getByText("ALT-NORTH - Reroute north of the imaging suite")).toBeVisible()
  expect(screen.getAllByText(/Avoids the fixed equipment zone/).length).toBeGreaterThan(0)
  expect(screen.getByText("78% confidence")).toBeVisible()
  expect(document.querySelector('[data-route-state="candidate"]')).not.toBeNull()
})

it("keeps the final decision human-controlled", () => {
  useDecisionRoomStore.setState(evaluatedState())
  render(<App />)
  fireEvent.click(screen.getAllByRole("button", { name: /^Select$/i })[0]!)
  fireEvent.click(screen.getByRole("button", { name: /simulate impact/i }))
  fireEvent.click(screen.getByRole("button", { name: /prepare decision/i }))
  expect(screen.getByText("Awaiting human approval")).toBeVisible()
  fireEvent.click(screen.getByRole("button", { name: /approve decision/i }))
  fireEvent.click(screen.getByRole("button", { name: /draft change order/i }))
  expect(screen.getByText("Human approved")).toBeVisible()
  expect(screen.getAllByText("CO-ISS-VENT-42")[0]).toBeVisible()
  expect(screen.getByText(/is a draft only; no contract was executed/i)).toBeVisible()
})

function evaluatedState() {
  const configured = createConfiguredTestState()
  return requireSuccess(evaluateResolutionOptions(configured, { expectedStateVersion: configured.stateVersion, options: agentOptions }))
}

function requireSuccess(result: DomainResult) {
  if (!result.success) throw new Error(result.message)
  return result.state
}

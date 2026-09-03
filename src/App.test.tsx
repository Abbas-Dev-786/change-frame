import { fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"

import { App } from "./App"
import { useDecisionRoomStore } from "./store/decision-room-store"
import { createInitialDecisionState } from "./domain/decision"
import { resetDecisionToolRegistryForTests } from "./webmcp/decision-tool-registry"
import { resetFlightRecorderForTests } from "./observability/agent-flight-recorder"

afterEach(() => {
  resetDecisionToolRegistryForTests()
  resetFlightRecorderForTests()
  window.sessionStorage.clear()
  useDecisionRoomStore.setState(createInitialDecisionState())
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: undefined,
  })
})

it("loads the decision room in the canonical investigating state", () => {
  render(<App />)

  expect(screen.getByRole("heading", { name: "ChangeDecision OS" })).toBeVisible()
  expect(screen.getByText("ISS-019")).toBeVisible()
  expect(screen.getByText("HVAC duct conflicts with structural beam B14")).toBeVisible()
  expect(screen.getByText("Investigating")).toBeVisible()
  expect(screen.getByRole("heading", { name: "Agent Flight Recorder" })).toBeVisible()
  expect(screen.getByText("0 of 7 tools live")).toBeVisible()
  expect(screen.getByText("approve_decision")).toBeVisible()
})

it("materializes options and creates a keyboard coordinate constraint", () => {
  render(<App />)

  fireEvent.click(screen.getByRole("button", { name: /evaluate options/i }))
  fireEvent.click(screen.getByRole("button", { name: "Open Agent Flight Recorder" }))

  const flightTrace = screen.getByRole("region", { name: "Latest trace" })
  expect(within(flightTrace).getByText("evaluate_options")).toBeVisible()
  expect(within(flightTrace).getByText("human", { exact: true })).toBeVisible()
  fireEvent.click(screen.getByRole("button", { name: "Close flight recorder" }))
  fireEvent.change(screen.getByLabelText("Rejection reason for OPTION-B"), {
    target: { value: "requires_engineering_review" },
  })
  fireEvent.click(screen.getAllByRole("button", { name: /reject option/i })[1])
  fireEvent.click(screen.getByRole("button", { name: /create field constraint/i }))

  expect(screen.getByText("Options available")).toBeVisible()
  expect(screen.getByText("OPTION-A - Reroute through Corridor C")).toBeVisible()
  expect(screen.getByText("Option Comparison")).toBeVisible()
  expect(screen.getByText("Decision note")).toBeVisible()
  expect(screen.getByText("Rejection reason: Requires engineering review")).toBeVisible()
  expect(screen.getByText("Rejected by reviewer: requires engineering review.")).toBeVisible()
  expect(screen.getByText("Constraint added")).toBeVisible()
})

it("keeps approval human-only and renders the final draft change order", () => {
  render(<App />)

  fireEvent.click(screen.getByRole("button", { name: /evaluate options/i }))
  fireEvent.click(screen.getByRole("button", { name: /create field constraint/i }))
  fireEvent.click(screen.getAllByRole("button", { name: /^Revise$/i })[0])

  expect(screen.getByText("Avoids CONSTRAINT-12")).toBeVisible()
  expect(screen.getByText("Balances constructability, cost, and milestone protection after the field constraint.")).toBeVisible()
  expect(document.querySelector('[data-route-state="before"]')).not.toBeNull()
  expect(document.querySelector('[data-route-state="after"]')).not.toBeNull()
  expect(screen.getByText(/After · OPTION-A revision 2 clears constraint/)).toBeVisible()

  fireEvent.click(screen.getAllByRole("button", { name: /^Select$/i })[0])
  fireEvent.click(screen.getByRole("button", { name: /simulate impact/i }))

  expect(screen.getByRole("heading", { name: "Change Ripple X-Ray" })).toBeVisible()
  expect(screen.getByRole("button", { name: /replay ripple/i })).toBeEnabled()
  expect(screen.getByText("MEP-342 shifts")).toBeVisible()
  expect(screen.getByText("+$6,500 net change")).toBeVisible()
  const versionBeforeReplay = useDecisionRoomStore.getState().stateVersion
  fireEvent.click(screen.getByRole("button", { name: /replay ripple/i }))
  expect(useDecisionRoomStore.getState().stateVersion).toBe(versionBeforeReplay)

  fireEvent.click(screen.getByRole("button", { name: /prepare decision/i }))

  expect(screen.getByText("Ready for approval")).toBeVisible()
  expect(screen.getByRole("button", { name: /approve decision/i })).toBeEnabled()
  expect(screen.getByText("DEC-019 is ready for human approval.")).toBeVisible()
  expect(screen.getByRole("heading", { name: "Decision Receipt" })).toBeVisible()
  expect(screen.getByText("Awaiting human approval")).toBeVisible()
  expect(screen.getByText(/DEC-019 \/ OPTION-A\.r2 \/ CONSTRAINT-12 \/ v6/)).toBeVisible()
  expect(screen.getByRole("link", { name: /Flight provenance/i })).toHaveAttribute("href", "#agent-flight-recorder")

  fireEvent.click(screen.getByRole("button", { name: /approve decision/i }))
  fireEvent.click(screen.getByRole("button", { name: /draft change order/i }))

  expect(screen.getAllByText("Change order drafted")[0]).toBeVisible()
  expect(screen.getAllByText("CO-007")[0]).toBeVisible()
  expect(screen.getAllByText("+$6,500")[0]).toBeVisible()
  expect(screen.getByText("MEP-04 — Northline Mechanical")).toBeVisible()
  expect(screen.getByText("Human approved")).toBeVisible()
  expect(screen.getByText("CO-007 is a draft only; no contract was executed.")).toBeVisible()
})

it("uses strategy-aware language in the change ripple", () => {
  render(<App />)

  fireEvent.click(screen.getByRole("button", { name: /evaluate options/i }))
  fireEvent.click(screen.getAllByRole("button", { name: /^Select$/i })[1])
  fireEvent.click(screen.getByRole("button", { name: /simulate impact/i }))

  expect(screen.getByText("OPTION-B r1 reshapes D22")).toBeVisible()
  expect(screen.getByText("Uses the evaluated resized section on M-204.")).toBeVisible()
})

it("renders hostile constraint labels as text and keeps keyboard preview transient", () => {
  render(<App />)

  fireEvent.click(screen.getByRole("button", { name: /evaluate options/i }))
  const beforePreviewVersion = useDecisionRoomStore.getState().stateVersion
  fireEvent.focus(screen.getByText("OPTION-B - Resize duct section").closest("[tabindex]")!)

  expect(useDecisionRoomStore.getState().previewOptionId).toBe("OPTION-B")
  expect(useDecisionRoomStore.getState().selectedOptionId).toBeNull()
  expect(useDecisionRoomStore.getState().stateVersion).toBe(beforePreviewVersion)

  const hostileLabel = '<img src=x onerror="window.compromised=true">'
  fireEvent.change(screen.getByLabelText("Label"), { target: { value: hostileLabel } })
  fireEvent.click(screen.getByRole("button", { name: /create field constraint/i }))

  expect(useDecisionRoomStore.getState().constraints[0]?.label).toBe(hostileLabel)
  expect(document.querySelector("img")).toBeNull()
  expect(screen.getAllByText(hostileLabel).length).toBeGreaterThan(0)
})

import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"

import { App } from "./App"
import { useDecisionRoomStore } from "./store/decision-room-store"
import { createInitialDecisionState } from "./domain/decision"
import { resetDecisionToolRegistryForTests } from "./webmcp/decision-tool-registry"

afterEach(() => {
  resetDecisionToolRegistryForTests()
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
})

it("materializes options and creates a keyboard coordinate constraint", () => {
  render(<App />)

  fireEvent.click(screen.getByRole("button", { name: /evaluate options/i }))
  fireEvent.click(screen.getByRole("button", { name: /create constraint-12/i }))

  expect(screen.getByText("Options available")).toBeVisible()
  expect(screen.getByText("OPTION-A - Reroute through Corridor C")).toBeVisible()
  expect(screen.getByText("Constraint added")).toBeVisible()
})

it("keeps approval human-only and renders the final draft change order", () => {
  render(<App />)

  fireEvent.click(screen.getByRole("button", { name: /evaluate options/i }))
  fireEvent.click(screen.getByRole("button", { name: /create constraint-12/i }))
  fireEvent.click(screen.getAllByRole("button", { name: /^Revise$/i })[0])
  fireEvent.click(screen.getAllByRole("button", { name: /^Select$/i })[0])
  fireEvent.click(screen.getByRole("button", { name: /simulate impact/i }))
  fireEvent.click(screen.getByRole("button", { name: /prepare decision/i }))

  expect(screen.getByText("Ready for approval")).toBeVisible()
  expect(screen.getByRole("button", { name: /approve decision/i })).toBeEnabled()
  expect(screen.getByText("DEC-019 is ready for human approval.")).toBeVisible()

  fireEvent.click(screen.getByRole("button", { name: /approve decision/i }))
  fireEvent.click(screen.getByRole("button", { name: /draft change order/i }))

  expect(screen.getAllByText("Change order drafted")[0]).toBeVisible()
  expect(screen.getAllByText("CO-007")[0]).toBeVisible()
  expect(screen.getAllByText("+$6,500")[0]).toBeVisible()
  expect(screen.getByText("MEP-04 — Summit Mechanical")).toBeVisible()
})

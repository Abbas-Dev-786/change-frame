import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"

import { App } from "./App"
import { useDecisionRoomStore } from "./store/decision-room-store"
import { createInitialDecisionState } from "./domain/decision"

afterEach(() => {
  window.sessionStorage.clear()
  useDecisionRoomStore.setState(createInitialDecisionState())
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

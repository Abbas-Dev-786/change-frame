import { expect, test, type Page } from "@playwright/test"

type ToolResponse = { success: boolean; stateVersion: number; error?: string; data?: Record<string, unknown> }
type TestTool = { name: string; execute: (input: unknown, options?: { signal?: AbortSignal }) => Promise<ToolResponse> | ToolResponse }

declare global {
  interface Window { webMcpTestHarness: { execute: (name: string, input: unknown) => Promise<ToolResponse>; names: () => string[] } }
}

const liveContext = {
  project: { id: "PRJ-LIVE", name: "Live Airport Expansion", budget: 45000000, currentForecast: 45100000, currency: "USD" },
  activeIssue: { id: "ISS-LIVE-7", title: "Cable tray conflicts with smoke barrier", description: "The proposed tray crosses a protected smoke-barrier access zone.", severity: "high", status: "Decision required", drawingId: "E-301", location: "Concourse B level 3", elementIds: ["TRAY-7", "WALL-SB2"], affectedActivityIds: ["ELEC-30"], affectedContractIds: ["ELEC-2"] },
  drawings: [{ id: "E-301", name: "Concourse B electrical coordination", discipline: "electrical", level: "Level 3" }],
  drawingElements: [
    { id: "TRAY-7", type: "cable_tray", label: "Main cable tray", drawingId: "E-301", geometry: { x: 90, y: 240, width: 560, height: 28 }, trade: "electrical" },
    { id: "WALL-SB2", type: "wall", label: "Smoke barrier SB2", drawingId: "E-301", geometry: { x: 420, y: 150, width: 45, height: 220 }, trade: "architectural" },
  ],
  schedule: [{ id: "ELEC-30", name: "Install main tray", start: "2026-11-01", finish: "2026-11-05", durationDays: 5, trade: "electrical", dependencies: [] }],
  contracts: [{ id: "ELEC-2", name: "Electrical package", trade: "electrical", contractor: "VoltWorks", value: 6400000 }],
  baselineConstraints: [{ id: "BASE-SMOKE", type: "code", label: "Smoke barrier access must remain clear" }],
  planViewBox: { width: 760, height: 520 }, activeDrawingId: "E-301",
}

const options = [
  { id: "ALT-BYPASS", strategy: "overhead-bypass", title: "Bypass through service bay", description: "Route the tray around the protected access zone.", rationale: "Preserves fire access and avoids reworking the barrier.", assumptions: ["Service bay clearance is available"], confidence: 0.76, costImpact: 8800, scheduleImpactDays: 2, risk: "medium", route: { label: "Initial service-bay route", points: [{ x: 90, y: 250 }, { x: 680, y: 250 }] } },
  { id: "ALT-DROP", strategy: "vertical-drop", title: "Drop below the barrier zone", description: "Use a vertical drop and low-level crossing.", rationale: "Reduces horizontal rerouting but adds access coordination.", assumptions: ["Low-level access remains maintainable"], confidence: 0.61, costImpact: 6200, scheduleImpactDays: 3, risk: "high", route: { label: "Low crossing", points: [{ x: 90, y: 410 }, { x: 680, y: 410 }] } },
]

const starterDemoOptions = [
  {
    id: "ALT-EAST",
    strategy: "corridor-reroute",
    title: "Reroute through the east corridor bay",
    description: "Offset duct D22 around beam B14 and reconnect beyond the electrical riser zone.",
    rationale: "Preserves the structural beam and maintains the original duct section while using accessible corridor space.",
    assumptions: ["The corridor ceiling has sufficient clear height", "Two additional elbows are acceptable to the mechanical engineer"],
    confidence: 0.78,
    costImpact: 4800,
    scheduleImpactDays: 1,
    risk: "medium",
    route: { label: "Initial east corridor route", points: [{ x: 124, y: 250 }, { x: 340, y: 250 }, { x: 560, y: 250 }, { x: 682, y: 250 }] },
  },
  {
    id: "ALT-HIGH",
    strategy: "high-level-offset",
    title: "Raise the duct above the conflict zone",
    description: "Introduce a high-level offset before B14 and return to the original elevation downstream.",
    rationale: "Avoids structural modification and keeps the route inside the mechanical coordination zone.",
    assumptions: ["The upper plenum has verified clearance", "Hangers can connect without loading B14"],
    confidence: 0.64,
    costImpact: 5900,
    scheduleImpactDays: 2,
    risk: "medium",
    route: { label: "High-level bypass", points: [{ x: 124, y: 250 }, { x: 320, y: 250 }, { x: 320, y: 130 }, { x: 682, y: 130 }] },
  },
  {
    id: "ALT-SPLIT",
    strategy: "parallel-branches",
    title: "Split the supply run below B14",
    description: "Divide the supply into two smaller branches through the south service zone and recombine downstream.",
    rationale: "Reduces individual duct depth and avoids modifying structural or electrical elements.",
    assumptions: ["Air balancing can maintain the design flow", "South service-zone access remains available"],
    confidence: 0.7,
    costImpact: 7200,
    scheduleImpactDays: 2,
    risk: "low",
    route: { label: "South split route", points: [{ x: 124, y: 250 }, { x: 300, y: 250 }, { x: 300, y: 380 }, { x: 682, y: 380 }] },
  },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const tools = new Map<string, TestTool>(); const loads = Number(window.name.replace("changeframe-loads:", "")) || 0; window.name = `changeframe-loads:${loads + 1}`
    Object.defineProperty(document, "modelContext", { configurable: true, value: { registerTool: async (tool: TestTool, options?: { signal?: AbortSignal }) => { tools.set(tool.name, tool); options?.signal?.addEventListener("abort", () => { if (tools.get(tool.name) === tool) tools.delete(tool.name) }, { once: true }) } } })
    window.webMcpTestHarness = { execute: async (name, input) => { const tool = tools.get(name); if (!tool) throw new Error(`Tool ${name} is not registered.`); return tool.execute(input, { signal: new AbortController().signal }) }, names: () => [...tools.keys()] }
  })
})

test("rehearses the complete starter-project demo video flow", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Starter project ready" })).toBeVisible()
  await expect(page.getByText("0 agent proposals")).toBeVisible()

  expect((await executeTool(page, "evaluate_resolution_options", { expectedStateVersion: 1, options: starterDemoOptions })).success).toBe(true)
  await expect(page.getByText("ALT-EAST - Reroute through the east corridor bay")).toBeVisible()
  await expect(page.getByText("78% confidence")).toBeVisible()

  await page.getByLabel("Label").fill("Electrical riser access")
  await page.getByRole("button", { name: "Create field constraint" }).click()
  await expect(page.getByText("Needs revision")).toBeVisible()
  await expectToolNames(page, ["get_decision_context", "get_user_constraints", "revise_resolution_option"])

  const { id: _id, ...eastOption } = starterDemoOptions[0]
  const revision = {
    ...eastOption,
    description: "Route D22 below the human-marked riser access region and reconnect downstream.",
    rationale: "The south bypass preserves B14 and keeps the electrical-riser access rectangle unobstructed.",
    assumptions: [...eastOption.assumptions, "The south service zone remains clear during installation"],
    confidence: 0.82,
    costImpact: 5300,
    route: { label: "Validated south bypass", points: [{ x: 124, y: 250 }, { x: 340, y: 250 }, { x: 340, y: 380 }, { x: 682, y: 380 }] },
  }
  expect((await executeTool(page, "revise_resolution_option", { optionId: "ALT-EAST", constraintIds: ["CONSTRAINT-1"], expectedOptionRevision: 1, expectedStateVersion: 3, revision })).success).toBe(true)
  await expect(page.getByText("Revised")).toBeVisible()
  await expect(page.getByRole("cell", { name: "Avoids CONSTRAINT-1" })).toBeVisible()

  await page.getByRole("button", { name: "Select", exact: true }).first().click()
  const mitigation = { id: "MIT-PREFAB", type: "prefabrication", label: "Prefabricate duct offsets", rationale: "Off-site fabrication can recover the added field-installation day.", additionalCost: 1200, daysRecovered: 1, confidence: 0.74 }
  expect((await executeTool(page, "simulate_project_impact", { expectedStateVersion: 5, mitigation })).success).toBe(true)
  await expect(page.getByText("+$6,500 net change")).toBeVisible()
  expect((await executeTool(page, "prepare_change_decision", { expectedStateVersion: 6 })).success).toBe(true)
  await expect(page.getByText("Awaiting human approval")).toBeVisible()
  await expectToolNames(page, ["get_decision_context", "get_user_constraints"])
  expect(await page.evaluate(() => window.webMcpTestHarness.names().includes("approve_decision"))).toBe(false)

  await page.getByRole("button", { name: "Approve decision" }).click()
  await expectToolNames(page, ["get_decision_context", "get_user_constraints", "draft_change_order"])
  expect((await executeTool(page, "draft_change_order", { expectedStateVersion: 8 })).success).toBe(true)
  await expect(page.getByText("CO-ISS-019").first()).toBeVisible()
  await expect(page.getByText("Human approved")).toBeVisible()

  await page.getByRole("button", { name: "Open Agent Flight Recorder" }).click()
  await expect(page.getByText("Live capability choreography and actor-attributed state trace.")).toBeVisible()
  await expect(page.getByText("approve_decision").last()).toBeVisible()
})

test("solves a runtime-supplied decision with agent-authored alternatives", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Starter project ready" })).toBeVisible()
  await expectToolNames(page, ["get_decision_context", "get_user_constraints", "configure_decision_context", "evaluate_resolution_options"])

  expect((await executeTool(page, "configure_decision_context", { ...liveContext, expectedStateVersion: 1 })).success).toBe(true)
  await expect(page.getByText(/Live Airport Expansion/)).toBeVisible()
  await expectToolNames(page, ["get_decision_context", "get_user_constraints", "configure_decision_context", "evaluate_resolution_options"])

  expect((await executeTool(page, "evaluate_resolution_options", { expectedStateVersion: 2, options })).success).toBe(true)
  await expect(page.getByText("ALT-BYPASS - Bypass through service bay")).toBeVisible()
  await expect(page.getByText("76% confidence")).toBeVisible()

  await page.getByRole("button", { name: "Create field constraint" }).click()
  await expectToolNames(page, ["get_decision_context", "get_user_constraints", "revise_resolution_option"])
  const { id: _id, ...revisionBase } = options[0]
  const revision = { ...revisionBase, rationale: "Moves below the human-marked access restriction while maintaining tray bend radius.", confidence: 0.81, route: { label: "Validated south bypass", points: [{ x: 90, y: 390 }, { x: 680, y: 390 }] } }
  expect((await executeTool(page, "revise_resolution_option", { optionId: "ALT-BYPASS", constraintIds: ["CONSTRAINT-1"], expectedOptionRevision: 1, expectedStateVersion: 4, revision })).success).toBe(true)
  await expect(page.getByRole("cell", { name: "Avoids CONSTRAINT-1" })).toBeVisible()

  await page.getByRole("button", { name: "Select", exact: true }).first().click()
  const mitigation = { id: "MIT-PREFAB", type: "prefabrication", label: "Prefabricate tray offsets", rationale: "Parallel fabrication recovers one field day.", additionalCost: 1400, daysRecovered: 1, confidence: 0.72 }
  const simulation = await executeTool(page, "simulate_project_impact", { expectedStateVersion: 6, mitigation })
  expect(simulation.success).toBe(true)
  await expect(page.getByText("+$10,200 net change")).toBeVisible()

  expect((await executeTool(page, "prepare_change_decision", { expectedStateVersion: 7 })).success).toBe(true)
  await expect(page.getByText("Awaiting human approval")).toBeVisible()
  await expectToolNames(page, ["get_decision_context", "get_user_constraints"])
  await page.getByRole("button", { name: "Approve decision" }).click()
  expect((await executeTool(page, "draft_change_order", { expectedStateVersion: 9 })).success).toBe(true)
  await expect(page.getByText("CO-ISS-LIVE-7").first()).toBeVisible()
  await expect(page.getByText("Human approved")).toBeVisible()
  expect(await page.evaluate(() => window.name)).toBe("changeframe-loads:1")
})

test("rejects intersecting agent revisions and stale state", async ({ page }) => {
  await page.goto("/")
  await executeTool(page, "configure_decision_context", { ...liveContext, expectedStateVersion: 1 })
  await executeTool(page, "evaluate_resolution_options", { expectedStateVersion: 2, options })
  await page.getByRole("button", { name: "Create field constraint" }).click()
  const { id: _id, ...revisionBase } = options[0]
  const blocked = await executeTool(page, "revise_resolution_option", { optionId: "ALT-BYPASS", constraintIds: ["CONSTRAINT-1"], expectedOptionRevision: 1, expectedStateVersion: 4, revision: revisionBase })
  expect(blocked.success).toBe(false); expect(blocked.error).toBe("UNSUPPORTED_CONSTRAINT_GEOMETRY"); expect(blocked.stateVersion).toBe(4)
  const stale = await executeTool(page, "revise_resolution_option", { optionId: "ALT-BYPASS", constraintIds: ["CONSTRAINT-1"], expectedOptionRevision: 1, expectedStateVersion: 3, revision: revisionBase })
  expect(stale.success).toBe(false); expect(stale.error).toBe("STATE_CONFLICT")
})

test("persists arbitrary context and resets to the starter project", async ({ page }) => {
  await page.goto("/")
  await executeTool(page, "configure_decision_context", { ...liveContext, expectedStateVersion: 1 })
  await page.reload(); await expect(page.getByText(/Live Airport Expansion/)).toBeVisible()
  await page.getByRole("button", { name: "Reset workflow" }).click()
  await expect(page.getByRole("heading", { name: "Starter project ready" })).toBeVisible()
  await expect(page.getByText(/Riverside Office Tower/).first()).toBeVisible()
  await expect(page.getByText("v3", { exact: true })).toBeVisible()
  await expectToolNames(page, ["get_decision_context", "get_user_constraints", "configure_decision_context", "evaluate_resolution_options"])
})

async function executeTool(page: Page, name: string, input: unknown): Promise<ToolResponse> {
  return page.evaluate(async ({ toolName, toolInput }) => window.webMcpTestHarness.execute(toolName, toolInput), { toolName: name, toolInput: input })
}

async function expectToolNames(page: Page, expectedNames: string[]): Promise<void> {
  await expect.poll(() => page.evaluate(() => window.webMcpTestHarness.names())).toEqual(expectedNames)
}

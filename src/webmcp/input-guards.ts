import type {
  AgentMitigationProposal,
  AgentOptionProposal,
  BaselineConstraint,
  Contract,
  DecisionContextInput,
  Drawing,
  DrawingElement,
  Issue,
  PlanViewBox,
  Project,
  ScheduleActivity,
  Trade,
} from "@/src/domain/decision"
import type { EvaluateOptionsInput, RevisionInput, SimulateImpactInput } from "@/src/domain/decision/actions"

type ConfigureInput = Omit<DecisionContextInput, "source">

export function parseEmptyInput(input: unknown): Record<string, never> | null {
  return isRecord(input) && hasExactKeys(input, []) ? {} : null
}

export function parseExpectedVersionInput(input: unknown): { expectedStateVersion: number } | null {
  return isRecord(input) && hasExactKeys(input, ["expectedStateVersion"]) && isNonNegativeInteger(input.expectedStateVersion)
    ? { expectedStateVersion: input.expectedStateVersion }
    : null
}

export function parseConfigureContextInput(input: unknown): ConfigureInput | null {
  const keys = ["expectedStateVersion", "project", "activeIssue", "drawings", "drawingElements", "schedule", "contracts", "baselineConstraints", "planViewBox", "activeDrawingId"]
  if (!isRecord(input) || !hasExactKeys(input, keys) || !isNonNegativeInteger(input.expectedStateVersion) || !isProject(input.project) || !isIssue(input.activeIssue) || !isDrawingList(input.drawings) || !isElementList(input.drawingElements) || !isSchedule(input.schedule) || !isContracts(input.contracts) || !isBaselineConstraints(input.baselineConstraints) || !isPlanViewBox(input.planViewBox) || !isNonEmptyString(input.activeDrawingId)) return null
  return {
    expectedStateVersion: input.expectedStateVersion,
    project: input.project,
    activeIssue: input.activeIssue,
    drawings: input.drawings,
    drawingElements: input.drawingElements,
    schedule: input.schedule,
    contracts: input.contracts,
    baselineConstraints: input.baselineConstraints,
    planViewBox: input.planViewBox,
    activeDrawingId: input.activeDrawingId,
  }
}

export function parseEvaluateOptionsInput(input: unknown): EvaluateOptionsInput | null {
  if (!isRecord(input) || !hasExactKeys(input, ["expectedStateVersion", "options"]) || !isNonNegativeInteger(input.expectedStateVersion) || !Array.isArray(input.options) || !input.options.every(isAgentOptionProposal)) return null
  return { expectedStateVersion: input.expectedStateVersion, options: input.options }
}

export function parseReviseOptionInput(input: unknown): RevisionInput | null {
  if (!isRecord(input) || !hasExactKeys(input, ["optionId", "constraintIds", "expectedOptionRevision", "expectedStateVersion", "revision"]) || !isNonEmptyString(input.optionId) || !isStringList(input.constraintIds) || input.constraintIds.length === 0 || !isNonNegativeInteger(input.expectedOptionRevision) || !isNonNegativeInteger(input.expectedStateVersion) || !isRevision(input.revision)) return null
  return { optionId: input.optionId, constraintIds: input.constraintIds, expectedOptionRevision: input.expectedOptionRevision, expectedStateVersion: input.expectedStateVersion, revision: input.revision }
}

export function parseSimulateImpactInput(input: unknown): SimulateImpactInput | null {
  if (!isRecord(input) || !hasExactKeys(input, ["mitigation", "expectedStateVersion"]) || !isNonNegativeInteger(input.expectedStateVersion) || !(input.mitigation === null || isMitigation(input.mitigation))) return null
  return { mitigation: input.mitigation, expectedStateVersion: input.expectedStateVersion }
}

function isProject(value: unknown): value is Project {
  return isRecord(value) && hasExactKeys(value, ["id", "name", "budget", "currentForecast", "currency"]) && isNonEmptyString(value.id) && isNonEmptyString(value.name) && isFiniteNumber(value.budget) && isFiniteNumber(value.currentForecast) && isNonEmptyString(value.currency)
}

function isIssue(value: unknown): value is Issue {
  return isRecord(value) && hasExactKeys(value, ["id", "title", "description", "severity", "status", "drawingId", "location", "elementIds", "affectedActivityIds", "affectedContractIds"]) && isNonEmptyString(value.id) && isNonEmptyString(value.title) && isNonEmptyString(value.description) && isRisk(value.severity) && isNonEmptyString(value.status) && isNonEmptyString(value.drawingId) && isNonEmptyString(value.location) && isStringList(value.elementIds) && isStringList(value.affectedActivityIds) && isStringList(value.affectedContractIds)
}

function isDrawingList(value: unknown): value is Drawing[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => isRecord(item) && hasExactKeys(item, ["id", "name", "discipline", "level"]) && isNonEmptyString(item.id) && isNonEmptyString(item.name) && isTrade(item.discipline) && isNonEmptyString(item.level))
}

function isElementList(value: unknown): value is DrawingElement[] {
  const types = ["duct", "beam", "riser", "corridor", "room", "wall", "pipe", "cable_tray", "equipment", "generic"]
  return Array.isArray(value) && value.every((item) => isRecord(item) && hasExactKeys(item, ["id", "type", "label", "drawingId", "geometry", "trade"]) && isNonEmptyString(item.id) && types.includes(String(item.type)) && isNonEmptyString(item.label) && isNonEmptyString(item.drawingId) && isRect(item.geometry) && isTrade(item.trade))
}

function isSchedule(value: unknown): value is ScheduleActivity[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && hasExactKeys(item, ["id", "name", "start", "finish", "durationDays", "trade", "dependencies"]) && isNonEmptyString(item.id) && isNonEmptyString(item.name) && isNonEmptyString(item.start) && isNonEmptyString(item.finish) && isNonNegativeInteger(item.durationDays) && isTrade(item.trade) && isStringList(item.dependencies))
}

function isContracts(value: unknown): value is Contract[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && hasExactKeys(item, ["id", "name", "trade", "contractor", "value"]) && isNonEmptyString(item.id) && isNonEmptyString(item.name) && isTrade(item.trade) && isNonEmptyString(item.contractor) && isFiniteNumber(item.value))
}

function isBaselineConstraints(value: unknown): value is BaselineConstraint[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && hasExactKeys(item, ["id", "type", "label"]) && isNonEmptyString(item.id) && isNonEmptyString(item.type) && isNonEmptyString(item.label))
}

function isPlanViewBox(value: unknown): value is PlanViewBox {
  return isRecord(value) && hasExactKeys(value, ["width", "height"]) && isFiniteNumber(value.width) && isFiniteNumber(value.height)
}

function isAgentOptionProposal(value: unknown): value is AgentOptionProposal {
  return isRecord(value) && hasExactKeys(value, ["id", "strategy", "title", "description", "rationale", "assumptions", "confidence", "costImpact", "scheduleImpactDays", "risk", "route"]) && isNonEmptyString(value.id) && isNonEmptyString(value.strategy) && isNonEmptyString(value.title) && isNonEmptyString(value.description) && isNonEmptyString(value.rationale) && isStringList(value.assumptions) && isFiniteNumber(value.confidence) && isFiniteNumber(value.costImpact) && isNonNegativeInteger(value.scheduleImpactDays) && isRisk(value.risk) && (value.route === null || isRoute(value.route))
}

function isRevision(value: unknown): value is Omit<AgentOptionProposal, "id"> {
  return isRecord(value) && hasExactKeys(value, ["strategy", "title", "description", "rationale", "assumptions", "confidence", "costImpact", "scheduleImpactDays", "risk", "route"]) && isAgentOptionProposal({ ...value, id: "revision" })
}

function isMitigation(value: unknown): value is AgentMitigationProposal {
  return isRecord(value) && hasExactKeys(value, ["id", "type", "label", "rationale", "additionalCost", "daysRecovered", "confidence"]) && isNonEmptyString(value.id) && isNonEmptyString(value.type) && isNonEmptyString(value.label) && isNonEmptyString(value.rationale) && isFiniteNumber(value.additionalCost) && isNonNegativeInteger(value.daysRecovered) && isFiniteNumber(value.confidence)
}

function isRoute(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["label", "points"]) && isNonEmptyString(value.label) && Array.isArray(value.points) && value.points.every((point) => isRecord(point) && hasExactKeys(point, ["x", "y"]) && isFiniteNumber(point.x) && isFiniteNumber(point.y))
}

function isRect(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["x", "y", "width", "height"]) && [value.x, value.y, value.width, value.height].every(isFiniteNumber)
}

function isTrade(value: unknown): value is Trade {
  return ["mechanical", "structural", "electrical", "architectural", "plumbing", "fire_protection", "civil", "general"].includes(String(value))
}

function isRisk(value: unknown): value is "low" | "medium" | "high" { return value === "low" || value === "medium" || value === "high" }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value) }
function isStringList(value: unknown): value is string[] { return Array.isArray(value) && value.every(isNonEmptyString) }
function isNonEmptyString(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0 }
function isFiniteNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) }
function isNonNegativeInteger(value: unknown): value is number { return typeof value === "number" && Number.isInteger(value) && value >= 0 }
function hasExactKeys(value: Record<string, unknown>, expectedKeys: string[]): boolean {
  const actual = Object.keys(value).sort(); const expected = [...expectedKeys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

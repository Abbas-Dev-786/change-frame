import type { JsonSchema } from "./model-context"

const idSchema: JsonSchema = { type: "string", minLength: 2, maxLength: 40, pattern: "^[A-Za-z0-9][A-Za-z0-9_-]+$" }
const textSchema: JsonSchema = { type: "string", minLength: 1, maxLength: 800 }
const tradeSchema: JsonSchema = { type: "string", enum: ["mechanical", "structural", "electrical", "architectural", "plumbing", "fire_protection", "civil", "general"] }
const pointSchema: JsonSchema = {
  type: "object",
  properties: { x: { type: "number", minimum: 0 }, y: { type: "number", minimum: 0 } },
  required: ["x", "y"],
  additionalProperties: false,
}
const rectSchema: JsonSchema = {
  type: "object",
  properties: {
    x: { type: "number", minimum: 0 },
    y: { type: "number", minimum: 0 },
    width: { type: "number", minimum: 1 },
    height: { type: "number", minimum: 1 },
  },
  required: ["x", "y", "width", "height"],
  additionalProperties: false,
}

export const emptyInputSchema: JsonSchema = { type: "object", properties: {}, additionalProperties: false }

export const expectedVersionSchema: JsonSchema = {
  type: "object",
  properties: { expectedStateVersion: { type: "integer", minimum: 0 } },
  required: ["expectedStateVersion"],
  additionalProperties: false,
}

export const configureContextSchema: JsonSchema = {
  type: "object",
  properties: {
    expectedStateVersion: { type: "integer", minimum: 0 },
    project: {
      type: "object",
      properties: { id: idSchema, name: textSchema, budget: { type: "number", minimum: 0 }, currentForecast: { type: "number", minimum: 0 }, currency: { type: "string", minLength: 3, maxLength: 3 } },
      required: ["id", "name", "budget", "currentForecast", "currency"], additionalProperties: false,
    },
    activeIssue: {
      type: "object",
      properties: {
        id: idSchema, title: textSchema, description: textSchema,
        severity: { type: "string", enum: ["low", "medium", "high"] }, status: textSchema,
        drawingId: idSchema, location: textSchema,
        elementIds: { type: "array", items: idSchema, maxItems: 20, uniqueItems: true },
        affectedActivityIds: { type: "array", items: idSchema, maxItems: 20, uniqueItems: true },
        affectedContractIds: { type: "array", items: idSchema, maxItems: 20, uniqueItems: true },
      },
      required: ["id", "title", "description", "severity", "status", "drawingId", "location", "elementIds", "affectedActivityIds", "affectedContractIds"], additionalProperties: false,
    },
    drawings: {
      type: "array", minItems: 1, maxItems: 10,
      items: { type: "object", properties: { id: idSchema, name: textSchema, discipline: tradeSchema, level: textSchema }, required: ["id", "name", "discipline", "level"], additionalProperties: false },
    },
    drawingElements: {
      type: "array", maxItems: 80,
      items: { type: "object", properties: { id: idSchema, type: { type: "string", enum: ["duct", "beam", "riser", "corridor", "room", "wall", "pipe", "cable_tray", "equipment", "generic"] }, label: textSchema, drawingId: idSchema, geometry: rectSchema, trade: tradeSchema }, required: ["id", "type", "label", "drawingId", "geometry", "trade"], additionalProperties: false },
    },
    schedule: {
      type: "array", maxItems: 60,
      items: { type: "object", properties: { id: idSchema, name: textSchema, start: textSchema, finish: textSchema, durationDays: { type: "integer", minimum: 0 }, trade: tradeSchema, dependencies: { type: "array", items: idSchema, maxItems: 20, uniqueItems: true } }, required: ["id", "name", "start", "finish", "durationDays", "trade", "dependencies"], additionalProperties: false },
    },
    contracts: {
      type: "array", maxItems: 40,
      items: { type: "object", properties: { id: idSchema, name: textSchema, trade: tradeSchema, contractor: textSchema, value: { type: "number", minimum: 0 } }, required: ["id", "name", "trade", "contractor", "value"], additionalProperties: false },
    },
    baselineConstraints: {
      type: "array", maxItems: 20,
      items: { type: "object", properties: { id: idSchema, type: textSchema, label: textSchema }, required: ["id", "type", "label"], additionalProperties: false },
    },
    planViewBox: { type: "object", properties: { width: { type: "number", minimum: 100 }, height: { type: "number", minimum: 100 } }, required: ["width", "height"], additionalProperties: false },
    activeDrawingId: idSchema,
  },
  required: ["expectedStateVersion", "project", "activeIssue", "drawings", "drawingElements", "schedule", "contracts", "baselineConstraints", "planViewBox", "activeDrawingId"],
  additionalProperties: false,
}

const agentOptionSchema: JsonSchema = {
  type: "object",
  properties: {
    id: idSchema, strategy: textSchema, title: textSchema, description: textSchema, rationale: textSchema,
    assumptions: { type: "array", items: textSchema, maxItems: 8 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    costImpact: { type: "number" }, scheduleImpactDays: { type: "integer", minimum: 0 },
    risk: { type: "string", enum: ["low", "medium", "high"] },
    route: { type: ["object", "null"], properties: { label: textSchema, points: { type: "array", items: pointSchema, minItems: 2, maxItems: 30 } }, required: ["label", "points"], additionalProperties: false },
  },
  required: ["id", "strategy", "title", "description", "rationale", "assumptions", "confidence", "costImpact", "scheduleImpactDays", "risk", "route"],
  additionalProperties: false,
}

export const evaluateOptionsSchema: JsonSchema = {
  type: "object",
  properties: { expectedStateVersion: { type: "integer", minimum: 0 }, options: { type: "array", items: agentOptionSchema, minItems: 2, maxItems: 5 } },
  required: ["expectedStateVersion", "options"], additionalProperties: false,
}

const revisionSchema: JsonSchema = {
  ...agentOptionSchema,
  properties: Object.fromEntries(Object.entries(agentOptionSchema.properties ?? {}).filter(([key]) => key !== "id")),
  required: (agentOptionSchema.required ?? []).filter((key) => key !== "id"),
}

export const reviseOptionSchema: JsonSchema = {
  type: "object",
  properties: {
    optionId: idSchema,
    constraintIds: { type: "array", items: idSchema, minItems: 1, maxItems: 10, uniqueItems: true },
    expectedOptionRevision: { type: "integer", minimum: 1 },
    expectedStateVersion: { type: "integer", minimum: 0 },
    revision: revisionSchema,
  },
  required: ["optionId", "constraintIds", "expectedOptionRevision", "expectedStateVersion", "revision"], additionalProperties: false,
}

export const simulateImpactSchema: JsonSchema = {
  type: "object",
  properties: {
    expectedStateVersion: { type: "integer", minimum: 0 },
    mitigation: {
      type: ["object", "null"],
      properties: { id: idSchema, type: textSchema, label: textSchema, rationale: textSchema, additionalCost: { type: "number" }, daysRecovered: { type: "integer", minimum: 0 }, confidence: { type: "number", minimum: 0, maximum: 1 } },
      required: ["id", "type", "label", "rationale", "additionalCost", "daysRecovered", "confidence"], additionalProperties: false,
    },
  },
  required: ["expectedStateVersion", "mitigation"], additionalProperties: false,
}

import type { JsonSchema } from "./model-context"

export const emptyInputSchema: JsonSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
}

export const expectedVersionSchema: JsonSchema = {
  type: "object",
  properties: {
    expectedStateVersion: { type: "integer", minimum: 0 },
  },
  required: ["expectedStateVersion"],
  additionalProperties: false,
}

export const reviseOptionSchema: JsonSchema = {
  type: "object",
  properties: {
    optionId: { type: "string", enum: ["OPTION-A", "OPTION-B", "OPTION-C"] },
    constraintIds: {
      type: "array",
      items: { type: "string", enum: ["CONSTRAINT-12"] },
      minItems: 1,
      maxItems: 1,
      uniqueItems: true,
    },
    expectedOptionRevision: { type: "integer", minimum: 1 },
    expectedStateVersion: { type: "integer", minimum: 0 },
  },
  required: [
    "optionId",
    "constraintIds",
    "expectedOptionRevision",
    "expectedStateVersion",
  ],
  additionalProperties: false,
}

export const simulateImpactSchema: JsonSchema = {
  type: "object",
  properties: {
    preserveInspectionMilestone: { type: "boolean" },
    expectedStateVersion: { type: "integer", minimum: 0 },
  },
  required: ["preserveInspectionMilestone", "expectedStateVersion"],
  additionalProperties: false,
}

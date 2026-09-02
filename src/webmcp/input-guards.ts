import type { ConstraintId, OptionId } from "@/src/domain/decision"

export type EvaluateOptionsInput = {
  expectedStateVersion: number
}

export type ReviseOptionInput = {
  optionId: OptionId
  constraintIds: ConstraintId[]
  expectedOptionRevision: number
  expectedStateVersion: number
}

export type SimulateImpactInput = {
  preserveInspectionMilestone: boolean
  expectedStateVersion: number
}

export function parseEvaluateOptionsInput(input: unknown): EvaluateOptionsInput | null {
  if (!isRecord(input) || !isNonNegativeInteger(input.expectedStateVersion)) {
    return null
  }

  return {
    expectedStateVersion: input.expectedStateVersion,
  }
}

export function parseReviseOptionInput(input: unknown): ReviseOptionInput | null {
  if (
    !isRecord(input) ||
    !isOptionId(input.optionId) ||
    !isConstraintIdList(input.constraintIds) ||
    !isNonNegativeInteger(input.expectedOptionRevision) ||
    !isNonNegativeInteger(input.expectedStateVersion)
  ) {
    return null
  }

  return {
    optionId: input.optionId,
    constraintIds: input.constraintIds,
    expectedOptionRevision: input.expectedOptionRevision,
    expectedStateVersion: input.expectedStateVersion,
  }
}

export function parseSimulateImpactInput(input: unknown): SimulateImpactInput | null {
  if (
    !isRecord(input) ||
    typeof input.preserveInspectionMilestone !== "boolean" ||
    !isNonNegativeInteger(input.expectedStateVersion)
  ) {
    return null
  }

  return {
    preserveInspectionMilestone: input.preserveInspectionMilestone,
    expectedStateVersion: input.expectedStateVersion,
  }
}

export function parseExpectedVersionInput(input: unknown): EvaluateOptionsInput | null {
  return parseEvaluateOptionsInput(input)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}

function isOptionId(value: unknown): value is OptionId {
  return value === "OPTION-A" || value === "OPTION-B" || value === "OPTION-C"
}

function isConstraintIdList(value: unknown): value is ConstraintId[] {
  return (
    Array.isArray(value) &&
    value.length === 1 &&
    value[0] === "CONSTRAINT-12"
  )
}

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

export function parseEmptyInput(input: unknown): Record<string, never> | null {
  return isRecord(input) && hasExactKeys(input, []) ? {} : null
}

export function parseEvaluateOptionsInput(input: unknown): EvaluateOptionsInput | null {
  if (
    !isRecord(input) ||
    !hasExactKeys(input, ["expectedStateVersion"]) ||
    !isNonNegativeInteger(input.expectedStateVersion)
  ) {
    return null
  }

  return {
    expectedStateVersion: input.expectedStateVersion,
  }
}

export function parseReviseOptionInput(input: unknown): ReviseOptionInput | null {
  if (
    !isRecord(input) ||
    !hasExactKeys(input, [
      "optionId",
      "constraintIds",
      "expectedOptionRevision",
      "expectedStateVersion",
    ]) ||
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
    !hasExactKeys(input, ["preserveInspectionMilestone", "expectedStateVersion"]) ||
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

function hasExactKeys(value: Record<string, unknown>, expectedKeys: string[]): boolean {
  const actualKeys = Object.keys(value).sort()
  const sortedExpectedKeys = [...expectedKeys].sort()

  return (
    actualKeys.length === sortedExpectedKeys.length &&
    actualKeys.every((key, index) => key === sortedExpectedKeys[index])
  )
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

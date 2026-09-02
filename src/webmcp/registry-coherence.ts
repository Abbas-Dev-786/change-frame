let reconciliationTail: Promise<void> = Promise.resolve()

export function queueRegistryReconciliation(work: () => Promise<void>): Promise<void> {
  const next = reconciliationTail.then(work, work)

  reconciliationTail = next.catch(() => undefined)

  return next
}

export function waitForDecisionToolRegistryCoherence(): Promise<void> {
  return reconciliationTail
}

export function resetRegistryCoherenceForTests(): void {
  reconciliationTail = Promise.resolve()
}

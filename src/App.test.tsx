import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { App } from './App'
import { resetPhaseZeroForTests } from './webmcp/phaseZero'

afterEach(() => {
  resetPhaseZeroForTests()
  Object.defineProperty(document, 'modelContext', {
    configurable: true,
    value: undefined,
  })
})

it('keeps the human-facing spike usable when WebMCP is unavailable', async () => {
  Object.defineProperty(document, 'modelContext', {
    configurable: true,
    value: undefined,
  })

  render(<App />)

  expect(
    screen.getByRole('heading', {
      name: 'Prove the browser connection before building the product.',
    }),
  ).toBeVisible()
  await waitFor(() => {
    expect(screen.getByText('WebMCP unavailable')).toBeVisible()
  })
})

import { describe, expect, it } from 'vitest'
import {
  dfeAnalyticsEvents,
  dfeExperiments,
  dfeExperimentVariants,
} from '../src/schema'

function getExtraConfigBuilder(table: Record<PropertyKey, unknown>) {
  const builderSymbol = Object.getOwnPropertySymbols(table)
    .find((symbol) => String(symbol) === 'Symbol(drizzle:ExtraConfigBuilder)')
  const columnsSymbol = Object.getOwnPropertySymbols(table)
    .find((symbol) => String(symbol) === 'Symbol(drizzle:ExtraConfigColumns)')

  expect(builderSymbol).toBeDefined()
  expect(columnsSymbol).toBeDefined()

  return (table as any)[builderSymbol as symbol]((table as any)[columnsSymbol as symbol])
}

describe('drizzle schema exports', () => {
  it('exposes experiment indexes', () => {
    const config = getExtraConfigBuilder(dfeExperiments as unknown as Record<PropertyKey, unknown>)

    expect(config).toHaveProperty('formStatusIdx')
    expect(config).toHaveProperty('tenantStatusIdx')
  })

  it('exposes unique variant keys per experiment', () => {
    const config = getExtraConfigBuilder(dfeExperimentVariants as unknown as Record<PropertyKey, unknown>)

    expect(config).toHaveProperty('experimentKeyUnique')
  })

  it('exposes analytics indexes for tenant, submission, and event queries', () => {
    const config = getExtraConfigBuilder(dfeAnalyticsEvents as unknown as Record<PropertyKey, unknown>)

    expect(config).toHaveProperty('tenantFormOccurredIdx')
    expect(config).toHaveProperty('submissionOccurredIdx')
    expect(config).toHaveProperty('eventOccurredIdx')
  })
})

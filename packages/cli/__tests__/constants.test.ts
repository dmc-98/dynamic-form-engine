import { describe, it, expect } from 'vitest'
import { ORG_SCOPE, CORE_PKG, SERVER_PKG, EXPRESS_PKG, PRISMA_PKG, DRIZZLE_PKG, REACT_PKG } from '../src/constants'

describe('CLI Constants', () => {
  it('should have a valid org scope', () => {
    expect(ORG_SCOPE).toBe('@dmc-98')
    expect(ORG_SCOPE.startsWith('@')).toBe(true)
  })

  it('should prefix all packages with the org scope', () => {
    const packages = [CORE_PKG, SERVER_PKG, EXPRESS_PKG, PRISMA_PKG, DRIZZLE_PKG, REACT_PKG]
    for (const pkg of packages) {
      expect(pkg).toMatch(new RegExp(`^${ORG_SCOPE.replace('/', '\\/')}/dfe-`))
    }
  })

  it('should have correct package names', () => {
    expect(CORE_PKG).toBe('@dmc-98/dfe-core')
    expect(SERVER_PKG).toBe('@dmc-98/dfe-server')
    expect(EXPRESS_PKG).toBe('@dmc-98/dfe-express')
    expect(PRISMA_PKG).toBe('@dmc-98/dfe-prisma')
    expect(DRIZZLE_PKG).toBe('@dmc-98/dfe-drizzle')
    expect(REACT_PKG).toBe('@dmc-98/dfe-react')
  })
})

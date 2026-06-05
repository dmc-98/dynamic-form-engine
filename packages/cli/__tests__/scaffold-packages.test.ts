import { describe, expect, it } from 'vitest'
import {
  CORE_PKG,
  DRIZZLE_PKG,
  EXPRESS_PKG,
  PRISMA_PKG,
  REACT_PKG,
  SERVER_PKG,
} from '../src/constants'
import {
  MODULE_PACKAGES,
  getInitPackages,
  getModulePackages,
} from '../src/scaffold-packages'

describe('CLI scaffold package lists', () => {
  it('builds init package lists from real scoped package names', () => {
    expect(getInitPackages({})).toEqual([CORE_PKG])
    expect(getInitPackages({ prisma: true, express: true })).toEqual([
      CORE_PKG,
      PRISMA_PKG,
      SERVER_PKG,
      EXPRESS_PKG,
    ])
    expect(getInitPackages({ drizzle: true })).toEqual([
      CORE_PKG,
      DRIZZLE_PKG,
    ])
  })

  it('builds add-module package lists from real scoped package names', () => {
    expect(getModulePackages('prisma-schema')).toEqual([PRISMA_PKG, SERVER_PKG])
    expect(getModulePackages('drizzle-schema')).toEqual([DRIZZLE_PKG, SERVER_PKG])
    expect(getModulePackages('be-utils')).toEqual([SERVER_PKG, EXPRESS_PKG])
    expect(getModulePackages('fe-hooks')).toEqual([REACT_PKG, CORE_PKG])
  })

  it('never emits unresolved scope placeholders', () => {
    const packageLists = [
      getInitPackages({ prisma: true, drizzle: true, express: true }),
      ...Object.keys(MODULE_PACKAGES).map(moduleName =>
        getModulePackages(moduleName as keyof typeof MODULE_PACKAGES)
      ),
    ]

    for (const packages of packageLists) {
      expect(packages.some(pkg => pkg.includes('${ORG_SCOPE}'))).toBe(false)
    }
  })
})

import {
  CORE_PKG,
  DRIZZLE_PKG,
  EXPRESS_PKG,
  PRISMA_PKG,
  REACT_PKG,
  SERVER_PKG,
} from './constants'

export interface InitPackageOptions {
  prisma?: boolean
  drizzle?: boolean
  express?: boolean
}

export function getInitPackages(opts: InitPackageOptions): string[] {
  const packages = [CORE_PKG]

  if (opts.prisma) packages.push(PRISMA_PKG)
  if (opts.drizzle) packages.push(DRIZZLE_PKG)
  if (opts.express) packages.push(SERVER_PKG, EXPRESS_PKG)

  return packages
}

export const MODULE_PACKAGES = {
  'prisma-schema': [PRISMA_PKG, SERVER_PKG],
  'drizzle-schema': [DRIZZLE_PKG, SERVER_PKG],
  'be-utils': [SERVER_PKG, EXPRESS_PKG],
  'fe-hooks': [REACT_PKG, CORE_PKG],
} as const

export type SupportedModule = keyof typeof MODULE_PACKAGES

export function getModulePackages(moduleName: SupportedModule): string[] {
  return [...MODULE_PACKAGES[moduleName]]
}

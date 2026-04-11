/**
 * Centralized configuration for the Dynamic Form Engine monorepo.
 *
 * Update values here and run `pnpm run sync-config` to propagate
 * changes across all packages, docs, and examples.
 */

export const config = {
  /** npm scope — used in all package.json "name" fields */
  orgScope: '@dmc-98',

  /** GitHub organisation or user */
  githubOrg: 'snarjun98',

  /** GitHub repository name */
  githubRepo: 'dynamic-form-engine',

  /** Human-readable project name */
  projectName: 'Dynamic Form Engine',

  /** Short project name / CLI command */
  shortName: 'dfe',

  /** Base path for GitHub Pages docs */
  docsBasePath: '/dynamic-form-engine/',

  /** Author info for package.json files */
  author: 'snarjun98',

  /** License */
  license: 'MIT',
} as const

export type DfeConfig = typeof config

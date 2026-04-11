export { DrizzleDatabaseAdapter } from './adapter'
export type { DrizzleLike, DrizzleAdapterOptions } from './adapter'

// Re-export schema for convenience
export {
  dfeForms, dfeFormVersions, dfeSteps, dfeFields,
  dfeFieldOptions, dfeSubmissions,
} from './schema'

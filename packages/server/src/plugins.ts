import type { PluginDefinition } from '@dmc--98/dfe-core'

export interface PluginRegistry {
  /** Register a plugin */
  register(plugin: PluginDefinition): void
  /** Unregister a plugin */
  unregister(pluginId: string): void
  /** Get a registered plugin */
  get(pluginId: string): PluginDefinition | undefined
  /** Get all registered plugins */
  getAll(): PluginDefinition[]
  /** Check if a custom field type exists */
  hasFieldType(type: string): boolean
  /** Validate a value using a plugin validator */
  validate(validatorId: string, value: unknown, config: unknown): { valid: boolean; error?: string }
}

/**
 * Create a plugin registry for managing custom field types and validators
 */
export function createPluginRegistry(): PluginRegistry {
  const plugins = new Map<string, PluginDefinition>()
  const fieldTypeMap = new Map<string, PluginDefinition>()
  const validatorMap = new Map<string, any>()

  return {
    register(plugin: PluginDefinition): void {
      // Register the plugin itself
      plugins.set(plugin.id, plugin)

      // Index field types
      if (plugin.fieldTypes) {
        for (const fieldType of plugin.fieldTypes) {
          fieldTypeMap.set(fieldType.type, plugin)
        }
      }

      // Index validators
      if (plugin.validators) {
        for (const validator of plugin.validators) {
          validatorMap.set(validator.id, validator)
        }
      }
    },

    unregister(pluginId: string): void {
      const plugin = plugins.get(pluginId)
      if (!plugin) return

      // Remove from plugins map
      plugins.delete(pluginId)

      // Remove field types
      if (plugin.fieldTypes) {
        for (const fieldType of plugin.fieldTypes) {
          fieldTypeMap.delete(fieldType.type)
        }
      }

      // Remove validators
      if (plugin.validators) {
        for (const validator of plugin.validators) {
          validatorMap.delete(validator.id)
        }
      }
    },

    get(pluginId: string): PluginDefinition | undefined {
      return plugins.get(pluginId)
    },

    getAll(): PluginDefinition[] {
      return Array.from(plugins.values())
    },

    hasFieldType(type: string): boolean {
      return fieldTypeMap.has(type)
    },

    validate(validatorId: string, value: unknown, config: unknown): { valid: boolean; error?: string } {
      const validator = validatorMap.get(validatorId)
      if (!validator) {
        return { valid: false, error: `Validator "${validatorId}" not found` }
      }

      try {
        return validator.validate(value, config)
      } catch (err) {
        return {
          valid: false,
          error: err instanceof Error ? err.message : String(err),
        }
      }
    },
  }
}

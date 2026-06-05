import type {
  FormExperimentRecord,
  FormExperimentVariantRecord,
} from './adapters'

function hashToUnitInterval(value: string) {
  // FNV-1a 32-bit hash over the full unsigned 32-bit range, mapped uniformly
  // to [0, 1) by dividing by 2^32. This gives much more uniform bucketing than
  // the previous `hash % 10000` approach (which clustered on string length).
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    // hash *= 16777619 using 32-bit overflow-safe multiplication
    hash = Math.imul(hash, 0x01000193)
  }

  // Convert to an unsigned 32-bit integer, then normalize to [0, 1).
  return (hash >>> 0) / 0x100000000
}

export function selectExperimentVariant(
  experiment: FormExperimentRecord,
  subjectKey: string,
): FormExperimentVariantRecord {
  const variants = [...experiment.variants].sort((a, b) => a.key.localeCompare(b.key))
  const totalWeight = variants.reduce((sum, variant) => sum + Math.max(variant.weight, 0), 0)

  if (variants.length === 0 || totalWeight <= 0) {
    throw new Error(`Experiment "${experiment.id}" does not have any selectable variants`)
  }

  const bucket = hashToUnitInterval(`${experiment.id}:${subjectKey}`)
  let cumulative = 0

  for (const variant of variants) {
    cumulative += variant.weight / totalWeight
    if (bucket <= cumulative) {
      return variant
    }
  }

  return variants[variants.length - 1]
}

import type {
  FormExperimentRecord,
  FormExperimentVariantRecord,
} from './adapters'

function hashToUnitInterval(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash % 10000) / 10000
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

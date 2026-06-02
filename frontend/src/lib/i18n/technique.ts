import type { TechniqueType, TechniqueTarget } from '../../types/api'
import type { TranslationKey } from './translations'

/** Technique type values, in display order for <select> dropdowns. */
export const TECHNIQUE_TYPES: TechniqueType[] = [
  'SUBMISSION', 'POSITION', 'GUARD_POSITION', 'GUARD_PASS',
  'SWEEP', 'TAKEDOWN', 'PIN', 'SCAPE', 'GRIP',
]

/** Technique target (body part / position) values, in display order. */
export const TECHNIQUE_TARGETS: TechniqueTarget[] = [
  'HEAD', 'NECK', 'SHOULDER', 'TORSO', 'LEG', 'FOOT', 'ANKLE', 'KNEE',
  'HIP', 'BACK', 'SPINE', 'ARM', 'ELBOW', 'WRIST', 'HAND',
  'GUARD_PASS', 'GUARD_POSITION', 'PIN', 'TAKEDOWN', 'SWEEP', 'ESCAPE',
]

/** Translation key for a technique type, e.g. `techniqueType.SUBMISSION`. */
export function techniqueTypeKey(type: TechniqueType): TranslationKey {
  return `techniqueType.${type}` as TranslationKey
}

/** Translation key for a technique target, e.g. `techniqueTarget.HEAD`. */
export function techniqueTargetKey(target: TechniqueTarget): TranslationKey {
  return `techniqueTarget.${target}` as TranslationKey
}

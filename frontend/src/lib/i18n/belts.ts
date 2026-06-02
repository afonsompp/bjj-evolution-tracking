import type { Belt } from '../../types/api'
import type { TranslationKey } from './translations'

/** Belt values grouped for use in <select> dropdowns. */
export const BELT_GROUPS: { groupKey: TranslationKey; belts: Belt[] }[] = [
  {
    groupKey: 'belt.group.adult',
    belts: ['WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK'],
  },
  {
    groupKey: 'belt.group.youth',
    belts: [
      'GRAY_WHITE', 'GRAY', 'GRAY_BLACK',
      'YELLOW_WHITE', 'YELLOW', 'YELLOW_BLACK',
      'ORANGE_WHITE', 'ORANGE', 'ORANGE_BLACK',
      'GREEN_WHITE', 'GREEN', 'GREEN_BLACK',
    ],
  },
]

/** Flat list of every belt value, in display order. */
export const ALL_BELTS: Belt[] = BELT_GROUPS.flatMap((g) => g.belts)

/** Translation key for a belt's name, e.g. `belt.WHITE`. */
export function beltKey(belt: Belt): TranslationKey {
  return `belt.${belt}` as TranslationKey
}

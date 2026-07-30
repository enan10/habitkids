import fr from '../i18n/fr.json'
import ar from '../i18n/ar.json'

const PRESET_HABIT_MAP = new Map<string, string>([
  ['🦷|HYGIENE', 'presets.brush_teeth'],
  ['🧼|HYGIENE', 'presets.wash_hands'],
  ['🚿|HYGIENE', 'presets.shower'],
  ['💇|HYGIENE', 'presets.comb_hair'],
  ['💊|HYGIENE', 'presets.take_medicine'],
  ['🩴|HYGIENE', 'presets.wear_slippers'],
  ['📖|EDUCATION', 'presets.read_15min'],
  ['📚|EDUCATION', 'presets.do_homework'],
  ['✏️|EDUCATION', 'presets.study_lessons'],
  ['🔤|EDUCATION', 'presets.learn_word'],
  ['🏃|SPORT', 'presets.sport_30min'],
  ['🚶|SPORT', 'presets.walk_10min'],
  ['🧘|SPORT', 'presets.stretching'],
  ['🥗|ALIMENTATION', 'presets.eat_vegetables'],
  ['💧|ALIMENTATION', 'presets.drink_water'],
  ['🥣|ALIMENTATION', 'presets.eat_breakfast'],
  ['🍬|ALIMENTATION', 'presets.limit_sweets'],
  ['😴|SOMMEIL', 'presets.sleep_ontime'],
  ['🌅|SOMMEIL', 'presets.wake_up_early'],
  ['📵|SOMMEIL', 'presets.no_screens_8pm'],
  ['🎨|CREATIVITE', 'presets.draw_color'],
  ['🎵|CREATIVITE', 'presets.play_instrument'],
  ['🛏️|MENAGE', 'presets.make_bed'],
  ['🧹|MENAGE', 'presets.tidy_room'],
  ['👕|MENAGE', 'presets.fold_clothes'],
  ['🏠|MENAGE', 'presets.help_parents'],
  ['🍽️|MENAGE', 'presets.set_table'],
  ['🌿|NATURE', 'presets.water_plants'],
  ['🌳|NATURE', 'presets.go_outside'],
  ['🌍|NATURE', 'presets.respect_nature'],
  ['🗑️|NATURE', 'presets.throw_trash'],
  ['🙏|SOCIAL', 'presets.say_please_thanks'],
  ['🤝|SOCIAL', 'presets.greet_adults'],
  ['🤫|SOCIAL', 'presets.wait_turn'],
  ['💬|SOCIAL', 'presets.express_listen'],
  ['🧓|SOCIAL', 'presets.give_seat'],
  ['📞|SOCIAL', 'presets.call_family'],

  ['🌅|AUTONOMIE', 'presets.prepare_alone_morning'],
  ['🎒|AUTONOMIE', 'presets.prep_bag'],
  ['👕|AUTONOMIE', 'presets.dress_alone'],
  ['👗|AUTONOMIE', 'presets.choose_outfit'],
  ['👟|AUTONOMIE', 'presets.tie_shoes'],
  ['🥪|AUTONOMIE', 'presets.prep_snack'],
  ['🍽️|AUTONOMIE', 'presets.clear_plate'],
  ['⏰|AUTONOMIE', 'presets.wake_alone'],
  ['💰|AUTONOMIE', 'presets.manage_money'],
  ['🧺|AUTONOMIE', 'presets.dirty_laundry'],
])

export function habitTitle(
  habit: { emoji: string; category?: string; title?: string },
  t: (key: string) => string
): string {
  const tKey = PRESET_HABIT_MAP.get(`${habit.emoji}|${habit.category ?? ''}`)
  if (!tKey) return habit.title ?? ''

  // Only auto-translate if the stored title matches a known preset translation.
  // If the user renamed it to something custom, respect that custom title.
  const key = tKey.replace('presets.', '') as keyof typeof fr.presets
  const knownFr = fr.presets[key]
  const knownAr = ar.presets[key]
  const stored = habit.title ?? ''

  if (stored === knownFr || stored === knownAr || stored === '') {
    return t(tKey)
  }

  return stored
}

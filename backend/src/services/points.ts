const LEVELS = [
  { level: 1, xpRequired: 0,    name: 'Petit explorateur' },
  { level: 2, xpRequired: 100,  name: 'Apprenti champion' },
  { level: 3, xpRequired: 300,  name: 'Héros du quotidien' },
  { level: 4, xpRequired: 600,  name: 'Super champion' },
  { level: 5, xpRequired: 1000, name: 'Légende' },
]

export function getLevelFromXP(xp: number): number {
  let level = 1
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) level = l.level
  }
  return level
}

export function getXPForNextLevel(level: number): number {
  const next = LEVELS.find(l => l.level === level + 1)
  return next?.xpRequired ?? LEVELS[LEVELS.length - 1].xpRequired
}

export { LEVELS }

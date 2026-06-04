const PREFIX = 'habitkids-photo-'

export function getChildPhoto(childId: string): string | undefined {
  return localStorage.getItem(PREFIX + childId) || undefined
}

export function setChildPhoto(childId: string, dataUrl: string): void {
  localStorage.setItem(PREFIX + childId, dataUrl)
}

export function removeChildPhoto(childId: string): void {
  localStorage.removeItem(PREFIX + childId)
}

export function mergePhotos<T extends { id: string; photoUrl?: string }>(children: T[]): T[] {
  return children.map(c => ({
    ...c,
    photoUrl: getChildPhoto(c.id) || c.photoUrl,
  } as T))
}

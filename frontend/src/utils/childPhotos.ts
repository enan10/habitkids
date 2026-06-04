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
  return children.map(c => {
    const serverPhoto = c.photoUrl
    const localPhoto = getChildPhoto(c.id)
    // Server wins — sync local cache so offline works too
    if (serverPhoto) setChildPhoto(c.id, serverPhoto)
    return { ...c, photoUrl: serverPhoto || localPhoto } as T
  })
}

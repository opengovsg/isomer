export function indexAfterMove(active: number, from: number, to: number) {
  if (active === from) {
    return to
  }
  if (from < active && to >= active) {
    return active - 1
  }
  if (from > active && to <= active) {
    return active + 1
  }
  return active
}

export function indexAfterDelete(
  active: number,
  deleted: number,
  nextLength: number,
) {
  const shifted = deleted < active ? active - 1 : active
  return Math.min(shifted, nextLength - 1)
}

export function slideImageFileName(backgroundUrl?: string) {
  const fileName =
    backgroundUrl?.split("?")[0]?.split("/").filter(Boolean).at(-1) ?? ""

  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}

export function slideRowTitle(title: string | undefined, index: number) {
  const trimmed = title?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : `Slide ${index + 1}`
}

export const calculateGridDimensions = (arr: unknown[]) => {
  const cols =
    arr.length === 4 || arr.length >= 7 ? ("4" as const) : ("3" as const)
  const requiresResizingLastRow = arr.length === 5

  return {
    cols,
    requiresResizingLastRow,
  }
}

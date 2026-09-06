import { modes } from "./modes"

export const withChromaticModes = (args: (keyof typeof modes)[]) => {
  const modesArr = [...new Set(args)]
  const selectedModes: Partial<typeof modes> = {}
  for (const mode of modesArr) {
    // Only want to preserve width, and not height for Chromatic snapshots.
    selectedModes[mode] = modes[mode]
  }
  return { modes: selectedModes }
}

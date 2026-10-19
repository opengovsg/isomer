import { modes } from "./modes"

export const withArgosModes = (args: (keyof typeof modes)[]) => {
  const modesArr = Array.from(new Set(args))
  return {
    modes: modesArr.reduce(
      (acc, mode) => {
        return {
          ...acc,
          // Only want to preserve width, and not height for Argos snapshots.
          [mode]: modes[mode],
        }
      },
      {} as Partial<typeof modes>,
    ),
  }
}

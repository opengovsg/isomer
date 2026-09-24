import { modes } from "./modes"

/** @see https://www.chromatic.com/docs/modes/browser-options/ */
export interface ChromaticBrowserOptions {
  locale?: string
}

export const withChromaticModes = (
  args: (keyof typeof modes)[],
  browserOptions?: ChromaticBrowserOptions,
) => {
  const modesArr = Array.from(new Set(args))
  return {
    modes: modesArr.reduce(
      (acc, mode) => {
        return {
          ...acc,
          // Only want to preserve width, and not height for Chromatic snapshots.
          [mode]: {
            ...modes[mode],
            ...browserOptions,
          },
        }
      },
      {} as Partial<typeof modes>,
    ),
  }
}

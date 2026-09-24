import { CHROMATIC_LOCALE_SG, modes } from "./modes"

/** @see https://www.chromatic.com/docs/modes/browser-options/ */
export interface ChromaticBrowserOptions {
  locale?: string
}

export const withChromaticModes = (
  args: (keyof typeof modes)[],
  browserOptions?: ChromaticBrowserOptions,
) => {
  const resolvedBrowserOptions = {
    locale: CHROMATIC_LOCALE_SG,
    ...browserOptions,
  }
  const modesArr = Array.from(new Set(args))
  return {
    modes: modesArr.reduce(
      (acc, mode) => {
        return {
          ...acc,
          // Only want to preserve width, and not height for Chromatic snapshots.
          [mode]: {
            ...modes[mode],
            ...resolvedBrowserOptions,
          },
        }
      },
      {} as Partial<typeof modes>,
    ),
  }
}

/**
 * This file is for Chromatic viewport modes.
 * @see https://www.chromatic.com/docs/modes/
 * The names should correspond to the viewports exported in `viewports.ts`.
 */

export type ChromaticModeKey = keyof typeof modes

export const modes = {
  desktop: {
    viewport: "xl",
  },
  gsib: {
    viewport: "lg",
  },
  mobile: {
    viewport: "sm",
  },
  mobileSmall: {
    viewport: "xs",
  },
  tablet: {
    viewport: "md",
  },
  // You can also combine modes by passing in the appropriate parameters
  // "dark desktop": {
  //   backgrounds: { value: "#1E293B" },
  //   theme: "dark",
  //   viewport: "lg",
  // },
}

// Mainly for typing available viewports for use in storybook
export const getViewportByMode = (viewport: ChromaticModeKey) =>
  modes[viewport].viewport

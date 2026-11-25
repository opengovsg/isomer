/**
 * This file is for Argos viewport modes.
 * @see https://argos-ci.com/docs/learn/how-to-guides/visual-coverage/storybook-story-modes
 * The names should correspond to the viewports exported in `viewports.ts`.
 */

export type ArgosModeKey = keyof typeof modes

export const modes = {
  mobileSmall: {
    viewport: "xs",
  },
  mobile: {
    viewport: "sm",
  },
  tablet: {
    viewport: "md",
  },
  gsib: {
    viewport: "lg",
  },
  desktop: {
    viewport: "xl",
  },
  // You can also combine modes by passing in the appropriate parameters
  // "dark desktop": {
  //   backgrounds: { value: "#1E293B" },
  //   theme: "dark",
  //   viewport: "lg",
  // },
}

// Mainly for typing available viewports for use in storybook
export const getViewportByMode = (viewport: ArgosModeKey) => {
  return modes[viewport].viewport
}

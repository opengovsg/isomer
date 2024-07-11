/**
 * This file is for Chromatic viewport modes.
 * @see https://www.chromatic.com/docs/modes/
 * The names should correspond to the viewports exported in `viewports.ts`.
 */

export const modes = {
  mobile: {
    viewport: "sm",
  },
  tablet: {
    viewport: "md",
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
};

import { DEFAULT_INFOBAR_VARIANT } from "~/interfaces/complex/Infobar/constants"
import { tv } from "~/lib/tv"

import { ComponentContent } from "../../internal/customCssClass"

export const createInfobarStyles = tv({
  slots: {
    screenWideOuterContainer: "",
    outerContainer: `${ComponentContent}`,
    innerContainer: "mx-auto flex flex-col items-start",
    headingContainer: "flex flex-col gap-6",
    title: "break-words",
    description: "",
    buttonContainer: "flex flex-col gap-x-5 gap-y-4 sm:flex-row",
  },
  variants: {
    layout: {
      homepage: {
        outerContainer: "mx-6 py-16 sm:mx-10 lg:py-24",
        innerContainer:
          "items-center gap-9 rounded-none text-center lg:max-w-3xl",
        headingContainer: "gap-6",
        title: "prose-display-lg",
        description: "prose-headline-lg-regular",
        buttonContainer: "items-center",
      },
      default: {
        screenWideOuterContainer: "mt-12 rounded-lg first:mt-0",
        innerContainer: "items-start gap-7 p-8",
        headingContainer: "gap-4",
        title: "prose-display-xs",
        description: "prose-body-base",
        buttonContainer: "items-start",
      },
    },
    colorScheme: {
      dark: {},
      light: {},
    },
  },
  compoundVariants: [
    {
      colorScheme: "dark",
      layout: "homepage",
      className: {
        screenWideOuterContainer: "bg-base-canvas-inverse",
        outerContainer: "bg-base-canvas-inverse text-base-canvas",
      },
    },
    {
      // NOTE: Should not have dark mode on non-homepage for now
      // Copy the light + default variant
      colorScheme: "dark",
      layout: "default",
      className: {
        screenWideOuterContainer: "bg-base-canvas-backdrop",
        outerContainer: "",
      },
    },
    {
      colorScheme: "light",
      layout: "homepage",
      className: {
        outerContainer: "text-base-content-strong",
        description: "text-base-content",
      },
    },
    {
      colorScheme: "light",
      layout: "default",
      className: {
        screenWideOuterContainer: "bg-base-canvas-backdrop",
        outerContainer: "",
      },
    },
  ],
  defaultVariants: {
    layout: "homepage",
    colorScheme: DEFAULT_INFOBAR_VARIANT,
  },
})

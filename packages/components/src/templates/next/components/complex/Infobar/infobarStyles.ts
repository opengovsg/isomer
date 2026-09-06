import { DEFAULT_INFOBAR_VARIANT } from "~/interfaces/complex/Infobar/constants"
import { tv } from "~/lib/tv"

import { ComponentContent } from "../../internal/customCssClass"

export const createInfobarStyles = tv({
  compoundVariants: [
    {
      className: {
        outerContainer: "bg-base-canvas-inverse text-base-canvas",
        screenWideOuterContainer: "bg-base-canvas-inverse",
      },
      colorScheme: "dark",
      layout: "homepage",
    },
    {
      // NOTE: Should not have dark mode on non-homepage for now
      // Copy the light + default variant
      colorScheme: "dark",
      layout: "default",
      className: {
        outerContainer: "",
        screenWideOuterContainer: "bg-base-canvas-backdrop",
      },
    },
    {
      className: {
        description: "text-base-content",
        outerContainer: "text-base-content-strong",
      },
      colorScheme: "light",
      layout: "homepage",
    },
    {
      className: {
        outerContainer: "",
        screenWideOuterContainer: "bg-base-canvas-backdrop",
      },
      colorScheme: "light",
      layout: "default",
    },
  ],
  defaultVariants: {
    colorScheme: DEFAULT_INFOBAR_VARIANT,
    layout: "homepage",
  },
  slots: {
    buttonContainer: "flex flex-col gap-x-5 gap-y-4 sm:flex-row",
    description: "",
    headingContainer: "flex flex-col gap-6",
    innerContainer: "mx-auto flex flex-col items-start",
    outerContainer: ComponentContent,
    screenWideOuterContainer: "",
    title: "break-words",
  },
  variants: {
    colorScheme: {
      dark: {},
      light: {},
    },
    layout: {
      default: {
        buttonContainer: "items-start",
        description: "prose-body-base",
        headingContainer: "gap-4",
        innerContainer: "items-start gap-7 p-8",
        screenWideOuterContainer: "mt-12 rounded-lg first:mt-0",
        title: "prose-display-xs",
      },
      homepage: {
        buttonContainer: "items-center",
        description: "prose-headline-lg-regular",
        headingContainer: "gap-6",
        innerContainer:
          "items-center gap-9 rounded-none text-center lg:max-w-3xl",
        outerContainer: "mx-6 py-16 sm:mx-10 lg:py-24",
        title: "prose-display-lg",
      },
    },
  },
})

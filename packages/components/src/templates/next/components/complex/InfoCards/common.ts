import { INFOCARD_VARIANT } from "~/interfaces/complex/InfoCards"
import { tv } from "~/lib/tv"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"

import { ComponentContent } from "../../internal/customCssClass"

export const infoCardTitleStyle = tv({
  base: "prose-headline-lg-semibold relative text-base-content-strong",
  compoundVariants: [
    {
      className: "group-hover:text-brand-canvas-inverse",
      isClickableCard: true,
      variant: INFOCARD_VARIANT.default,
    },
  ],
  extend: groupFocusVisibleHighlight,
  variants: {
    isClickableCard: {
      true: "",
    },
    variant: {
      [INFOCARD_VARIANT.default]: "",
      [INFOCARD_VARIANT.bold]: "h-full text-base-content-inverse",
    },
  },
})

const singleInfoCardStyle = tv({
  defaultVariants: {
    imageFit: "cover",
    variant: INFOCARD_VARIANT.default,
  },
  slots: {
    cardContainer: "group flex flex-col gap-5 outline-0",
    cardDescription: "prose-body-base text-base-content",
    cardImage: "h-full w-full object-center",
    cardImageContainer:
      "w-full overflow-hidden border border-base-divider-subtle bg-base-canvas drop-shadow-none transition ease-in",
    cardTextContainer: "flex flex-col break-words",
    cardTitleArrow:
      "mb-0.5 ml-1 inline h-auto w-6 shrink-0 transition ease-in group-hover:translate-x-1",
  },
  variants: {
    imageFit: {
      contain: {
        cardImage: "object-contain",
      },
      cover: {
        cardImage: "object-cover",
      },
    },
    isClickableCard: {
      true: {
        cardImageContainer: "group-hover:drop-shadow-md",
      },
    },
    isExternalLink: {
      true: {
        cardTitleArrow: "rotate-[-45deg]",
      },
    },
    isFallback: {
      true: {
        cardImage: "size-1/2 object-contain",
        cardImageContainer: "flex items-center justify-center",
      },
    },
    variant: {
      [INFOCARD_VARIANT.default]: {
        cardImageContainer: "rounded-lg",
        cardTextContainer: "gap-3",
        cardTitleArrow:
          "mb-0.5 ml-1 inline h-auto w-6 transition ease-in group-hover:translate-x-1",
      },
      [INFOCARD_VARIANT.bold]: {
        cardContainer: "relative aspect-square lg:aspect-[2/3]",
        cardImageContainer: "h-full",
        cardTextContainer: "align-self-bottom text-base-content-inverse",
      },
    },
  },
})

const createInfoCardsStyles = tv({
  compoundVariants: [
    {
      class: {
        cardImageContainer: "lg:aspect-[2/1]",
      },
      layout: "homepage",
      maxColumns: "2",
    },
    {
      class: {
        cardImageContainer: "lg:aspect-square",
      },
      layout: "default",
      maxColumns: "3",
    },
    {
      class: {
        headingContainer: "self-center text-center",
      },
      layout: "homepage",
      variant: INFOCARD_VARIANT.bold,
    },
  ],
  defaultVariants: {
    imageFit: "cover",
    imageStyle: INFOCARD_VARIANT.bold,
    layout: "default",
    maxColumns: "3",
  },
  extend: singleInfoCardStyle,
  slots: {
    container: `${ComponentContent} flex flex-col`,
    headingContainer: "flex flex-col",
    headingTitle: "prose-display-sm break-words text-base-content-strong",
    headingSubtitle: "text-base-content",
    // auto-rows-max and grid-template-rows:max-content are needed to make the grid items have the same height,
    // which otherwise would be an issue on some versions of Safari
    // Ref: https://github.com/opengovsg/isomer/pull/1392
    grid: "grid auto-rows-max grid-cols-1 [grid-template-rows:max-content]",
    urlButtonContainer: "mx-auto block pt-8 sm:pt-12", // temp: following headingContainer's mb
    cardImageContainer: "",
  },
  variants: {
    imageStyle: {
      [INFOCARD_VARIANT.bold]: {
        headingContainer: "pb-12",
      },
      [INFOCARD_VARIANT.default]: {
        headingContainer: "pb-8 md:pb-12",
      },
    },
    isClickableCard: {
      true: {
        cardImageContainer: "group-hover:drop-shadow-md",
      },
    },
    isResizedLastRow: { true: { grid: "mt-1" } },
    layout: {
      default: {
        container: "mt-14 first:mt-0",
        headingContainer: "gap-6",
        headingSubtitle: "prose-body-base",
      },
      homepage: {
        container: "py-12 first:pt-0 md:py-16",
        headingContainer: "gap-2.5 md:max-w-3xl",
        headingSubtitle: "prose-headline-lg-regular",
      },
    },
    maxColumns: {
      "1": {
        grid: "",
      },
      "2": {
        grid: "md:grid-cols-2",
      },
      "3": {
        grid: "md:grid-cols-2 lg:grid-cols-3",
      },
      "4": {
        grid: "md:grid-cols-2 lg:grid-cols-4",
      },
    },
    variant: {
      [INFOCARD_VARIANT.default]: {
        cardImageContainer: "aspect-[3/2]",
        grid: "gap-10 md:gap-7 lg:gap-x-16 lg:gap-y-12",
      },
      [INFOCARD_VARIANT.bold]: {
        grid: "gap-1",
      },
    },
  },
})

export const compoundStyles = createInfoCardsStyles()

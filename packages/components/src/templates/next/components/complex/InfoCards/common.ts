import { INFOCARD_VARIANT } from "~/interfaces/complex/InfoCards"
import { tv } from "~/lib/tv"
import { groupFocusVisibleHighlight } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"

export const infoCardTitleStyle = tv({
  extend: groupFocusVisibleHighlight,
  base: "prose-headline-lg-semibold relative text-base-content-strong",
  variants: {
    isClickableCard: {
      true: "",
    },
    variant: {
      [INFOCARD_VARIANT.default]: "",
      [INFOCARD_VARIANT.bold]: "h-full text-base-content-inverse",
    },
  },
  compoundVariants: [
    {
      variant: INFOCARD_VARIANT.default,
      isClickableCard: true,
      className: "group-hover:text-brand-canvas-inverse",
    },
  ],
})

export const singleInfoCardStyle = tv({
  slots: {
    cardContainer: "group flex flex-col gap-5 outline-0",
    cardImage: "h-full w-full object-center",
    cardTextContainer: "flex flex-col",
    cardTitleArrow:
      "mb-0.5 ml-1 inline h-auto w-6 transition ease-in group-hover:translate-x-1",
    cardDescription: "prose-body-base text-base-content",
    cardImageContainer:
      "w-full overflow-hidden border border-base-divider-subtle bg-base-canvas drop-shadow-none transition ease-in",
  },
  variants: {
    variant: {
      [INFOCARD_VARIANT.default]: {
        cardImageContainer: "rounded-lg",
        cardTitleArrow:
          "mb-0.5 ml-1 inline h-auto w-6 transition ease-in group-hover:translate-x-1",
        cardTextContainer: "gap-3",
      },
      [INFOCARD_VARIANT.bold]: {
        cardTextContainer: "align-self-bottom text-base-content-inverse",
        cardImageContainer: "h-full",
        cardContainer: "relative aspect-square lg:aspect-[2/3]",
      },
    },
    isClickableCard: {
      true: {
        cardImageContainer: "group-hover:drop-shadow-md",
      },
    },
    imageFit: {
      cover: {
        cardImage: "object-cover",
      },
      contain: {
        cardImage: "object-contain",
      },
    },
    isExternalLink: {
      true: {
        cardTitleArrow: "rotate-[-45deg]",
      },
    },
  },

  defaultVariants: {
    imageFit: "cover",
    variant: INFOCARD_VARIANT.default,
  },
})

export const createInfoCardsStyles = tv({
  extend: singleInfoCardStyle,
  slots: {
    container: `${ComponentContent} flex flex-col`,
    headingContainer: "flex flex-col",
    headingTitle: "prose-display-md break-words text-base-content-strong",
    headingSubtitle: "text-base-content",
    grid: "grid auto-rows-max grid-cols-1 [grid-template-rows:max-content]",
    urlButtonContainer: "mx-auto block pt-8 sm:pt-12", // temp: following headingContainer's mb
    cardImageContainer: "",
  },
  variants: {
    variant: {
      [INFOCARD_VARIANT.default]: {
        grid: "gap-10 md:gap-7 lg:gap-x-16 lg:gap-y-12",
        cardImageContainer: "aspect-[3/2]",
      },
      [INFOCARD_VARIANT.bold]: {
        grid: "gap-1",
      },
    },
    layout: {
      homepage: {
        container: "py-12 first:pt-0 md:py-16",
        headingContainer: "gap-2.5 md:max-w-3xl",
        headingSubtitle: "prose-headline-lg-regular",
      },
      default: {
        container: "mt-14 first:mt-0",
        headingContainer: "gap-6",
        headingSubtitle: "prose-body-base",
      },
    },
    isClickableCard: {
      true: {
        cardImageContainer: "group-hover:drop-shadow-md",
      },
    },
    isResizedLastRow: { true: { grid: "mt-1" } },
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
    imageStyle: {
      [INFOCARD_VARIANT.bold]: {
        headingContainer: "pb-12",
      },
      [INFOCARD_VARIANT.default]: {
        headingContainer: "pb-8 md:pb-12",
      },
    },
  },

  compoundVariants: [
    {
      layout: "homepage",
      maxColumns: "2",
      class: {
        cardImageContainer: "lg:aspect-[2/1]",
      },
    },
    {
      layout: "default",
      maxColumns: "3",
      class: {
        cardImageContainer: "lg:aspect-square",
      },
    },
    {
      layout: "homepage",
      variant: INFOCARD_VARIANT.bold,
      class: {
        headingContainer: "self-center text-center",
      },
    },
  ],
  defaultVariants: {
    layout: "default",
    maxColumns: "3",
    imageFit: "cover",
    imageStyle: INFOCARD_VARIANT.bold,
  },
})

export const compoundStyles = createInfoCardsStyles()

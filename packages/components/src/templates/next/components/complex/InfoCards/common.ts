import { tv } from "~/lib/tv"
import { groupFocusVisibleHighlight } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"

export const infoCardTitleStyle = tv({
  extend: groupFocusVisibleHighlight,
  base: "prose-headline-lg-semibold text-base-content-strong",
  variants: {
    isClickableCard: {
      true: "group-hover:text-brand-canvas-inverse",
    },
  },
})

export const createInfoCardsStyles = tv({
  slots: {
    container: `${ComponentContent} flex flex-col`,
    headingContainer: "flex flex-col pb-8 sm:pb-12",
    headingTitle: "prose-display-md break-words text-base-content-strong",
    headingSubtitle: "text-base-content",
    grid: "grid grid-cols-1 gap-10 md:gap-7 lg:gap-x-16 lg:gap-y-12",
    cardContainer: "group flex flex-col gap-5 outline-0",
    cardImageContainer:
      "aspect-[3/2] w-full overflow-hidden rounded-lg border border-base-divider-subtle bg-base-canvas drop-shadow-none transition ease-in",
    cardImage: "h-full w-full object-center",
    cardTextContainer: "flex flex-col gap-2.5 sm:gap-3",
    cardTitleArrow:
      "mb-0.5 ml-1 inline h-auto w-6 transition ease-in group-hover:translate-x-1",
    cardDescription: "prose-body-base text-base-content",
    urlButtonContainer: "mx-auto block pt-8 sm:pt-12", // temp: following headingContainer's mb
  },
  variants: {
    layout: {
      homepage: {
        container: "py-12 first:pt-0 md:py-16",
        headingContainer: "gap-2.5 lg:max-w-3xl",
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
    imageFit: {
      cover: {
        cardImage: "object-cover",
      },
      contain: {
        cardImage: "object-contain",
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
    },
    isExternalLink: {
      true: {
        cardTitleArrow: "rotate-[-45deg]",
      },
    },
  },
  compoundVariants: [
    {
      layout: "homepage",
      maxColumns: "3",
      class: {
        cardImageContainer: "aspect-[3/2]",
      },
    },
    {
      layout: "homepage",
      maxColumns: "2",
      class: {
        cardImageContainer: "aspect-[3/2] lg:aspect-[2/1]",
      },
    },
    {
      layout: "default",
      maxColumns: "3",
      class: {
        cardImageContainer: "aspect-[3/2] lg:aspect-square",
      },
    },
    {
      layout: "default",
      maxColumns: "2",
      class: {
        cardImageContainer: "aspect-[3/2]",
      },
    },
  ],
  defaultVariants: {
    layout: "default",
    maxColumns: "3",
    imageFit: "cover",
  },
})

export const compoundStyles = createInfoCardsStyles()

import { tv } from "~/lib/tv"

import { ComponentContent } from "../../../internal/customCssClass"

export const commonContactInformationStyles = tv({
  slots: {
    screenWideOuterContainer: "",
    container: `${ComponentContent} flex flex-col`,
    titleAndDescriptionContainer: "flex flex-col",
    title: "prose-display-sm text-base-content-strong",
    description: "text-base-content-strong [&:not(:first-child)]:mt-0",
    contactMethodsContainer: "flex flex-col gap-10",
    otherInformationContainer: "mt-8 flex flex-col gap-6",
    otherInformationTitle: "prose-display-xs text-base-content-strong",
    urlButtonContainer: "mx-auto",
  },
  variants: {
    isLoading: {
      true: {
        title: "bg-base-utility-skeleton h-8 w-48 animate-pulse rounded-sm",
        description:
          "bg-base-utility-skeleton h-6 w-64 animate-pulse rounded-sm",
      },
    },
  },
})

export const commonContactMethodStyles = tv({
  slots: {
    container: "flex w-full flex-col items-start gap-2",
    icon: "size-8 flex-shrink-0 text-base-content-strong",
    textContainer: "flex w-full flex-col items-start gap-3",
    label: "prose-headline-lg-semibold text-base-content-strong",
    valuesAndCaptionContainer: "flex w-full flex-col items-start gap-1",
    value:
      "prose-body-base text-left text-base-content tailwindv3-wrap-anywhere",
    caption: "prose-body-sm text-base-content",
  },
  variants: {
    isLink: {
      true: {
        value:
          "text-hyperlink underline visited:text-hyperlink-visited hover:text-hyperlink-hover",
      },
      false: {
        value: "text-base-content",
      },
    },
    isLoading: {
      true: {
        icon: "bg-base-utility-skeleton size-8 animate-pulse rounded-sm",
        label: "bg-base-utility-skeleton h-6 w-24 animate-pulse rounded-sm",
        value: "bg-base-utility-skeleton h-6 w-48 animate-pulse rounded-sm",
        caption: "bg-base-utility-skeleton h-4 w-20 animate-pulse rounded-sm",
      },
    },
  },
})

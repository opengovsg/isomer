import { tv } from "~/lib/tv"

import { ComponentContent } from "../../../internal/customCssClass"

export const commonContactInformationStyles = tv({
  slots: {
    contactMethodsContainer: "flex flex-col gap-10",
    container: `${ComponentContent} flex flex-col`,
    description: "text-base-content-strong [&:not(:first-child)]:mt-0",
    otherInformationContainer: "mt-8 flex flex-col gap-6",
    otherInformationTitle: "prose-display-xs text-base-content-strong",
    screenWideOuterContainer: "",
    title: "prose-display-sm text-base-content-strong",
    titleAndDescriptionContainer: "flex flex-col",
    urlButtonContainer: "mx-auto",
  },
  variants: {
    isLoading: {
      true: {
        description: "h-6 w-64 animate-pulse rounded-sm bg-[#0000001a]",
        title: "h-8 w-48 animate-pulse rounded-sm bg-[#0000001a]",
      },
    },
  },
})

export const commonContactMethodStyles = tv({
  slots: {
    caption: "prose-body-sm text-base-content",
    container: "flex w-full flex-col items-start gap-2",
    icon: "size-8 flex-shrink-0 text-base-content-strong",
    label: "prose-headline-lg-semibold text-base-content-strong",
    textContainer: "flex w-full flex-col items-start gap-3",
    value:
      "prose-body-base text-left text-base-content tailwindv3-wrap-anywhere",
    valuesAndCaptionContainer: "flex w-full flex-col items-start gap-1",
  },
  variants: {
    isLink: {
      false: {
        value: "text-base-content",
      },
      true: {
        value:
          "text-hyperlink underline visited:text-hyperlink-visited hover:text-hyperlink-hover",
      },
    },
    isLoading: {
      true: {
        caption: "h-4 w-20 animate-pulse rounded-sm bg-[#0000001a]",
        icon: "size-8 animate-pulse rounded-sm bg-[#0000001a]",
        label: "h-6 w-24 animate-pulse rounded-sm bg-[#0000001a]",
        value: "h-6 w-48 animate-pulse rounded-sm bg-[#0000001a]",
      },
    },
  },
})

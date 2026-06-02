import { tv } from "~/lib/tv"

import { ComponentContent } from "../../../internal/customCssClass"

export const commonContactInformationStyles = tv({
  slots: {
    screenWideOuterContainer: "",
    container: `${ComponentContent} flex-col flex`,
    titleAndDescriptionContainer: "flex-col flex",
    title: "prose-display-sm text-base-content-strong",
    description: "text-base-content-strong [&:not(:first-child)]:mt-0",
    contactMethodsContainer: "flex-col gap-10 flex",
    otherInformationContainer: "flex-col gap-6 mt-8 flex",
    otherInformationTitle: "prose-display-xs text-base-content-strong",
    urlButtonContainer: "mx-auto",
  },
  variants: {
    isLoading: {
      true: {
        title: "h-8 w-48 animate-pulse rounded-sm bg-[#0000001a]",
        description: "h-6 w-64 animate-pulse rounded-sm bg-[#0000001a]",
      },
    },
  },
})

export const commonContactMethodStyles = tv({
  slots: {
    container: "flex-col gap-2 flex w-full items-start",
    icon: "size-8 shrink-0 text-base-content-strong",
    textContainer: "flex-col gap-3 flex w-full items-start",
    label: "prose-headline-lg-semibold text-base-content-strong",
    valuesAndCaptionContainer: "flex-col gap-1 flex w-full items-start",
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
        icon: "size-8 animate-pulse rounded-sm bg-[#0000001a]",
        label: "h-6 w-24 animate-pulse rounded-sm bg-[#0000001a]",
        value: "h-6 w-48 animate-pulse rounded-sm bg-[#0000001a]",
        caption: "h-4 w-20 animate-pulse rounded-sm bg-[#0000001a]",
      },
    },
  },
})

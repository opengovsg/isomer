import { tv } from "~/lib/tv"
import { ComponentContent } from "../../../internal/customCssClass"

export const commonContactInformationStyles = tv({
  slots: {
    container: `${ComponentContent} flex flex-col`,
    titleAndDescriptionContainer: "flex flex-col gap-2",
    title: "prose-display-md font-bold text-base-content-strong",
    description: "prose-headline-lg-regular text-base-content-strong",
    contactMethodsContainer: "flex flex-col gap-10",
    otherInformationContainer: "mt-8 flex flex-col gap-6",
    otherInformationTitle:
      "prose-display-sm font-bold text-base-content-strong",
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
    container: "flex w-full flex-col items-start gap-2",
    icon: "size-8 flex-shrink-0 text-base-content-strong",
    textContainer: "flex w-full flex-col items-start gap-3",
    label: "prose-headline-lg-semibold text-base-content",
    valuesAndCaptionContainer: "flex w-full flex-col items-start gap-1",
    value:
      "prose-headline-lg-medium break-words break-all text-left text-base-content",
    caption: "prose-body-sm text-base-content",
  },
  variants: {
    isLink: {
      true: {
        value:
          "break-words break-all text-hyperlink underline visited:text-hyperlink-visited hover:text-hyperlink-hover",
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

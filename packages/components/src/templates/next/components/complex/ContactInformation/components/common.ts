import { tv } from "~/lib/tv"
import { ComponentContent } from "../../../internal/customCssClass"

export const commonContactInformationStyles = tv({
  slots: {
    container: `${ComponentContent} flex flex-col`,
    titleAndDescriptionContainer: "flex flex-col gap-2 lg:max-w-3xl",
    title: "prose-display-md font-bold text-base-content-strong",
    description: "prose-headline-lg-regular text-base-content-strong",
    contactMethodsContainer: "flex flex-col gap-10",
    otherInformationContainer: "mt-8 flex flex-col gap-6",
    otherInformationTitle:
      "prose-display-md font-bold text-base-content-strong",
    urlButtonContainer: "mx-auto",
  },
})

export const commonContactMethodStyles = tv({
  slots: {
    container: "flex w-full flex-col items-start gap-2",
    icon: "size-8 flex-shrink-0 text-base-content-strong",
    textContainer: "flex w-full flex-col items-start gap-3",
    label: "prose-headline-lg-semibold text-base-content",
    valuesAndCaptionContainer: "flex w-full flex-col items-start gap-1",
    value: "prose-headline-lg-medium text-left text-base-content",
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
  },
})

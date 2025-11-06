import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { ComponentContent } from "../../internal/customCssClass"

const createDynamicDataBannerStyles = tv({
  slots: {
    // hardcoded bg color for now since MUIS is the only use case
    // consider moving into site config if used by other sites
    screenWideOuterContainer: "bg-[#E1EAE6]",
    outerContainer: `${ComponentContent} md:gap-auto flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:px-10 md:py-5`,
    basicInfoContainer:
      "flex flex-col items-center gap-0.5 md:items-start md:gap-1",
    title: "prose-headline-lg-semibold whitespace-nowrap text-base-content",
    dateAndUrlContainer: "align-center flex justify-center gap-2",
    date: "prose-body-sm whitespace-nowrap text-base-content-medium",
    url: "prose-label-md-regular text-link underline-offset-4 visited:text-link-visited hover:text-link-hover hover:underline",
    dataInfoContainer:
      "md:max-lg:col-gap-10 grid grid-cols-3 justify-items-center gap-y-4 md:justify-items-end md:gap-y-2 md:max-lg:grid-cols-[auto,auto,auto] md:max-lg:gap-x-6 lg:flex lg:gap-11",
    errorMessageContainer: `${ComponentContent} flex flex-row gap-2 px-6 py-3 md:items-center md:gap-1`,
    errorIcon: "h-full min-h-4 min-w-4",
    individualDataContainer:
      "flex w-fit flex-col items-center justify-center gap-0.5 md:flex-row md:gap-1.5 lg:flex-col lg:items-end",
    individualDataLabel: "prose-headline-base-medium text-base-content",
    individualDataValue:
      "prose-headline-lg-semibold text-brand-interaction-hover md:max-lg:w-[70px] md:max-lg:text-right",
    individualDataValueLoading:
      "md:h-4.5 h-4 w-11 animate-pulse rounded-sm bg-[#0000001a]",
    urlShowOnMobileOnly: "block text-center md:hidden",
    urlHideOnMobile: "hidden md:block",
  },
})

export const getDynamicDataBannerClassNames = () => {
  const compoundStyles = createDynamicDataBannerStyles()
  return {
    screenWideOuterContainer: compoundStyles.screenWideOuterContainer(),
    outerContainer: compoundStyles.outerContainer(),
    basicInfoContainer: compoundStyles.basicInfoContainer(),
    title: compoundStyles.title(),
    dateAndUrlContainer: compoundStyles.dateAndUrlContainer(),
    date: compoundStyles.date(),
    url: compoundStyles.url(),
    dataInfoContainer: compoundStyles.dataInfoContainer(),
    errorMessageContainer: compoundStyles.errorMessageContainer(),
    errorIcon: compoundStyles.errorIcon(),
    individualDataContainer: compoundStyles.individualDataContainer(),
    individualDataLabel: compoundStyles.individualDataLabel(),
    individualDataValue: compoundStyles.individualDataValue(),
    individualDataValueLoading: compoundStyles.individualDataValueLoading(),
    urlShowOnMobileOnly: twMerge(
      compoundStyles.url(),
      compoundStyles.urlShowOnMobileOnly(),
    ),
    urlHideOnMobile: twMerge(
      compoundStyles.url(),
      compoundStyles.urlHideOnMobile(),
    ),
  }
}

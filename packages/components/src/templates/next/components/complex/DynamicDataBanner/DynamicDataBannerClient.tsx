"use client"

import { useEffect, useState } from "react"
import { BiError } from "react-icons/bi"

import type { DynamicDataBannerProps } from "~/interfaces"
import { NUMBER_OF_DATA } from "~/interfaces"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"
import { getSingaporeDateLong, getSingaporeDateYYYYMMDD } from "./utils"

const createDynamicDataBannerStyles = tv({
  slots: {
    // hardcoded bg color for now since MUIS is the only use case
    // consider moving into site config if used by other sites
    screenWideOuterContainer: "bg-[#E1EAE6]",
    outerContainer: `${ComponentContent} md:gap-auto flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:px-10 md:py-5`,
    basicInfoContainer:
      "flex flex-col items-center gap-0.5 md:items-start md:gap-1",
    title: "text-base-content-default prose-headline-lg-semibold",
    dateAndUrlContainer: "align-center flex justify-center gap-2",
    date: "prose-body-sm text-base-content-medium",
    url: "hover:text-link-hove prose-label-md-regular text-link underline-offset-4 visited:text-link-visited hover:underline",
    dataInfoContainer:
      "md:col-gap-10 md:gap-6lg:flex grid grid-cols-3 justify-items-center gap-y-4 md:grid-cols-[auto,1fr,auto] md:justify-items-end md:gap-x-6 md:gap-y-2 lg:flex lg:gap-11",
    errorMessageContainer: `${ComponentContent} flex flex-row gap-2 px-6 py-3 md:items-center md:gap-1`,
    errorIcon: "h-full min-h-4 min-w-4",
    individualDataContainer:
      "flex w-fit flex-col items-center justify-center gap-0.5 md:flex-row md:gap-1.5 lg:flex-col lg:items-end",
    individualDataLabel: "text-base-content-default prose-headline-base-medium",
    individualDataValue:
      "prose-headline-lg-semibold text-brand-interaction-hover",
    individualDataValueLoading:
      "md:h-4.5 h-4 w-11 animate-pulse rounded-sm bg-[#0000001a]",
    urlShowOnMobileOnly: "block text-center md:hidden",
    urlHideOnMobile: "hidden md:block",
  },
})
const compoundStyles = createDynamicDataBannerStyles()

type DynamicDataBannerClientProps = Omit<
  DynamicDataBannerProps,
  "type" | "site" | "errorMessage"
> & {
  errorMessageBaseParagraph?: React.ReactNode
}

const DynamicDataBannerUI = ({
  title,
  data,
  url,
  label,
  errorMessageBaseParagraph,
  LinkComponent,
}: Pick<
  DynamicDataBannerClientProps,
  "title" | "label" | "url" | "LinkComponent" | "errorMessageBaseParagraph"
> & {
  data: { label: string; value?: string }[]
}) => {
  const shouldRenderUrl: boolean = !!url && !!label
  const renderUrl = ({
    className,
  }: {
    className?: string
  }): React.ReactNode => {
    return (
      <Link
        LinkComponent={LinkComponent}
        href={url}
        className={twMerge(compoundStyles.url(), className)}
      >
        {label}
      </Link>
    )
  }

  if (errorMessageBaseParagraph) {
    return (
      <div className={compoundStyles.screenWideOuterContainer()}>
        <div className={compoundStyles.errorMessageContainer()}>
          <BiError className={compoundStyles.errorIcon()} />
          {errorMessageBaseParagraph}
        </div>
      </div>
    )
  }

  return (
    <div className={compoundStyles.screenWideOuterContainer()}>
      <div className={compoundStyles.outerContainer()}>
        <div className={compoundStyles.basicInfoContainer()}>
          {!!title && <div className={compoundStyles.title()}>{title}</div>}
          <div className={compoundStyles.dateAndUrlContainer()}>
            <span className={compoundStyles.date()}>
              {getSingaporeDateLong()}
            </span>
            {shouldRenderUrl &&
              renderUrl({ className: compoundStyles.urlHideOnMobile() })}
          </div>
        </div>
        <div className={compoundStyles.dataInfoContainer()}>
          {data.slice(0, NUMBER_OF_DATA).map((singleData) => (
            <div className={compoundStyles.individualDataContainer()}>
              <div className={compoundStyles.individualDataLabel()}>
                {singleData.label}
              </div>
              {singleData.value ? (
                <div className={compoundStyles.individualDataValue()}>
                  {singleData.value}
                </div>
              ) : (
                <div className={compoundStyles.individualDataValueLoading()} />
              )}
            </div>
          ))}
        </div>
        {shouldRenderUrl &&
          renderUrl({ className: compoundStyles.urlShowOnMobileOnly() })}
      </div>
    </div>
  )
}

export const DynamicDataBannerClient = ({
  apiEndpoint,
  title,
  data,
  url,
  label,
  errorMessageBaseParagraph,
  LinkComponent,
}: DynamicDataBannerClientProps) => {
  const [isLoading, setLoading] = useState(true)
  const [isError, setError] = useState(false)
  const [dynamicData, setDynamicData] = useState<Record<string, string>>({})

  // This is to ensure that the component is mounted before the query is executed
  // because next.js will attempt to execute the query during static site generation
  // which will fail because it requires "fetch" (browser API) to be available, which isn't the case
  // Ref: https://nextjs.org/docs/app/building-your-application/deploying/static-exports#browser-apis
  // Also not using react-query's useQuery hook because it's not compatible with this approach of using useEffect
  useEffect(() => {
    // we now have access to fetch here
    fetch(apiEndpoint)
      .then((res) => res.json())
      .then((apiData) => {
        if (!apiData?.[getSingaporeDateYYYYMMDD()]) {
          throw new Error("No data found for current date")
        }
        setDynamicData(apiData[getSingaporeDateYYYYMMDD()])
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching data:", error)
        setLoading(false)
        setError(true)
      })
  }, [])

  if (isError) {
    return (
      <DynamicDataBannerUI
        data={[]}
        url={url}
        label={label}
        errorMessageBaseParagraph={errorMessageBaseParagraph}
      />
    )
  }

  if (data.length !== NUMBER_OF_DATA)
    return <DynamicDataBannerUI data={[]} url={url} label={label} />

  return (
    <DynamicDataBannerUI
      title={!!title ? dynamicData[title] : undefined}
      data={data.map((singleData) => ({
        label: singleData.label,
        value: isLoading ? undefined : dynamicData[singleData.key] || "-- : --",
      }))}
      url={url}
      label={label}
      LinkComponent={LinkComponent}
    />
  )
}

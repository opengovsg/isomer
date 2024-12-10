"use client"

import { useEffect, useState } from "react"

import type { DynamicDataBannerProps } from "~/interfaces"
import { NUMBER_OF_DATA } from "~/interfaces"
import { tv } from "~/lib/tv"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"
import { getSingaporeDateLong, getSingaporeDateYYYYMMDD } from "./utils"

const createDynamicDataBannerStyles = tv({
  slots: {
    outerContainer: `${ComponentContent} grid grid-cols-1 gap-5 bg-brand-canvas px-6 pb-4 pt-6 md:gap-4 md:px-10 md:py-2 lg:grid-cols-12 lg:justify-between lg:justify-items-stretch lg:gap-0`,
    basicInfoContainer:
      "flex flex-row items-center justify-between md:gap-1 md:py-3 lg:col-span-3 lg:flex-col lg:items-start lg:justify-start",
    basicInfoInnerContainer: "flex flex-col items-start justify-start gap-1",
    title: "prose-headline-base-medium",
    dateWithDesktopUrl: "prose-label-sm-regular flex flex-row gap-2",
    url: "visited:text-link-visited prose-label-sm-medium flex text-link hover:text-link-hover",
    dataInfoContainer:
      "grid gap-y-1 md:flex md:justify-between md:justify-items-center lg:col-span-8 lg:col-start-5",
    errorMessageContainer:
      "flex flex-1 flex-col gap-1 md:pb-3 lg:items-end lg:justify-center lg:py-0",
    individualDataContainer:
      "flex w-fit flex-col items-start justify-center gap-0.5 py-3 md:items-center",
    individualDataLabel: "prose-body-sm",
    individualDataValue: "prose-headline-lg-medium",
    showOnMobileOnly: "block md:hidden",
    showOnTabletOnly: "hidden md:block lg:hidden",
    showOnDesktopOnly: "hidden lg:block",
  },
  variants: {
    success: {
      true: {
        dataInfoContainer: ["grid-cols-3"],
      },
    },
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
  data: { label: string; value: string }[]
}) => {
  const shouldRenderUrl: boolean = !!url && !!label
  const renderUrl = (): React.ReactNode => {
    return (
      <Link
        LinkComponent={LinkComponent}
        href={url}
        className={compoundStyles.url()}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className={compoundStyles.outerContainer()}>
      <div className={compoundStyles.basicInfoContainer()}>
        <div className={compoundStyles.basicInfoInnerContainer()}>
          {title && <div className={compoundStyles.title()}>{title}</div>}
          <div className={compoundStyles.dateWithDesktopUrl()}>
            {getSingaporeDateLong()}
            {shouldRenderUrl && (
              <div className={compoundStyles.showOnDesktopOnly()}>
                {renderUrl()}
              </div>
            )}
          </div>
        </div>
        {shouldRenderUrl && (
          <div className={compoundStyles.showOnTabletOnly()}>{renderUrl()}</div>
        )}
      </div>
      <div
        className={compoundStyles.dataInfoContainer({
          success: !errorMessageBaseParagraph,
        })}
      >
        {!!errorMessageBaseParagraph ? (
          <div className={compoundStyles.errorMessageContainer()}>
            {errorMessageBaseParagraph}
          </div>
        ) : (
          data.slice(0, NUMBER_OF_DATA).map((singleData) => (
            <div className={compoundStyles.individualDataContainer()}>
              <div className={compoundStyles.individualDataLabel()}>
                {singleData.label}
              </div>
              <div className={compoundStyles.individualDataValue()}>
                {singleData.value}
              </div>
            </div>
          ))
        )}
      </div>
      {shouldRenderUrl && (
        <div className={compoundStyles.showOnMobileOnly()}>{renderUrl()}</div>
      )}
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

  if (isError || isLoading || data.length !== NUMBER_OF_DATA)
    return (
      <DynamicDataBannerUI
        data={[]}
        url={url}
        label={label}
        errorMessageBaseParagraph={errorMessageBaseParagraph}
      />
    )

  return (
    <DynamicDataBannerUI
      title={!!title ? dynamicData[title] : undefined}
      data={data.map((singleData) => ({
        label: singleData.label,
        value: dynamicData[singleData.key] || "-- : --",
      }))}
      url={url}
      label={label}
      LinkComponent={LinkComponent}
    />
  )
}

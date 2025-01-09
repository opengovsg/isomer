"use client"

import { useEffect, useState } from "react"
import { BiError } from "react-icons/bi"

import type { DynamicDataBannerProps } from "~/interfaces"
import { NUMBER_OF_DATA } from "~/interfaces"
import { tv } from "~/lib/tv"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"
import { getSingaporeDateLong, getSingaporeDateYYYYMMDD } from "./utils"

const createDynamicDataBannerStyles = tv({
  slots: {
    screenWideOuterContainer: "bg-brand-canvas",
    outerContainer: `${ComponentContent} grid grid-cols-1 gap-4 px-6 pb-4 pt-6 md:gap-4 md:px-10 md:py-2 lg:grid-cols-12 lg:justify-between lg:justify-items-stretch lg:gap-0`,
    basicInfoContainer: "flex flex-col items-start gap-2 lg:flex-row lg:gap-5",
    titleAndDateContainer:
      "prose-label-sm-medium flex flex-row items-center gap-2",
    divider: "h-full w-[1px] bg-[#9CA3AF]",
    url: "prose-label-sm-medium text-link visited:text-link-visited hover:text-link-hover",
    dataInfoContainer:
      "grid grid-cols-3 gap-y-1 md:flex md:justify-between md:justify-items-center lg:col-span-8 lg:col-start-5",
    errorMessageContainer:
      "flex flex-row items-center gap-2 px-6 py-3 md:gap-1",
    errorText: "prose-label-sm-medium",
    errorIcon: "h-full",
    individualDataContainer: "flex w-fit flex-col gap-0.5 md:flex-row md:gap-1",
    individualDataLabel: "prose-label-sm-regular",
    individualDataValue: "prose-label-sm-regular font-semibold",
    showOnMobileOnly: "block md:hidden",
    hideOnMobile: "hidden md:block",
  },
})
const compoundStyles = createDynamicDataBannerStyles()

type DynamicDataBannerClientProps = Omit<
  DynamicDataBannerProps,
  "type" | "site" | "errorMessage"
> & {
  errorMessageBaseParagraph?: React.ReactNode
}

const ErrorMessage = ({
  errorMessageBaseParagraph,
}: Pick<DynamicDataBannerClientProps, "errorMessageBaseParagraph">) => {
  return (
    <div className={compoundStyles.errorMessageContainer()}>
      <BiError className={compoundStyles.errorIcon()} />
      <div className={compoundStyles.errorText()}>
        {errorMessageBaseParagraph}
      </div>
    </div>
  )
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
    <div className={compoundStyles.screenWideOuterContainer()}>
      {!errorMessageBaseParagraph ? (
        <div className={compoundStyles.outerContainer()}>
          <div className={compoundStyles.basicInfoContainer()}>
            <div className={compoundStyles.titleAndDateContainer()}>
              {title}
              <div className={compoundStyles.divider()} />
              {getSingaporeDateLong()}
            </div>
            {shouldRenderUrl && (
              <div className={compoundStyles.hideOnMobile()}>{renderUrl()}</div>
            )}
          </div>
          <div className={compoundStyles.dataInfoContainer()}>
            {data.slice(0, NUMBER_OF_DATA).map((singleData) => (
              <div className={compoundStyles.individualDataContainer()}>
                <div className={compoundStyles.individualDataLabel()}>
                  {singleData.label}
                </div>
                <div className={compoundStyles.individualDataValue()}>
                  {singleData.value}
                </div>
              </div>
            ))}
          </div>
          {shouldRenderUrl && (
            <div className={compoundStyles.showOnMobileOnly()}>
              {renderUrl()}
            </div>
          )}
        </div>
      ) : (
        <ErrorMessage errorMessageBaseParagraph={errorMessageBaseParagraph} />
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

  if (isLoading || data.length !== NUMBER_OF_DATA)
    return <DynamicDataBannerUI data={[]} url={url} label={label} />

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

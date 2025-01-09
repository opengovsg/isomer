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
    outerContainer: `${ComponentContent} md:gap-auto flex flex-col gap-4 px-6 py-3 md:flex-row md:items-center md:justify-between`,
    basicInfoContainer:
      "flex flex-col items-start gap-2 lg:flex-row lg:items-center lg:gap-5",
    titleAndDateContainer:
      "prose-label-sm-medium flex flex-row items-center gap-2 whitespace-nowrap",
    divider: "h-4 w-[1px] bg-[#9CA3AF]",
    url: "prose-label-sm-medium text-link visited:text-link-visited hover:text-link-hover",
    dataInfoContainer:
      "md:col-gap-10 grid grid-cols-[repeat(3,minmax(10rem,1fr))] gap-y-4 md:justify-items-end md:gap-y-2 lg:flex lg:gap-8",
    errorMessageContainer: `${ComponentContent} flex flex-row gap-2 px-6 py-3 md:items-center md:gap-1`,
    errorIcon: "h-full min-h-4 min-w-4",
    individualDataContainer: "flex w-fit flex-col gap-0.5 md:flex-row md:gap-1",
    individualDataLabel: "prose-label-sm-regular",
    individualDataValue: "prose-label-sm-regular font-semibold",
    individualDataValueLoading:
      "md:h-4.5 h-4 w-11 animate-pulse rounded-sm bg-[#0000001a]",
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
      {errorMessageBaseParagraph}
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
  data: { label: string; value: string | undefined }[]
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
        className={`${compoundStyles.url()} ${className}`}
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
              {title && (
                <>
                  {title} <div className={compoundStyles.divider()} />
                </>
              )}
              {getSingaporeDateLong()}
            </div>
            {shouldRenderUrl &&
              renderUrl({ className: compoundStyles.hideOnMobile() })}
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
                  <div
                    className={compoundStyles.individualDataValueLoading()}
                  />
                )}
              </div>
            ))}
          </div>
          {shouldRenderUrl &&
            renderUrl({ className: compoundStyles.showOnMobileOnly() })}
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

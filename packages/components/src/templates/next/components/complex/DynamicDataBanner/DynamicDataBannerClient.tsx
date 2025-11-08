"use client"

import { useEffect, useState } from "react"
import { BiError } from "react-icons/bi"

import type { DynamicDataBannerClassNames } from "./types"
import type { DynamicDataBannerProps } from "~/interfaces"
import { DYNAMIC_DATA_BANNER_NUMBER_OF_DATA } from "~/interfaces"
import { Link } from "../../internal/Link"
import { getSingaporeDateLong, getSingaporeDateYYYYMMDD } from "./utils"

type DynamicDataBannerClientProps = Omit<
  DynamicDataBannerProps,
  "type" | "site" | "errorMessage"
> & {
  errorMessageBaseParagraph?: React.ReactNode
  classNames: DynamicDataBannerClassNames
}

const DynamicDataBannerUI = ({
  title,
  data,
  url,
  label,
  errorMessageBaseParagraph,
  LinkComponent,
  classNames,
}: Pick<
  DynamicDataBannerClientProps,
  "title" | "label" | "url" | "LinkComponent" | "errorMessageBaseParagraph"
> & {
  data: { label: string; value?: string }[]
  classNames: DynamicDataBannerClassNames
}) => {
  const shouldRenderUrl: boolean = !!url && !!label
  const renderUrl = ({ className }: { className: string }): React.ReactNode => {
    return (
      <Link LinkComponent={LinkComponent} href={url} className={className}>
        {label}
      </Link>
    )
  }

  if (errorMessageBaseParagraph) {
    return (
      <div className={classNames.screenWideOuterContainer}>
        <div className={classNames.errorMessageContainer}>
          <BiError className={classNames.errorIcon} />
          {errorMessageBaseParagraph}
        </div>
      </div>
    )
  }

  return (
    <div className={classNames.screenWideOuterContainer}>
      <div className={classNames.outerContainer}>
        <div className={classNames.basicInfoContainer}>
          {!!title && <div className={classNames.title}>{title}</div>}
          <div className={classNames.dateAndUrlContainer}>
            <span className={classNames.date}>{getSingaporeDateLong()}</span>
            {shouldRenderUrl &&
              renderUrl({ className: classNames.urlHideOnMobile })}
          </div>
        </div>
        <div className={classNames.dataInfoContainer}>
          {data
            .slice(0, DYNAMIC_DATA_BANNER_NUMBER_OF_DATA)
            .map((singleData) => (
              <div
                key={singleData.label}
                className={classNames.individualDataContainer}
              >
                <div className={classNames.individualDataLabel}>
                  {singleData.label}
                </div>
                {singleData.value ? (
                  <div className={classNames.individualDataValue}>
                    {singleData.value}
                  </div>
                ) : (
                  <div className={classNames.individualDataValueLoading} />
                )}
              </div>
            ))}
        </div>
        {shouldRenderUrl &&
          renderUrl({ className: classNames.urlShowOnMobileOnly })}
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
  classNames,
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
        classNames={classNames}
      />
    )
  }

  if (data.length !== DYNAMIC_DATA_BANNER_NUMBER_OF_DATA)
    return (
      <DynamicDataBannerUI
        data={[]}
        url={url}
        label={label}
        classNames={classNames}
      />
    )

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
      classNames={classNames}
    />
  )
}

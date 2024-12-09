"use client"

import { useEffect, useState } from "react"

import type { DynamicDataBannerProps } from "~/interfaces"
import { NUMBER_OF_DATA } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"
import { getSingaporeDateLong, getSingaporeDateYYYYMMDD } from "./utils"

export const DynamicDataBannerUI = ({
  title,
  data,
  url,
  label,
  LinkComponent,
}: Pick<DynamicDataBannerProps, "title" | "label" | "url" | "LinkComponent"> & {
  data: { label: string; value: string }[]
}) => {
  const shouldRenderUrl: boolean = !!url && !!label
  const renderUrl = (): React.ReactNode => {
    return (
      <Link
        LinkComponent={LinkComponent}
        href={url}
        className="visited:text-link-visited prose-label-sm-medium flex text-link hover:text-link-hover"
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="bg-brand-canvas">
      <div
        className={`${ComponentContent} grid grid-cols-1 gap-5 px-6 pb-4 pt-6 md:gap-4 md:px-10 md:py-2 lg:grid-cols-12 lg:justify-between lg:justify-items-stretch lg:gap-0`}
      >
        <div className="flex flex-row items-center justify-between md:gap-1 md:py-3 lg:col-span-3 lg:flex-col lg:items-start lg:justify-start">
          <div className="flex flex-col gap-1 whitespace-nowrap">
            {title && <div className="prose-headline-base-medium">{title}</div>}
            <div className="prose-label-sm-regular flex flex-row gap-2">
              {getSingaporeDateLong()}
              {shouldRenderUrl && (
                <div className="hidden lg:block">{renderUrl()}</div>
              )}
            </div>
          </div>
          {shouldRenderUrl && (
            <div className="hidden md:block lg:hidden">{renderUrl()}</div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-y-1 md:flex md:justify-between md:justify-items-center lg:col-span-8 lg:col-start-5">
          {data.slice(0, NUMBER_OF_DATA).map((singleData) => (
            <div className="flex w-fit flex-col items-start justify-center gap-0.5 py-3 md:items-center">
              <div className="prose-body-sm">{singleData.label}</div>
              <div className="prose-headline-lg-medium">{singleData.value}</div>
            </div>
          ))}
        </div>
        {shouldRenderUrl && (
          <div className="block md:hidden">{renderUrl()}</div>
        )}
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
  LinkComponent,
}: Omit<DynamicDataBannerProps, "type" | "site">) => {
  const [isLoading, setLoading] = useState(true)
  const [apiData, setApiData] = useState<Record<string, object>>({})

  // This is to ensure that the component is mounted before the query is executed
  // because next.js will attempt to execute the query during static site generation
  // which will fail because it requires "fetch" (browser API) to be available, which isn't the case
  // Ref: https://nextjs.org/docs/app/building-your-application/deploying/static-exports#browser-apis
  // Also not using react-query's useQuery hook because it's not compatible with this approach of using useEffect
  useEffect(() => {
    // we now have access to fetch here
    fetch(apiEndpoint)
      .then((res) => res.json())
      .then((data) => {
        setApiData(data as Record<string, object>)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching data:", error)
        setLoading(false)
      })
  }, [])

  if (isLoading || data.length !== NUMBER_OF_DATA)
    return <DynamicDataBannerUI data={[]} url={url} label={label} />

  const values = apiData[getSingaporeDateYYYYMMDD()] as Record<string, string>
  return (
    <DynamicDataBannerUI
      title={!!title ? values[title] : undefined}
      data={data.map((singleData) => ({
        label: singleData.label,
        value: values[singleData.key] || "-- : --",
      }))}
      url={url}
      label={label}
      LinkComponent={LinkComponent}
    />
  )
}

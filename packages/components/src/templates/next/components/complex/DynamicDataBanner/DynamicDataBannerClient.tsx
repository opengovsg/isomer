"use client"

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query"

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
        className="prose-label-sm-medium flex text-link visited:text-link-visited hover:text-link-hover"
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

type DynamicDataBannerClientProps = Omit<
  DynamicDataBannerProps,
  "type" | "site"
>

const DynamicDataBannerContent = ({
  apiEndpoint,
  title,
  data,
  url,
  label,
  LinkComponent,
}: DynamicDataBannerClientProps) => {
  const {
    isPending,
    error,
    data: apiData,
  } = useQuery({
    queryKey: [getSingaporeDateYYYYMMDD()],
    queryFn: async () => {
      const response = await fetch(apiEndpoint)
      return (await response.json()) as Record<string, object | string>
    },
  })

  if (isPending || error || data.length !== NUMBER_OF_DATA)
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

const queryClient = new QueryClient()
export const DynamicDataBannerClient = (
  props: DynamicDataBannerClientProps,
) => {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicDataBannerContent {...props} />
    </QueryClientProvider>
  )
}

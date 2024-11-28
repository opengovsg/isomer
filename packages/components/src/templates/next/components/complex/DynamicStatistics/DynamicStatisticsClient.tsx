"use client"

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query"

import type { DynamicStatisticsProps } from "~/interfaces"
import { NUMBER_OF_STATISTICS } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"
import { getSingaporeDateLong, getSingaporeDateYYYYMMDD } from "./utils"

export const DynamicStatisticsUI = ({
  title,
  statistics,
  url,
  label,
  LinkComponent,
}: Pick<DynamicStatisticsProps, "title" | "label" | "url" | "LinkComponent"> & {
  statistics: { label: string; value: string }[]
}) => {
  const shouldRenderUrl: boolean = !!url && !!label
  const renderUrl = (): React.ReactNode => {
    return (
      <Link
        LinkComponent={LinkComponent}
        href={url}
        className="prose-label-sm-medium flex text-link"
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
          {statistics.slice(0, NUMBER_OF_STATISTICS).map((statistic) => (
            <div className="flex w-fit flex-col items-start justify-center gap-0.5 py-3 md:items-center">
              <div className="prose-body-sm">{statistic.label}</div>
              <div className="prose-headline-lg-medium">{statistic.value}</div>
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

type DynamicStatisticsClientProps = Omit<
  DynamicStatisticsProps,
  "type" | "site"
>

const DynamicStatisticsContent = ({
  apiEndpoint,
  title,
  statistics,
  url,
  label,
  LinkComponent,
}: DynamicStatisticsClientProps) => {
  const { isPending, error, data } = useQuery({
    queryKey: [getSingaporeDateYYYYMMDD()],
    queryFn: async () => {
      const response = await fetch(apiEndpoint)
      return (await response.json()) as Record<string, object | string>
    },
  })

  if (isPending || error || statistics.length !== NUMBER_OF_STATISTICS)
    return <DynamicStatisticsUI statistics={[]} url={url} label={label} />

  const values = data[getSingaporeDateYYYYMMDD()] as Record<string, string>
  return (
    <DynamicStatisticsUI
      title={!!title ? values[title] : undefined}
      statistics={statistics.map((statistic) => ({
        label: statistic.label,
        value: values[statistic.key] || "-- : --",
      }))}
      url={url}
      label={label}
      LinkComponent={LinkComponent}
    />
  )
}

const queryClient = new QueryClient()
export const DynamicStatisticsClient = (
  props: DynamicStatisticsClientProps,
) => {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicStatisticsContent {...props} />
    </QueryClientProvider>
  )
}

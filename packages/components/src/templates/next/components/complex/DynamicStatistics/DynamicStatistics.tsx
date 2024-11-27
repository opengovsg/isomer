"use client"

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query"

import type { DynamicStatisticsProps } from "~/interfaces"
import { NUMBER_OF_STATISTICS } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"
import { getSingaporeDateLong, getSingaporeDateYYYYMMDD } from "./utils"

interface DynamicStatisticsUIProps {
  title?: string
  statistics: { label: string; value: string }[]
  url?: string
  label?: string
}
export const DynamicStatisticsUI = ({
  title,
  statistics,
  url,
  label,
}: DynamicStatisticsUIProps) => {
  const shouldRenderUrl: boolean = !!url && !!label
  const renderUrl = (): React.ReactNode => {
    return (
      <a className="prose-label-sm-medium flex text-link" href={url}>
        {label}
      </a>
    )
  }
  return (
    <div className="bg-brand-canvas">
      <div
        className={`${ComponentContent} grid grid-cols-1 gap-5 px-6 pb-4 pt-6 md:gap-4 md:px-10 md:py-2 lg:grid-cols-12 lg:justify-between lg:justify-items-stretch lg:gap-0`}
      >
        <div className="flex flex-row items-center justify-between md:gap-1 md:py-3 lg:col-span-3 lg:flex-col lg:items-start lg:justify-start">
          <div className="flex flex-row gap-2 whitespace-nowrap">
            <div className="prose-headline-base-medium">
              {getSingaporeDateLong()}
            </div>
            {title && (
              <>
                <div className="text-base-divider-strong">|</div>
                <div className="prose-headline-base-medium">{title}</div>
              </>
            )}
          </div>
          {shouldRenderUrl && (
            <div className="hidden md:block">{renderUrl()}</div>
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

const DynamicStatisticsContent = ({
  apiEndpoint,
  title,
  statistics,
  url,
  label,
}: Omit<DynamicStatisticsProps, "type">) => {
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
    />
  )
}

const queryClient = new QueryClient()
export const DynamicStatistics = ({
  apiEndpoint,
  title,
  statistics,
  url,
  label,
}: DynamicStatisticsProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicStatisticsContent
        apiEndpoint={apiEndpoint}
        title={title}
        statistics={statistics}
        url={url}
        label={label}
      />
    </QueryClientProvider>
  )
}

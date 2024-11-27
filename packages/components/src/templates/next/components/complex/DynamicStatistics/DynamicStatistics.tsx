import type { DynamicStatisticsProps } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"

const DynamicStatisticsUI = ({
  title,
  statistics,
  url,
  label,
}: {
  title: string
  statistics: { label: string; value: string }[]
  url?: string
  label?: string
}) => {
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
        <div className="prose-headline-base-medium flex flex-row items-center justify-between gap-2 md:gap-2 md:py-3 lg:col-span-3 lg:flex-col lg:items-start lg:justify-start">
          <div>{title}</div>
          {shouldRenderUrl && (
            <div className="hidden md:block">{renderUrl()}</div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-y-1 md:flex md:justify-between md:justify-items-center lg:col-span-8 lg:col-start-5">
          {statistics.map((statistic) => (
            <div className="flex w-fit flex-col items-start gap-0.5 py-3 md:items-center">
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

export const DynamicStatistics = ({
  apiEndpoint,
  title,
  statistics,
  url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  label = "View all dates",
}: DynamicStatisticsProps) => {
  return (
    <DynamicStatisticsUI
      title="1 January 2025 | 1 Rejab 1446H"
      statistics={[
        { label: "Subuh", value: "5:43am" },
        { label: "Syuruk", value: "7:07am" },
        { label: "Zohor", value: "1:09pm" },
        { label: "Asar", value: "4.33pm" },
        { label: "Maghrib", value: "7.10pm" },
        { label: "Isyak", value: "8.25pm" },
      ]}
      url={url}
      label={label}
    />
  )
}

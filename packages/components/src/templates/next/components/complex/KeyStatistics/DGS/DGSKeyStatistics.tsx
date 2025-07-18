import type { DGSKeyStatisticsProps } from "~/interfaces"
import { KeyStatisticsSkeleton } from "../KeyStatisticsSkeleton"
import { useDGSData } from "./useDGSData"
import { transformDgsField } from "./utils"

export const DGSKeyStatistics = ({
  dataSource,
  title,
  statistics,
  label,
  ...rest
}: DGSKeyStatisticsProps) => {
  const { record, isLoading, isError } = useDGSData({
    resourceId: dataSource.resourceId,
    row: dataSource.row,
  })

  if (isLoading || isError || !record) {
    return <div>Loading...</div>
  }

  const transformedTitle = transformDgsField(title, record)

  const transformedStatistics = statistics.map((statistic) => {
    return {
      label: transformDgsField(statistic.label, record),
      value: transformDgsField(statistic.value, record),
    }
  })

  const transformedLabel = transformDgsField(label, record)

  return (
    <KeyStatisticsSkeleton
      dataSource={dataSource}
      title={transformedTitle}
      statistics={transformedStatistics}
      label={transformedLabel}
      {...rest}
    />
  )
}

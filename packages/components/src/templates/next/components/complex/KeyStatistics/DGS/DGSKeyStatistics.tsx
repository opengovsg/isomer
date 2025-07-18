import type { DGSKeyStatisticsProps } from "~/interfaces"
import { useDGSData } from "./useDGSData"

export const DGSKeyStatistics = ({
  dataSource,
  ...rest
}: DGSKeyStatisticsProps) => {
  const { record, isLoading, isError } = useDGSData({
    resourceId: dataSource.resourceId,
    row: dataSource.row,
  })

  if (isLoading || isError || !record) {
    return <div>Loading...</div>
  }

  return null
}

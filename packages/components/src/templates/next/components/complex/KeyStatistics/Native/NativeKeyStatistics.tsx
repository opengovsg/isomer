import type { NativeKeyStatisticsProps } from "~/interfaces"
import { KeyStatisticsSkeleton } from "../shared"

export const NativeKeyStatistics = ({
  statistics,
  ...props
}: NativeKeyStatisticsProps) => {
  return <KeyStatisticsSkeleton statisticsData={statistics} {...props} />
}

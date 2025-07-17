"use client"

import type {
  DGSKeyStatisticsProps,
  KeyStatisticsSkeletonProps,
} from "~/interfaces"
import { KeyStatisticsSkeleton } from "../shared"
import { useDGSData } from "./useDGSData"

export const DGSKeyStatistics = ({
  dgsResourceId,
  dgsRow,
  ...props
}: DGSKeyStatisticsProps) => {
  const { row, isLoading, isError } = useDGSData({
    dgsResourceId,
    dgsRow,
  })

  // TODO: better handling of these non-success states
  if (isLoading || isError || !row) {
    return <div>Loading...</div>
  }

  const statisticsData: KeyStatisticsSkeletonProps["statisticsData"] =
    props.statistics.map(({ label, dgsFieldKey }) => {
      const value = row[
        dgsFieldKey
      ] as KeyStatisticsSkeletonProps["statisticsData"][number]["value"]

      return { label, value }
    })

  return <KeyStatisticsSkeleton {...props} statisticsData={statisticsData} />
}

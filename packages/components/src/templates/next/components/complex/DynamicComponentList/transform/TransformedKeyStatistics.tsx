import omit from "lodash/omit"

import type {
  DynamicComponentListProps,
  KeyStatisticsComponentProps,
} from "../../../../../../interfaces"
import type { KeyStatisticsProps } from "../../../../../../interfaces/complex/KeyStatistics"
import type { UseDGSDataReturn } from "../dgs/useDGSData"
import { KeyStatisticsSkeleton } from "../../KeyStatistics"

interface TransformedKeyStatisticsProps
  extends Pick<DynamicComponentListProps, "layout" | "site" | "LinkComponent"> {
  component: KeyStatisticsComponentProps
  rows: NonNullable<UseDGSDataReturn["rows"]>
}

export const TransformedKeyStatistics = ({
  component,
  rows,
  ...props
}: TransformedKeyStatisticsProps) => {
  return (
    <>
      {rows.map((row: Record<string, unknown>, idx) => {
        const title = row[component.title] as string

        let statistics: KeyStatisticsProps["statistics"]
        try {
          statistics = JSON.parse(
            row[component.statistics] as string,
          ) as KeyStatisticsProps["statistics"]
        } catch {
          statistics = []
        }

        return (
          <KeyStatisticsSkeleton
            key={idx}
            type={component.type}
            title={title}
            statistics={statistics}
            {...omit(component, ["type", "title", "statistics"])}
            {...props}
          />
        )
      })}
    </>
  )
}

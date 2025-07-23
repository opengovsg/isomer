import type { KeyStatisticsProps } from "~/interfaces"
import { DGSKeyStatistics } from "./DGS"
import { KeyStatisticsSkeleton } from "./KeyStatisticsSkeleton"

const KeyStatistics = ({ dataSource, ...rest }: KeyStatisticsProps) => {
  if (!dataSource) {
    return <KeyStatisticsSkeleton dataSource={dataSource} {...rest} />
  }

  // To use a switch statement here if there are more data sources
  return <DGSKeyStatistics dataSource={dataSource} {...rest} />
}

export default KeyStatistics

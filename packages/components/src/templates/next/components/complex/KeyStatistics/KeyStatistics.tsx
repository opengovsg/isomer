import type { KeyStatisticsProps } from "~/interfaces"
import { DGSKeyStatistics } from "./DGS"
import { KeyStatisticsSkeleton } from "./KeyStatisticsSkeleton"

const KeyStatistics = ({ dataSource, ...rest }: KeyStatisticsProps) => {
  if (!dataSource) {
    return <KeyStatisticsSkeleton dataSource={dataSource} {...rest} />
  }

  return <DGSKeyStatistics dataSource={dataSource} {...rest} />
}

export default KeyStatistics

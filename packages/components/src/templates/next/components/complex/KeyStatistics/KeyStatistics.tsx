import type { KeyStatisticsProps } from "~/interfaces"
import { DGS_DATA_SOURCE, NATIVE_DATA_SOURCE } from "~/interfaces"
import { DGSKeyStatistics } from "./DGS"
import { KeyStatisticsSkeleton } from "./KeyStatisticsSkeleton"

const KeyStatistics = ({ dataSource, ...rest }: KeyStatisticsProps) => {
  switch (dataSource.type) {
    case DGS_DATA_SOURCE:
      return <DGSKeyStatistics dataSource={dataSource} {...rest} />
    case NATIVE_DATA_SOURCE:
      return <KeyStatisticsSkeleton dataSource={dataSource} {...rest} />
    default: // fallback to native for backwards compatibility
      return <KeyStatisticsSkeleton dataSource={dataSource} {...rest} />
  }
}

export default KeyStatistics

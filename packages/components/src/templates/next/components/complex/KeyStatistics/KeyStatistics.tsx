import type { KeyStatisticsProps } from "~/interfaces/complex/KeyStatistics"
import { KeyStatisticsSkeleton } from "./KeyStatisticsSkeleton"

const KeyStatistics = (props: KeyStatisticsProps) => {
  return <KeyStatisticsSkeleton {...props} />
}

export default KeyStatistics

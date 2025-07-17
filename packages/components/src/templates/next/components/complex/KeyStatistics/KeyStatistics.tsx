import type { KeyStatisticsProps } from "~/interfaces"
import { DGSKeyStatistics } from "./DGS/DGSKeyStatistics"
import { NativeKeyStatistics } from "./Native/NativeKeyStatistics"

const KeyStatistics = (props: KeyStatisticsProps) => {
  switch (props.variant) {
    case "dgs":
      return <DGSKeyStatistics {...props} />
    case "native":
      return <NativeKeyStatistics {...props} />
    default:
      return <NativeKeyStatistics {...props} /> // default to native for backward compatibility
  }
}

export default KeyStatistics

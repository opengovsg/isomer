export interface KeyStatisticsProps {
  variant: "side" | "top"
  title: string
  statistics: Array<{
    label: string
    value: string
  }>
}

export default KeyStatisticsProps

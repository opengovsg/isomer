export interface KeyStatisticsProps {
  type: "keystatistics"
  variant: "side" | "top"
  title: string
  statistics: Array<{
    label: string
    value: string
  }>
}

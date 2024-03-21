export interface SiderailItem {
  title: string
  url: string
  children?: SiderailItem[]
  isCurrent?: boolean
}

export interface SiderailProps {
  type: "siderail"
  parentTitle: string
  parentUrl: string
  items: SiderailItem[]
}

export default SiderailProps

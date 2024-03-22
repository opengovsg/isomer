export interface Page {
  title: string
  url: string
  childPages?: Page[]
  isCurrent?: boolean
}

export interface SiderailProps {
  type: "siderail"
  parentTitle: string
  parentUrl: string
  pages: Page[]
  LinkComponent?: any
}

export default SiderailProps

export interface Page {
  title: string
  url: string
  childPages?: Page[]
  isCurrent?: boolean
}

export interface SiderailProps {
  parentTitle: string
  parentUrl: string
  pages: Page[]
  LinkComponent?: any
}

export default SiderailProps

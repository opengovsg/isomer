interface Page {
  title: string
  url: string
  isCurrent?: boolean
}

export interface SiderailProps {
  parentTitle: string
  parentUrl: string
  pages: Page[]
}

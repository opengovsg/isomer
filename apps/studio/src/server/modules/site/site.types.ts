export interface Sitemap {
  parentTitle: string
  childrenTitles: string[]
  sibilngTitles: string[]
}

export interface SiteConfig {
  theme: string
  isGovernment?: boolean
  sitemap: Sitemap
}

export interface Sitemap {
  parentTitle: string
  childrenTitles: string[]
  sibilngTitles: string[]
}
type SiteTheme = 'isomer-classic' | 'isomer-next'
export interface SiteConfig {
  theme: SiteTheme
  isGovernment?: boolean
  sitemap: Sitemap
}

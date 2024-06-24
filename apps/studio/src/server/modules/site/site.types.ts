export interface Sitemap {
  parentTitle: string
  childrenTitles: string[]
  siblingTitles: string[]
}
type SiteTheme = 'isomer-classic' | 'isomer-next'
export interface SiteConfig {
  theme: SiteTheme
  isGovernment?: boolean
  sitemap: Sitemap
}

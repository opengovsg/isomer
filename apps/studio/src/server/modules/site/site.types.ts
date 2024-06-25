export interface Sitemap {
  parentTitle: string
  childrenTitles: string[]
  siblingTitles: string[]
}

export const SiteThemes = {
  classic: 'isomer-classic',
  next: 'isomer-next',
} as const

type SiteTheme = (typeof SiteThemes)[keyof typeof SiteThemes]

export interface SiteConfig {
  theme: SiteTheme
  isGovernment?: boolean
  sitemap: Sitemap
}

import { type IsomerSiteProps } from '@opengovsg/isomer-components'

export type SiteConfig = Omit<IsomerSiteProps, 'navBarItems' | 'footerItems'>

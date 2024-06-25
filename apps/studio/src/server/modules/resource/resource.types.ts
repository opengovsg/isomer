import { type IsomerSiteProps } from '@opengovsg/isomer-components'

export type Navbar = { items: IsomerSiteProps['navBarItems'] }

export interface FooterItem {
  title: string
  url: string
  description?: string
}

export interface Navbar extends Omit<NavbarItem, 'description'> {
  items: NavbarItem[]
}

export interface Footer {
  name: string
  contactUsLink?: string
  feedbackFormLink?: string
  privacyStatementLink?: string
  termsOfUseLink?: string
}

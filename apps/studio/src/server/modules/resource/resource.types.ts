export interface NavbarItem {
  name: string
  url: string
  description: string
}

export interface Navbar extends NavbarItem {
  items: NavbarItem[]
}

export interface Footer {
  name: string
  contactUsLink?: string
  feedbackFormLink?: string
  privacyStatementLink?: string
  termsOfUseLink?: string
}

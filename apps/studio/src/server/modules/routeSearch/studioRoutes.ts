export type StudioRouteAccess = "member" | "siteAdmin" | "isomerAdmin"

export interface StudioRouteDefinition {
  id: string
  label: string
  /** Text Jev uses to decide whether a query is asking for this destination. */
  description: string
  href: (siteId: string) => string
  access: StudioRouteAccess
  /** Hidden unless the audit-log feature flag is on, in addition to `access`. */
  requiresAuditLogFlag?: boolean
}

/**
 * Studio destinations global search can jump to. Access is applied before
 * these rows are sent to Jev, so the model never sees a link the caller
 * cannot open.
 */
export const STUDIO_ROUTES: StudioRouteDefinition[] = [
  {
    id: "collaborators",
    label: "Collaborators",
    description:
      "Collaborators, users, and the people list. Manage users, invite someone, add a user, edit roles, or remove a collaborator.",
    href: (siteId) => `/sites/${siteId}/users`,
    access: "member",
  },
  {
    id: "settingsAgency",
    label: "Name and agency",
    description: "Site settings for the site name, agency, and public URL.",
    href: (siteId) => `/sites/${siteId}/settings/agency`,
    access: "member",
  },
  {
    id: "settingsNotification",
    label: "Notification banner",
    description: "Site settings for the notification banner.",
    href: (siteId) => `/sites/${siteId}/settings/notification`,
    access: "member",
  },
  {
    id: "settingsIntegrations",
    label: "Integrations",
    description:
      "Site settings for integrations. Add AskGov, VICA, a chatbot, Google Tag Manager, or site search.",
    href: (siteId) => `/sites/${siteId}/settings/integrations`,
    access: "member",
  },
  {
    id: "settingsRedirects",
    label: "Redirects",
    description: "Site settings for URL redirects.",
    href: (siteId) => `/sites/${siteId}/settings/redirects`,
    access: "member",
  },
  {
    id: "settingsAuditLog",
    label: "Logs",
    description: "Site settings for audit logs and activity exports.",
    href: (siteId) => `/sites/${siteId}/settings/audit-log`,
    access: "siteAdmin",
    requiresAuditLogFlag: true,
  },
  {
    id: "settingsNavbar",
    label: "Navigation bar",
    description: "Site settings for the navigation bar and header menu.",
    href: (siteId) => `/sites/${siteId}/settings/navbar`,
    access: "member",
  },
  {
    id: "settingsFooter",
    label: "Footer",
    description: "Site settings for the footer.",
    href: (siteId) => `/sites/${siteId}/settings/footer`,
    access: "member",
  },
  {
    id: "settingsColours",
    label: "Colours",
    description: "Site settings for colours, theme, and branding colours.",
    href: (siteId) => `/sites/${siteId}/settings/colours`,
    access: "member",
  },
  {
    id: "settingsLogo",
    label: "Logos and favicon",
    description: "Site settings for the logo and favicon.",
    href: (siteId) => `/sites/${siteId}/settings/logo`,
    access: "member",
  },
  {
    id: "isomerAdmin",
    label: "Isomer admin settings",
    description:
      "Isomer admin settings. Raw site config, theme, navbar, and footer JSON.",
    href: (siteId) => `/sites/${siteId}/admin`,
    access: "isomerAdmin",
  },
]

export interface AccessibleRouteContext {
  isSiteAdmin: boolean
  isIsomerAdmin: boolean
  isAuditLogEnabled: boolean
}

export const listAccessibleStudioRoutes = ({
  isSiteAdmin,
  isIsomerAdmin,
  isAuditLogEnabled,
}: AccessibleRouteContext): StudioRouteDefinition[] => {
  return STUDIO_ROUTES.filter((route) => {
    if (route.requiresAuditLogFlag && !isAuditLogEnabled) return false
    if (route.access === "member") return true
    if (route.access === "siteAdmin") return isSiteAdmin
    return isIsomerAdmin
  })
}

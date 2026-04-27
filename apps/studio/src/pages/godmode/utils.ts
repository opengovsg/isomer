import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

interface GodmodeLink {
  href: string
  label: string
  /** Isomer admin roles that may see this hub link */
  roles: readonly IsomerAdminRole[]
}

const GODMODE_LINKS: readonly GodmodeLink[] = [
  {
    href: "/godmode/create-site",
    label: "Create a new site",
    roles: [IsomerAdminRole.Core],
  },
  {
    href: "/godmode/publishing",
    label: "Publishing",
    roles: [IsomerAdminRole.Core],
  },
  {
    href: "/godmode/whitelist",
    label: "Whitelist",
    roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
  },
]

export const getVisibleGodmodeLinks = (
  userGodmodeRoles: Iterable<IsomerAdminRole>,
): readonly GodmodeLink[] => {
  const roleSet = new Set(userGodmodeRoles)

  return GODMODE_LINKS.filter((link) =>
    link.roles.some((role) => roleSet.has(role)),
  )
}

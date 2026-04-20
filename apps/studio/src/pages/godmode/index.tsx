import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Text,
} from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { type NextPageWithLayout } from "~/lib/types"
import { AuthenticatedLayout } from "~/templates/layouts/AuthenticatedLayout"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

type GodmodeLink = {
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

const GODMODE_PAGE_ACCESS_ROLES: readonly IsomerAdminRole[] = [
  ...new Set(GODMODE_LINKS.flatMap((link) => [...link.roles])),
]

const GodModePage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const { isAdmin: isCoreIsomerAdmin, isLoading: isCoreRoleLoading } =
    useIsUserIsomerAdmin({
      roles: [IsomerAdminRole.Core],
    })
  const { isAdmin: isMigratorIsomerAdmin, isLoading: isMigratorRoleLoading } =
    useIsUserIsomerAdmin({
      roles: [IsomerAdminRole.Migrator],
    })

  const isLoading = isCoreRoleLoading || isMigratorRoleLoading
  const userGodmodeRoles = new Set<IsomerAdminRole>()
  if (isCoreIsomerAdmin) {
    userGodmodeRoles.add(IsomerAdminRole.Core)
  }
  if (isMigratorIsomerAdmin) {
    userGodmodeRoles.add(IsomerAdminRole.Migrator)
  }

  const visibleGodmodeLinks = GODMODE_LINKS.filter((link) =>
    link.roles.some((role) => userGodmodeRoles.has(role)),
  )
  const canAccessGodmode = GODMODE_PAGE_ACCESS_ROLES.some((role) =>
    userGodmodeRoles.has(role),
  )

  if (!isLoading && !canAccessGodmode) {
    toast({
      title: "You do not have permission to access this page.",
      status: "error",
      ...BRIEF_TOAST_SETTINGS,
    })
    void router.push(`/`)
  }

  return (
    <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" as={NextLink}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Text as="h3" size="lg" textStyle="h3">
        👁️ God Mode 👁️
      </Text>

      <Flex flexDirection="column" mt="1.5rem" gap="1rem">
        {!isLoading &&
          visibleGodmodeLinks.map((link) => (
            <Flex
              key={link.href}
              as={NextLink}
              href={link.href}
              p="1rem"
              borderWidth="1px"
              alignItems="center"
              bg="base.canvas.default"
              border="1px solid"
              borderColor="base.divider.medium"
              borderRadius="0.5rem"
              _hover={{ background: "interaction.muted.main.hover" }}
            >
              <Text textStyle="subhead-2">{link.label}</Text>
            </Flex>
          ))}
      </Flex>
    </Flex>
  )
}

GodModePage.getLayout = AuthenticatedLayout

export default GodModePage

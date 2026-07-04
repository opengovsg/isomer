import type { GetServerSideProps } from "next"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Text,
} from "@chakra-ui/react"
import NextLink from "next/link"
import {
  requireGodModeAdminWithRoleProps,
  type GodModeAdminRoleProps,
} from "~/features/godmode/serverSideProps"
import { type NextPageWithLayout } from "~/lib/types"
import { AuthenticatedLayout } from "~/templates/layouts/AuthenticatedLayout"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

interface GodModeLink {
  href: string
  label: string
  /** Isomer admin roles that may see this hub link */
  roles: readonly IsomerAdminRole[]
}

const GODMODE_LINKS: readonly GodModeLink[] = [
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

export const getServerSideProps: GetServerSideProps<GodModeAdminRoleProps> = (
  context,
) =>
  requireGodModeAdminWithRoleProps(context, [
    IsomerAdminRole.Core,
    IsomerAdminRole.Migrator,
  ])

const GodModePage: NextPageWithLayout<GodModeAdminRoleProps> = ({
  userGodModeRoles,
}) => {
  const userGodModeRoleSet = new Set(userGodModeRoles)
  const visibleGodModeLinks = GODMODE_LINKS.filter((link) =>
    link.roles.some((role) => userGodModeRoleSet.has(role)),
  )

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
        {visibleGodModeLinks.map((link) => (
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

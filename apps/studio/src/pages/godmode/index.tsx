import NextLink from "next/link"
import { useRouter } from "next/router"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Text,
} from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { ADMIN_ROLE } from "~/lib/growthbook"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminLayout } from "~/templates/layouts/AdminLayout"

const GODMODE_LINKS = [
  {
    href: "/godmode/create-site",
    label: "Create a new site",
  },
  {
    href: "/godmode/publishing",
    label: "Publishing",
  },
] as const

const GodModePage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const isUserIsomerAdmin = useIsUserIsomerAdmin({
    roles: [ADMIN_ROLE.CORE],
  })

  if (!isUserIsomerAdmin) {
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
        {GODMODE_LINKS.map((link) => (
          <Flex
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

GodModePage.getLayout = AdminLayout

export default GodModePage

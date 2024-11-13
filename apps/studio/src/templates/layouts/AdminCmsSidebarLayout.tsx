import type { PropsWithChildren } from "react"
import Image from "next/image"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { Box, Flex, HStack, Spacer, Text } from "@chakra-ui/react"
import {
  AvatarMenu,
  Button,
  IconButton,
  Menu,
  Searchbar,
} from "@opengovsg/design-system-react"
import {
  BiCog,
  BiFolder,
  BiHelpCircle,
  BiLinkExternal,
  BiLogOut,
} from "react-icons/bi"
import { z } from "zod"

import type { CmsSidebarItem } from "~/components/CmsSidebar/CmsSidebarItems"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { CmsContainer, CmsSidebar } from "~/components/CmsSidebar"
import { LayoutHead } from "~/components/LayoutHead"
import { DirectorySidebar } from "~/features/dashboard/components/DirectorySidebar"
import { useMe } from "~/features/me/api"
import { useQueryParse } from "~/hooks/useQueryParse"
import { DASHBOARD } from "~/lib/routes"
import { type GetLayout } from "~/lib/types"
import { trpc } from "~/utils/trpc"

interface SearchableHeaderProps {
  siteId: string
}
const SearchableHeader = ({ siteId }: SearchableHeaderProps) => {
  const { me, logout } = useMe()
  const [{ name }] = trpc.site.getSiteName.useSuspenseQuery({
    siteId: Number(siteId),
  })

  return (
    <Flex
      flexDir="row"
      alignItems="center"
      py={{ base: 0, md: "0.5rem" }}
      px={{ base: 0, md: "0.5rem" }}
      background="white"
      borderBottom="1px solid"
      borderColor="base.divider.medium"
    >
      <Flex alignItems="center">
        <IconButton
          mr="0.5rem"
          as={NextLink}
          href={DASHBOARD}
          variant="clear"
          aria-label="Back to dashboard"
          icon={
            <Image
              src="/assets/isomer-logo-color.svg"
              height={24}
              width={22}
              alt="Back to dashboard"
              priority
            />
          }
        />
        <Text textStyle="subhead-2">{name}</Text>
      </Flex>
      <Spacer />
      <Box w="42.5rem">
        <Searchbar
          defaultIsExpanded
          size="md"
          placeholder={`What do you need to edit today? E.g., “Press release”, “Speech by”`}
        />
      </Box>
      <Spacer />
      <HStack spacing="0.5rem" textStyle="subhead-1">
        <Button
          variant="clear"
          size="xs"
          rightIcon={<BiLinkExternal fontSize="1.25rem" />}
          as={NextLink}
          target="_blank"
          href="https://go.gov.sg/isomer-issue"
        >
          Report an issue
        </Button>
        <AvatarMenu
          name={me.name}
          variant="subtle"
          bg="base.canvas.brand-subtle"
          menuListProps={{ maxWidth: "19rem" }}
        >
          <Menu.Item onClick={() => logout()}>Sign out</Menu.Item>
        </AvatarMenu>
      </HStack>
    </Flex>
  )
}

export const AdminCmsSearchableLayout: GetLayout = (page) => {
  return (
    <EnforceLoginStatePageWrapper>
      <LayoutHead />
      <Flex
        flex={1}
        overflow="hidden"
        flexDir="row"
        bg="base.canvas.alt"
        pos="relative"
      >
        <CmsSidebarWrapper>{page}</CmsSidebarWrapper>
      </Flex>
    </EnforceLoginStatePageWrapper>
  )
}

const siteSchema = z.object({
  siteId: z.coerce.string(),
})

// Extracted out since this needs to be a child of EnforceLoginStatePageWrapper
const CmsSidebarWrapper = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  const { siteId } = useQueryParse(siteSchema)

  const { logout } = useMe()

  const pageNavItems: CmsSidebarItem[] = [
    {
      icon: BiFolder,
      label: "Site content",
      href: `/sites/${siteId}`,
      isActive:
        router.asPath === `/sites/${siteId}` ||
        router.asPath.startsWith(`/sites/${siteId}/pages`),
    },

    // TODO(ISOM-1552): Add back manage users functionality when implemented
    { icon: BiCog, label: "Settings", href: `/sites/${siteId}/settings` },
  ]

  const userNavItems: CmsSidebarItem[] = [
    // TODO(ISOM-1552): Add back view live site functionality when implemented
    {
      icon: BiHelpCircle,
      label: "Isomer Guide ",
      href: "https://guide.isomer.gov.sg/",
    },
    {
      icon: BiLogOut,
      label: "Sign out",
      onClick: logout,
    },
  ]

  return (
    <CmsContainer
      sidebar={
        <CmsSidebar topNavItems={pageNavItems} bottomNavItems={userNavItems} />
      }
      sidenav={<DirectorySidebar siteId={siteId} />}
      header={<SearchableHeader siteId={siteId} />}
    >
      {children}
    </CmsContainer>
  )
}

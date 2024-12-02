import Image from "next/image"
import NextLink from "next/link"
import { Flex, Grid, GridItem, Text } from "@chakra-ui/react"
import { AvatarMenu, IconButton, Menu } from "@opengovsg/design-system-react"

import { Searchbar, useSearchStyle } from "~/components/Searchbar"
import { useMe } from "~/features/me/api"
import { DASHBOARD } from "~/lib/routes"
import { trpc } from "~/utils/trpc"

interface SearchableHeaderProps {
  siteId: string
}
export const SearchableHeader = ({ siteId }: SearchableHeaderProps) => {
  const { me, logout } = useMe()
  const [{ name }] = trpc.site.getSiteName.useSuspenseQuery({
    siteId: Number(siteId),
  })
  const { minWidth, maxWidth } = useSearchStyle()

  return (
    <Grid
      gridTemplateColumns={`1fr ${maxWidth} 1fr`}
      py={{ base: 0, md: "0.5rem" }}
      px={{ base: 0, md: "0.5rem" }}
      background="white"
      alignItems="start"
    >
      <Flex alignItems="center" as={GridItem}>
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
        <Text textStyle="subhead-2" noOfLines={1}>
          {name}
        </Text>
      </Flex>
      {/* NOTE: We are doing this because the searchbar has to be horizontally centered within the Flex */}
      <GridItem minW={minWidth} maxW={maxWidth}>
        <Searchbar siteId={siteId} />
      </GridItem>

      <GridItem justifyContent="flex-end" display="flex">
        <AvatarMenu
          name={me.name}
          variant="subtle"
          bg="base.canvas.brand-subtle"
          menuListProps={{ maxWidth: "19rem" }}
        >
          <Menu.Item onClick={() => logout()}>Sign out</Menu.Item>
        </AvatarMenu>
      </GridItem>
    </Grid>
  )
}

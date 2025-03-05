import { useContext } from "react"
import {
  Box,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useMultiStyleConfig,
} from "@chakra-ui/react"

import { UserManagementContext } from "~/features/users"
import { trpc } from "~/utils/trpc"
import { UserTable } from "../UserTable"
import { InactiveUsersBanner, IsomerAdminAccessBanner } from "./Banners"
import { UserTableTab } from "./UserTableTab"

interface UserTableTabsProps {
  siteId: number
  variant?: string
  size?: string
  colorScheme?: string
}

export const UserTableTabs = ({
  siteId,
  variant = "line",
  size = "md",
  colorScheme = "blue",
}: UserTableTabsProps) => {
  const ability = useContext(UserManagementContext)

  // Get Chakra UI's style configuration for Tabs
  const styles = useMultiStyleConfig("Tabs", { variant, size, colorScheme })

  const { data: agencyUsersCount = 0 } = trpc.user.count.useQuery({
    siteId,
    getIsomerAdmins: false,
  })

  const { data: isomerAdminsCount = 0 } = trpc.user.count.useQuery({
    siteId,
    getIsomerAdmins: true,
  })

  const { data: hasInactiveUsers = false } =
    trpc.user.hasInactiveUsers.useQuery({
      siteId,
    })

  return (
    <Box w="100%">
      <Tabs
        w="100%"
        variant={variant}
        size={size}
        colorScheme={colorScheme}
        isLazy
      >
        <TabList
          mb="1rem"
          borderBottomColor="base.divider.medium"
          __css={styles.tablist}
        >
          <UserTableTab label="Your users" count={agencyUsersCount} />
          <UserTableTab label="Isomer admins" count={isomerAdminsCount} />
        </TabList>
        <TabPanels __css={styles.tabpanels}>
          <TabPanel>
            {hasInactiveUsers && ability.can("manage", "UserManagement") && (
              <InactiveUsersBanner />
            )}
            <UserTable siteId={siteId} getIsomerAdmins={false} />
          </TabPanel>
          <TabPanel>
            <IsomerAdminAccessBanner />
            <UserTable siteId={siteId} getIsomerAdmins={true} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

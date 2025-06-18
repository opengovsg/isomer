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
    adminType: "agency",
  })

  const { data: isomerAdminsCount = 0 } = trpc.user.count.useQuery({
    siteId,
    adminType: "isomer",
  })

  const { data: inactiveUsersCount = 0 } = trpc.user.count.useQuery({
    siteId,
    adminType: "agency",
    activityType: "inactive",
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
            {inactiveUsersCount > 0 &&
              ability.can("manage", "UserManagement") && (
                <InactiveUsersBanner />
              )}
            <UserTable siteId={siteId} adminType="agency" />
          </TabPanel>
          <TabPanel>
            <IsomerAdminAccessBanner />
            <UserTable siteId={siteId} adminType="isomer" />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

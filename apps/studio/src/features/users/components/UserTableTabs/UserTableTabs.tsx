import { useContext } from "react"
import { TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react"

import { UserManagementContext } from "~/features/users"
import { UserTable } from "../UserTable"
import { InactiveUsersBanner, IsomerAdminAccessBanner } from "./Banners"
import { UserTableTab } from "./UserTableTab"

interface UserTableTabsProps {
  siteId: number
  agencyUsersCount: number
  isomerAdminsCount: number
  hasInactiveUsers: boolean
}

export const UserTableTabs = ({
  siteId,
  agencyUsersCount,
  isomerAdminsCount,
  hasInactiveUsers,
}: UserTableTabsProps) => {
  const ability = useContext(UserManagementContext)

  return (
    <Tabs w="100%">
      <TabList mb="1rem" borderBottomColor="base.divider.medium">
        <UserTableTab label="Your users" count={agencyUsersCount} />
        <UserTableTab label="Isomer admins" count={isomerAdminsCount} />
      </TabList>
      <TabPanels>
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
  )
}

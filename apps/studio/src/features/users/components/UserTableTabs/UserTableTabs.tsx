import { useContext } from "react"
import { TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react"

import { UserManagementContext } from "~/features/users"
import { trpc } from "~/utils/trpc"
import { UserTable } from "../UserTable"
import { InactiveUsersBanner, IsomerAdminAccessBanner } from "./Banners"
import { UserTableTab } from "./UserTableTab"

interface UserTableTabsProps {
  siteId: number
}

export const UserTableTabs = ({ siteId }: UserTableTabsProps) => {
  const ability = useContext(UserManagementContext)

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

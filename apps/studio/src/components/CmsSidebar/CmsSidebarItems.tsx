import type { IconType } from "react-icons"
import { useMemo } from "react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { List, ListItem, Tooltip } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"

export interface CmsSidebarItem {
  icon: IconType
  label: string
  href: string
  isActive?: boolean
}

export interface CmsSidebarItemsProps {
  navItems: CmsSidebarItem[]
}

const generateSidebarItem = (
  { icon: Icon, ...item }: CmsSidebarItem,
  index: number,
  asPath: string,
) => {
  const isActive = item.isActive ?? asPath === item.href
  return (
    <ListItem key={index}>
      <Tooltip label={item.label} placement="right">
        <IconButton
          key={index}
          as={NextLink}
          variant="clear"
          isActive={isActive}
          aria-label={item.label}
          icon={<Icon fontSize="1.5rem" />}
          href={item.href}
        />
      </Tooltip>
    </ListItem>
  )
}

export function CmsSidebarItems({ navItems }: CmsSidebarItemsProps) {
  const router = useRouter()

  const renderedSidebarItems = useMemo(() => {
    return navItems.map((item, index) =>
      generateSidebarItem(item, index, router.asPath),
    )
  }, [navItems, router.asPath])

  return <List spacing={3}>{renderedSidebarItems}</List>
}

export default CmsSidebarItems

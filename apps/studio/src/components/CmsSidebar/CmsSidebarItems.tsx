import type { IconType } from "react-icons"
import type { MergeExclusive } from "type-fest"
import { List, ListItem, Tooltip } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { useMemo } from "react"

export type CmsSidebarItem = {
  icon: IconType
  label: string
  isActive?: boolean
} & MergeExclusive<
  {
    href: string
  },
  {
    onClick: () => void
  }
>

interface CmsSidebarItemsProps {
  navItems: CmsSidebarItem[]
}

const generateSidebarItem = (
  { icon: Icon, ...item }: CmsSidebarItem,
  asPath: string,
) => {
  const isActive = item.isActive ?? (!!item.href && asPath === item.href)
  const itemKey = item.href ?? item.label
  const handleClick = item.onClick
    ? () => {
        item.onClick()
      }
    : undefined

  return (
    <ListItem key={itemKey}>
      <Tooltip label={item.label} placement="right">
        {item.href ? (
          <IconButton
            key={itemKey}
            as={NextLink}
            variant="clear"
            isActive={isActive}
            aria-label={item.label}
            icon={<Icon fontSize="1.5rem" fill="base.content.default" />}
            _active={{
              bg: "interaction.muted.main.active",
              fill: "base.content.brand",
            }}
            href={item.href}
          />
        ) : (
          <IconButton
            key={itemKey}
            variant="clear"
            aria-label={item.label}
            icon={<Icon fontSize="1.5rem" />}
            onClick={handleClick}
          />
        )}
      </Tooltip>
    </ListItem>
  )
}

export const CmsSidebarItems = ({ navItems }: CmsSidebarItemsProps) => {
  const router = useRouter()

  const renderedSidebarItems = useMemo(
    () => navItems.map((item) => generateSidebarItem(item, router.asPath)),
    [navItems, router.asPath],
  )

  return <List spacing={3}>{renderedSidebarItems}</List>
}

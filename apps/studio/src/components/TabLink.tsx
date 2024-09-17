import type { LinkProps } from "@chakra-ui/react"
import NextLink from "next/link"
import { chakra, useMultiStyleConfig } from "@chakra-ui/react"

const Link = chakra(NextLink)

interface TabLinkProps extends LinkProps {
  isActive?: boolean
}

/** A Link component that looks like the Tab component */
export const TabLink = ({ isActive, ...props }: TabLinkProps) => {
  const styles = useMultiStyleConfig("Tabs", {})

  return <Link aria-selected={isActive} {...props} sx={styles.tab} />
}

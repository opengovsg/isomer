import type { NavbarProps } from "~/interfaces"
import type { NavbarItem } from "~/interfaces/internal/Navbar"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import NavbarClient from "./NavbarClient"

// This section is server rendered to optimize performance
// by avoiding the transfer of large sitemaps (under `site`) to the client,
// thereby reducing the overall build size.
export const Navbar = ({
  logoUrl,
  logoAlt,
  layout,
  search,
  items,
  site,
  LinkComponent,
}: Omit<NavbarProps, "type">) => {
  // recursive function to process each navbar item
  const processNavItem = (item: NavbarItem): NavbarItem => ({
    ...item,
    referenceLinkHref: getReferenceLinkHref(
      item.url,
      site.siteMap,
      site.assetsBaseUrl,
    ),
    items: item.items?.map(processNavItem),
  })

  return (
    <NavbarClient
      layout={layout}
      search={search}
      items={items.map(processNavItem)}
      imageClientProps={{
        src:
          isExternalUrl(logoUrl) || site.assetsBaseUrl === undefined
            ? logoUrl
            : `${site.assetsBaseUrl}${logoUrl}`,
        alt: logoAlt,
        width: "100%",
        className:
          "max-h-[48px] max-w-[128px] object-contain object-center lg:mr-3",
        assetsBaseUrl: site.assetsBaseUrl,
        lazyLoading: false, // will always be above the fold
      }}
      LinkComponent={LinkComponent}
    />
  )
}

export default Navbar

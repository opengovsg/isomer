import type { NavbarProps } from "~/interfaces"
import type { NavbarItemProps } from "~/interfaces/internal/Navbar"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import NavbarClient from "./NavbarClient"

// This section is server rendered to optimize performance
// by avoiding the transfer of large sitemaps (under `site`) to the client,
// thereby reducing the overall build size.
export const Navbar = ({
  logoUrl,
  logoAlt,
  callToAction,
  utility,
  layout,
  search,
  items,
  site,
  LinkComponent,
}: NavbarProps) => {
  // recursive function to process each navbar item
  const processNavItem = (item: NavbarItemProps): NavbarItemProps => ({
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
          "max-h-[48px] max-w-[128px] object-contain object-left lg:mr-3",
        assetsBaseUrl: site.assetsBaseUrl,
        lazyLoading: false, // will always be above the fold
      }}
      callToAction={
        callToAction && {
          label: callToAction.label,
          referenceLinkHref: getReferenceLinkHref(
            callToAction.url,
            site.siteMap,
            site.assetsBaseUrl,
          ),
          isExternal: isExternalUrl(callToAction.url),
        }
      }
      utility={
        utility && !callToAction
          ? {
              label: utility.label,
              items: utility.items.map((item) => ({
                name: item.name,
                url:
                  getReferenceLinkHref(
                    item.url,
                    site.siteMap,
                    site.assetsBaseUrl,
                  ) || item.url,
              })),
            }
          : undefined
      }
      LinkComponent={LinkComponent}
    />
  )
}

export default Navbar

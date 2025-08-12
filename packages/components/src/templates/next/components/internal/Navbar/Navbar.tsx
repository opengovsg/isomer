import type { NavbarProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import NavbarClient from "./NavbarClient"

const navbarLogoStyles = tv({
  base: "object-contain object-left",
  variants: {
    variant: {
      utility: "max-h-[68px] max-w-[180px]",
      default: "max-h-[48px] max-w-[128px]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

// This section is server rendered to optimize performance
// by avoiding the transfer of large sitemaps (under `site`) to the client,
// thereby reducing the overall build size.
export const Navbar = ({
  logoUrl,
  logoAlt,
  layout,
  search,
  items,
  callToAction,
  utility,
  site,
  LinkComponent,
}: NavbarProps) => {
  // recursive function to process each navbar item
  const processNavItem = (
    item: NavbarProps["items"][number],
  ): NavbarProps["items"][number] => ({
    ...item,
    url:
      getReferenceLinkHref(item.url, site.siteMap, site.assetsBaseUrl) ??
      item.url,
    items: item.items?.map(processNavItem),
  })

  return (
    <NavbarClient
      layout={layout}
      search={search}
      items={items.map(processNavItem)}
      LinkComponent={LinkComponent}
      imageClientProps={{
        src:
          isExternalUrl(logoUrl) || site.assetsBaseUrl === undefined
            ? logoUrl
            : `${site.assetsBaseUrl}${logoUrl}`,
        alt: logoAlt,
        width: "100%",
        className: navbarLogoStyles({
          variant: !!utility ? "utility" : "default",
        }),
        assetsBaseUrl: site.assetsBaseUrl,
        lazyLoading: false, // will always be above the fold
      }}
      callToAction={
        !!callToAction
          ? {
              label: callToAction.label,
              url:
                getReferenceLinkHref(
                  callToAction.url,
                  site.siteMap,
                  site.assetsBaseUrl,
                ) ?? callToAction.url,
            }
          : undefined
      }
      utility={
        !!utility
          ? {
              label: utility.label,
              items: utility.items.map((item) => ({
                name: item.name,
                url:
                  getReferenceLinkHref(
                    item.url,
                    site.siteMap,
                    site.assetsBaseUrl,
                  ) ?? item.url,
              })),
            }
          : undefined
      }
    />
  )
}

export default Navbar

import type { NavbarProps } from "~/interfaces"
import type { NavbarItemProps } from "~/interfaces/internal/Navbar"
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
  site,
  LinkComponent,
  ...rest
}: NavbarProps) => {
  // recursive function to process each navbar item
  const processNavItem = (item: NavbarItemProps): NavbarItemProps => ({
    ...item,
    url:
      getReferenceLinkHref(item.url, site.siteMap, site.assetsBaseUrl) ??
      item.url,
    items: item.items?.map(processNavItem),
  })

  const navbarClientCommonProps = {
    layout,
    search,
    items: items.map(processNavItem),
    imageClientProps: {
      src:
        isExternalUrl(logoUrl) || site.assetsBaseUrl === undefined
          ? logoUrl
          : `${site.assetsBaseUrl}${logoUrl}`,
      alt: logoAlt,
      width: "100%",
      className: navbarLogoStyles({
        variant: rest.variant === "utility" ? "utility" : "default",
      }),
      assetsBaseUrl: site.assetsBaseUrl,
      lazyLoading: false, // will always be above the fold
    },
    LinkComponent,
  }

  switch (rest.variant) {
    case "callToAction":
      return (
        <NavbarClient
          {...navbarClientCommonProps}
          {...rest}
          callToAction={{
            label: rest.callToAction.label,
            url:
              getReferenceLinkHref(
                rest.callToAction.url,
                site.siteMap,
                site.assetsBaseUrl,
              ) ?? rest.callToAction.url,
          }}
        />
      )

    case "utility":
      return (
        <NavbarClient
          {...navbarClientCommonProps}
          {...rest}
          utility={{
            label: rest.utility.label,
            items: rest.utility.items.map((item) => ({
              name: item.name,
              url:
                getReferenceLinkHref(
                  item.url,
                  site.siteMap,
                  site.assetsBaseUrl,
                ) ?? item.url,
            })),
          }}
        />
      )

    case "default":
      return <NavbarClient {...navbarClientCommonProps} {...rest} />

    default:
      const _: never = rest
      return <></>
  }
}

export default Navbar

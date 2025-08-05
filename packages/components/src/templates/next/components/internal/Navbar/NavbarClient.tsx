"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { BiMenu, BiSearch, BiX } from "react-icons/bi"
import { useResizeObserver } from "usehooks-ts"

import type { NavbarClientProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight, isExternalUrl } from "~/utils"
import { ImageClient } from "../../complex/Image"
import { LocalSearchInputBox, SearchSGInputBox } from "../../internal"
import { LinkButton } from "../../internal/LinkButton"
import { IconButton } from "../IconButton"
import { Link } from "../Link"
import { MobileNavMenu } from "./MobileNavMenu"
import { NavItem } from "./NavItem"

const createNavbarStyles = tv({
  slots: {
    navbar: "relative flex flex-col",
    navbarContainer: "flex min-h-16 w-full bg-white lg:min-h-[4.25rem]",
    logo: "flex flex-shrink-0 rounded focus-visible:bg-utility-highlight",
    navigationSection: "flex w-full flex-col items-center justify-between",
    primaryNavigationSection: "flex w-full items-center justify-end",
    utilityNavigationSection:
      "prose-label-sm-medium mt-3 hidden w-full items-center justify-end gap-4 lg:flex",
    utilityItemsList: "flex items-center gap-4",
    utilityItemsHeader: "prose-label-sm-medium text-base-content-subtle",
    utilityItem: [
      focusVisibleHighlight(),
      "prose-label-sm-medium text-base-content-subtle hover:underline",
    ],
    navbarItems:
      "mx-auto flex w-full max-w-screen-xl items-center justify-between gap-x-4 pl-6 pr-3 md:px-10",
    navItemContainer: "hidden flex-1 items-center gap-x-4 pl-2 lg:flex",
    callToAction: "align-content mx-5 hidden h-fit lg:flex",
    buttonsSection: "flex flex-row gap-1",
    searchIcon: "flex h-[68px] items-center",
    hamburgerIcon: "flex h-[68px] items-center lg:hidden",
    searchBar: "mx-auto mb-4 w-full max-w-screen-xl px-6 lg:px-10",
  },
  variants: {
    isSearchOpen: {
      true: {
        searchBar: "block",
      },
      false: {
        searchBar: "hidden",
      },
    },
  },
})

const navbarStyles = createNavbarStyles()

export const NavbarClient = ({
  layout,
  search,
  items,
  callToAction,
  utility,
  imageClientProps,
  LinkComponent,
}: Omit<NavbarClientProps, "type">) => {
  const [openNavItemIdx, setOpenNavItemIdx] = useState(-1)
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [mobileNavbarTopPx, setMobileNavbarTopPx] = useState<number>()

  const isMenuOpen = openNavItemIdx !== -1 || isHamburgerOpen

  // Reference for navigation items bar on desktop
  const navDesktopRef = useRef<HTMLUListElement>(null)

  // Reference for the site header
  const siteHeaderRef = useRef<HTMLDivElement>(null)

  const refreshMenuOffset = useCallback(() => {
    setMobileNavbarTopPx(siteHeaderRef.current?.getBoundingClientRect().bottom)
  }, [])

  useResizeObserver({
    ref: siteHeaderRef,
    onResize: refreshMenuOffset,
  })

  const onCloseMenu = useCallback(() => {
    setIsHamburgerOpen(false)
    setOpenNavItemIdx(-1)
  }, [])

  const activeNavRef = useRef(null)

  useLayoutEffect(() => {
    if (isMenuOpen) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: isHamburgerOpen ? undefined : "smooth",
      })
      refreshMenuOffset()
    }
  }, [isHamburgerOpen, isMenuOpen, refreshMenuOffset])

  return (
    <div className={navbarStyles.navbar()}>
      {/* Site header */}
      <div className={navbarStyles.navbarContainer()} ref={siteHeaderRef}>
        <div className={navbarStyles.navbarItems()}>
          {/* Logo */}
          <Link
            LinkComponent={LinkComponent}
            className={navbarStyles.logo()}
            href="/"
          >
            <ImageClient {...imageClientProps} />
          </Link>

          <div className={navbarStyles.navigationSection()}>
            {utility && (
              <div className={navbarStyles.utilityNavigationSection()}>
                <p className={navbarStyles.utilityItemsHeader()}>
                  {utility.label || "Quick links"}
                </p>
                <ul className={navbarStyles.utilityItemsList()}>
                  {utility.items.map((item, index) => (
                    <li key={`${item.name}-${index}`}>
                      <Link
                        LinkComponent={LinkComponent}
                        className={navbarStyles.utilityItem()}
                        href={item.url}
                        isExternal={isExternalUrl(item.url)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={navbarStyles.primaryNavigationSection()}>
              {/* Navigation items (for desktop) */}
              <ul
                className={navbarStyles.navItemContainer()}
                ref={navDesktopRef}
              >
                {items.map((item, index) => (
                  <NavItem
                    key={`${item.name}-${index}`}
                    ref={openNavItemIdx === index ? activeNavRef : null}
                    {...item}
                    onCloseMegamenu={onCloseMenu}
                    onClick={() => {
                      setIsSearchOpen(false)
                      setOpenNavItemIdx((currIdx) =>
                        currIdx === index ? -1 : index,
                      )
                    }}
                    isOpen={openNavItemIdx === index && !isHamburgerOpen}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    LinkComponent={LinkComponent}
                  />
                ))}
              </ul>

              {/* Call To Action button */}
              {callToAction && (
                <LinkButton
                  href={callToAction.referenceLinkHref}
                  isExternal={callToAction.isExternal}
                  size="sm"
                  className={navbarStyles.callToAction()}
                  isWithFocusVisibleHighlight
                  LinkComponent={LinkComponent}
                >
                  {callToAction.label}
                </LinkButton>
              )}

              <div className={navbarStyles.buttonsSection()}>
                {/* Search icon */}
                {search && !isHamburgerOpen && layout !== "search" && (
                  <div className={navbarStyles.searchIcon()}>
                    {isSearchOpen ? (
                      <IconButton
                        onPress={() => {
                          setIsSearchOpen(!isSearchOpen)
                        }}
                        aria-label="Close search bar"
                        icon={BiX}
                      />
                    ) : (
                      <IconButton
                        onPress={() => {
                          setOpenNavItemIdx(-1)
                          setIsSearchOpen(!isSearchOpen)
                        }}
                        aria-label="Open search bar"
                        icon={BiSearch}
                      />
                    )}
                  </div>
                )}

                {/* Hamburger menu for small screens */}
                <div className={navbarStyles.hamburgerIcon()}>
                  {isHamburgerOpen ? (
                    <IconButton
                      onPress={onCloseMenu}
                      aria-label="Close navigation menu"
                      icon={BiX}
                    />
                  ) : (
                    <IconButton
                      onPress={() => {
                        setIsHamburgerOpen(true)
                        setIsSearchOpen(false)
                      }}
                      aria-label="Open navigation menu"
                      icon={BiMenu}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      {search && layout !== "search" && (
        <div className={navbarStyles.searchBar({ isSearchOpen })}>
          {search.type === "localSearch" && (
            <LocalSearchInputBox searchUrl={search.searchUrl} />
          )}

          {search.type === "searchSG" && (
            <SearchSGInputBox
              clientId={search.clientId}
              isOpen={isSearchOpen}
            />
          )}
        </div>
      )}
      {isHamburgerOpen && (
        <MobileNavMenu
          top={mobileNavbarTopPx}
          items={items}
          callToAction={callToAction}
          utility={utility}
          openNavItemIdx={openNavItemIdx}
          setOpenNavItemIdx={setOpenNavItemIdx}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          LinkComponent={LinkComponent}
          onCloseMenu={onCloseMenu}
        />
      )}
    </div>
  )
}

export default NavbarClient

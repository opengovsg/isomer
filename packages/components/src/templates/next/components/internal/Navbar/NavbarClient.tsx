"use client"

/* oxlint-disable eslint/complexity -- responsive navbar layout, search, and megamenu state are colocated */
import type { NavbarClientProps } from "~/interfaces"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { BiMenu, BiSearch, BiX } from "react-icons/bi"
import { useResizeObserver } from "usehooks-ts"
import { tv } from "~/lib/tv"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { focusVisibleHighlight } from "~/utils/tailwind"
import { hasNonEmptyString } from "~/utils/truthiness"

import { LinkButton } from "../../internal/LinkButton"
import { LocalSearchInputBox } from "../../internal/LocalSearchInputBox"
import { NavbarSearchSGInputBox } from "../../internal/SearchSGInputBox"
import { IconButton } from "../IconButton"
import { ImageClient } from "../ImageClient"
import { Link } from "../Link"
import { MobileNavMenu } from "./MobileNavMenu"
import { NavItem } from "./NavItem"

interface Size {
  width?: number
  height?: number
}

const createNavbarStyles = tv({
  slots: {
    buttonsSection: "flex flex-row gap-1",
    callToAction: "align-content h-fit",
    hamburgerIcon: "flex h-[68px] items-center lg:hidden",
    logo: "flex flex-shrink-0 rounded focus-visible:bg-utility-highlight",
    navItemContainer: "hidden flex-1 items-center gap-x-4 pl-2 lg:flex",
    navbar: "relative flex flex-col",
    navbarContainer: "flex min-h-16 w-full bg-white lg:min-h-[4.25rem]",
    navbarItems:
      "mx-auto flex w-full max-w-screen-xl items-center justify-between gap-x-4 pl-6 pr-3 md:px-10",
    navigationSection: "flex w-full flex-col items-center justify-between",
    primaryNavigationSection: "flex w-full items-center justify-end",
    searchBar: "mx-auto mb-4 w-full max-w-screen-xl px-6 lg:px-10",
    searchIcon: "flex h-[68px] items-center",
    utilityItem: [
      focusVisibleHighlight(),
      "prose-label-sm-medium inline-block py-1 text-base-content-subtle hover:underline",
    ],
    utilityItemsHeader: "prose-label-sm-medium text-base-content-strong",
    utilityItemsList: "flex items-center gap-4",
    utilityNavigationSection:
      "prose-label-sm-medium mt-3 hidden w-full items-center justify-end gap-4 lg:flex",
  },
  variants: {
    isPinned: {
      false: {
        callToAction: "mx-5 hidden lg:flex",
      },
      true: {
        callToAction: "my-2 flex",
        navbarContainer: "py-1 lg:py-0",
        primaryNavigationSection: "gap-3",
        searchIcon: "hidden lg:flex",
      },
    },
    isSearchOpen: {
      false: {
        searchBar: "hidden",
      },
      true: {
        searchBar: "block",
      },
    },
  },
})

const navbarStyles = createNavbarStyles()

export const NavbarClient = ({
  layout,
  search,
  items,
  imageClientProps,
  callToAction,
  utility,
}: NavbarClientProps) => {
  const isPinned = callToAction?.isPinnedOnMobile === true

  const [openNavItemIdx, setOpenNavItemIdx] = useState(-1)
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [mobileNavbarTopPx, setMobileNavbarTopPx] = useState<number>()

  const isMenuOpen = openNavItemIdx !== -1 || isHamburgerOpen

  // Reference for navigation items bar on desktop
  const navDesktopRef = useRef<HTMLUListElement>(null)

  // Reference for the site header
  const siteHeaderRef = useRef<HTMLDivElement>(null)

  const updateMenuOffset = (size?: Size) => {
    setMobileNavbarTopPx(siteHeaderRef.current?.getBoundingClientRect().bottom)

    if (size === undefined) {
      return
    }

    if (size.width !== undefined && size.width < 1024) {
      // close any open nav items when resizing to mobile
      setOpenNavItemIdx(-1)
    } else {
      setIsHamburgerOpen(false)
    }
  }

  useResizeObserver({
    onResize: updateMenuOffset,
    ref: siteHeaderRef,
  })

  // When the hamburger menu is open, also watch the full <header> for height
  // changes caused by siblings like masthead/notification toggling, since those
  // don't resize the navbar container but do shift its position.
  // oxlint-disable-next-line react-doctor/effect-needs-cleanup -- menu/header guards return noop cleanup before observer is registered
  useEffect(() => {
    if (!isHamburgerOpen) {
      return function noopCleanup() {
        // noop
      }
    }

    const header = siteHeaderRef.current?.closest("header")
    if (header === null || header === undefined) {
      return function noopCleanup() {
        // noop
      }
    }

    const observer = new ResizeObserver(() => {
      setMobileNavbarTopPx(
        siteHeaderRef.current?.getBoundingClientRect().bottom,
      )
    })
    observer.observe(header)
    return () => {
      observer.disconnect()
    }
  }, [isHamburgerOpen])

  const onCloseMenu = () => {
    setIsHamburgerOpen(false)
    setOpenNavItemIdx(-1)
  }

  const activeNavRef = useRef(null)

  useLayoutEffect(() => {
    if (!isMenuOpen) {
      return
    }

    window.scrollTo({
      behavior: isHamburgerOpen ? undefined : "smooth",
      left: 0,
      top: 0,
    })
    setMobileNavbarTopPx(siteHeaderRef.current?.getBoundingClientRect().bottom)
  }, [isHamburgerOpen, isMenuOpen])

  return (
    <div className={navbarStyles.navbar()}>
      {/* Site header */}
      <div
        className={navbarStyles.navbarContainer({ isPinned })}
        ref={siteHeaderRef}
      >
        <div className={navbarStyles.navbarItems()}>
          {/* Logo */}
          <Link className={navbarStyles.logo()} href="/">
            <ImageClient {...imageClientProps} />
          </Link>

          <div className={navbarStyles.navigationSection()}>
            {utility !== undefined && utility !== null && (
              <div className={navbarStyles.utilityNavigationSection()}>
                {hasNonEmptyString(utility.label) && (
                  <p className={navbarStyles.utilityItemsHeader()}>
                    {utility.label}
                  </p>
                )}
                <ul className={navbarStyles.utilityItemsList()}>
                  {utility.items.map((item) => (
                    <li key={item.url}>
                      <Link
                        className={navbarStyles.utilityItem()}
                        href={item.url}
                        isExternal={isExternalUrl(item.url)}
                        showExternalIcon={isExternalUrl(item.url)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div
              className={navbarStyles.primaryNavigationSection({ isPinned })}
            >
              {/* Navigation items (for desktop) */}
              <ul
                className={navbarStyles.navItemContainer()}
                ref={navDesktopRef}
              >
                {items.map((item, index) => (
                  <NavItem
                    key={item.url}
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
                  />
                ))}
              </ul>

              {/* Call To Action button */}
              {callToAction !== undefined && callToAction !== null && (
                <LinkButton
                  href={callToAction.url}
                  isExternal={isExternalUrl(callToAction.url)}
                  size="sm"
                  className={navbarStyles.callToAction({ isPinned })}
                  isWithFocusVisibleHighlight
                >
                  {isPinned ? (
                    <span className="max-w-[10rem] truncate max-xs:line-clamp-2 max-xs:whitespace-normal">
                      {callToAction.label}
                    </span>
                  ) : (
                    callToAction.label
                  )}
                </LinkButton>
              )}

              <div className={navbarStyles.buttonsSection()}>
                {/* Search icon */}
                {search !== undefined &&
                  search !== null &&
                  !isHamburgerOpen &&
                  layout !== "search" && (
                    <div className={navbarStyles.searchIcon({ isPinned })}>
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
      {search !== undefined && search !== null && layout !== "search" && (
        <div className={navbarStyles.searchBar({ isSearchOpen })}>
          {search.type === "localSearch" && (
            <LocalSearchInputBox searchUrl={search.searchUrl} />
          )}

          {search.type === "searchSG" && (
            <NavbarSearchSGInputBox
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
          openNavItemIdx={openNavItemIdx}
          setOpenNavItemIdx={setOpenNavItemIdx}
          callToAction={callToAction}
          utility={utility}
          onCloseMenu={onCloseMenu}
          isPinned={isPinned}
          search={isPinned && layout !== "search" ? search : undefined}
        />
      )}
    </div>
  )
}

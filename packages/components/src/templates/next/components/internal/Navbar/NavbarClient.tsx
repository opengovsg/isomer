"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { BiMenu, BiSearch, BiX } from "react-icons/bi"
import { useResizeObserver } from "usehooks-ts"

import type { NavbarClientProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { ImageClient } from "../../complex/Image"
import { LocalSearchInputBox, SearchSGInputBox } from "../../internal"
import { IconButton } from "../IconButton"
import { Link } from "../Link"
import { MobileNavMenu } from "./MobileNavMenu"
import { NavItem } from "./NavItem"

const navbarStyles = tv({
  slots: {
    navbarContainer: "flex min-h-16 w-full bg-white lg:min-h-[4.25rem]",
    navbar:
      "mx-auto flex w-full max-w-screen-xl items-center justify-between gap-x-2 pl-6 pr-3 md:px-10",
    navItemContainer:
      "hidden flex-1 flex-wrap items-center gap-x-4 pl-2 lg:flex",
  },
})

const { navItemContainer, navbarContainer, navbar } = navbarStyles()

export const NavbarClient = ({
  layout,
  search,
  items,
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
    <div className="relative flex flex-col">
      {/* Site header */}
      <div className={navbarContainer()} ref={siteHeaderRef}>
        <div className={navbar()}>
          {/* Logo */}
          <Link
            LinkComponent={LinkComponent}
            className="flex rounded focus-visible:bg-utility-highlight"
            href="/"
          >
            <ImageClient {...imageClientProps} />
          </Link>

          {/* Navigation items (for desktop) */}
          <ul className={navItemContainer()} ref={navDesktopRef}>
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

          <div className="flex flex-row gap-1">
            {/* Search icon */}
            {search && !isHamburgerOpen && layout !== "search" && (
              <div className="flex h-[68px] items-center">
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
            <div className="flex h-[68px] items-center lg:hidden">
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

      {/* Search bar */}
      {search && layout !== "search" && (
        <div
          className={`${
            isSearchOpen ? "block" : "hidden"
          } mx-auto mb-4 w-full max-w-screen-xl px-6 lg:px-10`}
        >
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

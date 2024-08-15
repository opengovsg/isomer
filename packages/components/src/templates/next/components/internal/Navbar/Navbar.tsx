"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { BiMenu, BiSearch, BiX } from "react-icons/bi"
import { useOnClickOutside, useResizeObserver } from "usehooks-ts"

import type { NavbarProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { LocalSearchInputBox, SearchSGInputBox } from "../../internal"
import { IconButton } from "../IconButton"
import { MobileNavMenu } from "./MobileNavMenu"
import { NavItem } from "./NavItem"

const navbarStyles = tv({
  slots: {
    logo: "max-h-[68px] object-contain object-center",
    navbarContainer: "flex min-h-16 w-full bg-white lg:min-h-[4.25rem]",
    navbar:
      "mx-auto flex w-full max-w-screen-xl justify-between gap-x-2 pl-6 pr-3 lg:px-10",
    navItemContainer:
      "hidden flex-1 flex-wrap items-center gap-x-3 pl-2 lg:flex",
  },
})

const { navItemContainer, navbarContainer, navbar, logo } = navbarStyles()

export const Navbar = ({
  logoUrl,
  logoAlt,
  search,
  items,
  LinkComponent = "a",
  ScriptComponent = "script",
}: Omit<NavbarProps, "type">) => {
  const [openNavItemIdx, setOpenNavItemIdx] = useState(-1)
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [siteHeaderBottomPx, setSiteHeaderBottomPx] = useState<number>()

  const isMenuOpen = openNavItemIdx !== -1 || isHamburgerOpen

  // Reference for navigation items bar on desktop
  const navDesktopRef = useRef<HTMLUListElement>(null)

  // Reference for the site header
  const siteHeaderRef = useRef<HTMLDivElement>(null)

  const refreshMenuOffset = useCallback(() => {
    setSiteHeaderBottomPx(siteHeaderRef.current?.getBoundingClientRect().bottom)
  }, [])

  useResizeObserver({
    ref: siteHeaderRef,
    onResize: refreshMenuOffset,
  })

  const handleClickOutside = useCallback(() => {
    if (!isHamburgerOpen) {
      setOpenNavItemIdx(-1)
    }
  }, [isHamburgerOpen])

  const megaMenuRef = useRef(null)
  const activeNavRef = useRef(null)
  const mobileMenuRef = useRef(null)

  useOnClickOutside(
    [activeNavRef, megaMenuRef, mobileMenuRef],
    handleClickOutside,
    "mouseup",
  )

  useLayoutEffect(() => {
    if (isMenuOpen) {
      window.scrollTo({
        top: 0,
        left: 0,
      })
      refreshMenuOffset()
    }
  }, [isMenuOpen, refreshMenuOffset])

  return (
    <div className="relative flex flex-col">
      {/* Site header */}
      <div className={navbarContainer()} ref={siteHeaderRef}>
        <div className={navbar()}>
          {/* Logo */}
          <LinkComponent className="flex" href="/">
            <img src={logoUrl} alt={logoAlt} className={logo()} />
          </LinkComponent>

          {/* Navigation items (for desktop) */}
          <ul className={navItemContainer()} ref={navDesktopRef}>
            {items.map((item, index) => (
              <NavItem
                top={siteHeaderBottomPx}
                key={`${item.name}-${index}`}
                megaMenuRef={megaMenuRef}
                ref={openNavItemIdx === index ? activeNavRef : null}
                {...item}
                onCloseMegamenu={handleClickOutside}
                onClick={() => {
                  setIsSearchOpen(false)
                  setOpenNavItemIdx((currIdx) =>
                    currIdx === index ? -1 : index,
                  )
                }}
                isOpen={openNavItemIdx === index}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                LinkComponent={LinkComponent}
              />
            ))}
          </ul>

          <div className="flex flex-row gap-1">
            {/* Search icon */}
            {search && !isHamburgerOpen && (
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
                  onPress={() => {
                    setIsHamburgerOpen(false)
                    setOpenNavItemIdx(-1)
                  }}
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
      {search && (
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
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              ScriptComponent={ScriptComponent}
            />
          )}
        </div>
      )}
      {isHamburgerOpen && (
        <MobileNavMenu
          ref={mobileMenuRef}
          top={siteHeaderBottomPx}
          items={items}
          openNavItemIdx={openNavItemIdx}
          setOpenNavItemIdx={setOpenNavItemIdx}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          LinkComponent={LinkComponent}
        />
      )}
    </div>
  )
}

export default Navbar

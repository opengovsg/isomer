"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { usePreventScroll } from "react-aria"
import { BiSearch, BiX } from "react-icons/bi"
import { tv } from "tailwind-variants"
import { useOnClickOutside, useResizeObserver } from "usehooks-ts"

import type { NavbarProps } from "~/interfaces"
import { LocalSearchInputBox, SearchSGInputBox } from "../../internal"
import { HamburgerIcon } from "./HamburgerIcon"
import { MobileNavMenu } from "./MobileNavMenu"
import { NavItem } from "./NavItem"

const navbarStyles = tv({
  slots: {
    overlay: "fixed inset-0 bg-canvas-overlay bg-opacity-40",
    icon: "my-3 flex items-center justify-center text-[1.25rem] lg:my-[1.1875rem] lg:h-[2.125rem] lg:w-[2.125rem]",
    logo: "my-3 h-10 w-32 max-w-[6.625rem] object-contain object-center lg:h-12 lg:max-w-32",
    navbarContainer: "flex min-h-16 w-full bg-white lg:min-h-[4.25rem]",
    navbar:
      "mx-auto flex w-full max-w-screen-xl gap-x-4 px-6 lg:gap-x-6 lg:px-10",
    navItemContainer: "hidden flex-wrap items-center gap-x-6 lg:flex",
  },
})

const { overlay, navItemContainer, navbarContainer, navbar, logo, icon } =
  navbarStyles()

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

  usePreventScroll({
    isDisabled: !isMenuOpen,
  })

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
      {isMenuOpen && !isHamburgerOpen && (
        <div
          aria-hidden
          style={{
            top: siteHeaderBottomPx,
          }}
          className={overlay()}
        />
      )}
      {/* Site header */}
      <div className={navbarContainer()} ref={siteHeaderRef}>
        <div className={navbar()}>
          {/* Logo */}
          <LinkComponent href="/">
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search icon */}
          {search && !isHamburgerOpen && (
            <>
              {isSearchOpen ? (
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  aria-label="Close search bar"
                  className={icon({ className: "text-[1.5rem]" })}
                >
                  <BiX />
                </button>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  aria-label="Open search bar"
                  className={icon()}
                >
                  <BiSearch />
                </button>
              )}
            </>
          )}

          {/* Hamburger menu for small screens */}
          <div className="flex lg:hidden">
            {isHamburgerOpen ? (
              <button
                onClick={() => {
                  setIsHamburgerOpen(false)
                  setOpenNavItemIdx(-1)
                }}
                className={icon({ className: "text-[1.5rem]" })}
                aria-label="Close navigation menu"
              >
                <BiX />
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsHamburgerOpen(true)
                  setIsSearchOpen(false)
                }}
                aria-label="Open navigation menu"
                className={icon()}
              >
                <HamburgerIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      {search && (
        <div
          className={`${
            isSearchOpen ? "block" : "hidden"
          } mx-auto mb-4 w-full max-w-container px-6 lg:px-10`}
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

"use client"

import { startTransition, useEffect, useRef, useState } from "react"
import {
  BiChevronRight,
  BiLeftArrowAlt,
  BiMenu,
  BiRightArrowAlt,
  BiSearch,
  BiX,
} from "react-icons/bi"
import { useOnClickOutside } from "usehooks-ts"

import type { NavbarProps } from "~/interfaces"
import { LocalSearchInputBox, SearchSGInputBox } from "../../internal"
import { NavItem } from "./NavItem"

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

  // Reference for navigation items bar on desktop
  const navDesktopRef = useRef<HTMLUListElement>(null)

  // Reference for the site header
  const siteHeaderRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = () => {
    startTransition(() => {
      setOpenNavItemIdx(-1)
    })
  }

  const megaMenuRef = useRef(null)
  const activeNavRef = useRef(null)

  useOnClickOutside([activeNavRef, megaMenuRef], handleClickOutside, "mouseup")

  return (
    <div className="relative flex flex-col">
      {/* Site header */}
      <div
        className="mx-auto flex w-full max-w-container flex-row gap-4 px-6 py-6 lg:px-10"
        ref={siteHeaderRef}
      >
        {/* Logo */}
        <LinkComponent href="/" className="my-auto">
          <img
            src={logoUrl}
            alt={logoAlt}
            className="h-11 w-32 max-w-[110px] object-contain object-center lg:h-12 lg:max-w-[128px]"
          />
        </LinkComponent>

        {/* Navigation items (for desktop) */}
        <div className="mx-auto hidden w-full content-center lg:block">
          <ul
            className="mt-2 flex flex-row flex-wrap gap-1"
            ref={navDesktopRef}
          >
            {items.map((item, idx) => (
              <NavItem
                megaMenuRef={megaMenuRef}
                ref={openNavItemIdx === idx ? activeNavRef : null}
                LinkComponent={LinkComponent}
                {...item}
                onCloseMegamenu={() => {
                  startTransition(() => {
                    setOpenNavItemIdx(-1)
                  })
                }}
                onClick={() => {
                  setIsSearchOpen(false)
                  setOpenNavItemIdx((currIdx) => (currIdx === idx ? -1 : idx))
                }}
                isOpen={openNavItemIdx === idx}
                key={`${item.name}-{idx}`}
              />
            ))}
          </ul>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search icon */}
        {search && !isHamburgerOpen && (
          <div className="my-auto block">
            {isSearchOpen ? (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Close search bar"
                className="mt-[5px]"
              >
                <BiX className="text-2xl" />
              </button>
            ) : (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Open search bar"
                className="mt-[5px]"
              >
                <BiSearch className="text-2xl" />
              </button>
            )}
          </div>
        )}

        {/* Hamburger menu for small screens */}
        <div className="my-auto block lg:hidden">
          {isHamburgerOpen ? (
            <button
              onClick={() => {
                setIsHamburgerOpen(false)
                setOpenNavItemIdx(-1)
              }}
              aria-label="Close navigation menu"
            >
              Close
              <BiX className="-mt-0.5 ml-1 inline text-2xl" />
            </button>
          ) : (
            <button
              onClick={() => {
                setIsHamburgerOpen(true)
                setIsSearchOpen(false)
              }}
              aria-label="Open navigation menu"
              className="ml-5 mt-[3px]"
            >
              <BiMenu className="text-2xl" />
            </button>
          )}
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
              ScriptComponent={ScriptComponent}
            />
          )}
        </div>
      )}

      {/* Navigation items, first level (for mobile/tablet) */}
      {isHamburgerOpen && openNavItemIdx === -1 && (
        <div className="block lg:hidden">
          <ul className="px-6 pt-4">
            {items.map(({ name, url, items }, idx) => {
              if (!items || items.length === 0) {
                return (
                  <li key={Math.random()} className="w-full py-3">
                    <LinkComponent
                      className="text-md block w-full text-content hover:text-content-medium"
                      href={url}
                    >
                      {name}
                    </LinkComponent>
                  </li>
                )
              }

              return (
                <li key={Math.random()} className="w-full py-3">
                  <button
                    onClick={() => setOpenNavItemIdx(idx)}
                    className="w-full"
                  >
                    <div className="flex w-full flex-row justify-between">
                      <p className="text-md text-content">{name}</p>
                      <BiChevronRight className="text-2xl" />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Navigation items, second level (for mobile/tablet) */}
      {isHamburgerOpen && openNavItemIdx !== -1 && (
        <div
          className="block lg:hidden"
          style={{
            height: `calc(100vh - ${siteHeaderBottomY}px)`,
          }}
        >
          <div className="px-6 pt-4">
            <button
              className="flex flex-row gap-3 pb-4 pt-2.5"
              onClick={() => setOpenNavItemIdx(-1)}
              aria-label="Return to main navigation menu"
            >
              <BiLeftArrowAlt className="text-2xl" />
              <h5 className="text-md">{items[openNavItemIdx]?.name}</h5>
            </button>

            <ul className="flex flex-row flex-wrap gap-x-36 gap-y-5 px-9 py-4 md:gap-y-8">
              {items[openNavItemIdx]?.items?.map(
                ({ name, url, description }) => (
                  <li key={name} className="w-full md:w-1/3">
                    <div className="flex flex-col gap-1">
                      <LinkComponent
                        href={url}
                        className="text-content-medium text-paragraph-01 md:text-content"
                      >
                        {name}
                        <BiRightArrowAlt className="-mt-0.5 ml-1 hidden text-lg md:inline" />
                      </LinkComponent>
                      <p className="hidden text-content-medium text-paragraph-02 md:block">
                        {description}
                      </p>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default Navbar

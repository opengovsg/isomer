"use client"

import { useEffect, useRef, useState } from "react"
import {
  BiChevronDown,
  BiChevronRight,
  BiChevronUp,
  BiLeftArrowAlt,
  BiMenu,
  BiRightArrowAlt,
  BiSearch,
  BiX,
} from "react-icons/bi"
import type { NavbarProps } from "~/interfaces"
import { LocalSearchInputBox, SearchSGInputBox } from "../../internal"

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
  const [navbarDesktopHeight, setNavbarDesktopHeight] = useState(0)
  const [siteHeaderBottomY, setSiteHeaderBottomY] = useState(0)

  // Reference for navigation items bar on desktop
  const navDesktopRef = useRef<HTMLUListElement>(null)

  // Reference for the site header
  const siteHeaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onResize = () => {
      setNavbarDesktopHeight(navDesktopRef.current?.offsetHeight || 0)
      setSiteHeaderBottomY(
        siteHeaderRef.current?.getBoundingClientRect().bottom || 0,
      )
    }

    const handleClickOutside = (event: MouseEvent) => {
      const viewportWidth = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0,
      )

      if (
        navDesktopRef.current &&
        !navDesktopRef.current.contains(event.target as Node) &&
        viewportWidth >= 1024 // Tailwind's lg breakpoint
      ) {
        setOpenNavItemIdx(-1)
      }
    }

    onResize()
    window.addEventListener("resize", onResize)
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      window.removeEventListener("resize", onResize)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="flex flex-col">
      {/* Site header */}
      <div
        className="mx-auto flex w-full max-w-container flex-row px-6 py-6 lg:px-10"
        ref={siteHeaderRef}
      >
        {/* Logo */}
        <LinkComponent href="/">
          <img
            src={logoUrl}
            alt={logoAlt}
            className="h-11 w-full max-w-[110px] object-contain object-center lg:h-20 lg:max-w-[200px]"
          />
        </LinkComponent>

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
              className="mb-[5px]"
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

      {/* Navigation items (for desktop) */}
      <div className="relative hidden w-full bg-utility-neutral lg:block">
        <div className="mx-auto w-full max-w-container px-10">
          <div className="mx-auto w-full max-w-screen-xl">
            <ul className="flex flex-row flex-wrap" ref={navDesktopRef}>
              {items.map(({ name, url, description, items }, idx) => {
                if (!items || items.length === 0) {
                  return (
                    <li key={Math.random()}>
                      <LinkComponent
                        className="block px-3 py-4 text-lg text-content-medium transition duration-300 ease-in-out hover:bg-interaction-sub active:bg-interaction-sub"
                        href={url}
                      >
                        {name}
                      </LinkComponent>
                    </li>
                  )
                }

                return (
                  <li key={Math.random()}>
                    <button
                      className={`block px-3 py-4 text-lg text-content-medium transition duration-300 ease-in-out hover:bg-interaction-sub active:bg-interaction-sub ${
                        openNavItemIdx === idx ? "bg-interaction-sub" : ""
                      }`}
                      onClick={() => {
                        if (openNavItemIdx === idx) {
                          setOpenNavItemIdx(-1)
                        } else {
                          setOpenNavItemIdx(idx)
                        }
                      }}
                    >
                      {name}
                      {openNavItemIdx !== idx && (
                        <BiChevronDown className="-mt-1 ml-1 inline text-2xl" />
                      )}
                      {openNavItemIdx === idx && (
                        <BiChevronUp className="-mt-1 ml-1 inline text-2xl" />
                      )}
                    </button>
                    <div
                      className={`${
                        openNavItemIdx === idx ? "absolute" : "hidden"
                      } left-0 z-20 w-full border-b border-b-divider-medium bg-white px-4`}
                      style={{
                        top: `${navbarDesktopHeight}px`,
                      }}
                    >
                      <div className="mx-auto flex max-h-[32rem] w-full max-w-screen-xl flex-col py-12">
                        <div className="mx-auto flex w-full max-w-container flex-row items-start px-10 pb-4">
                          <div className="flex flex-col gap-1">
                            <h6 className="text-heading-06 uppercase text-content-medium">
                              {name}
                            </h6>
                            <p className="text-content">{description}</p>
                          </div>

                          {/* Spacer */}
                          <div className="flex-1" />

                          <button
                            onClick={() => setOpenNavItemIdx(-1)}
                            aria-label="Close navigation item"
                            className="text-button-link-01 text-content"
                          >
                            Close
                            <BiX className="-mt-0.5 ml-1 inline text-2xl" />
                          </button>
                        </div>

                        <hr className="mb-8 border-t border-t-divider-medium" />

                        <div className="overflow-auto">
                          <ul className="mx-auto flex w-full max-w-container flex-row flex-wrap gap-x-36 gap-y-8 px-10">
                            {items.map((subItem) => (
                              <li key={subItem.name} className="w-2/5">
                                <div className="flex flex-col gap-1">
                                  <LinkComponent href={subItem.url}>
                                    <p className="text-paragraph-01-medium text-pretty text-content underline underline-offset-2">
                                      {subItem.name}
                                      <BiRightArrowAlt className="-mt-0.5 inline h-auto w-6" />
                                    </p>
                                  </LinkComponent>
                                  <p className="text-paragraph-02 text-content-medium">
                                    {subItem.description}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation items, first level (for mobile/tablet) */}
      {isHamburgerOpen && openNavItemIdx === -1 && (
        <div
          className="block lg:hidden"
          style={{
            height: `calc(100vh - ${siteHeaderBottomY}px)`,
          }}
        >
          <ul className="px-6 pt-4">
            {items.map(({ name, url, items }, idx) => {
              if (!items || items.length === 0) {
                return (
                  <li key={Math.random()} className="w-full py-2">
                    <LinkComponent
                      className="block w-full text-lg text-content hover:text-content-medium"
                      href={url}
                    >
                      {name}
                    </LinkComponent>
                  </li>
                )
              }

              return (
                <li key={Math.random()} className="w-full py-2">
                  <button
                    onClick={() => setOpenNavItemIdx(idx)}
                    className="w-full"
                  >
                    <div className="flex w-full flex-row justify-between">
                      <p className="text-lg text-content hover:text-content-medium">
                        {name}
                      </p>
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
              className="flex flex-row gap-3 pb-4 pt-2.5 text-content"
              onClick={() => setOpenNavItemIdx(-1)}
              aria-label="Return to main navigation menu"
            >
              <BiLeftArrowAlt className="text-2xl" />
              <h5 className="text-heading-05">{items[openNavItemIdx].name}</h5>
            </button>

            <ul className="flex flex-row flex-wrap gap-x-36 gap-y-[1.125rem] px-9 py-4 md:gap-y-8">
              {items[openNavItemIdx].items?.map(
                ({ name, url, description }) => (
                  <li key={name} className="w-full md:w-1/3">
                    <div className="flex flex-col gap-1">
                      <LinkComponent
                        href={url}
                        className="text-paragraph-01-medium text-content underline"
                      >
                        {name}
                        <BiRightArrowAlt className="-mt-0.5 ml-1 hidden text-xl md:inline" />
                      </LinkComponent>
                      <p className="text-paragraph-02 hidden text-content-medium md:block">
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

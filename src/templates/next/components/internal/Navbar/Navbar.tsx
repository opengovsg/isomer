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
import { ButtonLink } from "../../../typography/ButtonLink"
import { Heading } from "../../../typography/Heading"
import { Paragraph } from "../../../typography/Paragraph"
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
  const [navbarDesktopBottomY, setNavbarDesktopBottomY] = useState(0)
  const [siteHeaderBottomY, setSiteHeaderBottomY] = useState(0)

  // Reference for navigation items bar on desktop
  const navDesktopRef = useRef<HTMLUListElement>(null)

  // Reference for the site header
  const siteHeaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onResize = () => {
      setNavbarDesktopBottomY(
        navDesktopRef.current?.getBoundingClientRect().bottom || 0,
      )
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
        className="flex flex-row w-full max-w-container mx-auto px-6 lg:px-10 py-6"
        ref={siteHeaderRef}
      >
        {/* Logo */}
        <LinkComponent href="/">
          <img
            src={logoUrl}
            alt={logoAlt}
            className="h-11 lg:h-20 w-full max-w-[110px] lg:max-w-[200px] object-contain object-center"
          />
        </LinkComponent>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search icon */}
        {search && !isHamburgerOpen && (
          <div className="block my-auto">
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
        <div className="block lg:hidden my-auto">
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
              <BiX className="inline ml-1 -mt-0.5 text-2xl" />
            </button>
          ) : (
            <button
              onClick={() => {
                setIsHamburgerOpen(true)
                setIsSearchOpen(false)
              }}
              aria-label="Open navigation menu"
              className="mt-[3px] ml-5"
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
          } w-full max-w-container mx-auto mb-4 px-6 lg:px-10`}
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
      <div className="hidden lg:block bg-[#f4f2f1] w-full">
        <div className="w-full max-w-container mx-auto px-10">
          <div className="mx-auto w-full max-w-screen-xl">
            <ul className="flex flex-row flex-wrap" ref={navDesktopRef}>
              {items.map(({ name, url, description, items }, idx) => {
                if (!items || items.length === 0) {
                  return (
                    <li key={Math.random()}>
                      <LinkComponent
                        className="block px-3 py-4 text-lg text-content-medium transition ease-in-out duration-300 hover:bg-interaction-sub active:bg-interaction-sub"
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
                      className={`block px-3 py-4 text-lg text-content-medium transition ease-in-out duration-300 hover:bg-interaction-sub active:bg-interaction-sub ${
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
                        <BiChevronDown className="inline ml-1 -mt-1 text-2xl" />
                      )}
                      {openNavItemIdx === idx && (
                        <BiChevronUp className="inline ml-1 -mt-1 text-2xl" />
                      )}
                    </button>
                    <div
                      className={`${
                        openNavItemIdx === idx ? "absolute" : "hidden"
                      } bg-white left-0 w-full px-4 border-b border-b-divider-medium`}
                      style={{
                        top: `${navbarDesktopBottomY}px`,
                      }}
                    >
                      <div className="flex flex-col mx-auto w-full max-w-screen-xl py-12 max-h-[32rem]">
                        <div className="flex flex-row w-full max-w-container mx-auto items-start pb-4 px-10">
                          <div className="flex flex-col gap-1">
                            <h6
                              className={`${Heading[6]} text-content-medium uppercase`}
                            >
                              {name}
                            </h6>
                            <p className="text-content">{description}</p>
                          </div>

                          {/* Spacer */}
                          <div className="flex-1" />

                          <button
                            onClick={() => setOpenNavItemIdx(-1)}
                            aria-label="Close navigation item"
                            className={`${ButtonLink[1]} text-content`}
                          >
                            Close
                            <BiX className="inline ml-1 -mt-0.5 text-2xl" />
                          </button>
                        </div>

                        <hr className="border-t-divider-medium border-t mb-8" />

                        <div className="overflow-auto">
                          <ul className="flex flex-row flex-wrap gap-x-36 gap-y-8 w-full max-w-container mx-auto px-10">
                            {items.map((subItem) => (
                              <li key={subItem.name} className="w-2/5">
                                <div className="flex flex-col gap-1">
                                  <LinkComponent href={subItem.url}>
                                    <p
                                      className={`${Paragraph["1-medium"]} underline underline-offset-2 text-content text-pretty`}
                                    >
                                      {subItem.name}
                                      <BiRightArrowAlt className="inline -mt-0.5 w-6 h-auto" />
                                    </p>
                                  </LinkComponent>
                                  <p
                                    className={`${Paragraph[2]} text-content-medium`}
                                  >
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

        {/* Overlay after navigation menu */}
        {openNavItemIdx !== -1 && (
          <div
            className="w-full bg-canvas-overlay"
            style={{
              height: `calc(100vh - ${navbarDesktopBottomY}px)`,
            }}
          ></div>
        )}
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
                    <div className="flex flex-row justify-between w-full">
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
              className="flex flex-row gap-3 pt-2.5 pb-4 text-content"
              onClick={() => setOpenNavItemIdx(-1)}
              aria-label="Return to main navigation menu"
            >
              <BiLeftArrowAlt className="text-2xl" />
              <h5 className={Heading[5]}>{items[openNavItemIdx].name}</h5>
            </button>

            <ul className="flex flex-row flex-wrap px-9 py-4 gap-x-36 gap-y-[1.125rem] md:gap-y-8">
              {items[openNavItemIdx].items?.map(
                ({ name, url, description }) => (
                  <li key={name} className="w-full md:w-1/3">
                    <div className="flex flex-col gap-1">
                      <LinkComponent
                        href={url}
                        className={`${Paragraph["1-medium"]} underline text-content`}
                      >
                        {name}
                        <BiRightArrowAlt className="hidden md:inline ml-1 -mt-0.5 text-xl" />
                      </LinkComponent>
                      <p
                        className={`hidden md:block ${Paragraph[2]} text-content-medium`}
                      >
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

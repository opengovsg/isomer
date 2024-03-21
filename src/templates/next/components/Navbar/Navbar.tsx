import { useState } from "react"
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
import type { NavbarProps } from "~/common"

const Navbar = ({
  logoUrl,
  logoAlt,
  search,
  items,
  LinkComponent = "a",
}: NavbarProps) => {
  const [openNavItemIdx, setOpenNavItemIdx] = useState(-1)
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const currentPathName =
    typeof window === "undefined" ? "" : window.location.pathname

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-row gap-5 px-14 xl:px-0 py-6 mx-auto max-h-24 w-full xl:max-w-screen-xl">
        {/* Logo */}
        <LinkComponent href="/">
          <img
            src={logoUrl}
            alt={logoAlt}
            className="h-full w-full max-w-48 object-cover object-center"
          />
        </LinkComponent>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        {search && search.type === "localSearch" && !isHamburgerOpen && (
          <form
            action={search.searchUrl}
            method="get"
            className={`flex flex-row gap-2 h-10 ${
              isSearchOpen ? "hidden lg:flex" : ""
            }`}
          >
            {isSearchOpen && (
              <input
                type="search"
                name="q"
                placeholder="Search this site"
                className="w-96 px-4 py-2 border border-divider-medium focus:border-site-primary focus:ring-site-primary focus:outline-none hidden lg:block"
              />
            )}
            <button
              onClick={(e) => {
                if (!isSearchOpen) {
                  e.preventDefault()
                  setIsSearchOpen(true)
                }
              }}
              type="submit"
              aria-label="Search this site"
            >
              <BiSearch className="text-2xl mt-0.5" />
            </button>
          </form>
        )}

        {/* Hamburger menu for small screens */}
        <div className="block xl:hidden h-10">
          {isHamburgerOpen ? (
            <button
              onClick={() => {
                setIsHamburgerOpen(false)
                setOpenNavItemIdx(-1)
              }}
              aria-label="Close navigation menu"
              className="mt-2"
            >
              Close
              <BiX className="inline ml-1 -mt-0.5 text-2xl" />
            </button>
          ) : (
            <button
              onClick={() => setIsHamburgerOpen(true)}
              aria-label="Open navigation menu"
            >
              <BiMenu className="text-2xl mt-2" />
            </button>
          )}
        </div>
      </div>

      {/* Search bar (for mobile/tablet) */}
      <div className="block lg:hidden">
        {isSearchOpen && search && search.type === "localSearch" && (
          <form action={search.searchUrl} method="get">
            <div className="flex flex-row gap-4 h-10 px-14">
              <input
                type="search"
                name="q"
                placeholder="Search this site"
                title="Search this site"
                aria-label="Search this site"
                className="w-full px-4 py-2 border border-divider-medium focus:border-site-primary focus:ring-site-primary focus:outline-none"
              />
              <button type="submit" aria-label="Search this site">
                <BiSearch className="text-2xl" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Navigation items (for desktop) */}
      <div className="hidden xl:block bg-[#fbfbfb] w-full">
        <div className="flex flex-row mx-auto w-full max-w-screen-xl">
          <ul>
            {items.map(({ name, url, description, items }, idx) => {
              if (!items || items.length === 0) {
                return (
                  <li key={Math.random()} className="inline">
                    <LinkComponent
                      className={`px-3 py-4 text-lg text-content-medium transition ease-in-out duration-300 hover:bg-interaction-sub active:bg-interaction-sub ${
                        currentPathName === url
                          ? "border-b-site-primary border-b-4 bg-interaction-sub"
                          : ""
                      }`}
                      href={url}
                    >
                      {name}
                    </LinkComponent>
                  </li>
                )
              }

              return (
                <li key={Math.random()} className="inline">
                  <button
                    className={`px-3 py-4 text-lg text-content-medium transition ease-in-out duration-300 hover:bg-interaction-sub active:bg-interaction-sub ${
                      currentPathName.startsWith(url) || openNavItemIdx === idx
                        ? "border-b-site-primary border-b-4 bg-interaction-sub"
                        : ""
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
                    } bg-white left-0 w-full px-4`}
                  >
                    <div className="flex flex-col mx-auto w-full max-w-screen-xl py-12 max-h-[32rem] overflow-auto">
                      <div className="flex flex-row justify-between items-start pb-4 border-b-divider-medium border-b">
                        <div className="flex flex-col gap-1">
                          <h6 className="text-lg font-medium uppercase">
                            {name}
                          </h6>
                          <p>{description}</p>
                        </div>

                        <button
                          onClick={() => setOpenNavItemIdx(-1)}
                          aria-label="Close navigation item"
                        >
                          Close
                          <BiX className="inline ml-1 -mt-0.5 text-2xl" />
                        </button>
                      </div>

                      <ul className="flex flex-row flex-wrap pt-12 gap-x-36 gap-y-8">
                        {items.map((subItem) => (
                          <li key={subItem.name} className="w-2/5">
                            <div className="flex flex-col gap-1">
                              <LinkComponent
                                href={subItem.url}
                                className="underline font-medium text-xl leading-8"
                              >
                                {subItem.name}
                                <BiRightArrowAlt className="inline ml-1 -mt-0.5 text-xl" />
                              </LinkComponent>
                              <p>{subItem.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Navigation items, first level (for mobile/tablet) */}
      <div
        className={`${
          isHamburgerOpen && openNavItemIdx === -1 ? "block" : "hidden"
        } xl:hidden`}
      >
        <ul className="px-14 pt-4">
          {items.map(({ name, url, items }, idx) => {
            if (!items || items.length === 0) {
              return (
                <li key={Math.random()} className="w-full py-2">
                  <LinkComponent
                    className="text-lg text-content block w-full hover:text-content-medium"
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
                  <div className="flex flex-row justify-between w-full text-content hover:text-content-medium">
                    <p className="text-lg ">{name}</p>
                    <BiChevronRight className="text-2xl" />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Navigation items, second level (for mobile/tablet) */}
      {isHamburgerOpen && openNavItemIdx !== -1 && (
        <div className="block xl:hidden">
          <div className="px-14 pt-4">
            <button
              className="flex flex-row gap-3 py-4"
              onClick={() => setOpenNavItemIdx(-1)}
              aria-label="Return to main navigation menu"
            >
              <BiLeftArrowAlt className="text-2xl" />
              <h5 className="text-xl leading-6 font-semibold">
                {items[openNavItemIdx].name}
              </h5>
            </button>

            <ul className="flex flex-row flex-wrap px-9 py-4 gap-x-36 gap-y-[1.125rem] md:gap-y-8">
              {items[openNavItemIdx].items?.map(
                ({ name, url, description }) => (
                  <li key={name} className="w-full md:w-1/3">
                    <div className="flex flex-col gap-1">
                      <LinkComponent
                        href={url}
                        className="underline font-normal md:font-medium text-xl leading-8"
                      >
                        {name}
                        <BiRightArrowAlt className="hidden md:inline ml-1 -mt-0.5 text-xl" />
                      </LinkComponent>
                      <p className="hidden md:block">{description}</p>
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

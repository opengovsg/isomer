"use client";

import { useEffect, useRef, useState } from "react";
import {
  BiChevronDown,
  BiChevronRight,
  BiChevronUp,
  BiLeftArrowAlt,
  BiMenu,
  BiRightArrowAlt,
  BiSearch,
  BiX,
} from "react-icons/bi";

import type { NavbarProps } from "~/interfaces";
import { LocalSearchInputBox, SearchSGInputBox } from "../../internal";

export const Navbar = ({
  logoUrl,
  logoAlt,
  search,
  items,
  LinkComponent = "a",
  ScriptComponent = "script",
}: Omit<NavbarProps, "type">) => {
  const [openNavItemIdx, setOpenNavItemIdx] = useState(-1);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [navbarDesktopHeight, setNavbarDesktopHeight] = useState(0);
  const [siteHeaderBottomY, setSiteHeaderBottomY] = useState(0);

  // Reference for navigation items bar on desktop
  const navDesktopRef = useRef<HTMLUListElement>(null);

  // Reference for the site header
  const siteHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => {
      setNavbarDesktopHeight(siteHeaderRef.current?.offsetHeight || 0);
      setSiteHeaderBottomY(
        siteHeaderRef.current?.getBoundingClientRect().bottom || 0,
      );
    };

    const handleClickOutside = (event: MouseEvent) => {
      const viewportWidth = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0,
      );

      if (
        navDesktopRef.current &&
        !navDesktopRef.current.contains(event.target as Node) &&
        viewportWidth >= 1024 // Tailwind's lg breakpoint
      ) {
        setOpenNavItemIdx(-1);
      }
    };

    onResize();
    window.addEventListener("resize", onResize);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex flex-col">
      {/* Site header */}
      <div
        className="max-w-container mx-auto flex w-full flex-row gap-4 px-6 py-6 lg:px-10"
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
            {items.map(({ name, url, description, items: subItems }, idx) => {
              if (!subItems || subItems.length === 0) {
                return (
                  <li key={`${name}-${idx}`}>
                    <LinkComponent
                      className="block px-2 py-1 text-base/5 font-medium text-[#1f2937]"
                      href={url}
                    >
                      {name}
                    </LinkComponent>
                  </li>
                );
              }

              return (
                <li key={`${name}-${idx}`}>
                  <button
                    className={`flex flex-row px-2 py-1 align-middle text-base/5 font-medium ${
                      openNavItemIdx === idx
                        ? "text-[#766a62]"
                        : "text-neutral-800"
                    }`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      if (openNavItemIdx === idx) {
                        setOpenNavItemIdx(-1);
                      } else {
                        setOpenNavItemIdx(idx);
                      }
                    }}
                  >
                    {name}
                    <BiChevronDown
                      className={`-mt-0.5 ml-1 inline text-2xl/6 transition-transform duration-300 ease-in-out ${openNavItemIdx !== idx ? "rotate-0" : "rotate-180"}`}
                    />
                  </button>
                  <div
                    className={`${
                      openNavItemIdx === idx ? "absolute" : "hidden"
                    } left-0 z-20 w-full border-y  border-y-gray-100 bg-white px-4`}
                    style={{
                      top: `${navbarDesktopHeight}px`,
                    }}
                  >
                    <div className="mx-auto flex w-full max-w-screen-xl flex-col py-12">
                      <div className="max-w-container mx-auto flex w-full flex-row items-start px-10 pb-12">
                        <div className="flex flex-col gap-1">
                          <h6 className="text-2xl font-semibold">{name}</h6>
                          <p className="text-gray-700">{description}</p>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        <button
                          onClick={() => setOpenNavItemIdx(-1)}
                          aria-label="Close navigation item"
                          className="text-content text-sm lg:text-base"
                        >
                          Close
                          <BiX className="-mt-0.5 ml-1 inline text-2xl" />
                        </button>
                      </div>

                      <div className="overflow-auto">
                        <ul className="max-w-container mx-auto flex w-full flex-row flex-wrap gap-x-36 gap-y-8 px-10">
                          {subItems.map((subItem) => (
                            <li key={subItem.name} className="w-2/5">
                              <div className="flex flex-col gap-1">
                                <LinkComponent href={subItem.url}>
                                  <p className="text-content text-pretty text-lg font-semibold hover:underline hover:underline-offset-2">
                                    {subItem.name}
                                    <BiRightArrowAlt className="-mt-0.5 inline h-auto w-5" />
                                  </p>
                                </LinkComponent>
                                <p className="text-base text-gray-500">
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
              );
            })}
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
                setIsHamburgerOpen(false);
                setOpenNavItemIdx(-1);
              }}
              aria-label="Close navigation menu"
            >
              Close
              <BiX className="-mt-0.5 ml-1 inline text-2xl" />
            </button>
          ) : (
            <button
              onClick={() => {
                setIsHamburgerOpen(true);
                setIsSearchOpen(false);
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
          } max-w-container mx-auto mb-4 w-full px-6 lg:px-10`}
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
                  <li key={Math.random()} className="w-full py-3">
                    <LinkComponent
                      className="text-content hover:text-content-medium text-md block w-full"
                      href={url}
                    >
                      {name}
                    </LinkComponent>
                  </li>
                );
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
              );
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
              <h5 className="text-md">{items[openNavItemIdx].name}</h5>
            </button>

            <ul className="flex flex-row flex-wrap gap-x-36 gap-y-5 px-9 py-4 md:gap-y-8">
              {items[openNavItemIdx].items?.map(
                ({ name, url, description }) => (
                  <li key={name} className="w-full md:w-1/3">
                    <div className="flex flex-col gap-1">
                      <LinkComponent
                        href={url}
                        className="text-paragraph-01 text-content-medium md:text-content"
                      >
                        {name}
                        <BiRightArrowAlt className="-mt-0.5 ml-1 hidden text-lg md:inline" />
                      </LinkComponent>
                      <p className="text-paragraph-02 text-content-medium hidden md:block">
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
  );
};

export default Navbar;

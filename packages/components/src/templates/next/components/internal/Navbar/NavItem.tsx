"use client"

import type { NavbarProps } from "~/interfaces/internal/Navbar"
import { FocusScope } from "@react-aria/focus"
import { forwardRef } from "react"
import { BiChevronDown, BiRightArrowAlt, BiX } from "react-icons/bi"
import { useScrollLock } from "usehooks-ts"
import { tv } from "~/lib/tv"
import { isExternalUrl } from "~/utils/isExternalUrl"
import {
  focusVisibleHighlight,
  groupFocusVisibleHighlight,
} from "~/utils/tailwind"

import { IconButton } from "../IconButton"
import { Link } from "../Link"

type NavbarItemProps = NavbarProps["items"][number] & {
  isOpen: boolean
  onClick: () => void
  onCloseMegamenu: () => void
}

const navbarItemStyles = tv({
  slots: {
    megamenu: "max-h-full overflow-auto bg-white shadow-md",
    item: "group prose-label-md-medium text-base-content-strong hover:text-brand-interaction-hover flex flex-row items-center gap-0.5 border-b-2 border-transparent pt-6 pb-5 outline-0 transition-colors motion-reduce:transition-none",
    chevron:
      "text-base transition-transform duration-300 ease-in-out motion-reduce:transition-none",
  },
  variants: {
    isOpen: {
      true: {
        item: "border-brand-interaction text-brand-interaction",
        chevron: "-rotate-180",
      },
    },
  },
})

const { item, chevron, megamenu } = navbarItemStyles()

export const NavItem = forwardRef<HTMLButtonElement, NavbarItemProps>(
  (
    { items, name, url, description, isOpen, onClick, onCloseMegamenu },
    ref,
  ): JSX.Element => {
    if (!items || items.length === 0) {
      return (
        <li className={item({ isOpen })}>
          <Link
            isExternal={isExternalUrl(url)}
            showExternalIcon={isExternalUrl(url)}
            href={url}
            className={focusVisibleHighlight()}
          >
            {name}
          </Link>
        </li>
      )
    }

    return (
      <li>
        <button
          ref={ref}
          className={item({ isOpen })}
          onClick={onClick}
          aria-expanded={isOpen}
        >
          <span className={groupFocusVisibleHighlight()}>{name}</span>
          <BiChevronDown className={chevron({ isOpen })} />
        </button>
        {isOpen && (
          <Megamenu
            name={name}
            description={description}
            url={url}
            items={items}
            onCloseMegamenu={onCloseMegamenu}
          />
        )}
      </li>
    )
  },
)

const Megamenu = ({
  name,
  description,
  url,
  onCloseMegamenu,
  items,
}: Pick<
  NavbarProps["items"][number],
  "name" | "description" | "url" | "items"
> & {
  onCloseMegamenu: () => void
}) => {
  useScrollLock()

  const renderTitleContent = () => {
    if (!url) {
      return name
    }

    const isExternal = isExternalUrl(url)
    return (
      <Link
        isExternal={isExternal}
        showExternalIcon={isExternal}
        isWithFocusVisibleHighlight
        href={url}
        className="group hover:text-brand-interaction-hover inline-flex w-fit items-center gap-1 hover:no-underline"
        onClick={onCloseMegamenu}
      >
        {name}
        {!isExternal && (
          <BiRightArrowAlt className="mt-0.5 inline text-[1.5rem] transition ease-in group-hover:translate-x-1" />
        )}
      </Link>
    )
  }

  return (
    <div className="absolute top-full right-0 left-0 z-50">
      <div
        className="bg-canvas-overlay/40 absolute top-full right-0 bottom-0 left-0 z-[1] h-screen"
        onClick={onCloseMegamenu}
      />
      <FocusScope contain restoreFocus>
        <div className={megamenu()}>
          <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-8 px-10 pt-12 pb-16">
            <div className="flex w-full flex-row items-start">
              <div className="flex flex-col gap-1">
                <h2 className="prose-display-xs text-base-content">
                  {renderTitleContent()}
                </h2>
                {description && (
                  <p className="prose-label-sm-regular text-base-content-subtle">
                    {description}
                  </p>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              <IconButton
                icon={BiX}
                onPress={onCloseMegamenu}
                aria-label="Close navigation item"
              />
            </div>

            <ul className="grid grid-cols-3 gap-x-16 gap-y-8">
              {items?.map((subItem) => {
                const isExternal = isExternalUrl(subItem.url)
                return (
                  <li key={subItem.name}>
                    <div className="flex flex-col gap-1.5">
                      <Link
                        isExternal={isExternal}
                        showExternalIcon={isExternal}
                        isWithFocusVisibleHighlight
                        href={subItem.url}
                        className="group prose-label-md-medium text-base-content hover:text-brand-interaction-hover w-fit items-center gap-1 hover:no-underline"
                        onClick={onCloseMegamenu}
                      >
                        {subItem.name}
                        {!isExternal && (
                          <BiRightArrowAlt className="mb-0.5 ml-1 inline text-[1.25rem] transition ease-in group-hover:translate-x-1" />
                        )}
                      </Link>
                      <p className="prose-label-sm-regular text-base-content-subtle">
                        {subItem.description}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </FocusScope>
    </div>
  )
}

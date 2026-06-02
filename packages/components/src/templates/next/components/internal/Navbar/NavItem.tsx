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
    item: "group flex-row gap-0.5 prose-label-md-medium flex items-center border-b-2 border-transparent pb-5 pt-6 text-base-content-strong outline-0 transition-colors hover:text-brand-interaction-hover motion-reduce:transition-none",
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
        className="group gap-1 inline-flex w-fit items-center hover:text-brand-interaction-hover hover:no-underline"
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
    <div className="absolute left-0 right-0 top-full z-50">
      <div
        className="absolute bottom-0 left-0 right-0 top-full z-[1] h-screen bg-canvas-overlay/40"
        onClick={onCloseMegamenu}
      />
      <FocusScope contain restoreFocus>
        <div className={megamenu()}>
          <div className="flex-col gap-8 mx-auto flex w-full max-w-screen-xl px-10 pb-16 pt-12">
            <div className="flex-row flex w-full items-start">
              <div className="flex-col gap-1 flex">
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

            <ul className="grid gap-y-8 gap-x-16 grid-cols-3">
              {items?.map((subItem) => {
                const isExternal = isExternalUrl(subItem.url)
                return (
                  <li key={subItem.name}>
                    <div className="flex-col gap-1.5 flex">
                      <Link
                        isExternal={isExternal}
                        showExternalIcon={isExternal}
                        isWithFocusVisibleHighlight
                        href={subItem.url}
                        className="group gap-1 prose-label-md-medium w-fit items-center text-base-content hover:text-brand-interaction-hover hover:no-underline"
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

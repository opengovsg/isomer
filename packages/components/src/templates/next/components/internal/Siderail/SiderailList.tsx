import type { PropsWithChildren } from "react"
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react"
import { BiMinus, BiPlus } from "react-icons/bi"

import type { ItemWithChild } from "./types"
import { tv } from "~/lib/tv"
import { SiderailLabel } from "./SiderailLabel"

export interface SiderailListProps {
  item: ItemWithChild
  className?: string
}

const createSiderailListStyles = tv({
  slots: {
    header: "flex w-full items-start justify-between gap-2 transition",
    label: "px-3 py-4",
    childHeader: "flex w-full items-center gap-1.5",
    childLabel: "py-2 hover:text-brand-interaction",
    container: "",
    expandButton:
      "focus-visible:bg-utility-highlight -mx-4 rounded p-4 outline outline-0 outline-offset-2 outline-link transition hover:text-brand-interaction focus-visible:outline-2",
    expandIcon: "h-6 w-6",
  },
  variants: {
    isOpen: {
      true: {
        header: "text-brand-interaction",
        label: "px-3 py-4",
        container: "pb-3",
      },
    },
  },
})

const compoundStyles = createSiderailListStyles()

export const SiderailList = ({
  item,
  className,
}: PropsWithChildren<SiderailListProps>): JSX.Element => {
  return (
    <Disclosure>
      {({ open: isOpen }) => (
        <li className={compoundStyles.container({ isOpen, className })}>
          <div className={compoundStyles.header({ isOpen })}>
            <SiderailLabel
              {...item}
              className={compoundStyles.label({ isOpen })}
            />
            <DisclosureButton
              className={compoundStyles.expandButton()}
              aria-label={`${isOpen ? "expand" : "collapse"} ${item.title} section`}
            >
              {isOpen ? (
                <BiMinus className={compoundStyles.expandIcon()} />
              ) : (
                <BiPlus className={compoundStyles.expandIcon()} />
              )}
            </DisclosureButton>
          </div>
          <DisclosurePanel>
            <ul>
              {item.childPages.map((child, index) => (
                <li
                  key={index}
                  className={compoundStyles.childHeader({ isOpen })}
                >
                  <SiderailLabel
                    showIconOnHover
                    {...child}
                    className={compoundStyles.childLabel({ isOpen })}
                  />
                </li>
              ))}
            </ul>
          </DisclosurePanel>
        </li>
      )}
    </Disclosure>
  )
}

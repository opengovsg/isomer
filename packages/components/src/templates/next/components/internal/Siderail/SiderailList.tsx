import type { PropsWithChildren } from "react"
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react"
import { BiMinus, BiPlus } from "react-icons/bi"
import { twMerge } from "tailwind-merge"
import { tv } from "tailwind-variants"

import type { ItemWithChild } from "./types"
import { SiderailLabel } from "./SiderailLabel"

export interface SiderailListProps {
  item: ItemWithChild
  className?: string
}

const createSiderailListStyles = tv({
  slots: {
    header:
      "flex w-full justify-between gap-2 text-base-content-strong transition",
    label: "prose-headline-base-semibold px-3 py-4",
    childHeader: "flex w-full items-center gap-1.5",
    childLabel: "py-2 hover:text-brand-interaction",
    container: "",
    expandIcon: "h-6 w-6 transition hover:text-brand-interaction",
  },
  variants: {
    isOpen: {
      true: {
        header: "text-brand-interaction",
        label: "prose-body-base px-3 py-4",
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
    <Disclosure defaultOpen={item.isCurrent}>
      {({ open: isOpen }) => (
        <div
          className={twMerge(compoundStyles.container({ isOpen }), className)}
        >
          <div className={compoundStyles.header({ isOpen })}>
            <SiderailLabel
              {...item}
              className={compoundStyles.label({ isOpen })}
            />
            <DisclosureButton>
              {isOpen ? (
                <BiMinus className={compoundStyles.expandIcon()} />
              ) : (
                <BiPlus className={compoundStyles.expandIcon()} />
              )}
            </DisclosureButton>
          </div>
          <DisclosurePanel>
            {item.childPages.map((child, index) => (
              <div className={compoundStyles.childHeader({ isOpen })}>
                <SiderailLabel
                  showIconOnHover
                  key={index}
                  {...child}
                  className={compoundStyles.childLabel({ isOpen })}
                />
              </div>
            ))}
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  )
}
